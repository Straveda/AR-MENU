import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import axiosClient from "../../api/axiosClient";
import { usePagination } from "../../hooks/usePagination";
import Pagination from "../../components/common/Pagination";
import PageSizeSelector from "../../components/common/PageSizeSelector";

export default function UsersManagement() {
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

  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "RESTAURANT_ADMIN",
    restaurantId: ""
  });

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
  };

  const handleError = (err) => {
    setError(err.response?.data?.message || "Operation failed");
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await axiosClient.post("/platform/create-user", userForm);
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
      await fetchData();
      closeModal();
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (!confirm(`${user.isActive ? 'Deactivate' : 'Activate'} user "${user.username}"?`)) return;
    try {
      await axiosClient.patch(`/platform/toggle-user-status/${user._id}`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Permanently delete user "${user.username}"? This action cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await axiosClient.delete(`/platform/delete-user/${user._id}`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
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
                        onToggleStatus={() => handleToggleStatus(user)}
                        onDelete={() => handleDeleteUser(user)}
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
                    type="password" 
                    value={userForm.password} 
                    onChange={(v) => setUserForm({ ...userForm, password: v })} 
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

  useEffect(() => {
    if (open && buttonRef.current) {
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
        });
      } else {
        setMenuStyle({
          position: 'fixed',
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        });
      }
    }
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm"
      >
        Actions ▾
      </button>
      
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div 
            style={menuStyle}
            className="z-50 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1"
          >
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Edit Details
            </button>
            <button
              onClick={() => { onToggleStatus(); setOpen(false); }}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                user.isActive ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {user.isActive ? 'Deactivate User' : 'Activate User'}
            </button>
            <div className="h-px bg-gray-100 my-1" />
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete User
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function InputField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
        required
      />
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
