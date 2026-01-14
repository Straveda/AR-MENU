import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import axiosClient from "../../api/axiosClient";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useToast } from "../../components/common/Toast/ToastContext";

export default function PlansManagement() {
  const { showSuccess, showError } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ type: null, plan: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null, isDangerous: false });

  const emptyForm = {
    name: "",
    description: "",
    price: "",
    interval: "MONTHLY",
    features: { arModels: false, kds: false, analytics: false },
    limits: { maxDishes: "", maxStaff: "" },
  };
  const [form, setForm] = useState(emptyForm);

  const fetchPlans = async () => {
    try {
      const { data } = await axiosClient.get("/platform/plans/get-plans");
      if (data.success) setPlans(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const closeModal = () => {
    setModal({ type: null, plan: null });
    setForm(emptyForm);
    setError("");
  };

  const closeConfirmModal = () => setConfirmModal({ ...confirmModal, isOpen: false });

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await axiosClient.post("/platform/plans/create-plan", form);
      await fetchPlans();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create plan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await axiosClient.put(`/platform/plans/update/${modal.plan._id}`, form);
      await fetchPlans();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update plan");
    } finally {
      setActionLoading(false);
    }
  };

  const initiateDelete = (plan) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Plan?",
      message: `Are you sure you want to delete "${plan.name}"? This cannot be undone.`,
      confirmLabel: "Delete Plan",
      isDangerous: true,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await axiosClient.delete(`/platform/plans/delete/${plan._id}`);
          showSuccess("Plan deleted successfully");
          await fetchPlans();
        } catch (err) {
            showError(err.response?.data?.message || "Failed to delete plan");
        } finally {
          setActionLoading(false);
          closeConfirmModal();
        }
      }
    });
  };

  const openEdit = (plan) => {
    setForm({
      name: plan.name,
      description: plan.description || "",
      price: plan.price ?? "",
      interval: plan.interval || "MONTHLY",
      features: plan.features || { arModels: false, kds: false, analytics: false },
      limits: plan.limits || { maxDishes: "", maxStaff: "" },
    });
    setModal({ type: "edit", plan });
  };

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Plans</h1>
          <p className="text-sm text-gray-500">Configure subscription plans</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setModal({ type: "create", plan: null }); }}
          className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800"
        >
          Create plan
        </button>
      </div>

      {}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Price</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Interval</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Features</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Limits</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {plans.map((p) => (
              <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-900 border-none">
                  <div className="font-medium">{p.name}</div>
                  {p.description && <div className="text-xs text-slate-500 max-w-[200px] truncate">{p.description}</div>}
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono">₹{p.price || 0}</td>
                <td className="px-4 py-3">
                   <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {p.interval || "MONTHLY"}
                   </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    <FeatureIndicator label="AR" enabled={p.features?.arModels} />
                    <FeatureIndicator label="KDS" enabled={p.features?.kds} />
                    <FeatureIndicator label="Analytics" enabled={p.features?.analytics} />
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                   <div className="flex flex-col">
                      <span><span className="font-semibold text-slate-700">{p.limits?.maxDishes || 0}</span> dishes</span>
                      <span><span className="font-semibold text-slate-700">{p.limits?.maxStaff || 0}</span> staff</span>
                   </div>
                </td>
                <td className="px-4 py-3 text-right">
                   <ActionDropdown 
                      plan={p}
                      onEdit={() => openEdit(p)}
                      onDelete={() => initiateDelete(p)}
                   />
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No plans configured
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {}
      {modal.type === "create" && (
        <Modal title="Create plan" onClose={closeModal}>
          <PlanForm
            form={form}
            setForm={setForm}
            onSubmit={handleCreate}
            loading={actionLoading}
            error={error}
            submitLabel="Create"
          />
        </Modal>
      )}

      {}
      {modal.type === "edit" && (
        <Modal title="Edit plan" onClose={closeModal}>
          <PlanForm
            form={form}
            setForm={setForm}
            onSubmit={handleUpdate}
            loading={actionLoading}
            error={error}
            submitLabel="Save"
            isEdit
          />
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

function FeatureIndicator({ label, enabled }) {
  return (
    <span className={`px-1.5 py-0.5 text-xs rounded ${enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
      {label}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function PlanForm({ form, setForm, onSubmit, loading, error, submitLabel, isEdit }) {
  return (
    <form onSubmit={onSubmit}>
      {error && <div className="mb-3 px-3 py-2 text-sm text-red-700 bg-red-50 rounded-md">{error}</div>}
      
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            disabled={isEdit}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Interval</label>
            <select
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-2">Features</label>
          <div className="flex gap-4">
            <Checkbox
              label="AR Models"
              checked={form.features.arModels}
              onChange={(v) => setForm({ ...form, features: { ...form.features, arModels: v } })}
            />
            <Checkbox
              label="KDS"
              checked={form.features.kds}
              onChange={(v) => setForm({ ...form, features: { ...form.features, kds: v } })}
            />
            <Checkbox
              label="Analytics"
              checked={form.features.analytics}
              onChange={(v) => setForm({ ...form, features: { ...form.features, analytics: v } })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Max Dishes</label>
            <input
              type="number"
              value={form.limits.maxDishes}
              onChange={(e) => setForm({ ...form, limits: { ...form.limits, maxDishes: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Max Staff</label>
            <input
              type="number"
              value={form.limits.maxStaff}
              onChange={(e) => setForm({ ...form, limits: { ...form.limits, maxStaff: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              min={0}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400"
      >
        {loading ? "..." : submitLabel}
      </button>
    </form>
  );
}

function ActionDropdown({ plan, onEdit, onDelete }) {
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
      const menuHeightEstimate = 100; 
      
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
        <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Management</div>
        <MenuItem 
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
          label="Edit Plan Details" 
          onClick={() => { onEdit(); setOpen(false); }} 
        />
        <div className="border-t border-slate-100 my-1"></div>
        <MenuItem 
           icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
           label="Delete Plan"
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
                <div className="pb-6">
                  <div className="px-4 py-2 border-b border-slate-100 mb-2">
                     <h3 className="font-semibold text-slate-900">Manage {plan.name}</h3>
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

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-1.5 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-3.5 h-3.5"
      />
      {label}
    </label>
  );
}
