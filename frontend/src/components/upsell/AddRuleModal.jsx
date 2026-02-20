import { useState, useEffect } from 'react';
import upsellApi from '../../api/upsellApi';

export default function AddRuleModal({ isOpen, onClose, onSuccess, editRule = null }) {
    const [loading, setLoading] = useState(false);
    const [dishes, setDishes] = useState([]);
    const [formData, setFormData] = useState({
        ruleType: 'FREQUENT_PAIR',
        ruleName: '',
        mainDishId: '',
        secondaryDishId: '',
        minMainOrders: '',
        maxSecondaryOrders: '',
        minPairPercentage: '',
        discountPercentage: 0,
        cartMinValue: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchDishes();
            if (editRule) {
                setFormData({
                    ruleType: editRule.ruleType,
                    ruleName: editRule.ruleName,
                    mainDishId: editRule.mainDishId?._id || '',
                    secondaryDishId: editRule.secondaryDishId?._id || '',
                    minMainOrders: editRule.minMainOrders || '',
                    maxSecondaryOrders: editRule.maxSecondaryOrders || '',
                    minPairPercentage: editRule.minPairPercentage || '',
                    discountPercentage: editRule.discountPercentage || 0,
                    cartMinValue: editRule.cartMinValue || '',
                });
            }
        }
    }, [isOpen, editRule]);

    const fetchDishes = async () => {
        try {
            const res = await upsellApi.getDishes();
            if (res.success) {
                setDishes(res.data);
            }
        } catch (error) {
            console.error('Error fetching dishes:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                minMainOrders: formData.minMainOrders ? Number(formData.minMainOrders) : null,
                maxSecondaryOrders: formData.maxSecondaryOrders ? Number(formData.maxSecondaryOrders) : null,
                minPairPercentage: formData.minPairPercentage ? Number(formData.minPairPercentage) : null,
                discountPercentage: Number(formData.discountPercentage),
                cartMinValue: formData.cartMinValue ? Number(formData.cartMinValue) : null,
            };

            const res = editRule
                ? await upsellApi.updateRule(editRule._id, payload)
                : await upsellApi.createRule(payload);

            if (res.success) {
                onSuccess();
                handleClose();
            }
        } catch (error) {
            console.error('Error saving rule:', error);
            alert('Failed to save rule');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            ruleType: 'FREQUENT_PAIR',
            ruleName: '',
            mainDishId: '',
            secondaryDishId: '',
            minMainOrders: '',
            maxSecondaryOrders: '',
            minPairPercentage: '',
            discountPercentage: 0,
            cartMinValue: '',
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">
                        {editRule ? 'Edit Rule' : 'Add New Rule'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Rule Type */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Rule Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.ruleType}
                            onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                            required
                        >
                            <option value="LOW_ATTACHMENT">Low Attachment Pairing</option>
                            <option value="FREQUENT_PAIR">Frequent Pairing</option>
                            <option value="COMBO_DISCOUNT">Combo Discount</option>
                            <option value="CART_THRESHOLD">Cart Threshold Upsell</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            {formData.ruleType === 'LOW_ATTACHMENT' && 'Recommend items rarely ordered together'}
                            {formData.ruleType === 'FREQUENT_PAIR' && 'Recommend frequently paired items'}
                            {formData.ruleType === 'COMBO_DISCOUNT' && 'Offer discount on item combinations'}
                            {formData.ruleType === 'CART_THRESHOLD' && 'Upsell when cart value exceeds threshold'}
                        </p>
                    </div>

                    {/* Rule Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Rule Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.ruleName}
                            onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                            placeholder="e.g., Burger + Fries Combo"
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                            required
                        />
                    </div>

                    {/* Conditional Fields Based on Rule Type */}
                    {(formData.ruleType === 'LOW_ATTACHMENT' || formData.ruleType === 'FREQUENT_PAIR' || formData.ruleType === 'COMBO_DISCOUNT') && (
                        <>
                            {/* Main Dish */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Main Dish <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.mainDishId}
                                    onChange={(e) => setFormData({ ...formData, mainDishId: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                    required
                                >
                                    <option value="">Select a dish</option>
                                    {dishes.map((dish) => (
                                        <option key={dish._id} value={dish._id}>
                                            {dish.name} - ₹{dish.price}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Secondary Dish */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Recommended Dish <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.secondaryDishId}
                                    onChange={(e) => setFormData({ ...formData, secondaryDishId: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                    required
                                >
                                    <option value="">Select a dish</option>
                                    {dishes
                                        .filter((dish) => dish._id !== formData.mainDishId)
                                        .map((dish) => (
                                            <option key={dish._id} value={dish._id}>
                                                {dish.name} - ₹{dish.price}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Thresholds for LOW_ATTACHMENT */}
                    {formData.ruleType === 'LOW_ATTACHMENT' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Min Main Orders
                                </label>
                                <input
                                    type="number"
                                    value={formData.minMainOrders}
                                    onChange={(e) => setFormData({ ...formData, minMainOrders: e.target.value })}
                                    placeholder="100"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Max Secondary Orders
                                </label>
                                <input
                                    type="number"
                                    value={formData.maxSecondaryOrders}
                                    onChange={(e) => setFormData({ ...formData, maxSecondaryOrders: e.target.value })}
                                    placeholder="10"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* Min Pair Percentage for FREQUENT_PAIR */}
                    {formData.ruleType === 'FREQUENT_PAIR' && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Min Pair Percentage (%)
                            </label>
                            <input
                                type="number"
                                value={formData.minPairPercentage}
                                onChange={(e) => setFormData({ ...formData, minPairPercentage: e.target.value })}
                                placeholder="50"
                                min="0"
                                max="100"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Minimum percentage of times dishes are ordered together
                            </p>
                        </div>
                    )}

                    {/* Cart Min Value for CART_THRESHOLD */}
                    {formData.ruleType === 'CART_THRESHOLD' && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Cart Minimum Value (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.cartMinValue}
                                    onChange={(e) => setFormData({ ...formData, cartMinValue: e.target.value })}
                                    placeholder="500"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Recommended Dish <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.secondaryDishId}
                                    onChange={(e) => setFormData({ ...formData, secondaryDishId: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                    required
                                >
                                    <option value="">Select a dish</option>
                                    {dishes.map((dish) => (
                                        <option key={dish._id} value={dish._id}>
                                            {dish.name} - ₹{dish.price}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Discount Percentage */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Discount Percentage (%)
                        </label>
                        <input
                            type="number"
                            value={formData.discountPercentage}
                            onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                            placeholder="0"
                            min="0"
                            max="100"
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Optional discount to offer with this recommendation
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : editRule ? 'Update Rule' : 'Create Rule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
