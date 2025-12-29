import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

export default function PlansManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ type: null, plan: null });

  const emptyForm = {
    name: "",
    description: "",
    price: 0,
    interval: "MONTHLY",
    features: { arModels: false, kds: false, analytics: false },
    limits: { maxDishes: 10, maxStaff: 2 },
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

  const openEdit = (plan) => {
    setForm({
      name: plan.name,
      description: plan.description || "",
      price: plan.price || 0,
      interval: plan.interval || "MONTHLY",
      features: plan.features || { arModels: false, kds: false, analytics: false },
      limits: plan.limits || { maxDishes: 10, maxStaff: 2 },
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

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Price</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Interval</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Features</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Limits</th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plans.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{p.name}</div>
                  {p.description && <div className="text-xs text-gray-400">{p.description}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">₹{p.price || 0}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{p.interval || "MONTHLY"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <FeatureIndicator label="AR" enabled={p.features?.arModels} />
                    <FeatureIndicator label="KDS" enabled={p.features?.kds} />
                    <FeatureIndicator label="Analytics" enabled={p.features?.analytics} />
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {p.limits?.maxDishes || 0} dishes, {p.limits?.maxStaff || 0} staff
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No plans configured
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
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

      {/* Edit Modal */}
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
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
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
              onChange={(e) => setForm({ ...form, limits: { ...form.limits, maxDishes: Number(e.target.value) } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Max Staff</label>
            <input
              type="number"
              value={form.limits.maxStaff}
              onChange={(e) => setForm({ ...form, limits: { ...form.limits, maxStaff: Number(e.target.value) } })}
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
