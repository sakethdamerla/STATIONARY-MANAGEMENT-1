import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Upload, Search, Users, Edit2, Trash2, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { apiUrl } from '../utils/api';

const StudentRow = ({
  student,
  editingId,
  editFields,
  setEditFields,
  startEdit,
  saveEdit,
  cancelEdit,
  deleteStudent,
  isSqlMode,
}) => {
  const isEditing = !isSqlMode && editingId === student.id;
  const studentInitial = String(student.name || '?').charAt(0).toUpperCase();

  if (isEditing) {
    return (
      <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={editFields.name}
            onChange={e => setEditFields(prev => ({...prev, name: e.target.value}))}
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={editFields.studentId}
            onChange={e => setEditFields(prev => ({...prev, studentId: e.target.value}))}
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={editFields.course}
            onChange={e => setEditFields(prev => ({...prev, course: e.target.value}))}
          >
            <option value="b.tech">B.Tech</option>
            <option value="diploma">Diploma</option>
            <option value="degree">Degree</option>
          </select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            type="number"
            value={editFields.year}
            onChange={e => setEditFields(prev => ({...prev, year: e.target.value}))}
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={editFields.branch}
            onChange={e => setEditFields(prev => ({...prev, branch: e.target.value}))}
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              onClick={() => saveEdit(student.id)}
            >
              Save
            </button>
            <button
              className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
            {studentInitial}
          </div>
          <span className="font-medium text-gray-900">{student.name}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {student.studentId}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {student.course.toUpperCase()}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {student.year ? `Year ${student.year}` : 'Year N/A'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {student.semester ? `Sem ${student.semester}` : 'Sem N/A'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {student.branch || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isSqlMode ? (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
            Read only
          </span>
        ) : (
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              onClick={() => startEdit(student)}
            >
              <Edit2 size={14} />
              Edit
            </button>
            <button
              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              onClick={() => deleteStudent(student)}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

const VIEW_MODES = {
  mongo: 'mongo',
  sql: 'sql',
};

const StudentManagement = ({ students = [], setStudents, addStudent, refreshStudents }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('1');
  const [branch, setBranch] = useState('');
  const [config, setConfig] = useState(null);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sqlStudents, setSqlStudents] = useState([]);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlLoaded, setSqlLoaded] = useState(false);
  const [sqlError, setSqlError] = useState('');
  const [sqlMeta, setSqlMeta] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);
  const [syncStats, setSyncStats] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState(null); // 'inserted', 'updated', 'skipped', null
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [viewMode, setViewMode] = useState(VIEW_MODES.mongo);
  const cancelSqlFetchRef = useRef(false);

  const isSqlActive = viewMode === VIEW_MODES.sql;
  const dataSource = isSqlActive ? sqlStudents : students;
  const isSqlMode = isSqlActive;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/config/academic'));
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
          const firstCourse = data.courses?.[0];
          if (firstCourse) {
            setCourse(firstCourse.name);
            setYear(String(firstCourse.years?.[0] || '1'));
            setBranch(firstCourse.branches?.[0] || '');
          }
        }
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    cancelSqlFetchRef.current = false;
    return () => {
      cancelSqlFetchRef.current = true;
    };
  }, []);

  const fetchSqlStudents = useCallback(async () => {
    if (sqlLoading) return;
    setSqlLoading(true);
    setSqlError('');
    try {
      const res = await fetch(apiUrl('/api/sql/students'));
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Failed with status ${res.status}`);
      }
      const data = await res.json();
      if (!cancelSqlFetchRef.current) {
        setSqlStudents(Array.isArray(data?.rows) ? data.rows : []);
        setSqlMeta({ table: data?.table, count: data?.count });
        setSqlLoaded(true);
      }
    } catch (error) {
      if (!cancelSqlFetchRef.current) {
        console.error('Failed to fetch MySQL students:', error);
        setSqlError(error.message || 'Unable to load external students.');
        setSqlLoaded(false);
      }
    } finally {
      if (!cancelSqlFetchRef.current) {
        setSqlLoading(false);
      }
    }
  }, [sqlLoading]);

  const handleSyncToMongo = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncFeedback(null);
    setSyncStats(null);
    try {
      const res = await fetch(apiUrl('/api/sql/students/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = data?.message || res.statusText || 'Failed to sync students.';
        throw new Error(message);
      }

      const {
        inserted = 0,
        updated = 0,
        skipped = 0,
        total = 0,
        errors = [],
        insertedDetails = [],
        updatedDetails = [],
        skippedDetails = [],
        message = 'Sync complete.',
      } = data || {};

      setSyncFeedback({
        type: 'success',
        message: `${message}`,
      });
      setSyncStats({
        inserted,
        updated,
        skipped,
        total,
        table: data?.table,
        errors: errors?.length || 0,
        insertedDetails: insertedDetails || [],
        updatedDetails: updatedDetails || [],
        skippedDetails: skippedDetails || [],
        timestamp: new Date().toISOString(),
      });
      setExpandedDetails(null); // Reset expanded section

      if (typeof refreshStudents === 'function') {
        await refreshStudents();
      }

      if (viewMode === VIEW_MODES.sql) {
        await fetchSqlStudents();
      }
    } catch (error) {
      setSyncFeedback({
        type: 'error',
        message: error.message || 'Unable to sync students from MySQL.',
      });
      setSyncStats(null);
    } finally {
      setSyncing(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return (dataSource || []).filter(student => {
      const term = (searchTerm || '').toLowerCase();
      if (term) {
        const nameMatch = String(student.name || '').toLowerCase().includes(term);
        const idMatch = String(student.studentId || '').toLowerCase().includes(term);
        if (!nameMatch && !idMatch) return false;
      }
      if (courseFilter !== 'all' && String(student.course) !== String(courseFilter)) return false;
      if (yearFilter !== 'all' && String(student.year) !== String(yearFilter)) return false;
      return true;
    });
  }, [dataSource, searchTerm, courseFilter, yearFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, courseFilter, yearFilter, viewMode, dataSource.length]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedStudents = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, safeCurrentPage, pageSize]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSqlMode) {
      setMessage('Adding students is disabled while viewing external database records.');
      return;
    }
    if (!name || !studentId || !course || !year) {
      setMessage('All fields are required.');
      return;
    }

    const newStudent = { name, studentId, course, year: Number(year), branch };
    const result = await addStudent(newStudent);
    if (result.success) {
      setMessage('Student added successfully!');
      setName(''); setStudentId(''); setYear('1'); setBranch('CSE'); setCourse('b.tech');
    } else setMessage(result.message || 'Add failed');
  };

  const startEdit = (s) => {
    if (isSqlMode) return;
    setEditingId(s.id);
    setEditFields({ name: s.name, studentId: s.studentId, course: s.course, year: s.year, branch: s.branch });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFields({});
  };

  const saveEdit = async (id) => {
    if (isSqlMode) return;
    try {
      const original = (students || []).find(s => s.id === id);
      const courseParam = String(original?.course || editFields.course || '').toLowerCase();
      const res = await fetch(apiUrl(`/api/users/${courseParam}/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFields.name,
          studentId: editFields.studentId,
          year: Number(editFields.year),
          branch: editFields.branch,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setStudents(prev => prev.map(p => p.id === id ? { ...p, ...editFields, year: Number(editFields.year) } : p));
      cancelEdit();
    } catch (err) {
      console.error('Edit failed', err);
      setMessage('Edit failed: ' + (err.message || ''));
    }
  };

  const deleteStudent = async (student) => {
    if (isSqlMode) return;
    const { id, course } = student;
    try {
      const courseParam = String(course || '').toLowerCase();
      const res = await fetch(apiUrl(`/api/users/${courseParam}/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
      setMessage('Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="flex items-center gap-4 mb-4 lg:mb-0">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-600">Manage all student records and information</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-gray-900 text-gray-100 rounded-xl px-1 py-1 flex items-center">
            <button
              onClick={() => setViewMode(VIEW_MODES.mongo)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === VIEW_MODES.mongo
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              Stationery Students
            </button>
            <button
              onClick={() => {
                setViewMode(VIEW_MODES.sql);
                if ((!sqlLoaded || sqlError) && !sqlLoading) {
                  fetchSqlStudents();
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === VIEW_MODES.sql
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
              disabled={sqlLoading}
            >
              External SQL Students
            </button>
          </div>

          {isSqlMode ? (
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleSyncToMongo}
              disabled={syncing}
            >
              <Upload size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : 'Sync to Stationery DB'}
            </button>
          ) : null}
        </div>
      </div>

      {viewMode === VIEW_MODES.sql && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
          <h3 className="text-base font-semibold mb-1">Read-only view from MySQL</h3>
          <p>
            Showing {sqlMeta?.count ?? sqlStudents.length} records from table{' '}
            <span className="font-medium">{sqlMeta?.table ?? 'students'}</span> in the configured MySQL
            database. Editing, adding, or deleting is disabled in this mode.
          </p>
        </div>
      )}

      {syncFeedback && (
        <div
          className={`mb-6 rounded-xl border p-4 text-sm ${
            syncFeedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {syncFeedback.message}
        </div>
      )}

      {syncStats && (
        <>
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Sync Statistics Explained</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li><strong>Processed:</strong> Total number of student records found in MySQL table</li>
                <li><strong>Inserted:</strong> New students added to MongoDB (didn't exist before)</li>
                <li><strong>Updated:</strong> Existing students whose information was modified</li>
                <li><strong>Skipped:</strong> Students that were not changed (already up-to-date) or had missing data</li>
              </ul>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Processed</h4>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{syncStats.total}</p>
                <p className="text-xs text-gray-400 mt-1">Table: {syncStats.table || 'students'}</p>
              </div>
              <button
                onClick={() => setExpandedDetails(expandedDetails === 'inserted' ? null : 'inserted')}
                className="bg-white rounded-xl border border-green-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-green-600 uppercase tracking-wider">Inserted</h4>
                    <p className="text-2xl font-semibold text-green-700 mt-1">{syncStats.inserted}</p>
                  </div>
                  {syncStats.inserted > 0 && (
                    expandedDetails === 'inserted' ? <ChevronUp size={20} className="text-green-600" /> : <ChevronDown size={20} className="text-green-600" />
                  )}
                </div>
              </button>
              <button
                onClick={() => setExpandedDetails(expandedDetails === 'updated' ? null : 'updated')}
                className="bg-white rounded-xl border border-blue-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 uppercase tracking-wider">Updated</h4>
                    <p className="text-2xl font-semibold text-blue-700 mt-1">{syncStats.updated}</p>
                  </div>
                  {syncStats.updated > 0 && (
                    expandedDetails === 'updated' ? <ChevronUp size={20} className="text-blue-600" /> : <ChevronDown size={20} className="text-blue-600" />
                  )}
                </div>
              </button>
              <button
                onClick={() => setExpandedDetails(expandedDetails === 'skipped' ? null : 'skipped')}
                className="bg-white rounded-xl border border-yellow-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-yellow-600 uppercase tracking-wider">Skipped</h4>
                    <p className="text-2xl font-semibold text-yellow-700 mt-1">
                      {syncStats.skipped}
                      {syncStats.errors ? ` (${syncStats.errors} issues)` : ''}
                    </p>
                  </div>
                  {syncStats.skipped > 0 && (
                    expandedDetails === 'skipped' ? <ChevronUp size={20} className="text-yellow-600" /> : <ChevronDown size={20} className="text-yellow-600" />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {syncStats.timestamp ? `Updated ${new Date(syncStats.timestamp).toLocaleString()}` : ''}
                </p>
              </button>
            </div>
          </div>

          {/* Detailed Views */}
          {expandedDetails === 'inserted' && syncStats.insertedDetails && syncStats.insertedDetails.length > 0 && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Users size={16} />
                Newly Inserted Students ({syncStats.insertedDetails.length})
              </h3>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-green-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-green-900">Student ID</th>
                      <th className="px-3 py-2 text-left font-semibold text-green-900">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-green-900">Course</th>
                      <th className="px-3 py-2 text-left font-semibold text-green-900">Year</th>
                      <th className="px-3 py-2 text-left font-semibold text-green-900">Branch</th>
                      <th className="px-3 py-2 text-left font-semibold text-green-900">Semester</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-green-100">
                    {syncStats.insertedDetails.map((student, idx) => (
                      <tr key={idx} className="hover:bg-green-50">
                        <td className="px-3 py-2 text-green-800 font-medium">{student.studentId}</td>
                        <td className="px-3 py-2 text-green-800">{student.name}</td>
                        <td className="px-3 py-2 text-green-800">{student.course || 'N/A'}</td>
                        <td className="px-3 py-2 text-green-800">{student.year || 'N/A'}</td>
                        <td className="px-3 py-2 text-green-800">{student.branch || 'N/A'}</td>
                        <td className="px-3 py-2 text-green-800">{student.semester || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {expandedDetails === 'updated' && syncStats.updatedDetails && syncStats.updatedDetails.length > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Edit2 size={16} />
                Updated Students ({syncStats.updatedDetails.length})
              </h3>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-blue-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-blue-900">Student ID</th>
                      <th className="px-3 py-2 text-left font-semibold text-blue-900">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-blue-900">Course</th>
                      <th className="px-3 py-2 text-left font-semibold text-blue-900">Year</th>
                      <th className="px-3 py-2 text-left font-semibold text-blue-900">Branch</th>
                      <th className="px-3 py-2 text-left font-semibold text-blue-900">Changes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-100">
                    {syncStats.updatedDetails.map((student, idx) => {
                      const changes = [];
                      if (student.previousCourse !== student.course) {
                        changes.push(`Course: ${student.previousCourse} → ${student.course}`);
                      }
                      if (student.previousYear !== student.year) {
                        changes.push(`Year: ${student.previousYear} → ${student.year}`);
                      }
                      if (student.previousBranch !== student.branch) {
                        changes.push(`Branch: ${student.previousBranch || 'N/A'} → ${student.branch || 'N/A'}`);
                      }
                      if (student.previousSemester !== student.semester) {
                        changes.push(`Semester: ${student.previousSemester || 'N/A'} → ${student.semester || 'N/A'}`);
                      }
                      return (
                        <tr key={idx} className="hover:bg-blue-50">
                          <td className="px-3 py-2 text-blue-800 font-medium">{student.studentId}</td>
                          <td className="px-3 py-2 text-blue-800">{student.name}</td>
                          <td className="px-3 py-2 text-blue-800">{student.course || 'N/A'}</td>
                          <td className="px-3 py-2 text-blue-800">{student.year || 'N/A'}</td>
                          <td className="px-3 py-2 text-blue-800">{student.branch || 'N/A'}</td>
                          <td className="px-3 py-2 text-blue-800">
                            <div className="space-y-1">
                              {changes.length > 0 ? (
                                changes.map((change, i) => (
                                  <div key={i} className="text-[10px]">{change}</div>
                                ))
                              ) : (
                                <span className="text-gray-500">No changes</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {expandedDetails === 'skipped' && syncStats.skippedDetails && syncStats.skippedDetails.length > 0 && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <X size={16} />
                Skipped Students ({syncStats.skippedDetails.length})
              </h3>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-yellow-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-yellow-900">Student ID</th>
                      <th className="px-3 py-2 text-left font-semibold text-yellow-900">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-yellow-900">Course</th>
                      <th className="px-3 py-2 text-left font-semibold text-yellow-900">Year</th>
                      <th className="px-3 py-2 text-left font-semibold text-yellow-900">Branch</th>
                      <th className="px-3 py-2 text-left font-semibold text-yellow-900">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-yellow-900">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-yellow-100">
                    {syncStats.skippedDetails.map((student, idx) => (
                      <tr key={idx} className="hover:bg-yellow-50">
                        <td className="px-3 py-2 text-yellow-800 font-medium">{student.studentId}</td>
                        <td className="px-3 py-2 text-yellow-800">{student.name}</td>
                        <td className="px-3 py-2 text-yellow-800">{student.course || 'N/A'}</td>
                        <td className="px-3 py-2 text-yellow-800">{student.year || 'N/A'}</td>
                        <td className="px-3 py-2 text-yellow-800">{student.branch || 'N/A'}</td>
                        <td className="px-3 py-2 text-yellow-800">
                          {student.status ? (
                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                              student.reason?.includes('Admission cancelled') 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {student.status}
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-yellow-800">
                          <span className="text-[10px]">{student.reason || 'No changes detected'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === VIEW_MODES.sql && sqlError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          <h3 className="text-base font-semibold mb-1">Could not load MySQL records</h3>
          <p>{sqlError}</p>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1 w-full lg:w-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or student ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Courses</option>
              {Array.from(new Set((dataSource || []).map(s => s.course).filter(Boolean))).map(c => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Years</option>
              {Array.from(new Set((dataSource || []).map(s => String(s.year)).filter(Boolean))).sort().map(y => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">All Students</h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="bg-gray-100 px-2 py-1 rounded-full">{filteredStudents.length} students</span>
              {filteredStudents.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                      value={pageSize}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setPageSize(value);
                        setCurrentPage(1);
                      }}
                    >
                      {[10, 25, 50, 100].map(size => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span>
                    Showing {(safeCurrentPage - 1) * pageSize + 1}-
                    {Math.min(filteredStudents.length, safeCurrentPage * pageSize)} of {filteredStudents.length}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedStudents.map(s => (
                <StudentRow
                  key={s.id}
                  student={s}
                  editingId={editingId}
                  editFields={editFields}
                  setEditFields={setEditFields}
                  startEdit={startEdit}
                  saveEdit={saveEdit}
                  cancelEdit={cancelEdit}
                  deleteStudent={deleteStudent}
                  isSqlMode={isSqlMode}
                />
              ))}
            </tbody>
          </table>
          {viewMode === VIEW_MODES.sql && sqlLoading && (
            <div className="py-10 text-center text-sm text-gray-500">Loading students from MySQL…</div>
          )}
          {!sqlLoading && filteredStudents.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-500">
              No students match the current filters.
            </div>
          )}
        </div>
      </div>

      {filteredStudents.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {safeCurrentPage} of {totalPages}
            </span>
            <button
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && viewMode === VIEW_MODES.mongo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Student</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { handleSubmit(e); setShowAddModal(false); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pin Number</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={course}
                    onChange={e => setCourse(e.target.value)}
                  >
                    {(config?.courses || []).map(c => (
                      <option key={c.name} value={c.name}>{c.displayName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                  >
                    {(config?.courses?.find(c => c.name === course)?.years || [1]).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                >
                  {(config?.courses?.find(c => c.name === course)?.branches || ['']).map(b => (
                    <option key={b} value={b}>{b || 'N/A'}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Student
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;