import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import axiosClient from "../../api/axiosClient";
import { usePagination } from "../../hooks/usePagination";
import Pagination from "../../components/common/Pagination";
import PageSizeSelector from "../../components/common/PageSizeSelector";
import Modal from "../../components/common/Modal";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useToast } from "../../components/common/Toast/ToastContext";

export default function UsersManagement() {
  const { showSuccess, showError, showWarning } = useToast();
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ role: "", restaurant: "" });

  const { 
    page, 
    limit, 
    paginationMeta, 
    setPaginationMeta, 
    handlePageChange, 
    handleLimitChange,
    paginationParams 
  } = usePagination(10);

  const [modal, setModal] = useState({ type: null, user: null });
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: "", 
    message: "", 
    onConfirm: null, 
    isDangerous: false 
  });

  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "RESTAURANT_ADMIN",
    restaurantId: ""
  });

  const [showPassword, setShowPassword] = useState(false);

  const fetchData = async () => {
    
    if(users.length === 0) setLoading(true);

    try {
      const [usersRes, restRes] = await Promise.all([
        axiosClient.get("/platform/get-all-users", { params: paginationParams }),
        axiosClient.get("/platform/get-all-restaurants"),
      ]);
      
      if (usersRes.data.success) {
        setUsers(usersRes.data.data || []);
        if (usersRes.data.meta) {
            setPaginationMeta(usersRes.data.meta);
        }
      }
      if (restRes.data.success) setRestaurants(restRes.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
  }, [page, limit]);

  const closeModal = () => {
    setModal({ type: null, user: null });
    setError("");
    setUserForm({
      username: "",
      email: "",
      password: "",
      phone: "",
      role: "RESTAURANT_ADMIN",
      restaurantId: ""
    });
    setShowPassword(false);
  };

  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const handleError = (err) => {
    showError(err.response?.data?.message || "Operation failed");
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      const res = await axiosClient.post("/platform/create-user", userForm);
      if (res.data.warning) {
          showWarning("User created successfully, but marked as INACTIVE due to plan limits. Upgrade plan to activate.", 5000);
      } else {
          showSuccess("User created successfully");
      }
      await fetchData();
      closeModal();
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await axiosClient.put(`/platform/update-user/${modal.user._id}`, {
        username: userForm.username,
        phone: userForm.phone,
        role: userForm.role,
        restaurantId: userForm.restaurantId
      });
      showSuccess("User updated successfully");
      await fetchData();
      closeModal();
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const initiateToggleStatus = (user) => {
    setConfirmModal({
      isOpen: true,
      title: `${user.isActive ? 'Deactivate' : 'Activate'} User`,
      message: `Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} user "${user.username}"?`,
      confirmLabel: user.isActive ? 'Deactivate' : 'Activate',
      isDangerous: user.isActive,
      onConfirm: () => handleToggleStatus(user),
    });
  };

  const handleToggleStatus = async (user) => {
    setActionLoading(true);
    try {
      await axiosClient.patch(`/platform/toggle-user-status/${user._id}`);
      showSuccess(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      await fetchData();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
      closeConfirmModal();
    }
  };

  const initiateDeleteUser = (user) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete User",
      message: `Permanently delete user "${user.username}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      isDangerous: true,
      onConfirm: () => handleDeleteUser(user),
    });
  };

  const handleDeleteUser = async (user) => {
    setActionLoading(true);
    try {
      await axiosClient.delete(`/platform/delete-user/${user._id}`);
      showSuccess(`User "${user.username}" deleted successfully`);
      await fetchData();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
      closeConfirmModal();
    }
  };

  const openEditModal = (user) => {
    setUserForm({
      username: user.username || "",
      email: user.email || "",
      password: "", 
      phone: user.phone || "",
      role: user.role || "RESTAURANT_ADMIN",
      restaurantId: user.restaurantId?._id || user.restaurantId || ""
    });
    setModal({ type: "edit", user });
  };

  const filteredUsers = users.filter((u) => {
    if (filter.role && u.role !== filter.role) return false;
    if (filter.restaurant) {
      const restId = u.restaurantId?._id || u.restaurantId;
      if (restId !== filter.restaurant) return false;
    }
    return true;
  });

  const roleStats = {
    SUPER_ADMIN: users.filter((u) => u.role === "SUPER_ADMIN").length,
    PLATFORM_ADMIN: users.filter((u) => u.role === "PLATFORM_ADMIN").length,
    RESTAURANT_ADMIN: users.filter((u) => u.role === "RESTAURANT_ADMIN").length,
    KDS: users.filter((u) => u.role === "KDS").length,
    CUSTOMER: users.filter((u) => u.role === "CUSTOMER").length,
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">
            {paginationMeta?.totalItems || 0} users across the platform
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <PageSizeSelector limit={limit} onLimitChange={handleLimitChange} />
          <button
            onClick={() => setModal({ type: "create", user: null })}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            + Create user
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatBadge label="Super Admins" count={roleStats.SUPER_ADMIN} color="purple" />
        <StatBadge label="Platform Admins" count={roleStats.PLATFORM_ADMIN} color="blue" />
        <StatBadge label="Restaurant Admins" count={roleStats.RESTAURANT_ADMIN} color="indigo" />
        <StatBadge label="KDS" count={roleStats.KDS} color="emerald" />
        <StatBadge label="Customers" count={roleStats.CUSTOMER} color="amber" />
      </div>

      {}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Role:</label>
          <select
            value={filter.role}
            onChange={(e) => setFilter({ ...filter, role: e.target.value })}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="PLATFORM_ADMIN">Platform Admin</option>
            <option value="RESTAURANT_ADMIN">Restaurant Admin</option>
            <option value="KDS">KDS</option>
            <option value="CUSTOMER">Customer</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Restaurant:</label>
          <select
            value={filter.restaurant}
            onChange={(e) => setFilter({ ...filter, restaurant: e.target.value })}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm max-w-[200px]"
          >
            <option value="">All restaurants</option>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>
        {(filter.role || filter.restaurant) && (
          <button
            onClick={() => setFilter({ role: "", restaurant: "" })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Restaurant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                        {user.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.username}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                    {user.restaurantId?.name || (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{user.phone || "-"}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    {user.role !== 'SUPER_ADMIN' && (
                      <ActionDropdown
                        user={user}
                        onEdit={() => openEditModal(user)}
                        onToggleStatus={() => initiateToggleStatus(user)}
                        onDelete={() => initiateDeleteUser(user)}
                      />
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No users found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {}
      {!loading && paginationMeta && (
        <Pagination
          currentPage={page}
          totalPages={paginationMeta.totalPages}
          onPageChange={handlePageChange}
          totalItems={paginationMeta.totalItems}
          limit={limit}
        />
      )}

      {}
      {modal.type && (
        <Modal 
          title={modal.type === "create" ? "Create New User" : `Edit User: ${modal.user.username}`} 
          onClose={closeModal}
        >
          <form onSubmit={modal.type === "create" ? handleCreateUser : handleUpdateUser}>
            {error && <ErrorMsg msg={error} />}
            
            <div className="space-y-4">
              <InputField 
                label="Username" 
                value={userForm.username} 
                onChange={(v) => setUserForm({ ...userForm, username: v })} 
              />
              
              {modal.type === "create" && (
                <>
                  <InputField 
                    label="Email" 
                    type="email" 
                    value={userForm.email} 
                    onChange={(v) => setUserForm({ ...userForm, email: v })} 
                  />
                  <InputField 
                    label="Password" 
                    type={showPassword ? "text" : "password"} 
                    value={userForm.password} 
                    onChange={(v) => setUserForm({ ...userForm, password: v })}
                    showToggle={true}
                    isToggled={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                  />
                </>
              )}
              
              <InputField 
                label="Phone" 
                value={userForm.phone} 
                onChange={(v) => setUserForm({ ...userForm, phone: v })} 
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="PLATFORM_ADMIN">Platform Admin</option>
                  <option value="RESTAURANT_ADMIN">Restaurant Admin</option>
                  <option value="KDS">KDS</option>
                  <option value="CUSTOMER">Customer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
                <select
                  value={userForm.restaurantId}
                  onChange={(e) => setUserForm({ ...userForm, restaurantId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a restaurant...</option>
                  {restaurants.map((r) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <SubmitBtn 
                loading={actionLoading} 
                label={modal.type === "create" ? "Create User" : "Update User"} 
              />
            </div>
          </form>
        </Modal>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        confirmLabel={confirmModal.confirmLabel}
        isDangerous={confirmModal.isDangerous}
        isLoading={actionLoading}
      />
    </div>
  );
}

function StatBadge({ label, count, color }) {
  const colors = {
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className={`border rounded-lg px-4 py-3 ${colors[color]}`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    SUPER_ADMIN: "bg-purple-100 text-purple-700",
    PLATFORM_ADMIN: "bg-blue-100 text-blue-700",
    RESTAURANT_ADMIN: "bg-indigo-100 text-indigo-700",
    KDS: "bg-emerald-100 text-emerald-700",
    CUSTOMER: "bg-amber-100 text-amber-700",
  };

  const labels = {
    SUPER_ADMIN: "Super Admin",
    PLATFORM_ADMIN: "Platform Admin",
    RESTAURANT_ADMIN: "Restaurant Admin",
    KDS: "KDS",
    CUSTOMER: "Customer",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[role] || "bg-gray-100 text-gray-700"}`}>
      {labels[role] || role}
    </span>
  );
}

function ActionDropdown({ user, onEdit, onToggleStatus, onDelete }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (open && buttonRef.current && !isMobile) {
      const rect = buttonRef.current.getBoundingClientRect();
      const screenHeight = window.innerHeight;
      const menuHeightEstimate = 200;
      
      const spaceBelow = screenHeight - rect.bottom;
      const shouldOpenUpwards = spaceBelow < menuHeightEstimate;

      if (shouldOpenUpwards) {
        setMenuStyle({
          position: 'fixed',
          bottom: screenHeight - rect.top + 4,
          right: window.innerWidth - rect.right,
          overflowY: 'auto'
        });
      } else {
        setMenuStyle({
          position: 'fixed',
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
          overflowY: 'auto'
        });
      }
    }
  }, [open, isMobile]);

  const MenuContent = () => (
    <>
      <div className="py-2">
        <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Account</div>
        <MenuItem 
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
          label="Edit Details" 
          onClick={() => { onEdit(); setOpen(false); }} 
        />
        <MenuItem 
          icon={user.isActive ? 
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> : 
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
          label={user.isActive ? 'Deactivate User' : 'Activate User'}
          onClick={() => { onToggleStatus(); setOpen(false); }}
          variant={user.isActive ? 'warning' : 'success'}
        />
      </div>

      <div className="border-t border-slate-100 my-1"></div>

      <div className="py-2">
        <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Danger Zone</div>
        <MenuItem 
           icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
           label="Delete User"
           onClick={() => { onDelete(); setOpen(false); }}
           variant="danger"
        />
      </div>
    </>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
      >
        Actions
        <svg className={`ml-1.5 w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          {isMobile ? (
             <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200">
                <div className="flex justify-center pt-3 pb-1">
                   <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                </div>
                <div className="pb-6">
                  <div className="px-4 py-2 border-b border-slate-100 mb-2">
                     <h3 className="font-semibold text-slate-900">Manage User</h3>
                  </div>
                  <MenuContent />
                </div>
             </div>
          ) : (
            <div 
              style={menuStyle}
              className="z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            >
              <MenuContent />
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
}

function MenuItem({ label, onClick, icon, variant = 'default', disabled = false }) {
  const styles = {
    default: "text-slate-700 hover:bg-slate-50 hover:text-indigo-600",
    success: "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800",
    warning: "text-amber-700 hover:bg-amber-50 hover:text-amber-800",
    danger: "text-red-600 hover:bg-red-50 hover:text-red-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
         disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400' : styles[variant]
      }`}
    >
      {icon && <span className={disabled ? '' : "opacity-75"}>{icon}</span>}
      <span className="font-medium">{label}</span>
    </button>
  );
}



function InputField({ label, value, onChange, type = "text", showToggle = false, isToggled = false, onToggle = null }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 ${showToggle ? 'pr-10' : ''}`}
          required
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 focus:outline-none"
          >
            {isToggled ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.046m4.596-4.596A9.964 9.964 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21m-6-6L3 3" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function SubmitBtn({ loading, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
    >
      {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
      {loading ? "Processing..." : label}
    </button>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div className="mb-4 px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">
      {msg}
    </div>
  );
}
