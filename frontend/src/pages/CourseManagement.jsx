import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiUrl } from '../utils/api';

const CourseManagement = () => {
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
    <div className="max-w-4xl mx-auto">
      {/* Add Course Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Course</h2>
        <form className="grid grid-cols-1 lg:grid-cols-4 gap-4" onSubmit={handleAddCourse}>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., B.Tech"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Branches</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., CSE, ECE"
              value={branchesText}
              onChange={(e) => setBranchesText(e.target.value)}
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Years</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 1,2,3,4"
              value={yearsText}
              onChange={(e) => setYearsText(e.target.value)}
            />
          </div>
          <div className="lg:col-span-1 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Add Course
            </button>
          </div>
        </form>
        {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
      </div>

      {/* Courses List Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Courses</h2>
          {loading && <span className="text-gray-500 text-sm">Loading...</span>}
        </div>
        
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No courses yet. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map(c => {
              const key = c._id || c.name;
              const isEditing = String(editingId) === String(key);
              return (
                <div key={key} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                            <input 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={editName} 
                              onChange={e => setEditName(e.target.value)} 
                              placeholder="Course name" 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branches</label>
                            <input 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={editBranchesText} 
                              onChange={e => setEditBranchesText(e.target.value)} 
                              placeholder="Branches (comma-separated)" 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Years</label>
                            <input 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={editYearsText} 
                              onChange={e => setEditYearsText(e.target.value)} 
                              placeholder="Years (comma-separated numbers)" 
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900 text-lg">{c.displayName || c.name}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {c.branches?.length || 0} branches
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <span className="font-medium">Branches:</span>
                              <span>{(c.branches || []).join(', ') || 'No branches'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <span className="font-medium">Years:</span>
                              <span>{(c.years || []).join(', ') || 'Years: default 1'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {isEditing ? (
                        <>
                          <button 
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            onClick={() => saveEdit(c)}
                          >
                            Save
                          </button>
                          <button 
                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            onClick={() => startEdit(c)}
                          >
                            Edit
                          </button>
                          <button 
                            className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            onClick={() => handleDelete(c._id, c.name)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </>
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
);
};

export default CourseManagement;


