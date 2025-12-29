import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createRole, getRoles, updateRole } from '../../api/roleApi';
import PermissionMatrix from '../../components/admin/PermissionMatrix';

const RoleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = id !== 'new' && id !== undefined;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchRole();
    }
  }, [id]);

  const fetchRole = async () => {
    try {
      // Re-using getRoles because we likely don't have a getRoleById endpoint implemented yet in RoleController/FrontendAPI
      // It's more efficient to just fetch list and filter in memory if list is small, 
      // but ideally we should have a getById. For now, filter from list is safer given implementation steps.
      // Wait, RoleController has update which requires ID, but list fetches all.
      // Let's implement getById in API if needed or just use getRoles and find.
      // RoleController doesn't have explicit getById, but getRoles fetches all.
      const response = await getRoles();
      if (response.data.success) {
        const role = response.data.data.find(r => r._id === id);
        if (role) {
            setFormData({
                name: role.name,
                description: role.description || '',
                permissions: role.permissions
            });
        } else {
            setError('Role not found');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch role details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (newPermissions) => {
    setFormData(prev => ({ ...prev, permissions: newPermissions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (isEditMode) {
        await updateRole(id, formData);
      } else {
        await createRole(formData);
      }
      navigate('/admin/roles');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading role details...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button 
            onClick={() => navigate('/admin/roles')}
            className="text-gray-500 hover:text-gray-700 text-sm mb-2 hover:underline"
        >
            &larr; Back to Roles
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Role' : 'Create New Role'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Role Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Senior Chef"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Briefly describe what this role is for..."
              />
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-semibold text-gray-800">Permissions</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Selected: {formData.permissions.length}
            </span>
          </div>
          
          <PermissionMatrix 
            selectedPermissions={formData.permissions} 
            onChange={handlePermissionChange} 
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/roles')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Saving...' : 'Save Role'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleEditor;
