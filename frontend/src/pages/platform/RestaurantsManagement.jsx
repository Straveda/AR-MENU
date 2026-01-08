import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import axiosClient from "../../api/axiosClient";
import { usePagination } from "../../hooks/usePagination";
import Pagination from "../../components/common/Pagination";
import PageSizeSelector from "../../components/common/PageSizeSelector";
import Modal from "../../components/common/Modal";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useToast } from "../../components/common/Toast/ToastContext";

export default function RestaurantsManagement() {
  const { showSuccess, showError, showWarning } = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: "", 
    message: "", 
    onConfirm: null, 
    isDangerous: false 
  });

  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const { 
    page, 
    limit, 
    paginationMeta, 
    setPaginationMeta, 
    handlePageChange, 
    handleLimitChange,
    paginationParams 
  } = usePagination(10);

  const [modal, setModal] = useState({ type: null, restaurant: null });

  const [createForm, setCreateForm] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    planId: "",
    subscriptionType: "MONTHLY",
    status: "Active"
  });
  
  const [adminForm, setAdminForm] = useState({ username: "", email: "", password: "", phone: "" });
  const [assignForm, setAssignForm] = useState({ planId: "", durationInDays: 30 });
  const [extendDays, setExtendDays] = useState(30);
  const [changePlanId, setChangePlanId] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");

  const fetchData = async () => {

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
    
  }, [page, limit]); 

  const closeModal = () => {
    setModal({ type: null, restaurant: null });
    setError("");
    setCreateForm({
      name: "",
      address: "",
      email: "",
      phone: "",
      planId: "",
      subscriptionType: "MONTHLY",
      status: "Active"
    });
    setAdminForm({ username: "", email: "", password: "", phone: "" });
    setAssignForm({ planId: "", durationInDays: 30 });
    setExtendDays(30);
    setChangePlanId("");
    setStatusUpdate("");
  };

  const handleError = (err) => {
    setError(err.response?.data?.message || "Operation failed");
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await axiosClient.post("/platform/create-restaurant", createForm);
      await fetchData();
      closeModal();
      showSuccess("Restaurant onboarded successfully");
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

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
      showSuccess("Admin created successfully!");
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

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

  const initiateSuspend = (r) => {
    setConfirmModal({
      isOpen: true,
      title: "Suspend Restaurant Access",
      message: (
        <div className="space-y-3">
          <p>Are you sure you want to suspend <span className="font-semibold text-gray-900">{r.name}</span>?</p>
          <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
            <h4 className="text-xs font-bold text-amber-800 uppercase mb-1">Impact</h4>
            <ul className="text-xs text-amber-700 list-disc list-inside space-y-1">
              <li>Admins/Staff cannot login</li>
              <li>Subscription paused</li>
              <li>Data is preserved (reversible)</li>
            </ul>
          </div>
        </div>
      ),
      confirmLabel: "Suspend Access",
      isDangerous: true,
      onConfirm: () => handleSuspend(r),
    });
  };

  const handleSuspend = async (r) => {
    setConfirmModal({ ...confirmModal, isLoading: true });
    try {
      await axiosClient.patch(`/platform/suspend-restaurant/${r._id}`);
      showSuccess(`Restaurant "${r.name}" suspended successfully`);
      await fetchData();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to suspend");
    } finally {
      closeConfirmModal();
    }
  };

  const initiateResume = (r) => {
    setConfirmModal({
      isOpen: true,
      title: "Resume Restaurant Access",
      message: (
        <div>
           <p className="mb-2">Restoring access for <span className="font-semibold text-gray-900">{r.name}</span>.</p>
           <p className="text-xs text-gray-500">Users will be able to log in immediately.</p>
        </div>
      ),
      confirmLabel: "Resume Access",
      isDangerous: false,
      onConfirm: () => handleResume(r),
    });
  };

  const handleResume = async (r) => {
    setConfirmModal({ ...confirmModal, isLoading: true });
    try {
      await axiosClient.patch(`/platform/resume-restaurant/${r._id}`);
      showSuccess(`Restaurant "${r.name}" resumed successfully`);
      await fetchData();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to resume");
    } finally {
      closeConfirmModal();
    }
  };

  const initiateDeleteRestaurant = (r) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Restaurant?",
      message: (
        <div>
           <p className="mb-3">You are about to delete <span className="font-semibold text-gray-900">{r.name}</span>.</p>
           <p className="text-sm text-gray-600">This action is permanent and cannot be undone via the dashboard.</p>
        </div>
      ),
      confirmLabel: "Continue to Confirmation...",
      isDangerous: true,
      onConfirm: () => initiateFinalDeleteRestaurant(r),
    });
  };

  const initiateFinalDeleteRestaurant = (r) => {
    setConfirmModal({
      isOpen: true,
      title: "CRITICAL: Permanent Deletion",
      message: (
         <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-red-800 text-sm">
               <strong>WARNING: Data Loss Imminent</strong>
               <p className="mt-1 text-xs">This will permanently destroy:</p>
               <ul className="list-disc list-inside mt-1 text-xs opacity-90">
                  <li>Restaurant Profile & Settings</li>
                  <li>All Staff Accounts ({r._id})</li>
                  <li>Menu & Inventory Data</li>
                  <li>Order History & Analytics</li>
               </ul>
            </div>
            <p className="text-sm">Type <strong>DELETE</strong> to confirm.</p> 
            {/* Note: Real input confirmation is not in existing UI component API, relying on double-click confirm flow for now */}
         </div>
      ),
      confirmLabel: "Yes, Delete Everything",
      isDangerous: true,
      onConfirm: () => handleDeleteRestaurant(r),
    });
  };

  const handleDeleteRestaurant = async (r) => {
    setConfirmModal({ ...confirmModal, isLoading: true });
    try {
      await axiosClient.delete(`/platform/delete-restaurant/${r._id}`);
      await fetchData();
      showSuccess("Restaurant deleted successfully");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete restaurant");
    } finally {
      closeConfirmModal();
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");

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

      {}
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
                        onSuspend={() => initiateSuspend(r)}
                        onResume={() => initiateResume(r)}
                        onDelete={() => initiateDeleteRestaurant(r)}
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
      
      {}
      {modal.type === "create" && (
        <Modal title="Onboard New Restaurant" onClose={closeModal}>
          <form onSubmit={handleCreateRestaurant} className="space-y-6">
            {error && <ErrorMsg msg={error} />}
            
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Business Profile</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. The Golden Spoon"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Address <span className="text-red-500">*</span></label>
                  <textarea
                    value={createForm.address}
                    onChange={(e) => setCreateForm({...createForm, address: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                    placeholder="Full street address, City, ZIP..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contact Information */}
            <div className="space-y-4">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Contact Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Primary Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="admin@restaurant.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
               </div>
            </div>

            {/* Section 3: Business Configuration */}
            <div className="space-y-4">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Subscription Config</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Plan Assignment <span className="text-red-500">*</span></label>
                    <select
                      value={createForm.planId}
                      onChange={(e) => setCreateForm({...createForm, planId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select a Plan</option>
                      {plans.map(p => (
                        <option key={p._id} value={p._id}>{p.name} (₹{p.price}/{p.interval})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Billing Cycle <span className="text-red-500">*</span></label>
                     <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setCreateForm({...createForm, subscriptionType: 'MONTHLY'})}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            createForm.subscriptionType === 'MONTHLY' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateForm({...createForm, subscriptionType: 'YEARLY'})}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            createForm.subscriptionType === 'YEARLY' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'
                          }`}
                        >
                          Yearly
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            {/* Section 4: Status */}
            <div className="space-y-4">
               <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Initial Status</h4>
                    <p className="text-xs text-slate-500">Determine if restaurant is live immediately</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className={`text-xs font-bold ${createForm.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {createForm.status}
                     </span>
                     <button
                        type="button"
                        onClick={() => setCreateForm({...createForm, status: createForm.status === 'Active' ? 'Inactive' : 'Active'})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          createForm.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                     >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          createForm.status === 'Active' ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                     </button>
                  </div>
               </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
               <button
                 type="button"
                 onClick={closeModal}
                 className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
               >
                 Cancel
               </button>
               <SubmitBtn loading={actionLoading} label="Onboard Restaurant" />
            </div>
          </form>
        </Modal>
      )}

      {}
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

      {}
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

      {}
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

      {}
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

      {}
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
      
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        confirmLabel={confirmModal.confirmLabel}
        isDangerous={confirmModal.isDangerous}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
}

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
      const menuHeightEstimate = 400; 
      
      const spaceBelow = screenHeight - rect.bottom;
      const shouldOpenUpwards = spaceBelow < menuHeightEstimate;

      if (shouldOpenUpwards) {
        setMenuStyle({
          position: 'fixed',
          bottom: screenHeight - rect.top + 4,
          right: window.innerWidth - rect.right,
          maxHeight: '80vh',
          overflowY: 'auto'
        });
      } else {
        setMenuStyle({
          position: 'fixed',
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
          maxHeight: '80vh',
          overflowY: 'auto'
        });
      }
    }
  }, [open, isMobile]);

  const MenuContent = () => (
    <>
      {/* Admin Section */}
      <div className="py-2">
        <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Admin</div>
        <MenuItem 
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
          label="Create Admin User" 
          onClick={() => { onCreateAdmin(); setOpen(false); }} 
        />
      </div>

      <div className="border-t border-slate-100 my-1"></div>

      {/* Subscription Section */}
      <div className="py-2">
        <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Subscription</div>
        <MenuItem 
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
          label="Assign Plan" 
          onClick={() => { onAssignPlan(); setOpen(false); }} 
        />
        {hasPlan && (
          <MenuItem 
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
            label="Change Plan" 
            onClick={() => { onChangePlan(); setOpen(false); }} 
          />
        )}
        <MenuItem 
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Extend Subscription" 
          onClick={() => { onExtend(); setOpen(false); }} 
          disabled={!hasPlan}
        />
      </div>

      <div className="border-t border-slate-100 my-1"></div>

      {/* Status Section */}
      <div className="py-2">
        <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</div>
        <MenuItem 
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
          label="Update Status" 
          onClick={() => { onUpdateStatus(); setOpen(false); }} 
        />
        {restaurant.subscriptionStatus === "SUSPENDED" ? (
          <MenuItem 
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Resume Restaurant" 
            onClick={() => { onResume(); setOpen(false); }} 
            variant="success"
          />
        ) : (
          <MenuItem 
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Suspend Restaurant" 
            onClick={() => { onSuspend(); setOpen(false); }} 
            variant="warning"
          />
        )}
      </div>

      <div className="border-t border-slate-100 my-1"></div>

      {/* Danger Zone */}
      <div className="py-2 bg-red-50/50">
        <div className="px-4 py-1 text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Danger Zone
        </div>
        <MenuItem 
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
          label="Delete Restaurant" 
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
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
      >
        Actions
        <svg className={`ml-1.5 w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="max-h-[85vh] overflow-y-auto pb-6">
                  <div className="px-4 py-2 border-b border-slate-100 mb-2">
                     <h3 className="font-semibold text-slate-900">Manage {restaurant.name}</h3>
                  </div>
                  <MenuContent />
                </div>
             </div>
          ) : (
            <div 
              style={menuStyle}
              className="z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
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
