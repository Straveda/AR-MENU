import React, { useState, useEffect } from 'react';
import { getRoles } from '../../api/roleApi';
import { getStaff, updateStaff } from '../../api/adminApi';

const UserRoleManager = () => {
    const [staff, setStaff] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null); // userId being updated

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [staffRes, rolesRes] = await Promise.all([
                getStaff(),
                getRoles()
            ]);
            
            if (staffRes.success) setStaff(staffRes.data);
            if (rolesRes.data.success) setRoles(rolesRes.data.data);
            
        } catch (error) {
            console.error("Failed to fetch staff/roles", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, roleId) => {
        setUpdating(userId);
        try {
            const response = await updateStaff(userId, { roleId });
            if (response.success) {
                // Update local state
                setStaff(staff.map(user => 
                    user._id === userId 
                        ? { ...user, roleId: roleId, roleDoc: roles.find(r => r._id === roleId) } 
                        : user
                ));
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update user role");
        } finally {
            setUpdating(null);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {staff.map((user) => (
                            <tr key={user._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                            {user.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                            <div className="text-sm text-gray-500">{user.phone || '-'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select 
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        value={user.roleId || ''}
                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                        disabled={updating === user._id}
                                    >
                                        <option value="" disabled>Select Role</option>
                                        {roles.map(role => (
                                            <option key={role._id} value={role._id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                    {/* Fallback display for legacy roles if roleId is missing, though migration should have fixed this */}
                                    {!user.roleId && <span className="text-xs text-red-500 block mt-1">Migration Required</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserRoleManager;
