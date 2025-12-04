import { useEffect, useState } from 'react';
import { Plus, Trash2, GraduationCap, BookOpen, Edit2, X } from 'lucide-react';
import { apiUrl } from '../utils/api';
import { hasFullAccess } from '../utils/permissions';

const CourseManagement = ({ currentUser }) => {
  // Check access level
  const isSuperAdmin = currentUser?.role === 'Administrator';
  const canEdit = isSuperAdmin || hasFullAccess(currentUser?.permissions || [], 'courses');

  const [courses, setCourses] = useState([]);
  const [name, setName] = useState('');
  const [branchesText, setBranchesText] = useState('');
  const [yearsText, setYearsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBranchesText, setEditBranchesText] = useState('');
  const [editYearsText, setEditYearsText] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        // Prefer new endpoint
        let res = await fetch(apiUrl('/api/academic-config/courses'));
        if (res.ok) {
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : []);
          return;
        }
        // Fallback to legacy singleton config
        if (res.status === 404) {
          res = await fetch(apiUrl('/api/config/academic'));
          if (res.ok) {
            const data = await res.json();
            setCourses(Array.isArray(data?.courses) ? data.courses : []);
            return;
          }
        }
      } catch (e) {
        // ignore load errors silently for now
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const resetForm = () => {
    setName('');
    setBranchesText('');
    setYearsText('');
    setError('');
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const normalizedNameCode = trimmedName.toLowerCase();
    const parsedBranches = branchesText
      .split(',')
      .map(b => b.trim())
      .filter(Boolean);
    const parsedYears = yearsText
      .split(',')
      .map(y => parseInt(y, 10))
      .filter(n => Number.isFinite(n) && n > 0);
    if (!trimmedName) {
      setError('Course name is required.');
      return;
    }
    if (courses.some(c => (c.name || '').toLowerCase() === normalizedNameCode)) {
      setError('A course with this code already exists.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      let res = await fetch(apiUrl('/api/academic-config/courses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: normalizedNameCode, displayName: trimmedName, years: parsedYears, branches: parsedBranches }),
      });
      if (res.ok) {
        const saved = await res.json();
        setCourses(prev => [...prev, saved]);
        resetForm();
        return;
      }
      // Fallback path using legacy config if new endpoint not present
      if (res.status === 404) {
        // Load current config
        const getRes = await fetch(apiUrl('/api/config/academic'));
        if (!getRes.ok) throw new Error('Failed to load config');
        const cfg = await getRes.json();
        const nextCourses = Array.isArray(cfg?.courses) ? cfg.courses.slice() : [];
        if (nextCourses.some(c => (c.name || '').toLowerCase() === normalizedNameCode)) {
          throw new Error('Course already exists');
        }
        nextCourses.push({ name: normalizedNameCode, displayName: trimmedName, years: parsedYears.length ? parsedYears : [1], branches: parsedBranches });
        const putRes = await fetch(apiUrl('/api/config/academic'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courses: nextCourses }),
        });
        if (!putRes.ok) throw new Error('Failed to save config');
        const savedCfg = await putRes.json();
        setCourses(Array.isArray(savedCfg?.courses) ? savedCfg.courses : nextCourses);
        resetForm();
        return;
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to add course');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId, courseCode) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      // If there is no _id (legacy config), skip directly to fallback path
      if (!courseId) {
        throw { status: 404 };
      }
      let res = await fetch(`/api/academic-config/courses/${courseId}`, { method: 'DELETE' });
      if (res.ok) {
        setCourses(prev => prev.filter(c => c._id !== courseId));
        return;
      }
      if (res.status === 404) {
        // Fallback delete via legacy config
        const getRes = await fetch(apiUrl('/api/config/academic'));
        if (!getRes.ok) throw new Error('Failed to load config');
        const cfg = await getRes.json();
        const before = Array.isArray(cfg?.courses) ? cfg.courses.length : 0;
        const nextCourses = (cfg?.courses || []).filter(c => String(c._id) !== String(courseId) && (c.name !== courseCode && (c.name || '').toLowerCase() !== String(courseCode || '').toLowerCase()));
        if (nextCourses.length === before) throw new Error('Course not found');
        const putRes = await fetch(apiUrl('/api/config/academic'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courses: nextCourses }),
        });
        if (!putRes.ok) throw new Error('Failed to save config');
        setCourses(nextCourses);
        return;
      }
      throw new Error('Failed to delete');
    } catch (e) {
      if (e && e.status === 404) {
        // go to fallback logic
        try {
          const getRes = await fetch(apiUrl('/api/config/academic'));
          if (!getRes.ok) throw new Error('Failed to load config');
          const cfg = await getRes.json();
          const before = Array.isArray(cfg?.courses) ? cfg.courses.length : 0;
          const nextCourses = (cfg?.courses || []).filter(c => String(c._id) !== String(courseId) && (c.name !== courseCode && (c.name || '').toLowerCase() !== String(courseCode || '').toLowerCase()));
          if (nextCourses.length === before) throw new Error('Course not found');
          const putRes = await fetch(apiUrl('/api/config/academic'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courses: nextCourses }),
          });
          if (!putRes.ok) throw new Error('Failed to save config');
          setCourses(nextCourses);
          return;
        } catch (inner) {
          setError(inner.message);
          return;
        }
      }
      setError(e.message);
    }
  };

  const startEdit = (course) => {
    const key = course._id || course.name;
    setEditingId(key);
    setEditName(course.displayName || course.name || '');
    setEditBranchesText((course.branches || []).join(', '));
    setEditYearsText((course.years || []).join(', '));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditBranchesText('');
    setEditYearsText('');
  };

  const saveEdit = async (course) => {
    try {
      setLoading(true);
      setError('');
      const normalizedNameCode = String(editName || '').trim().toLowerCase();
      if (!normalizedNameCode) throw new Error('Course name is required');
      const parsedBranches = editBranchesText
        .split(',')
        .map(b => b.trim())
        .filter(Boolean);
      const parsedYears = editYearsText
        .split(',')
        .map(y => parseInt(y, 10))
        .filter(n => Number.isFinite(n) && n > 0);

      const key = course._id || course.name;
      const nextCourses = (courses || []).map(c => {
        const cKey = c._id || c.name;
        if (String(cKey) !== String(key)) return c;
        return {
          ...c,
          name: normalizedNameCode,
          displayName: editName.trim(),
          branches: parsedBranches,
          years: parsedYears.length ? parsedYears : [1],
        };
      });

      const putRes = await fetch(apiUrl('/api/config/academic'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: nextCourses }),
      });
      if (!putRes.ok) throw new Error('Failed to save');
      const savedCfg = await putRes.json(); // eslint-disable-line
      setCourses(nextCourses);
      cancelEdit();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                <GraduationCap size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
                <p className="text-gray-600 mt-1">
                  {courses.length} {courses.length === 1 ? 'course' : 'courses'} configured
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Courses</p>
              <p className="text-xl font-semibold text-gray-900">{courses.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Branches</p>
              <p className="text-xl font-semibold text-gray-900">
                {courses.reduce((sum, c) => sum + (c.branches?.length || 0), 0)}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Years</p>
              <p className="text-xl font-semibold text-gray-900">
                {Array.from(new Set(courses.flatMap(c => c.years || []))).length}
              </p>
            </div>
          </div>
        </div>

        {/* Add Course Card - Only show if user has full access */}
        {canEdit && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plus className="text-white" size={18} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Add New Course</h2>
          </div>
          <form className="grid grid-cols-1 lg:grid-cols-4 gap-4" onSubmit={handleAddCourse}>
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
              <input
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                placeholder="e.g., B.Tech"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Branches</label>
              <input
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                placeholder="e.g., CSE, ECE"
                value={branchesText}
                onChange={(e) => setBranchesText(e.target.value)}
              />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Years</label>
              <input
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                placeholder="e.g., 1,2,3,4"
                value={yearsText}
                onChange={(e) => setYearsText(e.target.value)}
              />
            </div>
            <div className="lg:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                Add Course
              </button>
            </div>
          </form>
          {error && <p className="text-red-600 mt-3 text-sm font-medium">{error}</p>}
        </div>
        )}

        {/* Courses List Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">All Courses</h3>
                  <p className="text-sm text-gray-600">Manage course configurations</p>
                </div>
              </div>
              <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-200 rounded-lg">
                {courses.length} {courses.length === 1 ? 'course' : 'courses'}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {loading && courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-600">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-600 mb-6">Start by adding your first course above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map(c => {
                  const key = c._id || c.name;
                  const isEditing = String(editingId) === String(key);
                  return (
                    <div key={key} className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                                <input 
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                                  value={editName} 
                                  onChange={e => setEditName(e.target.value)} 
                                  placeholder="Course name" 
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branches</label>
                                <input 
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                                  value={editBranchesText} 
                                  onChange={e => setEditBranchesText(e.target.value)} 
                                  placeholder="Branches (comma-separated)" 
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Years</label>
                                <input 
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                                  value={editYearsText} 
                                  onChange={e => setEditYearsText(e.target.value)} 
                                  placeholder="Years (comma-separated numbers)" 
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-md">
                                  {(c.displayName || c.name || 'C')
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 text-lg">{c.displayName || c.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                                      {c.branches?.length || 0} branches
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                      {c.years?.length || 1} years
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-4 pl-16">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-semibold text-gray-700">Branches:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {(c.branches || []).length > 0 ? (
                                      (c.branches || []).map((branch, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                          {branch}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-gray-400 italic">No branches</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-semibold text-gray-700">Years:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {(c.years || [1]).map((year, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                        Year {year}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {isEditing ? (
                            <>
                              <button 
                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                                onClick={() => saveEdit(c)}
                                disabled={loading}
                              >
                                <Plus size={14} />
                                Save
                              </button>
                              <button 
                                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                onClick={cancelEdit}
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            </>
                          ) : canEdit ? (
                            <>
                              <button 
                                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                onClick={() => startEdit(c)}
                              >
                                <Edit2 size={14} />
                                Edit
                              </button>
                              <button 
                                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-md hover:shadow-lg"
                                onClick={() => handleDelete(c._id, c.name)}
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-2 rounded-lg">
                              View Only
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;


