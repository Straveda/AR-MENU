import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext';
import { useTenant } from '../../context/TenantProvider';
import { useToast } from '../common/Toast/ToastContext';

export default function UpsellCard({ recommendation }) {
    const navigate = useNavigate();
    const { addItem } = useOrder();
    const { slug } = useTenant();
    const { showSuccess } = useToast();

    const { recommendedDish, message, discountPercentage, ruleId } = recommendation;
    const dish = recommendedDish;

    if (!dish) return null;

    const finalPrice = discountPercentage > 0
        ? Math.round(dish.price * (1 - discountPercentage / 100))
        : dish.price;

    const handleAdd = (e) => {
        e.stopPropagation();
        addItem(dish, 1, {
            upsellRuleId: ruleId,
            source: 'UPSELL',
            originalPrice: dish.price,
        });
        showSuccess(`Added 1 x ${dish.name} to order!`);
    };

    return (
        <div className="w-full sm:w-64 bg-white rounded-2xl border border-slate-100 overflow-hidden shrink-0 hover:border-amber-400 transition-all shadow-md group flex sm:block gap-3 p-3 sm:p-0">
            {/* Image Container */}
            <div
                className="h-20 w-20 sm:h-32 sm:w-full bg-slate-50 cursor-pointer overflow-hidden relative rounded-lg sm:rounded-none shrink-0"
                onClick={() => navigate(`/r/${slug}/dish/${dish._id}`)}
            >
                {dish.imageUrl ? (
                    <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🍽️</div>
                )}
                {discountPercentage > 0 && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                        {discountPercentage}% OFF
                    </div>
                )}
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col justify-between sm:p-3">
                <div>
                    <h4
                        className="text-sm font-black text-slate-900 truncate cursor-pointer hover:text-amber-600 transition-colors"
                        onClick={() => navigate(`/r/${slug}/dish/${dish._id}`)}
                    >
                        {dish.name}
                    </h4>
                    {message && (
                        <p className="text-[10px] text-slate-500 italic leading-tight mt-1 line-clamp-2">
                            "{message}"
                        </p>
                    )}
                </div>

                <div className="mt-2 flex items-end justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-amber-600">₹{finalPrice}</span>
                        {discountPercentage > 0 && (
                            <span className="text-[10px] text-slate-400 line-through">₹{dish.price}</span>
                        )}
                    </div>
                    <button
                        onClick={handleAdd}
                        className="bg-amber-100 hover:bg-amber-500 hover:text-white text-amber-600 p-1.5 rounded-lg transition-all shadow-sm active:scale-95"
                        title="Add to Order"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
