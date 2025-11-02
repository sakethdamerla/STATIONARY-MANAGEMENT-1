import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, BookOpen, CreditCard, Package } from 'lucide-react';
import { apiUrl } from '../utils/api';

const StudentDetail = ({ students = [], setStudents, products = [] }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = students.find(s => String(s.id) === String(id));
    setStudent(s || null);
  }, [id, students]);

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">❓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Student not found</h2>
            <p className="text-gray-600 mb-6">Either the student doesn't exist or it hasn't loaded yet.</p>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const updateStudentOnServer = async (updated) => {
    try {
      setSaving(true);
      const courseParam = String(updated.course || '').toLowerCase();
      await fetch(apiUrl(`/api/users/${courseParam}/${updated.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: updated.paid, items: updated.items }),
      });
    } catch (err) {
      console.error('Failed to update student:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePaidToggle = () => {
    const updated = { ...student, paid: !student.paid };
    setStudent(updated);
    setStudents(prev => prev.map(p => p.id === updated.id ? updated : p));
    updateStudentOnServer(updated);
  };

  const handleItemToggle = (itemKey) => {
    const items = { ...(student.items || {}) };
    items[itemKey] = !Boolean(items[itemKey]);
    const updated = { ...student, items };
    setStudent(updated);
    setStudents(prev => prev.map(p => p.id === updated.id ? updated : p));
    updateStudentOnServer(updated);
  };

  // derive visible items for this student's course/year
  const visibleItems = (products || []).filter(p => {
    if (p.forCourse && p.forCourse !== student.course) return false;
    if (p.year && Number(p.year) !== Number(student.year)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-gray-600">Student Details & Stationery Management</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Student ID</span>
                    <p className="text-gray-900 font-semibold">{student.studentId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Course</span>
                    <p className="text-gray-900 font-semibold">{student.course.toUpperCase()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Year</span>
                    <p className="text-gray-900 font-semibold">Year {student.year}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Payment Status</span>
                      <p className={`text-sm font-semibold ${student.paid ? 'text-green-600' : 'text-red-600'}`}>
                        {student.paid ? 'Paid' : 'Unpaid'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={Boolean(student.paid)} 
                      onChange={handlePaidToggle}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {saving && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <div className="w-3 h-3 border border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                    Saving changes...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Stationery Items</h3>
              </div>
              
              {visibleItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No items configured for this course/year.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleItems.map(p => {
                    const key = p.name.toLowerCase().replace(/\s+/g, '_');
                    const isChecked = Boolean(student.items && student.items[key]);
                    return (
                      <label 
                        key={key} 
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          isChecked 
                            ? 'border-blue-200 bg-blue-50 shadow-sm' 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => handleItemToggle(key)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className={`font-medium ${isChecked ? 'text-blue-700' : 'text-gray-700'}`}>
                          {p.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;