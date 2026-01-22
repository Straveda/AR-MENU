import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getIngredients, getStockMovements, createIngredient, updateIngredient, adjustStock } from "../../api/inventoryApi";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import { useToast } from "../../components/common/Toast/ToastContext";
import Pagination from "../../components/common/Pagination";
import { usePagination } from "../../hooks/usePagination";

export default function Inventory() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState("ingredients");
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState([]);
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState({
    totalStockValue: 0,
    lowStockCount: 0,
    deadStockCount: 0,
    topConsumed: 'N/A'
  });

  const {
    page,
    limit,
    setPaginationMeta,
    paginationMeta,
    handlePageChange,
    handleLimitChange,
    paginationParams
  } = usePagination(10);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (activeTab === "ingredients") {
        const res = await getIngredients(paginationParams);
        setIngredients(res.data.data.ingredients);
        setSummary(res.data.data.summary);
        setPaginationMeta(res.data.data.meta);
      } else {
        const res = await getStockMovements(paginationParams);
        setMovements(res.data.data.movements);
        setPaginationMeta(res.data.data.meta);
      }
    } catch (error) {
      showError("Failed to load inventory data");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeTab, paginationParams, setPaginationMeta, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddIngredient = async (formData) => {
    try {
      await createIngredient(formData);
      showSuccess("Ingredient added successfully");
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to add ingredient");
    }
  };

  const handleUpdateIngredient = async (id, formData) => {
    try {
      const res = await updateIngredient(id, formData);
      setIngredients(prev => prev.map(ing => ing._id === id ? res.data.data : ing));
      showSuccess("Ingredient updated successfully");
      setSelectedIngredient(null);
      setShowAddModal(false);
      fetchData(true);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update ingredient");
    }
  };

  const handleAdjustStock = async (formData) => {
    try {
      const res = await adjustStock(selectedIngredient._id, formData);
      setIngredients(prev => prev.map(ing => ing._id === selectedIngredient._id ? res.data.data : ing));
      showSuccess("Stock adjusted successfully");
      setShowAdjustModal(false);
      setSelectedIngredient(null);
      fetchData(true);
    } catch (error) {
      showError(error.response?.data?.message || "Failed to adjust stock");
    }
  };

  if (loading && ingredients.length === 0 && movements.length === 0) {
    return <Loading message="Loading inventory..." />;
  }

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      { }
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="type-h1">Inventory Management</h1>
          <p className="type-secondary mt-1">Real-time tracking of raw materials and operational assets</p>
        </div>
        <button
          onClick={() => { setSelectedIngredient(null); setShowAddModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Add Ingredient
        </button>
      </div>

      { }
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          label="Total Value"
          value={`₹${summary.totalStockValue.toLocaleString()}`}
          accent="blue"
          icon="💰"
        />
        <SummaryCard
          label="Low Stock Items"
          value={summary.lowStockCount}
          accent="rose"
          icon="⚠️"
        />
        <SummaryCard
          label="Top Category"
          value={summary.topConsumed || "N/A"}
          accent="emerald"
          icon="📦"
        />
        <SummaryCard
          label="Dead Stock"
          value={summary.deadStockCount}
          accent="slate"
          icon="🧊"
        />
      </div>

      { }
      { }
      <div className="flex gap-8 border-b border-slate-200 mt-2">
        <button
          onClick={() => { setActiveTab("ingredients"); handlePageChange(1); }}
          className={`pb-4 type-label transition-all relative ${activeTab === "ingredients"
            ? "text-slate-900"
            : "text-slate-400 hover:text-slate-600"
            }`}
        >
          Ingredients
          {activeTab === "ingredients" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-full"></span>}
        </button>
        <button
          onClick={() => { setActiveTab("movements"); handlePageChange(1); }}
          className={`pb-4 type-label transition-all relative ${activeTab === "movements"
            ? "text-slate-900"
            : "text-slate-400 hover:text-slate-600"
            }`}
        >
          Stock Movements
          {activeTab === "movements" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-full"></span>}
        </button>
      </div>

      <div className="p-6">
        {activeTab === "ingredients" ? (
          <IngredientsTable
            ingredients={ingredients}
            onEdit={(ing) => { setSelectedIngredient(ing); setShowAddModal(true); }}
            onAdjust={(ing) => { setSelectedIngredient(ing); setShowAdjustModal(true); }}
          />
        ) : (
          <MovementsTable movements={movements} />
        )}

        {paginationMeta.totalPages > 1 && (
          <div className="mt-8 border-t border-amber-50 pt-6">
            <Pagination
              currentPage={page}
              totalPages={paginationMeta.totalPages}
              onPageChange={handlePageChange}
              limit={limit}
              totalItems={paginationMeta?.totalItems || 0}
              onPageSizeChange={handleLimitChange}
            />
          </div>
        )}
      </div>

      {showAddModal && (
        <Modal
          onClose={() => { setShowAddModal(false); setSelectedIngredient(null); }}
          title={selectedIngredient ? "Edit Ingredient" : "Add New Ingredient"}
        >
          <IngredientForm
            initialData={selectedIngredient}
            onSubmit={selectedIngredient ? (data) => handleUpdateIngredient(selectedIngredient._id, data) : handleAddIngredient}
            onCancel={() => { setShowAddModal(false); setSelectedIngredient(null); }}
          />
        </Modal>
      )}

      {showAdjustModal && (
        <Modal
          onClose={() => { setShowAdjustModal(false); setSelectedIngredient(null); }}
          title="Adjust Stock Level"
        >
          <AdjustmentForm
            ingredient={selectedIngredient}
            onSubmit={handleAdjustStock}
            onCancel={() => { setShowAdjustModal(false); setSelectedIngredient(null); }}
          />
        </Modal>
      )}
    </div>
  );
}

function SummaryCard({ label, value, accent, icon }) {
  const accents = {
    blue: "bg-blue-500",
    rose: "bg-rose-500",
    emerald: "bg-emerald-500",
    slate: "bg-slate-500"
  };

  return (
    <div className="card-premium p-6 group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl">
          {icon}
        </div>
        <div className={`w-1.5 h-1.5 rounded-full ${accents[accent]}`}></div>
      </div>
      <div>
        <p className="type-label mb-1">{label}</p>
        <p className="type-metric">{value}</p>
      </div>
    </div>
  );
}

function IngredientsTable({ ingredients, onEdit, onAdjust }) {
  if (ingredients.length === 0) {
    return <EmptyState title="No items found" message="Add your first ingredient to start tracking inventory." icon="📦" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 type-label text-left">Ingredient</th>
            <th className="px-6 py-4 type-label text-left">Category</th>
            <th className="px-6 py-4 type-label text-right">Current Stock</th>
            <th className="px-6 py-4 type-label text-right">Asset Value</th>
            <th className="px-6 py-4 type-label text-center">Status</th>
            <th className="px-6 py-4 type-label text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium type-body">
          {ingredients.map((ing) => (
            <tr key={ing._id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <p className="type-cell-value">{ing.name}</p>
                <p className="type-caption text-slate-400 mt-0.5">ID: {ing._id.slice(-6).toUpperCase()}</p>
              </td>
              <td className="px-6 py-4">
                <span className="badge-standard bg-slate-100 text-slate-600 border border-slate-200">
                  {ing.category || 'General'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="type-cell-value">{ing.currentStock}</span>
                <span className="type-caption text-slate-400 ml-1.5">{ing.unit}</span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="type-cell-value">₹{(ing.currentStock * ing.costPerUnit).toLocaleString()}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-center">
                  {ing.currentStock <= ing.minStockLevel ? (
                    <span className="badge-standard bg-rose-50 text-rose-600 border border-rose-100">Low Stock</span>
                  ) : (
                    <span className="badge-standard bg-emerald-50 text-emerald-600 border border-emerald-100">Optimal</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onAdjust(ing)}
                    className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
                    title="Adjust Stock"
                  >
                    <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </button>
                  <button
                    onClick={() => onEdit(ing)}
                    className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                    title="Edit Details"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MovementsTable({ movements }) {
  if (movements.length === 0) {
    return <EmptyState title="No movements tracked" message="Ingredient stock changes will appear here." icon="🔄" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 type-label">Date & Time</th>
            <th className="px-6 py-4 type-label">Ingredient</th>
            <th className="px-6 py-4 type-label">Type</th>
            <th className="px-6 py-4 type-label text-right">Quantity</th>
            <th className="px-6 py-4 type-label">Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
          {movements.map((m) => (
            <tr key={m._id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <span className="type-caption font-bold text-slate-600">{new Date(m.createdAt).toLocaleString()}</span>
              </td>
              <td className="px-6 py-4">
                <span className="type-cell-value">{m.ingredientId?.name || 'Deleted Ingredient'}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex">
                  <span className={`badge-standard border ${m.action === 'ADD' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                    {m.action === 'ADD' ? 'Stock In' : 'Stock Out'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <span className={`type-cell-value ${m.action === 'ADD' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {m.action === 'ADD' ? '+' : '-'}{m.quantity}
                </span>
                <span className="type-caption text-slate-400 ml-1.5">{m.ingredientId?.unit}</span>
              </td>
              <td className="px-6 py-4">
                <span className="type-caption text-slate-500 tracking-tight">{m.reason}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IngredientForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(initialData || {
    name: "",
    category: "General",
    currentStock: "",
    minStockLevel: "",
    unit: "kg",
    costPerUnit: "",
    supplier: ""
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block type-label mb-2 ml-1">Ingredient Name</label>
          <input
            type="text"
            className="input-standard w-full"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Basmati Rice"
            required
          />
        </div>
        <div>
          <label className="block type-label mb-2 ml-1">Category</label>
          <input
            type="text"
            className="input-standard w-full"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g. Grains"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div>
          <label className="block type-label mb-2 ml-1">Unit</label>
          <select
            className="input-standard w-full appearance-none"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          >
            <option value="kg">kg</option>
            <option value="gram">gram</option>
            <option value="liter">liter</option>
            <option value="ml">ml</option>
            <option value="unit">unit</option>
            <option value="pack">pack</option>
          </select>
        </div>
        <div>
          <label className="block type-label mb-2 ml-1">Cost / Unit (₹)</label>
          <input
            type="number"
            className="input-standard w-full font-semibold text-emerald-600"
            value={formData.costPerUnit}
            onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block type-label mb-2 ml-1">Min. Stock</label>
          <input
            type="number"
            className="input-standard w-full font-semibold text-amber-600"
            value={formData.minStockLevel}
            onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
            placeholder="10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!initialData && (
          <div>
            <label className="block type-label mb-2 ml-1">Initial Stock</label>
            <input
              type="number"
              className="input-standard w-full font-semibold text-slate-900"
              value={formData.currentStock}
              onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
              placeholder="0"
            />
          </div>
        )}
        <div className={initialData ? "col-span-2" : ""}>
          <label className="block type-label mb-2 ml-1">Supplier / Vendor</label>
          <input
            type="text"
            className="input-standard w-full"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            placeholder="e.g. Fresh Farms"
          />
        </div>
      </div>

      <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit(formData)}
          className="btn-primary"
        >
          {initialData ? "Save Changes" : "Confirm Addition"}
        </button>
      </div>
    </div>
  );
}

function AdjustmentForm({ ingredient, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    action: "ADD",
    quantity: "",
    reason: ""
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <p className="type-label mb-1">Adjusting Stock For</p>
        <p className="type-metric">{ingredient?.name}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="type-body-sm font-bold text-slate-600">{ingredient?.currentStock} {ingredient?.unit} currently available</span>
        </div>
      </div>

      <div>
        <label className="block type-label mb-2 ml-1">Select Action</label>
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setFormData({ ...formData, action: "ADD" })}
            className={`flex-1 py-3 text-xs font-semibold rounded-lg transition-all ${formData.action === "ADD" ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Restock
          </button>
          <button
            onClick={() => setFormData({ ...formData, action: "DEDUCT" })}
            className={`flex-1 py-3 text-xs font-semibold rounded-lg transition-all ${formData.action === "DEDUCT" ? "bg-white text-rose-600 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block type-label mb-2 ml-1">Quantity ({ingredient?.unit})</label>
          <input
            type="number"
            className="input-standard w-full type-metric"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            autoFocus
          />
        </div>
        <div>
          <label className="block type-label mb-2 ml-1">Reason</label>
          <select
            className="input-standard w-full appearance-none"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
          >
            <option value="">Select Reason</option>
            <option value="PURCHASE">Regular Purchase</option>
            <option value="WASTAGE">Operational Waste</option>
            <option value="CORRECTION">Inventory Audit</option>
            <option value="MANUAL_ADJUSTMENT">Manual Override</option>
            <option value="ORDER">Kitchen Order Sync</option>
          </select>
        </div>
      </div>

      <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit(formData)}
          className="btn-primary"
        >
          Apply Adjustment
        </button>
      </div>
    </div>
  );
}
