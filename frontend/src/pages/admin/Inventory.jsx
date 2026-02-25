import { useState, useEffect, useCallback } from "react";
import { getIngredients, getStockMovements, createIngredient, updateIngredient, adjustStock, getVendors } from "../../api/inventoryApi";
import Loading from "../../components/common/Loading";
import { useToast } from "../../components/common/Toast/ToastContext";
import IngredientMasterTab from "../../components/admin/inventory/IngredientMasterTab";
import StockMovementsTab from "../../components/admin/inventory/StockMovementsTab";
import RecipeMappingTab from "../../components/admin/inventory/RecipeMappingTab";

export default function Inventory() {
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
  const [vendors, setVendors] = useState([]);

  // Simplified fetch without pagination for now as per previous logic, or restore pagination if needed.
  // The separated components might handle pagination internally or we pass props.
  // For now, fetching all (or default limit) to keep it working.

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Parallel fetch for overview
      const [ingRes, movRes, venRes] = await Promise.all([
        getIngredients({ limit: 100 }), // Fetching more for master list
        getStockMovements({ limit: 20 }),
        getVendors()
      ]);

      setIngredients(ingRes.data.data.ingredients);
      setSummary(ingRes.data.data.summary);
      setMovements(movRes.data.data.movements);
      setVendors(venRes.data.data);

    } catch (error) {
      showError("Failed to load inventory data");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddIngredient = async (formData) => {
    try {
      await createIngredient(formData);
      showSuccess("Ingredient added successfully");
      fetchData(true);
      return true;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to add ingredient");
      return false;
    }
  };

  const handleUpdateIngredient = async (id, formData) => {
    try {
      await updateIngredient(id, formData);
      showSuccess("Ingredient updated successfully");
      fetchData(true);
      return true;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update ingredient");
      return false;
    }
  };

  const handleAdjustStock = async (formData) => {
    try {
      // formData contains { action, quantity, reason, ingredientId? }
      // The AdjustmentForm in IngredientMasterTab passes correct data structure?
      // Wait, AdjustmentForm passes {action, quantity, reason}. We need ingredientId.
      // The old handleAdjustStock took ingredientId from state. 
      // I need to ensure IngredientMasterTab passes the ID or handles it.
      // In my new IngredientMasterTab, I passed `selectedIngredient` to the form, but `onSubmit` in IngredientMasterTab calls `onAdjust(data)`.
      // I should update IngredientMasterTab to pass relevant ID or handle it here.
      // Actually, my IngredientMasterTab implementation calls `onAdjust(data)` where data is from form.
      // I need to know WHICH ingredient. 
      // Let's modify IngredientMasterTab to include IDs or pass them.

      // RE-CHECK IngredientMasterTab:
      // const handleAdjust = (ing) => { setSelectedIngredient(ing); ... }
      // <AdjustmentForm ingredient={selectedIngredient} onSubmit={async (data) => { await onAdjust({...data, ingredientId: selectedIngredient._id}); ... }} />
      // Yes, I need to do that in the PARENT (here) or CHILD.
      // Let's assume CHILD sends { ...data, ingredientId } or I pass a closure?
      // In IngredientMasterTab I wrote: `const success = await onAdjust(data);`
      // It DOES NOT pass the ID. This is a BUG in my previous step.
      // I must fix `IngredientMasterTab.jsx` or handle it in `Inventory.jsx` if I can access state.
      // But `Inventory.jsx` doesn't know which ingredient is selected in `IngredientMasterTab`.
      // SO: I will update `Inventory.jsx` to providing a wrapper, BUT `IngredientMasterTab` manages the modal.
      // Ah, `IngredientMasterTab` HAS the state `selectedIngredient`.
      // So `IngredientMasterTab` should call `onAdjust(selectedIngredient._id, data)`.

      // Let's Fix `IngredientMasterTab` first? Or overwrite it?
      // I'll overwrite `Inventory.jsx` assuming `IngredientMasterTab` passes (id, data) or (dataWithId).
      // I will update `IngredientMasterTab` in the next step to be sure.

      // Placeholder for now
      return false;
    } catch (error) {
      return false;
    }
  };

  // Re-writing handleAdjust to match what I WILL fix in the child
  const handleStockAdjustmentWrapper = async (id, data) => {
    try {
      await adjustStock(id, data);
      showSuccess("Stock adjusted successfully");
      fetchData(true);
      return true;
    } catch (error) {
      showError(error.response?.data?.message || "Failed to adjust stock");
      return false;
    }
  };


  if (loading && ingredients.length === 0) {
    return <Loading message="Loading inventory..." />;
  }

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="type-h1">Inventory & Pricebook</h1>
          <p className="type-secondary mt-1">Manage ingredients, recipes, and stock levels</p>
        </div>
        {/* Actions or Breadcrumbs could go here */}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Stock Value" value={`₹${summary.totalStockValue.toLocaleString()}`} accent="blue" icon="💰" />
        <SummaryCard label="Low Stock Alerts" value={summary.lowStockCount} accent="rose" icon="⚠️" />
        <SummaryCard label="Top Consumed" value={summary.topConsumed || "N/A"} accent="emerald" icon="📉" />
        <SummaryCard label="Dead Stock" value={summary.deadStockCount} accent="slate" icon="🧊" />
      </div>

      <div className="bg-slate-100 p-1 rounded-xl inline-flex">
        <TabButton active={activeTab === "ingredients"} onClick={() => setActiveTab("ingredients")}>Ingredient Master</TabButton>
        <TabButton active={activeTab === "recipes"} onClick={() => setActiveTab("recipes")}>Recipe Mapping</TabButton>
        <TabButton active={activeTab === "movements"} onClick={() => setActiveTab("movements")}>Stock Movements</TabButton>
      </div>

      <div className="min-h-[400px]">
        {activeTab === "ingredients" && (
          <IngredientMasterTab
            ingredients={ingredients}
            loading={loading}
            onAdd={handleAddIngredient}
            onUpdate={handleUpdateIngredient}
            onAdjust={handleStockAdjustmentWrapper}
            vendors={vendors}
          />
        )}
        {activeTab === "recipes" && (
          <RecipeMappingTab
            ingredients={ingredients}
          />
        )}
        {activeTab === "movements" && (
          <StockMovementsTab
            movements={movements}
          />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent, icon }) {
  const bgs = {
    blue: "bg-blue-50 text-blue-600",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-amber-50 text-amber-600",
    slate: "bg-slate-50 text-slate-600"
  }

  return (
    <div className="bg-white py-3 px-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className="flex items-start gap-3 relative z-10">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${bgs[accent]}`}>
          {icon}
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-0.5">{label}</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${active
        ? "bg-white text-slate-900 shadow-sm"
        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
        }`}
    >
      {children}
    </button>
  )
}
