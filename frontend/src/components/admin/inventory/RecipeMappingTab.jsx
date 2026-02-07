import { useState, useEffect } from "react";
import { getAllDishes, updateDish } from "../../../api/dishApi";
import { useToast } from "../../common/Toast/ToastContext";
import Loading from "../../common/Loading";
import EmptyState from "../../common/EmptyState";

export default function RecipeMappingTab({ ingredients }) {
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedDishId, setExpandedDishId] = useState(null);
    const [editingRecipe, setEditingRecipe] = useState(null); // { [dishId]: [...recipe] }
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        fetchDishes();
    }, []);

    const fetchDishes = async () => {
        setLoading(true);
        try {
            const res = await getAllDishes();
            setDishes(res.data.data.dishes);
        } catch (error) {
            showError("Failed to fetch dishes");
        } finally {
            setLoading(false);
        }
    };

    const handleExpand = (dish) => {
        const isCurrentlyOpen = expandedDishId === dish._id;

        if (isCurrentlyOpen) {
            setExpandedDishId(null);
            setEditingRecipe(null);
        } else {
            setExpandedDishId(dish._id);
            setEditingRecipe(dish.recipe?.map(r => ({
                ingredientId: r.ingredientId?._id || r.ingredientId,
                quantity: r.quantity
            })) || []);
        }
    };

    const handleAddIngredientRow = () => {
        setEditingRecipe([...editingRecipe, { ingredientId: "", quantity: "" }]);
    };

    const handleRemoveIngredientRow = (index) => {
        const newRecipe = [...editingRecipe];
        newRecipe.splice(index, 1);
        setEditingRecipe(newRecipe);
    };

    const handleRecipeChange = (index, field, value) => {
        const newRecipe = [...editingRecipe];
        newRecipe[index][field] = value;
        setEditingRecipe(newRecipe);
    };

    const handleSaveRecipe = async (dishId) => {
        try {
            // Filter out incomplete rows
            const cleanRecipe = editingRecipe.filter(r => r.ingredientId && r.quantity > 0);

            await updateDish(dishId, { recipe: cleanRecipe });
            showSuccess("Recipe updated successfully");

            // Update local state
            setDishes(prev => prev.map(d => d._id === dishId ? { ...d, recipe: cleanRecipe } : d));
            setExpandedDishId(null);
            setEditingRecipe(null);
        } catch (error) {
            showError("Failed to update recipe");
        }
    };

    const getIngredientName = (id) => {
        const ing = ingredients.find(i => i._id === id);
        return ing ? ing.name : 'Unknown Ingredient';
    };
    const getIngredientUnit = (id) => {
        const ing = ingredients.find(i => i._id === id);
        return ing ? ing.unit : '';
    };

    // Calculate Dish Cost based on Recipe
    const calculateCost = (recipe) => {
        if (!recipe) return 0;
        return recipe.reduce((total, item) => {
            const ing = ingredients.find(i => i._id === (item.ingredientId?._id || item.ingredientId));
            if (ing) {
                return total + (ing.costPerUnit * item.quantity);
            }
            return total;
        }, 0);
    };

    if (loading) return <Loading message="Loading dishes..." />;

    if (dishes.length === 0) {
        return <EmptyState title="No dishes found" message="Create menu items first to map recipes." icon="🍽️" />;
    }

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                    <h4 className="text-sm font-bold text-blue-900">Automation Note</h4>
                    <p className="text-xs text-blue-700 mt-1">
                        Inventory is deducted automatically when a bill is generated for a dish.
                        Ensure specific quantities (e.g., 0.2 kg) are mapped correctly.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {dishes.map(dish => (
                    <div key={dish._id} className={`bg-white border transition-all rounded-xl overflow-hidden ${expandedDishId === dish._id ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => handleExpand(dish)}
                        >
                            <div>
                                <h3 className="font-bold text-slate-800">{dish.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-500">{dish.category}</span>
                                    {dish.recipe && dish.recipe.length > 0 ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            {dish.recipe.length} Ingredients Mapped
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                            No Recipe
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-semibold text-slate-700">Cost: ₹{calculateCost(dish.recipe).toFixed(2)}</span>
                                <svg className={`w-5 h-5 text-slate-400 transform transition-transform ${expandedDishId === dish._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>

                        {expandedDishId === dish._id && (
                            <div className="border-t border-slate-100 bg-slate-50 p-4 animate-fade-in">
                                <div className="space-y-3">
                                    {editingRecipe.map((row, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <select
                                                    className="input-tiny w-full text-xs"
                                                    value={row.ingredientId}
                                                    onChange={(e) => handleRecipeChange(idx, 'ingredientId', e.target.value)}
                                                >
                                                    <option value="">Select Ingredient</option>
                                                    {ingredients.map(ing => (
                                                        <option key={ing._id} value={ing._id}>{ing.name} ({ing.unit})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    className="input-tiny w-full text-xs"
                                                    placeholder="Qty"
                                                    value={row.quantity}
                                                    onChange={(e) => handleRecipeChange(idx, 'quantity', parseFloat(e.target.value))}
                                                    step="any"
                                                    min="0"
                                                />
                                            </div>
                                            <div className="w-16 flex items-center text-xs text-slate-500">
                                                {row.ingredientId ? getIngredientUnit(row.ingredientId) : '-'}
                                            </div>
                                            <button
                                                onClick={() => handleRemoveIngredientRow(idx)}
                                                className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 flex justify-between items-center">
                                    <button
                                        onClick={handleAddIngredientRow}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        Add Ingredient
                                    </button>
                                    <button
                                        onClick={() => handleSaveRecipe(dish._id)}
                                        className="btn-primary py-1.5 px-4 text-xs"
                                    >
                                        Save Recipe
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
