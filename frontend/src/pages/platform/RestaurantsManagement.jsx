import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import axiosClient from "../../api/axiosClient";
import { usePagination } from "../../hooks/usePagination";
import Pagination from "../../components/common/Pagination";
import PageSizeSelector from "../../components/common/PageSizeSelector";

export default function RestaurantsManagement() {
  const [restaurants, setRestaurants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination hook
  const { 
    page, 
    limit, 
    paginationMeta, 
    setPaginationMeta, 
    handlePageChange, 
    handleLimitChange,
    paginationParams 
  } = usePagination(10);

  // Modal state
  const [modal, setModal] = useState({ type: null, restaurant: null });

  // Form states
  const [createName, setCreateName] = useState("");
  const [adminForm, setAdminForm] = useState({ username: "", email: "", password: "", phone: "" });
  const [assignForm, setAssignForm] = useState({ planId: "", durationInDays: 30 });
  const [extendDays, setExtendDays] = useState(30);
  const [changePlanId, setChangePlanId] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");

  const fetchData = async () => {
    // Only set full page loading on initial load or if we want to block interaction
    // For pagination, we might want a table-level loading state, but for now we'll stick to logic
    // We can optimize UX later by keeping table data stale while loading new data
    // For now let's keep it simple: loading state for fetch
    if(restaurants.length === 0) setLoading(true); 
    
    try {
      const [restRes, planRes] = await Promise.all([
        axiosClient.get("/platform/get-all-restaurants", { params: paginationParams }),
        axiosClient.get("/platform/plans/get-plans"),
      ]);
      
      if (restRes.data.success) {
        setRestaurants(restRes.data.data || []);
        if (restRes.data.meta) {
            setPaginationMeta(restRes.data.meta);
        }
      }
      if (planRes.data.success) setPlans(planRes.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]); // Re-fetch when pagination params change

  const closeModal = () => {
    setModal({ type: null, restaurant: null });
    setError("");
    setCreateName("");
    setAdminForm({ username: "", email: "", password: "", phone: "" });
    setAssignForm({ planId: "", durationInDays: 30 });
    setExtendDays(30);
    setChangePlanId("");
    setStatusUpdate("");
  };

  const handleError = (err) => {
    setError(err.response?.data?.message || "Operation failed");
  };

  // Create Restaurant
  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await axiosClient.post("/platform/create-restaurant", { name: createName });
      await fetchData();
      closeModal();
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Create Admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await axiosClient.post("/platform/create-restaurant-admin", {
        restaurantId: modal.restaurant._id,
        ...adminForm,
      });
      closeModal();
      alert("Admin created successfully!");
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Assign Plan
  const handleAssignPlan = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await axiosClient.patch("/platform/assign-plan", {
        restaurantId: modal.restaurant._id,
        planId: assignForm.planId,
        durationInDays: Number(assignForm.durationInDays),
      });
      await fetchData();
      closeModal();
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Extend Subscription
  const handleExtend = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await axiosClient.patch(`/platform/extend-subscription/${modal.restaurant._id}`, {
        extendByDays: Number(extendDays),
      });
      await fetchData();
      closeModal();
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Change Plan
  const handleChangePlan = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await axiosClient.patch(`/platform/change-plan/${modal.restaurant._id}`, {
        planId: changePlanId,
      });
      await fetchData();
      closeModal();
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Update Restaurant Status
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await axiosClient.patch(`/platform/update-restaurant-status/${modal.restaurant._id}`, {
        subscriptionStatus: statusUpdate,
      });
      await fetchData();
      closeModal();
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Suspend
  const handleSuspend = async (r) => {
    if (!confirm(`Suspend "${r.name}"? This will block access for the restaurant.`)) return;
    try {
      await axiosClient.patch(`/platform/suspend-restaurant/${r._id}`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to suspend");
    }
  };

  // Resume
  const handleResume = async (r) => {
    try {
      await axiosClient.patch(`/platform/resume-restaurant/${r._id}`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resume");
    }
  };

  // Delete Restaurant
  const handleDeleteRestaurant = async (r) => {
    const confirm1 = confirm(`Are you sure you want to delete "${r.name}"? This action CANNOT be undone.`);
    if (!confirm1) return;
    
    const confirm2 = confirm(`CRITICAL WARNING: This will permanently delete all users, dishes, orders, and logs associated with ${r.name}. Are you absolutely sure?`);
    if (!confirm2) return;

    setActionLoading(true);
    try {
      await axiosClient.delete(`/platform/delete-restaurant/${r._id}`);
      await fetchData();
      alert("Restaurant deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete restaurant");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");
  
  // Helper to get plan name
  const getPlanName = (r) => {
    const planId = typeof r.planId === 'object' ? r.planId?._id : r.planId;
    const plan = plans.find(p => p._id === planId);
    return plan?.name || null;
  };

  if (loading && restaurants.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-sm text-gray-500">
            {paginationMeta?.totalItems || 0} restaurants on platform
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <PageSizeSelector limit={limit} onLimitChange={handleLimitChange} />
          <button
            onClick={() => setModal({ type: "create", restaurant: null })}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            + Create restaurant
          </button>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Restaurant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Expires</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Public Link</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {restaurants.map((r) => {
                const planName = getPlanName(r);
                const planId = typeof r.planId === 'object' ? r.planId?._id : r.planId;
                
                return (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{r.name}</div>
                      <div className="text-xs text-gray-400">ID: ...{r._id.slice(-6)}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={r.subscriptionStatus} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {planName ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                          {planName}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No plan</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{formatDate(r.subscriptionEndsAt)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <a
                        href={`/r/${r.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 text-xs"
                      >
                        /r/{r.slug}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <ActionDropdown
                        restaurant={r}
                        hasPlan={!!planId}
                        onCreateAdmin={() => setModal({ type: "admin", restaurant: r })}
                        onAssignPlan={() => setModal({ type: "assign", restaurant: r })}
                        onExtend={() => setModal({ type: "extend", restaurant: r })}
                        onChangePlan={() => {
                          setChangePlanId(planId || "");
                          setModal({ type: "change", restaurant: r });
                        }}
                        onUpdateStatus={() => {
                          setStatusUpdate(r.subscriptionStatus);
                          setModal({ type: "status", restaurant: r });
                        }}
                        onSuspend={() => handleSuspend(r)}
                        onResume={() => handleResume(r)}
                        onDelete={() => handleDeleteRestaurant(r)}
                      />
                    </td>
                  </tr>
                );
              })}
              {restaurants.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No restaurants yet. Click "Create restaurant" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {!loading && paginationMeta && (
        <Pagination
          currentPage={page}
          totalPages={paginationMeta.totalPages}
          onPageChange={handlePageChange}
          totalItems={paginationMeta.totalItems}
          limit={limit}
        />
      )}
      
      {/* ===== MODALS ===== */}
      
      {/* Create Restaurant */}
      {modal.type === "create" && (
        <Modal title="Create New Restaurant" onClose={closeModal}>
          <form onSubmit={handleCreateRestaurant}>
            {error && <ErrorMsg msg={error} />}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter restaurant name"
                required
              />
              <p className="mt-1 text-xs text-gray-400">A unique slug will be auto-generated</p>
            </div>
            <SubmitBtn loading={actionLoading} label="Create Restaurant" />
          </form>
        </Modal>
      )}

      {/* Create Admin */}
      {modal.type === "admin" && (
        <Modal title={`Create Admin for ${modal.restaurant.name}`} onClose={closeModal}>
          <form onSubmit={handleCreateAdmin}>
            {error && <ErrorMsg msg={error} />}
            <p className="text-xs text-gray-500 mb-4">
              This will create a RESTAURANT_ADMIN user who can manage this restaurant.
            </p>
            <div className="space-y-3 mb-4">
              <InputField label="Username" value={adminForm.username} onChange={(v) => setAdminForm({ ...adminForm, username: v })} />
              <InputField label="Email" type="email" value={adminForm.email} onChange={(v) => setAdminForm({ ...adminForm, email: v })} />
              <InputField label="Password" type="password" value={adminForm.password} onChange={(v) => setAdminForm({ ...adminForm, password: v })} />
              <InputField label="Phone" value={adminForm.phone} onChange={(v) => setAdminForm({ ...adminForm, phone: v })} />
            </div>
            <SubmitBtn loading={actionLoading} label="Create Admin" />
          </form>
        </Modal>
      )}

      {/* Assign Plan */}
      {modal.type === "assign" && (
        <Modal title={`Assign Plan to ${modal.restaurant.name}`} onClose={closeModal}>
          <form onSubmit={handleAssignPlan}>
            {error && <ErrorMsg msg={error} />}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Plan</label>
              <select
                value={assignForm.planId}
                onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Choose a plan...</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} - ₹{p.price}/{p.interval}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
              <input
                type="number"
                value={assignForm.durationInDays}
                onChange={(e) => setAssignForm({ ...assignForm, durationInDays: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min={1}
                required
              />
            </div>
            <SubmitBtn loading={actionLoading} label="Assign Plan" />
          </form>
        </Modal>
      )}

      {/* Extend Subscription */}
      {modal.type === "extend" && (
        <Modal title={`Extend Subscription for ${modal.restaurant.name}`} onClose={closeModal}>
          <form onSubmit={handleExtend}>
            {error && <ErrorMsg msg={error} />}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Extend by (days)</label>
              <input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min={1}
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                Current expiry: {formatDate(modal.restaurant.subscriptionEndsAt)}
              </p>
            </div>
            <SubmitBtn loading={actionLoading} label="Extend Subscription" />
          </form>
        </Modal>
      )}

      {/* Change Plan */}
      {modal.type === "change" && (
        <Modal title={`Change Plan for ${modal.restaurant.name}`} onClose={closeModal}>
          <form onSubmit={handleChangePlan}>
            {error && <ErrorMsg msg={error} />}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Plan</label>
              <select
                value={changePlanId}
                onChange={(e) => setChangePlanId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              >
                <option value="">Select plan...</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} - ₹{p.price}/{p.interval}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-amber-600">
                ⚠️ Downgrade may be blocked if restaurant exceeds new plan limits.
              </p>
            </div>
            <SubmitBtn loading={actionLoading} label="Change Plan" />
          </form>
        </Modal>
      )}

      {/* Update Status */}
      {modal.type === "status" && (
        <Modal title={`Update Status for ${modal.restaurant.name}`} onClose={closeModal}>
          <form onSubmit={handleUpdateStatus}>
            {error && <ErrorMsg msg={error} />}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Status</label>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
            <SubmitBtn loading={actionLoading} label="Update Status" />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ===== COMPONENTS =====

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    SUSPENDED: "bg-red-100 text-red-700",
    TRIAL: "bg-amber-100 text-amber-700",
    EXPIRED: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status || "Unknown"}
    </span>
  );
}

function ActionDropdown({ restaurant, hasPlan, onCreateAdmin, onAssignPlan, onExtend, onChangePlan, onUpdateStatus, onSuspend, onResume, onDelete }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const screenHeight = window.innerHeight;
      const menuHeightEstimate = 350; // Conservative height estimate for the full menu
      
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

  const MenuItem = ({ label, onClick, danger, success }) => (
    <button
      onClick={() => { onClick(); setOpen(false); }}
      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
        danger ? 'text-red-600' : success ? 'text-emerald-600' : 'text-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
      >
        Actions
        <svg className="ml-1.5 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div 
            style={menuStyle}
            className="z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-1"
          >
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase">Admin</p>
            </div>
            <MenuItem label="Create admin user" onClick={onCreateAdmin} />
            
            <div className="px-4 py-2 border-b border-gray-100 border-t">
              <p className="text-xs font-medium text-gray-400 uppercase">Subscription</p>
            </div>
            <MenuItem label="Assign plan" onClick={onAssignPlan} />
            <MenuItem label="Extend subscription" onClick={onExtend} />
            {hasPlan && <MenuItem label="Change plan" onClick={onChangePlan} />}
            
            <div className="px-4 py-2 border-b border-gray-100 border-t">
              <p className="text-xs font-medium text-gray-400 uppercase">Status</p>
            </div>
            <MenuItem label="Update status" onClick={onUpdateStatus} />
            {restaurant.subscriptionStatus === "SUSPENDED" ? (
              <MenuItem label="Resume restaurant" onClick={onResume} success />
            ) : (
              <MenuItem label="Suspend restaurant" onClick={onSuspend} danger />
            )}
            
            <div className="px-4 py-2 border-b border-gray-100 border-t">
              <p className="text-xs font-medium text-gray-400 uppercase">Management</p>
            </div>
            <MenuItem label="Delete Restaurant" onClick={onDelete} danger />
          </div>
        </>,
        document.body
      )}
    </>
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
        <div className="p-5">{children}</div>
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
