import { useState } from "react";
import EmptyState from "../../common/EmptyState";
import Modal from "../../common/Modal";

export default function IngredientMasterTab({ ingredients, onAdd, onUpdate, onAdjust, loading }) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState(null);

    const handleEdit = (ing) => {
        setSelectedIngredient(ing);
        setShowAddModal(true);
    };

    const handleAdjust = (ing) => {
        setSelectedIngredient(ing);
        setShowAdjustModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setShowAdjustModal(false);
        setSelectedIngredient(null);
    };

    if (!loading && ingredients.length === 0) {
        return (
            <>
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => { setSelectedIngredient(null); setShowAddModal(true); }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Add Ingredient
                    </button>
                </div>
                <EmptyState title="No items found" message="Add your first ingredient to start tracking inventory." icon="📦" />
                {showAddModal && (
                    <Modal
                        onClose={handleCloseModal}
                        title={selectedIngredient ? "Edit Ingredient" : "Add New Ingredient"}
                    >
                        <IngredientForm
                            initialData={selectedIngredient}
                            onSubmit={async (data) => {
                                const success = selectedIngredient ? await onUpdate(selectedIngredient._id, data) : await onAdd(data);
                                if (success) handleCloseModal();
                            }}
                            onCancel={handleCloseModal}
                        />
                    </Modal>
                )}
            </>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white py-2.5 px-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Ingredient Master List</h3>
                <button
                    onClick={() => { setSelectedIngredient(null); setShowAddModal(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Add Ingredient
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="px-4 py-3">Ingredient</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3 text-right">Current Stock</th>
                                <th className="px-4 py-3 text-right">Asset Value</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-sm text-slate-700">
                            {ingredients.map((ing) => (
                                <tr key={ing._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-slate-900">{ing.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">ID: {ing._id.slice(-6).toUpperCase()}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                            {ing.category || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="font-bold text-slate-900">{ing.currentStock}</span>
                                        <span className="text-[10px] text-slate-400 ml-1 font-medium">{ing.unit}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="font-bold text-slate-700">₹{(ing.currentStock * ing.costPerUnit).toLocaleString()}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center">
                                            {ing.currentStock <= ing.minStockLevel ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">LOW STOCK</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">OPTIMAL</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleAdjust(ing)}
                                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                title="Adjust Stock"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleEdit(ing)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Edit Details"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddModal && (
                <Modal
                    onClose={handleCloseModal}
                    title={selectedIngredient ? "Edit Ingredient" : "Add New Ingredient"}
                >
                    <IngredientForm
                        initialData={selectedIngredient}
                        onSubmit={async (data) => {
                            const success = selectedIngredient ? await onUpdate(selectedIngredient._id, data) : await onAdd(data);
                            if (success) handleCloseModal();
                        }}
                        onCancel={handleCloseModal}
                    />
                </Modal>
            )}

            {showAdjustModal && (
                <Modal
                    onClose={handleCloseModal}
                    title="Adjust Stock Level"
                >
                    <AdjustmentForm
                        ingredient={selectedIngredient}
                        onSubmit={async (data) => {
                            // Pass ID and Data
                            const success = await onAdjust(selectedIngredient._id, data);
                            if (success) handleCloseModal();
                        }}
                        onCancel={handleCloseModal}
                    />
                </Modal>
            )}
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

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Ingredient Name</label>
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Category</label>
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Unit</label>
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Cost / Unit (₹)</label>
                    <input
                        type="number"
                        className="input-standard w-full font-semibold text-emerald-600"
                        value={formData.costPerUnit}
                        onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                        placeholder="0.00"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Min. Stock</label>
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
                        <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Initial Stock</label>
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Supplier / Vendor</label>
                    <input
                        type="text"
                        className="input-standard w-full"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        placeholder="e.g. Fresh Farms"
                    />
                </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn-primary"
                >
                    {initialData ? "Save Changes" : "Confirm Addition"}
                </button>
            </div>
        </form>
    );
}

function AdjustmentForm({ ingredient, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        action: "ADD",
        quantity: "",
        reason: ""
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase">Adjusting Stock For</p>
                    <p className="text-lg font-bold text-slate-800">{ingredient?.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{ingredient?.currentStock} <span className="text-sm font-medium text-slate-500">{ingredient?.unit}</span></p>
                    <p className="text-xs text-emerald-600 font-medium">+ Currently Available</p>
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 ml-1">Select Action</label>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, action: "ADD" })}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${formData.action === "ADD" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Restock ( Add + )
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, action: "DEDUCT" })}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${formData.action === "DEDUCT" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Correction ( Remove - )
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Quantity ({ingredient?.unit})</label>
                    <input
                        type="number"
                        className="input-standard w-full text-lg font-bold"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        autoFocus
                        required
                        min="0"
                        step="any"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Reason</label>
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

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className={`btn-primary ${formData.action === 'DEDUCT' ? '!bg-rose-600 hover:!bg-rose-700' : ''}`}
                >
                    {formData.action === 'ADD' ? 'Confirm Restock' : 'Confirm Removal'}
                </button>
            </div>
        </form>
    );
}
