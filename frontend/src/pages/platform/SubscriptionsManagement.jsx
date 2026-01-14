import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import axiosClient from "../../api/axiosClient";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import Modal from "../../components/common/Modal";
import { useToast } from "../../components/common/Toast/ToastContext";

export default function SubscriptionsManagement() {
  const { showSuccess, showError } = useToast();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [modal, setModal] = useState({ type: null, restaurant: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null, isDangerous: false });
  
  const [extendDays, setExtendDays] = useState(30);
  const [changePlanId, setChangePlanId] = useState("");

  const fetchData = async () => {
    try {
      const [statsRes, logsRes, restRes, plansRes] = await Promise.all([
        axiosClient.get("/platform/get-subscription-stats"),
        axiosClient.get("/platform/get-subscription-logs"),
        axiosClient.get("/platform/get-all-restaurants"),
        axiosClient.get("/platform/plans/get-plans"),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.data || {});
      if (logsRes.data.success) setLogs(Array.isArray(logsRes.data.data) ? logsRes.data.data : []);
      if (restRes.data.success) setRestaurants(Array.isArray(restRes.data.data) ? restRes.data.data : []);
      if (plansRes.data.success) setPlans(Array.isArray(plansRes.data.data) ? plansRes.data.data : []);
    } catch (err) {
      console.error("Failed to fetch subscription data:", err);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal({ type: null, restaurant: null });
    setExtendDays(30);
    setChangePlanId("");
  };

  const closeConfirmModal = () => setConfirmModal({ ...confirmModal, isOpen: false });

  const handleExtend = async () => {
    setActionLoading(true);
    try {
      await axiosClient.patch(`/platform/extend-subscription/${modal.restaurant._id}`, {
        extendByDays: Number(extendDays),
      });
      showSuccess("Subscription extended successfully");
      await fetchData();
      closeModal();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to extend");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePlan = async () => {
    setActionLoading(true);
    try {
      await axiosClient.patch(`/platform/change-plan/${modal.restaurant._id}`, {
        planId: changePlanId,
      });
      showSuccess("Plan changed successfully");
      await fetchData();
      closeModal();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to change plan");
    } finally {
      setActionLoading(false);
    }
  };

  const initiateSuspend = (r) => {
    setConfirmModal({
      isOpen: true,
      title: "Pause Subscription?",
      message: `Are you sure you want to pause subscription for ${r.name}? This will block access for the restaurant.`,
      confirmLabel: "Pause Subscription",
      isDangerous: true,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await axiosClient.patch(`/platform/suspend-restaurant/${r._id}`);
          showSuccess("Subscription paused");
          await fetchData();
        } catch (err) {
          showError(err.response?.data?.message);
        } finally {
          setActionLoading(false);
          closeConfirmModal();
        }
      }
    });
  };

  const initiateResume = (r) => {
    setConfirmModal({
      isOpen: true,
      title: "Resume Subscription?",
      message: `Resume subscription for ${r.name}?`,
      confirmLabel: "Resume Access",
      isDangerous: false,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await axiosClient.patch(`/platform/resume-restaurant/${r._id}`);
          showSuccess("Subscription resumed");
          await fetchData();
        } catch (err) {
          showError(err.response?.data?.message);
        } finally {
          setActionLoading(false);
          closeConfirmModal();
        }
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const now = new Date();
  
  const sortedRestaurants = Array.isArray(restaurants) ? [...restaurants].sort((a, b) => {
     if (!a?.subscriptionEndsAt) return 1;
     if (!b?.subscriptionEndsAt) return -1;
     return new Date(a.subscriptionEndsAt) - new Date(b.subscriptionEndsAt);
  }) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500">Monitor platform revenue and expiration timelines</p>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <RevenueCard 
          label="Estimated MRR" 
          value={`₹${(stats?.totalMRR || 0).toLocaleString()}`} 
          desc="Monthly Recurring Revenue" 
        />
        <RevenueCard 
          label="Active Subs" 
          value={stats?.activeSubscriptions || 0} 
          desc="Non-suspended restaurants" 
        />
        <RevenueCard 
          label="Expiring (7d)" 
          value={stats?.expiringSoon || 0} 
          color="text-amber-600"
          desc="Critical renewals" 
        />
        <RevenueCard 
          label="Expired" 
          value={stats?.expired || 0} 
          color="text-red-600"
          desc="Immediate attention" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Active Subscriptions</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Restaurant</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Cycle</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Expiry</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRestaurants.map((r) => {
                  const expiry = r.subscriptionEndsAt ? new Date(r.subscriptionEndsAt) : null;
                  const diffDays = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;
                  const isExpired = diffDays !== null && diffDays < 0;
                  
                  return (
                    <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{r.name}</div>
                        <div className="text-xs text-slate-500 font-mono">/r/{r.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.planId?.name || "No Plan"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {r.subscriptionType || "MONTHLY"}
                      </td>
                      <td className="px-4 py-3">
                        {expiry ? (
                            <div>
                                <div className={`text-sm ${isExpired ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                                    {expiry.toLocaleDateString()}
                                </div>
                                <div className="text-xs text-slate-400">
                                    {isExpired ? 'Expired' : `${diffDays} days left`}
                                </div>
                            </div>
                        ) : (
                            <span className="text-slate-400 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.subscriptionStatus === "ACTIVE" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : r.subscriptionStatus === "SUSPENDED" 
                                ? "bg-amber-100 text-amber-700" 
                                : "bg-red-100 text-red-700"
                        }`}>
                          {r.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionDropdown 
                          restaurant={r}
                          onExtend={() => setModal({ type: 'extend', restaurant: r })}
                          onChangePlan={() => setModal({ type: 'changePlan', restaurant: r })}
                          onSuspend={() => initiateSuspend(r)}
                          onResume={() => initiateResume(r)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      {modal.type === "extend" && (
        <Modal title={`Extend ${modal.restaurant.name}`} onClose={closeModal}>
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extend By (Days)</label>
                <select 
                   value={extendDays}
                   onChange={(e) => setExtendDays(e.target.value)}
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                   <option value={7}>7 Days</option>
                   <option value={15}>15 Days</option>
                   <option value={30}>30 Days (1 Month)</option>
                   <option value={90}>90 Days (3 Months)</option>
                   <option value={365}>365 Days (1 Year)</option>
                </select>
             </div>
             <button
               onClick={handleExtend}
               disabled={actionLoading}
               className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
             >
               {actionLoading ? "Processing..." : "Confirm Extension"}
             </button>
          </div>
        </Modal>
      )}

      {modal.type === "changePlan" && (
        <Modal title={`Change Plan for ${modal.restaurant.name}`} onClose={closeModal}>
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select New Plan</label>
                <select 
                   value={changePlanId}
                   onChange={(e) => setChangePlanId(e.target.value)}
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                   <option value="">Select Plan...</option>
                   {plans.map(p => (
                      <option key={p._id} value={p._id}>{p.name} (₹{p.price}/{p.interval})</option>
                   ))}
                </select>
             </div>
             <button
               onClick={handleChangePlan}
               disabled={actionLoading}
               className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
             >
               {actionLoading ? "Processing..." : "Update Plan"}
             </button>
          </div>
        </Modal>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        isDangerous={confirmModal.isDangerous}
      />

        {}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-6">
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
            ) : (
              logs.map((log) => {
                if (!log) return null;
                return (
                <div key={log._id || Math.random()} className="relative pl-6 pb-6 border-l border-gray-100 last:pb-0">
                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-indigo-500" />
                  <div className="text-xs text-gray-400 mb-1">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{log.restaurantId?.name || "Unknown Rest."}</span>{' '}
                    <ActionText action={log.action} />{' '}
                    <span className="font-medium text-indigo-600">{log.planId?.name || "Unknown Plan"}</span>
                  </div>
                  {log.durationInDays && (
                    <div className="text-xs text-gray-500 mt-1">
                      Duration: {log.durationInDays} days
                    </div>
                  )}
                  {log.performedBy && (
                    <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                      By {log.performedBy.username || "Unknown"}
                    </div>
                  )}
                </div>
              )})
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueCard({ label, value, desc, color = "text-gray-900" }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-micro text-gray-400 mt-2">{desc}</p>
    </div>
  );
}

function ActionDropdown({ restaurant, onExtend, onChangePlan, onSuspend, onResume }) {
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
        <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Subscription</div>
        <MenuItem 
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Extend Subscription" 
          onClick={() => { onExtend(); setOpen(false); }} 
        />
        <MenuItem 
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
          label="Change Plan" 
          onClick={() => { onChangePlan(); setOpen(false); }} 
        />
      </div>

      <div className="border-t border-slate-100 my-1"></div>

      <div className="py-2">
        <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</div>
        {restaurant.subscriptionStatus === "SUSPENDED" ? (
          <MenuItem 
             icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
             label="Resume Access"
             onClick={() => { onResume(); setOpen(false); }}
             variant="success"
          />
        ) : (
          <MenuItem 
             icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
             label="Pause Subscription"
             onClick={() => { onSuspend(); setOpen(false); }}
             variant="warning"
          />
        )}
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
                <div className="pb-6">
                  <div className="px-4 py-2 border-b border-slate-100 mb-2">
                     <h3 className="font-semibold text-slate-900">Manage Subscription</h3>
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

function ActionText({ action }) {
  const actionMap = {
    EXTEND: "extended subscription",
    CHANGE_PLAN: "changed plan",
    SUSPEND: "suspended access",
    RESUME: "resumed access",
    CREATE: "onboarded restaurant",
    ASSIGN_PLAN: "assigned plan",
    UPDATE_STATUS: "updated status"
  };

  return <span className="text-gray-600">{actionMap[action] || action?.replace(/_/g, ' ').toLowerCase()}</span>;
}
