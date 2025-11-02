import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, X } from 'lucide-react';
import { apiUrl } from '../utils/api';

// A simple modal component for creating/editing sub-admins
const SubAdminModal = ({ isOpen, onClose, onSave, subAdmin }) => {
  const [name, setName] = useState(subAdmin?.name || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(subAdmin?.role || 'Editor');

  useEffect(() => {
    if (isOpen) {
      setName(subAdmin?.name || '');
      setRole(subAdmin?.role || 'Editor');
      setPassword(''); // Always clear password field when modal opens
    }
  }, [isOpen, subAdmin]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subAdmin && !password) {
      alert('Password is required for new sub-admins.');
      return;
    }
    // Set default role for new sub-admins and only include password if it has been set
    const submissionRole = subAdmin ? role : 'Editor';
    onSave({ ...subAdmin, name, role: submissionRole, ...(password && { password }) });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{subAdmin ? 'Edit' : 'Create'} Sub-Admin</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
            <input
              id="name"
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter sub-admin name"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              id="password"
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={subAdmin ? "Enter new password to change" : "Enter password"}
              required={!subAdmin} // Password is required only for new sub-admins
            />
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200">
              Cancel
            </button>
            <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200">
              {subAdmin ? 'Update Sub-Admin' : 'Create Sub-Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SubAdminManagement = ({ currentUser }) => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState(null);
  
  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role === 'Administrator';

  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const response = await fetch(apiUrl('/api/subadmins'));
        if (!response.ok) {
          throw new Error(`Failed to load: ${response.status} ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Unexpected response from server');
        }
        const data = await response.json();
        setSubAdmins((data || []).map(sa => ({ ...sa, id: sa._id })));
      } catch (error) {
        console.error("Failed to fetch sub-admins:", error);
      }
    };
    fetchSubAdmins();
  }, []);

  const handleCreate = () => {
    setEditingSubAdmin(null);
    setIsModalOpen(true);
  };

  const handleEdit = (subAdmin) => {
    setEditingSubAdmin(subAdmin);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this sub-admin?')) return;

    fetch(apiUrl(`/api/subadmins/${id}`), { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete');
        setSubAdmins(prev => prev.filter(sa => sa.id !== id));
      })
      .catch(err => alert(`Error: ${err.message}`));
  };

  const handleSave = async (subAdminData) => {
    const isUpdating = !!subAdminData.id;
    const url = isUpdating ? apiUrl(`/api/subadmins/${subAdminData.id}`) : apiUrl('/api/subadmins');
    const method = isUpdating ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subAdminData),
      });

      if (!response.ok) {
        // Try to parse error JSON, but fallback to status text if it fails
        const errorData = await response.json().catch(() => ({ 
          message: `Request failed with status: ${response.status} ${response.statusText}` 
        }));
        throw new Error(errorData.message || 'Save operation failed');
      }

      const savedSubAdmin = await response.json();
      const formattedAdmin = { ...savedSubAdmin, id: savedSubAdmin._id };

      setSubAdmins(prev => isUpdating
        ? prev.map(sa => sa.id === formattedAdmin.id ? formattedAdmin : sa)
        : [...prev, formattedAdmin]);
      setIsModalOpen(false);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Users size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Sub-Admin Management
                </h1>
                <p className="text-gray-600 mt-1">Manage your team of sub-administrators</p>
              </div>
            </div>
           
          
          </div>

          {subAdmins.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users size={48} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sub-Admins Yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first sub-admin to help manage the system.</p>
              {isSuperAdmin && (
                <button onClick={handleCreate} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 inline-flex items-center gap-2">
                  <Plus size={20} />
                  Create Your First Sub-Admin
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  All Sub-Admins ({subAdmins.length})
                </h2>
                {isSuperAdmin && (
                  <button onClick={handleCreate} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 inline-flex items-center gap-2">
                    <Plus size={18} />
                    Create Sub-Admin
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {subAdmins.map((subAdmin, index) => (
                  <div key={subAdmin.id} className={`p-6 hover:bg-blue-50/30 transition-colors duration-200 ${index === 0 ? 'border-t-0' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-lg">
                            {subAdmin.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{subAdmin.name}</h3>
                          <p className="text-sm text-gray-500">Sub-Administrator</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(subAdmin)}
                          className="p-2 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded-lg transition-all duration-200 transform hover:scale-105"
                          title="Edit Sub-Admin"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(subAdmin.id)}
                          className="p-2 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-lg transition-all duration-200 transform hover:scale-105"
                          title="Delete Sub-Admin"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <SubAdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} subAdmin={editingSubAdmin} />
    </>
  );
};

export default SubAdminManagement;