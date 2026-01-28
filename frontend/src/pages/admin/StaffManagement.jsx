import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/common/Toast/ToastContext";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import Modal from "../../components/common/Modal";
import ChangePasswordModal from "../../components/admin/ChangePasswordModal";
import ActionMenu from "../../components/common/ActionMenu";
import { useFeatureAccess } from "../../contexts/FeatureAccessContext";

export default function StaffManagement() {
  const { showSuccess, showError, showWarning } = useToast();
  const { isAtLimit } = useFeatureAccess();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", phone: "", department: "KDS", roleTitle: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDangerous: false
  });

  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    user: null
  });

  const openPasswordModal = (user) => {
    setPasswordModal({ isOpen: true, user });
  };



  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/admin/get-staff");
      if (res.data.success) {
        setStaff(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showError("Failed to fetch staff data");
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
        if (res.data.warning) {
          showWarning("Staff user created successfully, but marked as INACTIVE due to plan limits. Upgrade your plan to activate.", 5000);
        } else {
          showSuccess("Staff user created successfully!");
        }
        setShowAddModal(false);
        setShowPassword(false);
        setForm({ username: "", email: "", password: "", phone: "", department: "KDS", roleTitle: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Create staff error:", error);
      showError(error.response?.data?.message || "Failed to create staff user.");
    } finally {
      setAddLoading(false);
    }
  };

  const initiateToggleStatus = (user) => {
    setConfirmModal({
      isOpen: true,
      title: `${user.isActive ? 'Deactivate' : 'Activate'} Staff Member`,
      message: `Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} staff member "${user.username}"?`,
      confirmLabel: user.isActive ? 'Deactivate' : 'Activate',
      isDangerous: user.isActive,
      onConfirm: () => handleToggleStatus(user),
    });
  };

  const handleToggleStatus = async (user) => {
    setActionLoading(true);
    try {
      await axiosClient.patch(`/admin/toggle-staff-status/${user._id}`);
      showSuccess(`Staff member ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
      closeConfirmModal();
    }
  };

  const initiateDeleteStaff = (user) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Staff Member",
      message: `Permanently delete staff member "${user.username}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      isDangerous: true,
      onConfirm: () => handleDeleteStaff(user),
    });
  };

  const handleDeleteStaff = async (user) => {
    setActionLoading(true);
    try {
      await axiosClient.delete(`/admin/delete-staff/${user._id}`);
      showSuccess(`Staff member "${user.username}" deleted successfully`);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete staff member");
    } finally {
      setActionLoading(false);
      closeConfirmModal();
    }
  };

  if (loading) return <Loading message="Loading staff accounts..." />;

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      { }
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="type-h1">Staff Management</h1>
          <p className="type-secondary mt-1">Oversee kitchen and service staff accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={isAtLimit('maxStaff')}
          className={`btn-primary flex items-center gap-2 ${isAtLimit('maxStaff') ? 'opacity-50 cursor-not-allowed grayscale' : ''
            }`}
          title={isAtLimit('maxStaff') ? "Staff limit reached. Upgrade your plan to add more." : ""}
        >
          <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Add Staff Member
        </button>
      </div>

      { }
      <div className="card-premium overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="type-h2">Active Personnel ({staff.length})</h2>
        </div>

        <div className="p-0">
          {staff.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No staff members yet"
                message="Get started by adding your first KDS or Waiter staff account."
                icon="👥"
                actionLabel="Add Staff Member"
                onAction={() => setShowAddModal(true)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 type-label">User Profile</th>
                    <th className="px-6 py-4 type-label">Department</th>
                    <th className="px-6 py-4 type-label">Role Title</th>
                    <th className="px-6 py-4 type-label">Status</th>
                    <th className="px-6 py-4 type-label text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium type-body">
                  {staff.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-amber-600 font-bold border border-slate-200 shadow-inner text-lg">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="type-h3">{user.username}</p>
                            <p className="type-caption text-slate-400 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge-standard bg-slate-100 text-slate-600 border border-slate-200">
                          {user.department || "KDS"}
                        </span>
                      </td>
                      <td className="px-6 py-4 type-cell-value">{user.roleTitle || "Staff Member"}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex">
                          <span className={`badge-standard border ${user.isActive
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-rose-50 text-rose-600 border-rose-100"
                            }`}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <ActionMenu
                            actions={[
                              {
                                label: user.isActive ? 'Deactivate User' : 'Activate User',
                                icon: user.isActive
                                  ? <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                  : <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                                onClick: () => initiateToggleStatus(user),
                                className: user.isActive ? 'text-amber-600' : 'text-emerald-600',
                                disabled: actionLoading
                              },
                              {
                                label: 'Change Password',
                                icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 16.536L13.95 19H11.55l-2.05-2.05L7 19.5 5.5 18l2.5-2.5L5.5 13l2.05-2.05-2.436-1.564A6 6 0 0115 7z" /></svg>,
                                onClick: () => openPasswordModal(user),
                                className: 'text-slate-600',
                                disabled: actionLoading
                              },
                              {
                                label: 'Delete User',
                                icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
                                onClick: () => initiateDeleteStaff(user),
                                className: 'text-rose-600',
                                disabled: actionLoading
                              }
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        confirmLabel={confirmModal.confirmLabel}
        isDangerous={confirmModal.isDangerous}
      />

      {showAddModal && (
        <Modal
          onClose={() => setShowAddModal(false)}
          title="Create Staff Account"
        >
          <form onSubmit={handleAddStaff} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block type-label mb-2 ml-1">Username</label>
                <input
                  type="text"
                  required
                  className="input-standard w-full"
                  placeholder="e.g. jannes_doe"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block type-label mb-2 ml-1">Role Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Chef, Waiter"
                  className="input-standard w-full"
                  value={form.roleTitle}
                  onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block type-label mb-2 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="input-standard w-full"
                  placeholder="staff@restaurant.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block type-label mb-2 ml-1">Phone (Optional)</label>
                <input
                  type="text"
                  className="input-standard w-full"
                  placeholder="+91 XXXXX XXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block type-label mb-2 ml-1">Assign Department</label>
                <select
                  className="input-standard w-full appearance-none"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="KDS">KDS</option>
                  <option value="Operations">Operations</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="block type-label mb-2 ml-1">Access Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="input-standard w-full pr-12"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-8">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2.5 type-label hover:text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addLoading}
                className="btn-primary min-w-[200px] flex items-center justify-center gap-2"
              >
                {addLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    <span>Creating...</span>
                  </>
                ) : "Create Personnel Account"}
              </button>
            </div>
          </form>
        </Modal>
      )}


      <ChangePasswordModal
        isOpen={passwordModal.isOpen}
        onClose={() => setPasswordModal({ isOpen: false, user: null })}
        user={passwordModal.user}
        onSuccess={() => {

        }}
      />
    </div>
  );
}
