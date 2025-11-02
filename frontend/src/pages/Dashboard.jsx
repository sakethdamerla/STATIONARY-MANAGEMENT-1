import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../utils/api';

const Dashboard = () => {
  const [courseStats, setCourseStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const courseOptions = ['b.tech', 'diploma', 'degree'];

  useEffect(() => {
    const fetchCourseStats = async () => {
      setLoading(true);
      const stats = {};
      
      for (const course of courseOptions) {
        try {
          const response = await fetch(apiUrl(`/api/users/${course}`));
          if (response.ok) {
            const students = await response.json();
            stats[course] = students.length;
          } else {
            stats[course] = 0;
          }
        } catch (error) {
          console.error(`Error fetching stats for ${course}:`, error);
          stats[course] = 0;
        }
      }
      
      setCourseStats(stats);
      setLoading(false);
    };

    fetchCourseStats();
  }, []);

  const getCourseIcon = (course) => {
    switch (course) {
      case 'b.tech':
        return '🎓';
      case 'diploma':
        return '📜';
      case 'degree':
        return '🎖️';
      default:
        return '📚';
    }
  };

  const getCourseColor = (course) => {
    switch (course) {
      case 'b.tech':
        return 'text-primary-500';
      case 'diploma':
        return 'text-cyan-500';
      case 'degree':
        return 'text-success-500';
      default:
        return 'text-gray-500';
    }
  };

  const totalStudents = loading ? 0 : Object.values(courseStats).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="mb-4">
          <span className="text-6xl animate-bounce-gentle">🎓</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">College Stationery Management</h1>
        {/* <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
          Efficiently manage student records and stationery distribution across all academic programs
        </p> */}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 text-center hover:shadow-medium transition-all duration-200">
          <div className="text-3xl font-bold text-primary-500 mb-2">
            {loading ? (
              <div className="inline-block w-6 h-6 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            ) : (
              totalStudents
            )}
          </div>
          <div className="text-sm text-gray-600 font-medium">Total Students</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 text-center hover:shadow-medium transition-all duration-200">
          <div className="text-3xl font-bold text-cyan-500 mb-2">{courseOptions.length}</div>
          <div className="text-sm text-gray-600 font-medium">Active Programs</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 text-center hover:shadow-medium transition-all duration-200">
          <div className="text-3xl font-bold text-success-500 mb-2">100%</div>
          <div className="text-sm text-gray-600 font-medium">System Status</div>
        </div>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {courseOptions.map(course => (
          <div 
            key={course} 
            className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-medium hover:-translate-y-1 group"
            onClick={() => navigate(`/course/${course}`)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`text-4xl ${getCourseColor(course)}`}>
                {getCourseIcon(course)}
              </div>
              <div className="text-gray-400 group-hover:text-primary-500 transition-colors duration-200 text-xl">→</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{course.toUpperCase()}</h3>
              <div className="text-gray-600">
                {loading ? (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                ) : (
                  <span className="text-lg font-semibold">
                    {courseStats[course]} {courseStats[course] === 1 ? 'Student' : 'Students'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => navigate('/add-student')}
        >
          <span className="text-lg">➕</span>
          Add New Student
        </button>
        <button 
          className="btn btn-outline btn-lg"
          onClick={() => navigate('/student-management')}
        >
          <span className="text-lg">👥</span>
          Manage Students
        </button>
        <button 
          className="btn btn-secondary btn-lg"
          onClick={() => navigate('/items')}
        >
          <span className="text-lg">📦</span>
          Manage Products
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-800">Quick Actions</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
            onClick={() => navigate('/course/b.tech')}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🎓</span>
            <span className="text-gray-700 font-medium">B.Tech Students</span>
          </button>
          <button 
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all duration-200 group"
            onClick={() => navigate('/course/diploma')}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">📜</span>
            <span className="text-gray-700 font-medium">Diploma Students</span>
          </button>
          <button 
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-success-300 hover:bg-success-50 transition-all duration-200 group"
            onClick={() => navigate('/course/degree')}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🎖️</span>
            <span className="text-gray-700 font-medium">Degree Students</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;