import { useState, useEffect, useMemo } from 'react';
import { Plus, Upload, Search, Users, Edit2, Trash2, X } from 'lucide-react';
import { apiUrl } from '../utils/api';

const StudentRow = ({ student, editingId, editFields, setEditFields, startEdit, saveEdit, cancelEdit, deleteStudent }) => {
  const isEditing = editingId === student.id;

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
            {student.name.charAt(0).toUpperCase()}
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
          Year {student.year}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {student.branch || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
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
      </td>
    </tr>
  );
};

const StudentManagement = ({ students = [], setStudents, addStudent }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('1');
  const [branch, setBranch] = useState('');
  const [config, setConfig] = useState(null);
  const [message, setMessage] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkMessage, setBulkMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

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

  const filteredStudents = useMemo(() => {
    return (students || []).filter(student => {
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
  }, [students, searchTerm, courseFilter, yearFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    setEditingId(s.id);
    setEditFields({ name: s.name, studentId: s.studentId, course: s.course, year: s.year, branch: s.branch });
  };

  const cancelEdit = () => { setEditingId(null); setEditFields({}); };

  const saveEdit = async (id) => {
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
        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            Add Student
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setShowBulkModal(true)}
          >
            <Upload size={16} />
            Bulk Upload
          </button>
        </div>
      </div>

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
              {Array.from(new Set((students || []).map(s => s.course).filter(Boolean))).map(c => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Years</option>
              {Array.from(new Set((students || []).map(s => String(s.year)).filter(Boolean))).sort().map(y => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">All Students</h3>
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              {filteredStudents.length} students
            </span>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map(s => (
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
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowBulkModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bulk Add Students</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-4">Upload an Excel (.xlsx or .csv) file with columns: name, studentId, course, year, branch</p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="w-full"
                onChange={e => { setBulkFile(e.target.files && e.target.files[0]); setBulkMessage(''); }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={async () => {
                  if (!bulkFile) { setBulkMessage('Please select a file'); return; }
                  try {
                    setBulkMessage('Uploading...');
                    const fd = new FormData();
                    fd.append('file', bulkFile);
                    const importCourse = courseFilter !== 'all' ? courseFilter : (config?.courses?.[0]?.name || '');
                    const res = await fetch(apiUrl(`/api/users/import/${importCourse}`), { method: 'POST', body: fd });
                    if (!res.ok) throw new Error('Upload failed');
                    const data = await res.json();
                    if (data && Array.isArray(data.imported)) {
                      setStudents(prev => [...(prev||[]), ...data.imported]);
                      setBulkMessage(`Imported ${data.imported.length} students`);
                      setBulkFile(null);
                    } else {
                      setBulkMessage('Import finished but no students returned');
                    }
                  } catch (err) {
                    console.error('Bulk upload failed', err);
                    setBulkMessage('Bulk upload failed: ' + (err.message || ''));
                  }
                }}
              >
                Upload
              </button>
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => { setShowBulkModal(false); setBulkFile(null); setBulkMessage(''); }}
              >
                Cancel
              </button>
            </div>
            {bulkMessage && <div className="mt-3 text-sm text-gray-600">{bulkMessage}</div>}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
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