// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useOrder } from "../../context/OrderContext";
// import { useTenant } from "../../context/TenantProvider";

// export default function OrderCart() {
//     const navigate = useNavigate();
//     const { slug } = useTenant();
//     const { items, removeItem, updateQuantity, placeOrder, clearOrder } = useOrder();
//     const [tableInput, setTableInput] = useState("");
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");

//     const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//     const tax = subtotal * 0.05;
//     const total = subtotal;

//     const handlePlaceOrder = async () => {
//         if (!tableInput.trim()) {
//             setError("Please enter your table number");
//             return;
//         }

//         setLoading(true);
//         setError("");

//         try {
//             const result = await placeOrder(tableInput);
//             navigate(`/r/${slug}/track-order?code=${result.orderCode}`);
//         } catch (err) {
//             console.error("Order failed:", err);

//             if (err.response?.status === 423) {
//                  setError("We are currently not accepting orders. Please ask the staff.");
//             } else if (err.response?.status === 400) {
//                  setError(err.response.data.message || "Invalid order. Please check your cart.");
//             } else {
//                  setError(err.message || "Failed to place order. Please try again.");
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     if (items.length === 0) {
//         return (
//             <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
//                 <div className="card-premium p-8 text-center max-w-sm w-full border-amber-100/50">
//                     <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
//                         <span className="text-4xl">🛒</span>
//                     </div>
//                     <h2 className="type-h2 text-gray-800 mb-2">Your Cart is Empty</h2>
//                     <p className="type-secondary mb-6">Looks like you haven't added any delicious dishes yet.</p>
//                     <button
//                         onClick={() => navigate(`/r/${slug}/menu`)}
//                         className="w-full bg-amber-600 hover:bg-amber-700 type-btn text-white py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
//                     >
//                         Browse Menu
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-amber-50 pb-24">
//             {}
//             <div className="bg-white border-b border-amber-200 sticky top-0 z-10 shadow-sm">
//                 <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
//                     <button
//                         onClick={() => navigate(-1)}
//                         className="p-2 -ml-2 text-gray-600 hover:text-amber-600 transition-colors"
//                     >
//                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                         </svg>
//                     </button>
//                     <h1 className="type-h1 text-gray-800">Your Order</h1>
//                     <div className="w-8"></div> {}
//                 </div>
//             </div>

//             <div className="max-w-3xl mx-auto px-4 py-6">
//                 {}
//                 <div className="space-y-4 mb-8">
//                     {items.map((item) => (
//                         <div key={item.dishId} className="card-premium p-4 border-amber-100/50 flex gap-4 animate-fade-in">
//                             {}
//                             <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
//                                 {item.image ? (
//                                     <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
//                                 ) : (
//                                     <div className="w-full h-full flex items-center justify-center text-amber-300 text-2xl">🍽️</div>
//                                 )}
//                             </div>

//                             {}
//                             <div className="flex-1 flex flex-col justify-between">
//                                 <div className="flex justify-between items-start">
//                                     <h3 className="type-h3 text-gray-800 line-clamp-2">{item.name}</h3>
//                                     <button
//                                         onClick={() => removeItem(item.dishId)}
//                                         className="text-gray-400 hover:text-red-500 transition-colors p-1"
//                                     >
//                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                                         </svg>
//                                     </button>
//                                 </div>

//                                 <div className="flex justify-between items-end mt-2">
//                                     <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
//                                         <button
//                                             onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
//                                             className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-lg transition-colors"
//                                         >
//                                             -
//                                         </button>
//                                         <span className="w-8 text-center type-body text-gray-800 text-sm">{item.quantity}</span>
//                                         <button
//                                             onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
//                                             className="w-8 h-8 flex items-center justify-center text-amber-600 hover:bg-amber-100 rounded-r-lg transition-colors"
//                                         >
//                                             +
//                                         </button>
//                                     </div>
//                                     <span className="type-metric text-amber-600">₹{item.price * item.quantity}</span>
//                                 </div>
//                             </div>
//                         </div>
//                     ))}
//                 </div>

//                 {}
//                 <div className="card-premium p-6 border-amber-100/50 mb-8">
//                     <h3 className="type-label mb-4 opacity-70">Bill Summary</h3>
//                     <div className="space-y-2 type-body-sm">
//                         <div className="flex justify-between type-secondary">
//                             <span>Item Total</span>
//                             <span>₹{subtotal}</span>
//                         </div>
//                         {}
//                         <div className="border-t border-dashed border-gray-200 my-3 pt-3 flex justify-between items-center">
//                             <span className="type-h3 text-gray-800">To Pay</span>
//                             <span className="type-metric text-amber-600">₹{total}</span>
//                         </div>
//                     </div>
//                 </div>

//                 {}
//                 <div className="card-premium p-6 border-amber-100/50 mb-8">
//                     <label className="block type-label mb-2">
//                         Table Number <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                         type="number"
//                         value={tableInput}
//                         onChange={(e) => setTableInput(e.target.value)}
//                         placeholder="Enter your table number (e.g. 5)"
//                         className="w-full px-4 py-3 text-lg border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
//                     />
//                     {error && (
//                         <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                             </svg>
//                             {error}
//                         </p>
//                     )}
//                 </div>
//             </div>

//             {}
//             <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
//                 <div className="max-w-3xl mx-auto flex gap-4 items-center">
//                     <div className="flex-1">
//                         <span className="block type-label">Total</span>
//                         <span className="block type-metric text-gray-900">₹{total}</span>
//                     </div>
//                     <button
//                         onClick={handlePlaceOrder}
//                         disabled={loading}
//                         className={`flex-1 bg-green-600 hover:bg-green-700 type-btn text-white py-3.5 px-6 rounded-xl shadow-lg shadow-green-200 transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2 ${loading ? 'opacity-75 cursor-wait' : ''}`}
//                     >
//                         {loading ? (
//                             <>
//                                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
//                                 Placing Order...
//                             </>
//                         ) : (
//                             <>
//                                 <span>Place Order</span>
//                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
//                                 </svg>
//                             </>
//                         )}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }

// ----------------------------- Dark below -----------------------------

// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useOrder } from "../../context/OrderContext";
// import { useTenant } from "../../context/TenantProvider";

// export default function OrderCart() {
//     const navigate = useNavigate();
//     const { slug } = useTenant();
//     const { items, removeItem, updateQuantity, placeOrder, clearOrder } = useOrder();
//     const [tableInput, setTableInput] = useState("");
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");

//     const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//     const tax = subtotal * 0.05;
//     const total = subtotal;

//     const handlePlaceOrder = async () => {
//         if (!tableInput.trim()) {
//             setError("Please enter your table number");
//             return;
//         }

//         setLoading(true);
//         setError("");

//         try {
//             const result = await placeOrder(tableInput);
//             navigate(`/r/${slug}/track-order?code=${result.orderCode}`);
//         } catch (err) {
//             console.error("Order failed:", err);

//             if (err.response?.status === 423) {
//                 setError("We are currently not accepting orders. Please ask the staff.");
//             } else if (err.response?.status === 400) {
//                 setError(err.response.data.message || "Invalid order. Please check your cart.");
//             } else {
//                 setError(err.message || "Failed to place order. Please try again.");
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     if (items.length === 0) {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
//                 <div className="bg-slate-800/40 backdrop-blur-sm p-8 text-center max-w-sm w-full border border-slate-700/50 rounded-2xl shadow-2xl">
//                     <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
//                         <span className="text-4xl">🛒</span>
//                     </div>
//                     <h2 className="text-2xl font-bold text-slate-100 mb-2">Your Cart is Empty</h2>
//                     <p className="text-slate-400 mb-6">Looks like you haven't added any delicious dishes yet.</p>
//                     <button
//                         onClick={() => navigate(`/r/${slug}/menu`)}
//                         className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/30 transform hover:-translate-y-0.5"
//                     >
//                         Browse Menu
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
//             {/* Header */}
//             <div className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-10 shadow-2xl">
//                 <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
//                     <button
//                         onClick={() => navigate(-1)}
//                         className="p-2 -ml-2 text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-800/50"
//                     >
//                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                         </svg>
//                     </button>
//                     <h1 className="text-2xl font-bold text-slate-100">Your Order</h1>
//                     <div className="w-8"></div> {/* Spacer */}
//                 </div>
//             </div>

//             <div className="max-w-3xl mx-auto px-4 py-6">
//                 {/* Cart Items */}
//                 <div className="space-y-4 mb-8">
//                     {items.map((item) => (
//                         <div key={item.dishId} className="bg-slate-800/40 backdrop-blur-sm p-4 border border-slate-700/50 rounded-2xl flex gap-4 animate-fade-in shadow-lg hover:border-amber-500/30 transition-all">
//                             {/* Image */}
//                             <div className="w-20 h-20 bg-slate-900 rounded-lg overflow-hidden shrink-0">
//                                 {item.image ? (
//                                     <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
//                                 ) : (
//                                     <div className="w-full h-full flex items-center justify-center text-amber-400 text-2xl">🍽️</div>
//                                 )}
//                             </div>

//                             {/* Details */}
//                             <div className="flex-1 flex flex-col justify-between">
//                                 <div className="flex justify-between items-start">
//                                     <h3 className="text-base font-bold text-slate-100 line-clamp-2">{item.name}</h3>
//                                     <button
//                                         onClick={() => removeItem(item.dishId)}
//                                         className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
//                                     >
//                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                                         </svg>
//                                     </button>
//                                 </div>

//                                 <div className="flex justify-between items-end mt-2">
//                                     <div className="flex items-center bg-slate-700/50 rounded-lg border border-slate-600/50 shadow-sm">
//                                         <button
//                                             onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
//                                             className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-600/50 rounded-l-lg transition-colors"
//                                         >
//                                             -
//                                         </button>
//                                         <span className="w-8 text-center text-slate-100 text-sm font-semibold">{item.quantity}</span>
//                                         <button
//                                             onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
//                                             className="w-8 h-8 flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-r-lg transition-colors"
//                                         >
//                                             +
//                                         </button>
//                                     </div>
//                                     <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">₹{item.price * item.quantity}</span>
//                                 </div>
//                             </div>
//                         </div>
//                     ))}
//                 </div>

//                 {/* Bill Summary */}
//                 <div className="bg-slate-800/40 backdrop-blur-sm p-6 border border-slate-700/50 rounded-2xl mb-8 shadow-lg">
//                     <h3 className="text-lg font-bold text-slate-100 mb-4 opacity-90">Bill Summary</h3>
//                     <div className="space-y-2 text-sm">
//                         <div className="flex justify-between text-slate-400">
//                             <span>Item Total</span>
//                             <span>₹{subtotal}</span>
//                         </div>
//                         {/* Divider */}
//                         <div className="border-t border-dashed border-slate-700/50 my-3 pt-3 flex justify-between items-center">
//                             <span className="text-lg font-bold text-slate-100">To Pay</span>
//                             <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">₹{total}</span>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Table Number Input */}
//                 <div className="bg-slate-800/40 backdrop-blur-sm p-6 border border-slate-700/50 rounded-2xl mb-8 shadow-lg">
//                     <label className="block text-sm font-bold text-slate-100 mb-2">
//                         Table Number <span className="text-red-400">*</span>
//                     </label>
//                     <input
//                         type="number"
//                         value={tableInput}
//                         onChange={(e) => setTableInput(e.target.value)}
//                         placeholder="Enter your table number (e.g. 5)"
//                         className="w-full px-4 py-3 text-lg border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 bg-slate-700/50 text-slate-100 placeholder-slate-500 transition-all shadow-inner"
//                     />
//                     {error && (
//                         <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                             </svg>
//                             {error}
//                         </p>
//                     )}
//                 </div>
//             </div>

//             {/* Fixed Bottom Bar */}
//             <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50 p-4 shadow-2xl z-20">
//                 <div className="max-w-3xl mx-auto flex gap-4 items-center">
//                     <div className="flex-1">
//                         <span className="block text-sm font-medium text-slate-400">Total</span>
//                         <span className="block text-2xl font-bold text-slate-100">₹{total}</span>
//                     </div>
//                     <button
//                         onClick={handlePlaceOrder}
//                         disabled={loading}
//                         className={`flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2 border border-amber-500/30 ${loading ? 'opacity-75 cursor-wait' : ''}`}
//                     >
//                         {loading ? (
//                             <>
//                                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
//                                 Placing Order...
//                             </>
//                         ) : (
//                             <>
//                                 <span>Place Order</span>
//                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
//                                 </svg>
//                             </>
//                         )}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }

// ------------------------------Light below-----------------------------

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrder } from "../../context/OrderContext";
import { useTenant } from "../../context/TenantProvider";
import upsellApi from "../../api/upsellApi";
import UpsellCard from "../../components/customer/UpsellCard";
import { useMenuTheme } from "../../hooks/useMenuTheme";

export default function OrderCart() {
    const navigate = useNavigate();
    const { slug } = useTenant();
    useMenuTheme(slug);
    const { items, removeItem, updateQuantity, placeOrder, clearOrder } = useOrder();
    const [tableInput, setTableInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [recommendations, setRecommendations] = useState([]);

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal;

    // Fetch recommendations when cart items change
    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!slug) return;
            try {
                const dishIds = items.map(item => item.dishId);
                const res = await upsellApi.getCartRecommendations(slug, dishIds, subtotal);
                if (res.success) {
                    setRecommendations(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch cart recommendations", err);
            }
        };

        // Debounce slightly to avoid rapid calls
        const timer = setTimeout(() => {
            fetchRecommendations();
        }, 300);

        return () => clearTimeout(timer);
    }, [items, subtotal, slug]);

    const handlePlaceOrder = async () => {
        if (!tableInput.trim()) {
            setError("Please enter your table number");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await placeOrder(tableInput);
            navigate(`/r/${slug}/track-order?code=${result.orderCode}`);
        } catch (err) {
            console.error("Order failed:", err);

            if (err.response?.status === 423) {
                setError("We are currently not accepting orders. Please ask the staff.");
            } else if (err.response?.status === 400) {
                setError(err.response.data.message || "Invalid order. Please check your cart.");
            } else {
                setError(err.message || "Failed to place order. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--menu-bg)', color: 'var(--menu-secondary)', fontFamily: 'var(--menu-font)' }}>
                <div className="bg-white p-8 text-center max-w-sm w-full border border-slate-100 rounded-3xl shadow-xl animate-fade-in-scale">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                        <span className="text-4xl">🛒</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Your Cart is Empty</h2>
                    <p className="text-slate-500 mb-6 font-medium">Looks like you haven't added any delicious dishes yet.</p>
                    <button
                        onClick={() => navigate(`/r/${slug}/menu`)}
                        className="w-full font-black py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-95"
                        style={{ background: 'var(--menu-primary)', color: 'var(--menu-primary-text)' }}
                    >
                        Browse Menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32" style={{ background: 'var(--menu-bg)', color: 'var(--menu-secondary)', fontFamily: 'var(--menu-font)' }}>
            {/* Header */}
            <div className="backdrop-blur-md border-b sticky top-0 z-10 shadow-sm" style={{ background: 'var(--menu-bg)', borderColor: 'var(--menu-accent)', opacity: 0.98 }}>
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-slate-400 hover:text-amber-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full border border-transparent hover:border-slate-100"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-black tracking-tight" style={{ color: 'var(--menu-secondary)' }}>Checkout Order</h1>
                    <div className="w-10"></div> {/* Spacer */}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                    {/* Left Column: Cart Items */}
                    <div className="flex-1 w-full lg:max-w-[calc(100%-400px)]">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Selected Items</h3>
                        {items.map((item) => (
                            <div key={item.dishId} className="bg-white p-4 border border-slate-100 rounded-3xl flex gap-4 animate-fade-in shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
                                {/* Image */}
                                <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-amber-500 text-2xl">🍽️</div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-base font-black text-slate-800 line-clamp-1">{item.name}</h3>
                                        <button
                                            onClick={() => removeItem(item.dishId)}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-end mt-2">
                                        <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100 shadow-inner p-1">
                                            <button
                                                onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                                                className="w-8 h-8 flex items-center justify-center text-slate-600 bg-white border border-slate-100 rounded-lg hover:text-red-500 hover:border-red-100 transition-all active:scale-90"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                                                </svg>
                                            </button>
                                            <span className="w-10 text-center text-slate-800 text-sm font-black">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                                                className="w-8 h-8 flex items-center justify-center text-slate-600 bg-white border border-slate-100 rounded-lg hover:text-amber-600 hover:border-amber-100 transition-all active:scale-90"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
                                        </div>
                                        <span className="text-lg font-black text-amber-600">₹{item.price * item.quantity}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recommendations Section */}
                    {recommendations.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Complete Your Meal</h3>
                            <div className="flex flex-col gap-4 sm:flex-row sm:overflow-x-auto sm:pb-4 sm:-mx-4 sm:px-4 sm:scrollbar-hide">
                                {recommendations.map(rec => (
                                    <UpsellCard key={rec._id} recommendation={rec} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Right Column: Sticky Summary */}
                    <div className="w-full lg:w-[380px] lg:sticky lg:top-32 space-y-6">
                        {/* Table Number Input */}
                        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm">
                            <label className="block text-sm font-black text-slate-800 mb-3">
                                Table Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={tableInput}
                                onChange={(e) => setTableInput(e.target.value)}
                                placeholder="e.g. 5"
                                className="w-full px-5 py-4 text-xl font-black border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 bg-slate-50 transition-all placeholder:text-slate-300 shadow-inner"
                            />
                            {error && (
                                <p className="text-red-500 text-sm mt-3 flex items-center gap-1.5 font-bold animate-shake">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* Bill Summary */}
                        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Bill Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-slate-600 font-bold">
                                    <span>Item Total</span>
                                    <span>₹{subtotal}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-600 font-bold">
                                    <span>Service Charge</span>
                                    <span className="bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-100 uppercase">Free</span>
                                </div>
                                {/* Divider */}
                                <div className="border-t border-dashed border-slate-200 my-4 pt-4 flex justify-between items-center">
                                    <span className="text-lg font-black text-slate-800">Total Payable</span>
                                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">₹{total}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Bar (Visible on all sizes, but max-width limited) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-20">
                <div className="max-w-7xl mx-auto flex gap-6 items-center">
                    <div className="hidden sm:block">
                        <span className="block text-xs font-black text-slate-400 uppercase tracking-widest">To Pay</span>
                        <span className="block text-2xl font-black text-slate-800">₹{total}</span>
                    </div>
                    <button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className={`flex-1 font-black py-4 px-8 rounded-[2rem] shadow-lg transition-all transform active:scale-95 flex justify-center items-center gap-3 border ${loading ? 'opacity-80 cursor-wait' : 'hover:-translate-y-0.5'}`}
                        style={{ background: 'var(--menu-primary)', color: 'var(--menu-primary-text)', borderColor: 'var(--menu-primary)' }}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                <span>Sending to Kitchen...</span>
                            </>
                        ) : (
                            <>
                                <span className="text-lg">Place Order</span>
                                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

