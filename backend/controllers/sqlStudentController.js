const asyncHandler = require('express-async-handler');
const { getMySqlPool } = require('../config/mysql');
const { User } = require('../models/userModel');
const { AcademicConfig } = require('../models/academicConfigModel');

const DEFAULT_STUDENT_TABLE = 'students';

const deriveValue = (record, possibleKeys, fallback = null) => {
  for (const key of possibleKeys) {
    if (key in record && record[key] !== null && record[key] !== undefined) {
      return record[key];
    }
  }
  return fallback;
};

const normalizeStudentRow = (row) => {
  const id =
    deriveValue(row, ['id', 'ID', 'student_id', 'studentId', 'roll_no', 'rollNo']) ??
    deriveValue(row, ['uuid', 'userId', 'user_id']);

  const firstName = deriveValue(row, ['first_name', 'firstName', 'fname', 'first']);
  const lastName = deriveValue(row, ['last_name', 'lastName', 'lname', 'last']);
  const combinedName = [firstName, lastName].filter(Boolean).join(' ').trim();

  const name =
    deriveValue(row, ['name', 'student_name', 'studentName', 'full_name', 'fullName']) ||
    combinedName ||
    (typeof row === 'object' ? JSON.stringify(row) : 'Unknown');

  const pin =
    deriveValue(row, [
      'pin_number',
      'pinNumber',
      'pin_no',
      'pinNo',
      'pin',
      'PIN',
      'pin_num',
      'pinNum',
      'pin_nbr',
      'pinNbr',
    ]) || null;

  const secondaryId =
    deriveValue(row, ['student_id', 'studentId', 'roll_no', 'rollNo', 'registration_no', 'registrationNo']) ||
    id ||
    null;

  const preferredId = pin || secondaryId;

  const course = deriveValue(row, ['course', 'course_name', 'courseName', 'program', 'programme'], 'N/A');
  const yearValue = deriveValue(row, ['year', 'year_of_study', 'yearOfStudy', 'current_year', 'stud_year', 'semester_year'], null);
  const semesterValue = deriveValue(row, ['semester', 'current_semester', 'semester_no', 'sem', 'sem_no'], null);
  const branch = deriveValue(row, ['branch', 'department', 'dept', 'department_name'], 'N/A');
  const status = deriveValue(row, ['status', 'admission_status', 'admissionStatus', 'student_status', 'studentStatus', 'admission_state'], null);

  return {
    id: id ?? preferredId ?? `${name}-${course}`,
    name,
    studentId: preferredId ?? 'N/A',
    pin: pin || null,
    alternateId: secondaryId || null,
    course,
    year: yearValue !== null && yearValue !== undefined ? Number(yearValue) || yearValue : 'N/A',
    semester: semesterValue !== null && semesterValue !== undefined ? Number(semesterValue) || semesterValue : null,
    branch,
    status: status || null,
    _sourceRow: row,
  };
};

const getSqlStudents = asyncHandler(async (req, res) => {
  const pool = getMySqlPool();
  if (!pool) {
    res.status(500);
    throw new Error('MySQL pool is not configured. Check environment variables.');
  }

  const tableName = process.env.DB_STUDENTS_TABLE || DEFAULT_STUDENT_TABLE;
  const sql = `SELECT * FROM \`${tableName}\``;

  try {
    const [rows] = await pool.query(sql);

    if (!Array.isArray(rows)) {
      res.status(200).json([]);
      return;
    }

    const normalized = rows.map(normalizeStudentRow);
    res.json({
      count: normalized.length,
      table: tableName,
      rows: normalized,
    });
  } catch (error) {
    console.error('[MySQL] Failed to fetch student records:', error);
    const status = error?.code === 'ER_NO_SUCH_TABLE' ? 404 : 500;
    res.status(status);
    throw new Error(
      error?.code === 'ER_NO_SUCH_TABLE'
        ? `Table "${tableName}" not found in the configured database.`
        : error.message || 'Failed to fetch students from MySQL.',
    );
  }
});

const ensureString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const isMeaningful = (value) => {
  if (value === null || value === undefined) return false;
  const str = String(value).trim();
  if (!str) return false;
  return str.toLowerCase() !== 'n/a';
};

const getDefaultPassword = () => process.env.SQL_STUDENT_DEFAULT_PASSWORD || 'Sync@123';
const getEmailDomain = () => process.env.SQL_STUDENT_EMAIL_DOMAIN || 'mysql-sync.pydah.com';

/**
 * Check if a student status indicates admission cancellation
 * @param {string|null|undefined} status - Student status value
 * @returns {boolean} - True if status indicates cancellation
 */
const isAdmissionCancelled = (status) => {
  if (!status) return false;
  
  const statusStr = String(status).trim().toLowerCase();
  
  // List of variations that indicate cancellation
  const cancelledPatterns = [
    'admission cancelled',
    'admission canceled',
    'cancelled admission',
    'canceled admission',
    'admission cancellation',
    'admission cancelation',
    'cancelled',
    'canceled',
    'cancellation',
    'cancel',
    'withdrawn',
    'withdrawal',
    'discontinued',
    'terminated',
    'inactive',
  ];
  
  // Check if status contains any cancellation pattern
  return cancelledPatterns.some(pattern => statusStr.includes(pattern));
};

/**
 * Update academic config with courses, branches, and years from synced students
 * @param {Array} normalizedStudents - Array of normalized student records
 */
const updateAcademicConfigFromStudents = async (normalizedStudents) => {
  try {
    // Collect unique courses, branches, and years from synced students
    const courseMap = new Map();

    normalizedStudents.forEach((student) => {
      const course = isMeaningful(student.course) ? ensureString(student.course).toLowerCase().trim() : null;
      if (!course || course === 'general') return;

      const branch = isMeaningful(student.branch) ? ensureString(student.branch).trim() : null;
      const rawYear = isMeaningful(student.year) ? student.year : null;
      const yearNumber = rawYear !== null && rawYear !== undefined ? Number.parseInt(rawYear, 10) : null;
      const year = yearNumber && Number.isFinite(yearNumber) && yearNumber > 0 ? yearNumber : null;

      if (!courseMap.has(course)) {
        // Format display name (e.g., "b.tech" -> "B.Tech", "diploma" -> "Diploma")
        const displayName = course
          .split(/[.\s_-]+/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('.')
          .replace(/\.+/g, '.')
          .replace(/\.$/, '') || course.charAt(0).toUpperCase() + course.slice(1);

        courseMap.set(course, {
          name: course,
          displayName,
          branches: new Set(),
          years: new Set(),
        });
      }

      const courseData = courseMap.get(course);
      if (branch) {
        courseData.branches.add(branch);
      }
      if (year) {
        courseData.years.add(year);
      }
    });

    if (courseMap.size === 0) {
      return; // No valid courses to update
    }

    // Get or create academic config singleton
    let config = await AcademicConfig.findOne({});
    if (!config) {
      config = await AcademicConfig.create({ courses: [] });
    }

    let configUpdated = false;

    // Update or add courses
    for (const [courseName, courseData] of courseMap) {
      const existingCourseIndex = config.courses.findIndex((c) => c.name === courseName);

      if (existingCourseIndex >= 0) {
        // Update existing course
        const existingCourse = config.courses[existingCourseIndex];
        const updatedBranches = Array.from(new Set([...existingCourse.branches, ...courseData.branches]));
        const updatedYears = Array.from(new Set([...existingCourse.years, ...courseData.years])).sort((a, b) => a - b);

        if (
          JSON.stringify(existingCourse.branches.sort()) !== JSON.stringify(updatedBranches.sort()) ||
          JSON.stringify(existingCourse.years) !== JSON.stringify(updatedYears)
        ) {
          config.courses[existingCourseIndex].branches = updatedBranches;
          config.courses[existingCourseIndex].years = updatedYears;
          configUpdated = true;
        }
      } else {
        // Add new course
        config.courses.push({
          name: courseData.name,
          displayName: courseData.displayName,
          branches: Array.from(courseData.branches),
          years: Array.from(courseData.years).sort((a, b) => a - b),
        });
        configUpdated = true;
      }
    }

    if (configUpdated) {
      await config.save();
      console.log(`[MySQL Sync] Updated academic config with ${courseMap.size} course(s)`);
    }
  } catch (error) {
    console.error('[MySQL Sync] Failed to update academic config:', error);
    // Don't throw - this is a non-critical update
  }
};

const syncSqlStudents = asyncHandler(async (req, res) => {
  const pool = getMySqlPool();
  if (!pool) {
    res.status(500);
    throw new Error('MySQL pool is not configured. Check environment variables.');
  }

  const tableName = process.env.DB_STUDENTS_TABLE || DEFAULT_STUDENT_TABLE;
  const sql = `SELECT * FROM \`${tableName}\``;

  const summary = {
    table: tableName,
    total: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    insertedDetails: [],
    updatedDetails: [],
    skippedDetails: [],
  };

  try {
    const [rows] = await pool.query(sql);
    if (!Array.isArray(rows) || rows.length === 0) {
      res.json({ ...summary, message: 'No records found in MySQL table.' });
      return;
    }

    const normalized = rows.map(normalizeStudentRow);
    summary.total = normalized.length;

    const uniqueIds = new Set();
    normalized.forEach((student) => {
      const preferredId = ensureString(student.pin) || ensureString(student.studentId);
      const alternateId = ensureString(student.alternateId);
      if (preferredId) uniqueIds.add(preferredId);
      if (alternateId) uniqueIds.add(alternateId);
    });

    const existingUsers = await User.find({ studentId: { $in: Array.from(uniqueIds).filter(Boolean) } });
    const userMap = new Map(existingUsers.map((user) => [ensureString(user.studentId), user]));

    for (const student of normalized) {
      const name = ensureString(student.name);
      const preferredId = ensureString(student.pin) || ensureString(student.studentId);
      const fallbackId = ensureString(student.alternateId);
      const studentId = preferredId || fallbackId;

      // Check for missing required fields
      if (!name || !studentId) {
        summary.skipped += 1;
        summary.skippedDetails.push({
          studentId: studentId || 'N/A',
          name: name || 'N/A',
          course: student.course || 'N/A',
          year: student.year || 'N/A',
          branch: student.branch || 'N/A',
          reason: 'Missing name or student ID',
        });
        continue;
      }

      // Filter out students with cancelled admission status
      if (isAdmissionCancelled(student.status)) {
        summary.skipped += 1;
        summary.skippedDetails.push({
          studentId,
          name,
          course: student.course || 'N/A',
          year: student.year || 'N/A',
          branch: student.branch || 'N/A',
          status: student.status || null,
          reason: `Admission cancelled (Status: ${student.status || 'N/A'})`,
        });
        continue;
      }

      const course = isMeaningful(student.course) ? ensureString(student.course) : 'General';
      const branch = isMeaningful(student.branch) ? ensureString(student.branch) : '';
      const rawYear = isMeaningful(student.year) ? student.year : 1;
      const yearNumber = Number.parseInt(rawYear, 10);
      const year = Number.isFinite(yearNumber) && yearNumber > 0 ? yearNumber : 1;
      const rawSemester = isMeaningful(student.semester) ? student.semester : null;
      const semesterNumber = rawSemester !== null ? Number.parseInt(rawSemester, 10) : null;
      const semester = semesterNumber && semesterNumber > 0 ? semesterNumber : null;

      try {
        let existing = userMap.get(studentId);
        if (!existing && fallbackId) {
          existing = userMap.get(fallbackId);
        }
        if (existing) {
          let changed = false;
          if (existing.name !== name) {
            existing.name = name;
            changed = true;
          }
          if (course && existing.course !== course) {
            existing.course = course;
            changed = true;
          }
          if (existing.year !== year) {
            existing.year = year;
            changed = true;
          }
          if (existing.branch !== branch) {
            existing.branch = branch;
            changed = true;
          }
          if (semester !== null && existing.semester !== semester) {
            existing.semester = semester;
            changed = true;
          }
          if (preferredId && existing.studentId !== preferredId) {
            existing.studentId = preferredId;
            changed = true;
          }

          if (changed) {
            await existing.save();
            userMap.set(ensureString(existing.studentId), existing);
            summary.updated += 1;
            summary.updatedDetails.push({
              studentId,
              name,
              course,
              year,
              branch,
              semester: semester || null,
              previousCourse: existing.course,
              previousYear: existing.year,
              previousBranch: existing.branch,
              previousSemester: existing.semester || null,
            });
          } else {
            summary.skipped += 1;
            summary.skippedDetails.push({
              studentId,
              name,
              course,
              year,
              branch,
              reason: 'No changes detected',
            });
          }
        } else {
          const emailDomain = getEmailDomain();
          let email = `${studentId}@${emailDomain}`.toLowerCase();

          // Ensure generated email is unique to prevent duplicate key errors
          let emailCounter = 1;
          // eslint-disable-next-line no-await-in-loop
          while (await User.findOne({ email })) {
            email = `${studentId}+${emailCounter}@${emailDomain}`.toLowerCase();
            emailCounter += 1;
          }

          const newUser = new User({
            name,
            studentId,
            course,
            year,
            semester,
            branch,
            email,
            password: getDefaultPassword(),
          });

          await newUser.save();
          userMap.set(studentId, newUser);
          summary.inserted += 1;
          summary.insertedDetails.push({
            studentId,
            name,
            course,
            year,
            branch,
            semester: semester || null,
          });
        }
      } catch (error) {
        console.error(`[MySQL Sync] Failed to sync student ${studentId}:`, error);
        summary.errors.push({
          studentId,
          message: error.message || 'Unknown error',
        });
      }
    }

    // Update academic config with courses, branches, and years from synced students
    await updateAcademicConfigFromStudents(normalized);

    res.json({
      ...summary,
      message: `Sync complete for table "${tableName}".`,
    });
  } catch (error) {
    console.error('[MySQL] Failed to sync student records:', error);
    res.status(500);
    throw new Error(error.message || 'Failed to sync MySQL students.');
  }
});

module.exports = {
  getSqlStudents,
  syncSqlStudents,
  normalizeStudentRow,
};


