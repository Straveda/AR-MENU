import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import { updateStaff } from "../../api/adminApi";

export default function StaffManagement() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", phone: "", department: "KDS", roleTitle: "" });
  const [addLoading, setAddLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/admin/get-staff");
      if (res.data.success) {
        setStaff(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
        const res = await axiosClient.post("/admin/create-staff", form);
        if (res.data.success) {
            alert("Staff user created successfully!");
            setShowAddModal(false);
            setForm({ username: "", email: "", password: "", phone: "", department: "KDS", roleTitle: "" });
            fetchData();
        }
    } catch (error) {
        console.error("Create staff error:", error);
        alert(error.response?.data?.message || "Failed to create staff user.");
    } finally {
        setAddLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (!confirm(`${user.isActive ? 'Deactivate' : 'Activate'} staff member "${user.username}"?`)) return;
    try {
      await axiosClient.patch(`/admin/toggle-staff-status/${user._id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteStaff = async (user) => {
    if (!confirm(`Permanently delete staff member "${user.username}"? This action cannot be undone.`)) return;
    try {
      await axiosClient.delete(`/admin/delete-staff/${user._id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete staff member");
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 px-4 py-8">
      {}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
           <button
             onClick={() => navigate("/admin/dashboard")}
             className="text-amber-600 hover:text-amber-700 font-medium mb-2 inline-flex items-center gap-2"
           >
             ← Back to Dashboard
           </button>
           <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
           <p className="text-gray-600">Manage Kitchen Display System staff</p>
        </div>
        <button 
           onClick={() => setShowAddModal(true)}
           className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New Staff
        </button>
      </div>

      {}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/50">
                <h2 className="font-semibold text-gray-800">Active Staff Accounts</h2>
            </div>
            
            {loading ? (
                <Loading message="Loading staff details..." />
            ) : staff.length === 0 ? (
                <EmptyState 
                    title="No staff members yet" 
                    message="Create accounts for your kitchen staff to get started." 
                    icon="👥"
                    actionLabel="Add New Staff"
                    onAction={() => setShowAddModal(true)}
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-gray-700">Name / Username</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Department</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Role Title</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Email</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-3 font-semibold text-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {staff.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-800">{user.username}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {user.department || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {user.roleTitle || <span className="text-gray-400 italic">Not set</span>}
                                    </td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                                            user.isActive 
                                            ? "bg-green-100 text-green-700" 
                                            : "bg-red-100 text-red-700"
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`}></span>
                                            {user.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown 
                                            user={user} 
                                            onToggleStatus={() => handleToggleStatus(user)}
                                            onDelete={() => handleDeleteStaff(user)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>

      {}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Add New Staff Member</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <form onSubmit={handleAddStaff} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                        <select 
                            value={form.department}
                            onChange={e => setForm({...form, department: e.target.value})}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        >
                            <option value="KDS">Kitchen Display</option>
                            <option value="Finance">Finance</option>
                            <option value="Operations">Operations</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Title *</label>
                        <input 
                           type="text" 
                           required
                           placeholder="e.g. Senior KDS Operator, Night Shift Handler"
                           value={form.roleTitle}
                           onChange={e => setForm({...form, roleTitle: e.target.value})}
                           maxLength={100}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Free text, max 100 characters</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input 
                           type="text" 
                           required
                           value={form.username}
                           onChange={e => setForm({...form, username: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                           placeholder="e.g. Kitchen Screen 1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                           type="email" 
                           required
                           value={form.email}
                           onChange={e => setForm({...form, email: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                           placeholder="staff@restaurant.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input 
                           type="password" 
                           required
                           value={form.password}
                           onChange={e => setForm({...form, password: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                           placeholder="••••••••"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                          type="submit"
                          disabled={addLoading}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                        >
                          {addLoading ? (
                             <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Creating Staff...
                             </span>
                          ) : "Create Staff Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

function ActionDropdown({ user, onToggleStatus, onDelete }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
      >
        Manage ▾
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div 
            style={menuStyle}
            className="z-50 w-44 bg-white border border-gray-100 rounded-lg shadow-xl py-1 animate-scale-in"
          >
            <button
              onClick={() => { onToggleStatus(); setOpen(false); }}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                user.isActive ? 'text-orange-600' : 'text-green-600'
              }`}
            >
              {user.isActive ? 'Deactivate Account' : 'Activate Account'}
            </button>
            <div className="h-px bg-gray-50 my-1" />
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete Staff
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

