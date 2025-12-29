import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRoles, deleteRole } from '../../api/roleApi';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await deleteRole(id);
      setRoles(roles.filter(role => role._id !== id));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete role');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading roles...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Role Management</h1>
          <p className="text-gray-500">Manage access control for your staff.</p>
        </div>
        <Link 
          to="/admin/roles/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Create Role
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    {role.name}
                    {role.isSystemRole && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">System</span>
                    )}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{role.description || 'No description provided'}</p>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-gray-50">
              <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                <span>Permissions:</span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{role.permissions.length}</span>
              </div>
              
              <div className="flex gap-3">
                <Link
                  to={`/admin/roles/${role._id}`}
                  className="flex-1 text-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-1.5 rounded text-sm font-medium transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(role._id)}
                  disabled={role.isSystemRole}
                  className={`flex-1 text-center py-1.5 rounded text-sm font-medium transition-colors ${
                      role.isSystemRole 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {roles.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">No roles found. Create one to get started.</p>
          </div>
      )}
    </div>
  );
};

export default RoleManagement;
