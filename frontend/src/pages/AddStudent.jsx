import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../utils/api';

const AddStudent = ({ addStudent }) => {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [config, setConfig] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

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
            const firstYear = String((firstCourse.years && firstCourse.years[0]) || '1');
            setYear(firstYear);
            const firstBranch = (firstCourse.branches && firstCourse.branches[0]) || '';
            setBranch(firstBranch);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const currentCourseObj = useMemo(() => {
    return (config?.courses || []).find(c => c.name === course);
  }, [config, course]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !studentId || !course || !year) {
      setMessage('All fields are required.');
      return;
    }

    const newStudent = {
      name,
      studentId,
      course,
      year: parseInt(year, 10), // Ensure year is a number
      branch,
    };

  const result = await addStudent(newStudent);

    if (result.success) {
      setMessage('Student added successfully!');
      // Reset form and navigate away after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } else {
      // Display the error message from the backend
      setMessage(result.message || 'An error occurred.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="mb-4">
          <span className="text-6xl animate-bounce-gentle">👨‍🎓</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Add New Student</h1>
        <p className="text-gray-600 text-lg">Enter student details to register them in the system</p>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Student Name</label>
              <input 
                type="text" 
                id="name" 
                className="form-input"
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="studentId" className="form-label">Student ID</label>
              <input 
                type="text" 
                id="studentId" 
                className="form-input"
                value={studentId} 
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter student ID"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="course" className="form-label">Course</label>
              <select 
                id="course" 
                className="form-select"
                value={course} 
                onChange={(e) => {
                  const newCourse = e.target.value;
                  setCourse(newCourse);
                  const found = (config?.courses || []).find(c => c.name === newCourse);
                  const nextYear = String((found?.years && found.years[0]) || '1');
                  setYear(nextYear);
                  setBranch((found?.branches && found.branches[0]) || '');
                }}
              >
                {(config?.courses || []).map(c => (
                  <option key={c.name} value={c.name}>{c.displayName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="year" className="form-label">Year</label>
              <select 
                id="year" 
                className="form-select"
                value={year} 
                onChange={(e) => setYear(e.target.value)}
              >
                {(currentCourseObj?.years || [1]).map(y => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="branch" className="form-label">Branch</label>
            <select 
              id="branch" 
              className="form-select"
              value={branch} 
              onChange={(e) => setBranch(e.target.value)}
            >
              {(currentCourseObj?.branches || ['']).map(b => (
                <option key={b} value={b}>{b || 'N/A'}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button type="submit" className="btn btn-primary btn-lg flex-1">
              <span className="text-lg">➕</span>
              Add Student
            </button>
            <button 
              type="button" 
              className="btn btn-danger btn-lg flex-1"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-4 rounded-lg text-sm font-medium ${
              message.includes('successfully') 
                ? 'bg-success-50 border border-success-200 text-success-700' 
                : 'bg-danger-50 border border-danger-200 text-danger-700'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddStudent;