import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, GraduationCap, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiUrl } from '../utils/api';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { loadJSON, saveJSON } from '../utils/storage';
import { getAllowedCourses, normalizeCourseName, hasViewAccess } from '../utils/permissions';

const normalizeCourse = (value) => {
  if (!value) return '';
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};

const prepareStudents = (source = []) =>
  (source || []).map((student) => ({
    ...student,
    id: student.id || student._id,
    normalizedCourse: normalizeCourse(student.course),
  }));

// Cache timestamp keys
const CACHE_TIMESTAMP_KEY = 'studentsCacheTimestamp';
const CONFIG_TIMESTAMP_KEY = 'configCacheTimestamp';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const isCacheValid = (timestampKey) => {
  const timestamp = loadJSON(timestampKey, null);
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_TTL;
};

const StudentDashboard = ({ initialStudents = [], isOnline: isOnlineProp, currentUser }) => {
  const navigate = useNavigate();
  const searchTimeoutRef = useRef(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Check if user is super admin
  const isSuperAdmin = currentUser?.role === 'Administrator';
  const userPermissions = Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];

  // Get allowed courses for course-dashboard permission
  const allowedCourses = useMemo(() => {
    if (isSuperAdmin) return null; // Super admin sees all courses
    if (!hasViewAccess(userPermissions, 'course-dashboard')) return []; // No access to course dashboard

    // Get course-specific permissions
    const courses = getAllowedCourses(userPermissions);
    // If user has course-dashboard permission but no course-specific permissions,
    // they see all courses (return null)
    // If they have course-specific permissions, return those courses
    return courses.length > 0 ? courses : null; // null means all courses, empty array means no access
  }, [isSuperAdmin, userPermissions]);

  // Load from cache first if available
  const cachedStudents = useMemo(() => {
    if (initialStudents && initialStudents.length > 0) return prepareStudents(initialStudents);
    return prepareStudents(loadJSON('studentsCache', []));
  }, [initialStudents]);

  const [students, setStudents] = useState(cachedStudents);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // 50 items per page
  const [config, setConfig] = useState(() => loadJSON('configCache', null));
  const isOnline = typeof isOnlineProp === 'boolean' ? isOnlineProp : useOnlineStatus();
  const hasInitialized = useRef(false);

  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    if (initialStudents && initialStudents.length > 0) {
      setStudents(prepareStudents(initialStudents));
    }
  }, [initialStudents]);

  // Smart fetch - only if cache is stale or missing
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!isOnline && !forceRefresh) return;

    const hasValidStudentCache = isCacheValid(CACHE_TIMESTAMP_KEY);
    const hasValidConfigCache = isCacheValid(CONFIG_TIMESTAMP_KEY);

    // If cache is valid and not forcing refresh, use cached data
    if (!forceRefresh && hasValidStudentCache && hasValidConfigCache) {
      // Update config if needed
      if (!hasValidConfigCache) {
        try {
          const configRes = await fetch(apiUrl('/api/config/academic'));
          if (configRes.ok) {
            const configData = await configRes.json();
            setConfig(configData);
            saveJSON('configCache', configData);
            saveJSON(CONFIG_TIMESTAMP_KEY, Date.now());
          }
        } catch (error) {
          console.error('Error fetching config:', error);
        }
      }
      return;
    }

    // Show refreshing indicator only if we have cached data
    if (students.length > 0 && !forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const promises = [];

      if (!hasValidConfigCache || forceRefresh) {
        promises.push(
          fetch(apiUrl('/api/config/academic'))
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) {
                setConfig(data);
                saveJSON('configCache', data);
                saveJSON(CONFIG_TIMESTAMP_KEY, Date.now());
              }
              return data;
            })
            .catch(err => {
              console.error('Error fetching config:', err);
              return null;
            })
        );
      }

      if (!hasValidStudentCache || forceRefresh) {
        promises.push(
          fetch(apiUrl('/api/users'))
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) {
                const formatted = prepareStudents(data);
                setStudents(formatted);
                saveJSON('studentsCache', formatted);
                saveJSON(CACHE_TIMESTAMP_KEY, Date.now());
              }
              return data;
            })
            .catch(err => {
              console.error('Error fetching students:', err);
              return null;
            })
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOnline, students.length]);

  // Initial load - check cache validity
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Load config from cache if valid
    if (isCacheValid(CONFIG_TIMESTAMP_KEY)) {
      const cachedConfig = loadJSON('configCache', null);
      if (cachedConfig) {
        setConfig(cachedConfig);
      }
    }

    // Load students from cache if valid
    if (isCacheValid(CACHE_TIMESTAMP_KEY)) {
      const cached = loadJSON('studentsCache', []);
      if (cached && cached.length > 0) {
        setStudents(prepareStudents(cached));
      }
    }

    // Fetch in background if online and cache is stale
    if (isOnline) {
      fetchData(false);
    }
  }, [isOnline, fetchData]);

  const getCourseDisplayName = (courseName) => {
    if (!courseName) return 'N/A';
    const normalized = normalizeCourse(courseName);
    const display = config?.courses?.find(c => normalizeCourse(c.name) === normalized)?.displayName;
    return display || courseName.toUpperCase();
  };

  const handleStudentUpdate = (studentId, updateData) => {
    const updated = students.map(student => {
      if (student.id !== studentId) return student;

      const updatedStudent = { ...student, ...updateData };
      updatedStudent.normalizedCourse = normalizeCourse(updatedStudent.course);

      const targetCourse = student.course;
      if (targetCourse) {
        fetch(apiUrl(`/api/users/${targetCourse}/${student._id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paid: updatedStudent.paid,
            items: updatedStudent.items,
            name: updatedStudent.name,
            studentId: updatedStudent.studentId,
            year: updatedStudent.year,
            branch: updatedStudent.branch,
          }),
        }).catch(err => console.error('Failed to update student:', err));
      }

      return updatedStudent;
    });

    setStudents(updated);
  };

  const handleItemToggle = (studentId, itemName) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const items = student.items || {};
    const updatedItems = { ...items, [itemName]: !Boolean(items[itemName]) };
    handleStudentUpdate(studentId, { items: updatedItems });
  };

  const handleDeleteStudent = (student) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    fetch(apiUrl(`/api/users/${student.course}/${student._id}`), {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error('Delete failed');
        setStudents(prev => prev.filter(s => s.id !== student.id));
      })
      .catch(err => console.error('Delete failed:', err));
  };

  const filteredStudents = useMemo(() => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    return students.filter(student => {
      // Filter by course permissions first
      if (allowedCourses !== null) {
        // If allowedCourses is an empty array, user has no access
        if (allowedCourses.length === 0) {
          return false;
        }
        // Check if student's course is in allowed courses
        const studentCourseNormalized = normalizeCourseName(student.course);
        const hasAccess = allowedCourses.some(allowedCourse => {
          const normalizedAllowed = normalizeCourseName(allowedCourse);
          return studentCourseNormalized === normalizedAllowed;
        });
        if (!hasAccess) {
          return false;
        }
      }
      // If allowedCourses is null, user has access to all courses (super admin or general course-dashboard permission)

      const matchesSearch = !searchLower ||
        student.name?.toLowerCase().includes(searchLower) ||
        student.studentId?.toLowerCase().includes(searchLower);

      const matchesYear = yearFilter === 'all' || String(student.year) === String(yearFilter);

      const matchesSemester = semesterFilter === 'all' ||
        (student.semester && String(student.semester) === String(semesterFilter));

      // Course filter: compare normalized course names
      const normalizedCourseFilter = courseFilter === 'all' ? 'all' : normalizeCourse(courseFilter);
      const matchesCourse = normalizedCourseFilter === 'all' || student.normalizedCourse === normalizedCourseFilter;

      // Branch filter: only apply if course is selected, and match branch
      const matchesBranch = branchFilter === 'all' ||
        (student.branch && student.branch.trim().toLowerCase() === branchFilter.trim().toLowerCase());

      return matchesSearch && matchesYear && matchesSemester && matchesCourse && matchesBranch;
    });
  }, [students, debouncedSearchTerm, yearFilter, courseFilter, branchFilter, allowedCourses]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [yearFilter, semesterFilter, courseFilter, branchFilter, debouncedSearchTerm]);

  // Get semesters from students (filtered by permissions, then by course/year filter)
  const semesterOptions = useMemo(() => {
    // Start with students filtered by permissions
    let availableStudents = students;
    if (allowedCourses !== null) {
      if (allowedCourses.length === 0) return [];
      availableStudents = students.filter(student => {
        const studentCourseNormalized = normalizeCourseName(student.course);
        return allowedCourses.some(allowedCourse => {
          const normalizedAllowed = normalizeCourseName(allowedCourse);
          return studentCourseNormalized === normalizedAllowed;
        });
      });
    }

    // Filter by course if set
    if (courseFilter !== 'all') {
      availableStudents = availableStudents.filter(s => normalizeCourse(s.course) === normalizeCourse(courseFilter));
    }

    // Filter by year if set
    if (yearFilter !== 'all') {
      availableStudents = availableStudents.filter(s => String(s.year) === String(yearFilter));
    }

    return Array.from(new Set(availableStudents.map(s => s.semester).filter(Boolean))).sort((a, b) => a - b);
  }, [students, courseFilter, yearFilter, allowedCourses]);

  // Get years from students (filtered by permissions, then by course filter)
  const yearOptions = useMemo(() => {
    // First filter by permissions
    let availableStudents = students;
    if (allowedCourses !== null) {
      if (allowedCourses.length === 0) {
        return [];
      }
      availableStudents = students.filter(student => {
        const studentCourseNormalized = normalizeCourseName(student.course);
        return allowedCourses.some(allowedCourse => {
          const normalizedAllowed = normalizeCourseName(allowedCourse);
          return studentCourseNormalized === normalizedAllowed;
        });
      });
    }

    // Then filter by course filter if set
    const filteredByCourse = courseFilter === 'all'
      ? availableStudents
      : availableStudents.filter(s => normalizeCourse(s.course) === normalizeCourse(courseFilter));
    return Array.from(new Set(filteredByCourse.map(s => s.year).filter(Boolean))).sort((a, b) => a - b);
  }, [students, courseFilter, allowedCourses]);

  // Get course options - filter by allowed courses
  const courseOptions = useMemo(() => {
    let allCourses = config?.courses
      ? config.courses.map(c => ({ name: c.name, displayName: c.displayName }))
      : Array.from(new Set(students.map(s => s.normalizedCourse)))
        .filter(Boolean)
        .map(name => ({ name, displayName: name.toUpperCase() }));

    // Filter by allowed courses if user has course-specific permissions
    if (allowedCourses !== null && allowedCourses.length > 0) {
      allCourses = allCourses.filter(course => {
        const courseName = course.name || course;
        const normalizedCourse = normalizeCourseName(courseName);
        return allowedCourses.some(allowed => normalizeCourseName(allowed) === normalizedCourse);
      });
    }

    return allCourses;
  }, [config?.courses, students, allowedCourses]);

  // Get branch options based on selected course
  const branchOptions = useMemo(() => {
    if (courseFilter === 'all') {
      // If no course selected, show all unique branches from all students
      return Array.from(new Set(students.map(s => s.branch).filter(Boolean))).sort();
    }

    // Get branches from config for the selected course
    const normalizedFilter = normalizeCourse(courseFilter);
    const selectedCourse = config?.courses?.find(c => normalizeCourse(c.name) === normalizedFilter);

    if (selectedCourse && selectedCourse.branches && selectedCourse.branches.length > 0) {
      // Return branches from config
      return selectedCourse.branches.sort();
    }

    // Fallback: get branches from students in this course
    const studentsInCourse = students.filter(s => normalizeCourse(s.course) === normalizedFilter);
    return Array.from(new Set(studentsInCourse.map(s => s.branch).filter(Boolean))).sort();
  }, [students, courseFilter, config]);

  // Save to cache when students change (but not during initial load)
  useEffect(() => {
    if (hasInitialized.current && students.length > 0) {
      saveJSON('studentsCache', students);
      saveJSON(CACHE_TIMESTAMP_KEY, Date.now());
    }
  }, [students]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className=" mx-auto">
        <div className="mb-8">
          {/* <div className="flex items-center gap-3 mb-6">
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
          </div> */}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                <Users size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  {searchTerm || courseFilter !== 'all' || yearFilter !== 'all' || semesterFilter !== 'all' || branchFilter !== 'all'
                    ? `${filteredStudents.length} ${filteredStudents.length === 1 ? 'student' : 'students'} found`
                    : `${students.length} ${students.length === 1 ? 'student' : 'students'} enrolled across all courses`}
                </p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
              onClick={() => navigate('/add-student')}
            >
              <Plus size={18} />
              Add Student
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-xl font-semibold text-gray-900">{filteredStudents.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid Students</p>
              <p className="text-xl font-semibold text-gray-900">{filteredStudents.filter(s => s.paid).length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Students</p>
              <p className="text-xl font-semibold text-gray-900">{filteredStudents.filter(s => !s.paid).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Search className="text-white" size={18} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600" size={18} />
              <input
                type="text"
                placeholder="Search by name or student ID..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                value={courseFilter}
                onChange={(e) => {
                  setCourseFilter(e.target.value);
                  setBranchFilter('all'); // Reset branch filter when course changes
                }}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white shadow-sm transition-all cursor-pointer hover:bg-gray-50"
              >
                <option value="all">All Courses</option>
                {courseOptions?.map(course => (
                  <option key={course.name || course} value={course.name || course}>
                    {course.displayName || getCourseDisplayName(course.name)}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white shadow-sm transition-all cursor-pointer hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={branchOptions.length === 0}
              >
                <option value="all">All Branches</option>
                {branchOptions.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white shadow-sm transition-all cursor-pointer hover:bg-gray-50"
              >
                <option value="all">All Years</option>
                {yearOptions.map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white shadow-sm transition-all cursor-pointer hover:bg-gray-50"
              >
                <option value="all">All Semesters</option>
                {semesterOptions.map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div>
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || courseFilter !== 'all' || yearFilter !== 'all' || semesterFilter !== 'all' || branchFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding students to the system'}
              </p>
              {!searchTerm && courseFilter === 'all' && yearFilter === 'all' && semesterFilter === 'all' && branchFilter === 'all' && (
                <button
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
                  onClick={() => navigate('/add-student')}
                >
                  Add First Student
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Student List</h3>
                      <p className="text-sm text-gray-600">View and manage all students</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-200 rounded-lg">
                    {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                {refreshing && (
                  <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-sm text-blue-700">
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    Refreshing data...
                  </div>
                )}
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Year</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Semester</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Branch</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedStudents.map(student => (
                      <tr
                        key={student.id}
                        onClick={() => navigate(`/student/${student.id}`)}
                        className="border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md">
                              {student.name
                                ?.split(' ')
                                ?.map(n => n[0])
                                ?.join('')
                                ?.toUpperCase()
                                ?.slice(0, 2) || 'NA'}
                            </div>
                            <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {getCourseDisplayName(student.course)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {student.studentId}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            Year {student.year}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.semester ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              Sem {student.semester}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-700">
                            {student.branch || <span className="text-gray-400">N/A</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <button
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
                              onClick={() => handleDeleteStudent(student)}
                              title="Delete Student"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="text-sm text-gray-700">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

