// import { useParams, useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { useOrder } from "../../context/OrderContext";
// import { useToast } from "../../components/common/Toast/ToastContext";
// import { useTenant } from "../../context/TenantProvider";

// export default function DishDetails() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { slug } = useTenant();
//   const { addItem } = useOrder();
//   const { showSuccess, showError } = useToast();
//   const [dish, setDish] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [imageError, setImageError] = useState(false);
//   const [quantity, setQuantity] = useState(1);
//   const [suspended, setSuspended] = useState(false);

//   const [recommendations, setRecommendations] = useState([]);

//   const handleAddToOrder = () => {
//     if (suspended) {
//       showError("Ordering is temporarily unavailable as the restaurant is suspended.");
//       return;
//     }
//     if (dish) {

//       addItem(dish, quantity);
//       showSuccess(`Added ${quantity} x ${dish.name} to order!`);
//     }
//   };

//   const handleAddRecommendationToOrder = (recDish) => {
//     if (suspended) {
//       showError("Ordering is temporarily unavailable.");
//       return;
//     }
//     addItem(recDish, 1);
//     showSuccess(`Added 1 x ${recDish.name} to order!`);
//   };

//   const getTagColor = (tag) => {
//     const tagLower = tag.toLowerCase();
//     if (tagLower.includes('spicy')) return 'bg-red-100 text-red-700';
//     if (tagLower.includes('vegan')) return 'bg-green-100 text-green-700';
//     if (tagLower.includes('vegetarian')) return 'bg-emerald-100 text-emerald-700';
//     if (tagLower.includes('gluten')) return 'bg-yellow-100 text-yellow-700';
//     if (tagLower.includes('hot')) return 'bg-orange-100 text-orange-700';
//     return 'bg-gray-100 text-gray-700';
//   };

//   const fetchDish = async () => {
//     if (!slug || !id) return;

//     try {

//       const { data } = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}`);
//       setDish(data.data.dish);

//       try {
//         const recData = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}/also-ordered`);
//         if (recData.data.success) {
//           setRecommendations(recData.data.data);
//         }
//       } catch (recError) {
//         console.error("Error fetching recommendations:", recError);
//       }

//     } catch (error) {
//       console.error("Error fetching dish:", error);
//       if (error.response?.status === 423) {
//         setSuspended(true);

//       } else if (error.response?.status === 404) {

//         setDish(null);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDish();

//     setQuantity(1);

//     window.scrollTo(0, 0);
//   }, [id]);

//   const arStatusConfig = {
//     completed: {
//       label: "View in AR",
//       color: "green",
//       icon: (
//         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
//         </svg>
//       ),
//       action: () => navigate(`/r/${slug}/ar/${id}`)
//     },
//     processing: {
//       label: "Generating AR Model...",
//       color: "yellow",
//       icon: <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
//     },
//     default: {
//       label: "AR Not Available",
//       color: "gray",
//       icon: (
//         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
//         </svg>
//       )
//     }
//   };

//   const getArStatus = () => {
//     return arStatusConfig[dish?.modelStatus] || arStatusConfig.default;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-amber-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
//           <p className="text-gray-600 mt-3">Loading dish details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!dish) {
//     return (
//       <div className="min-h-screen bg-amber-50 flex items-center justify-center">
//         <div className="text-center max-w-md mx-auto p-6">
//           <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
//             </svg>
//           </div>
//           <h3 className="text-xl font-semibold text-gray-800 mb-2">Dish Not Found</h3>
//           <p className="text-gray-600 mb-4">The dish you're looking for doesn't exist or has been removed.</p>
//           <button
//             onClick={() => navigate("/")}
//             className="bg-amber-500 hover:bg-amber-600 type-btn text-white px-6 py-2 rounded-lg transition-colors"
//           >
//             Back to Menu
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const arStatus = getArStatus();

//   return (
//     <div className="min-h-screen bg-amber-50">
//       {suspended && (
//         <div className="bg-red-600 text-white px-4 py-3 text-center shadow-md sticky top-0 z-50">
//           <p className="font-bold flex items-center justify-center gap-2">
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
//             Temporarily Closed
//           </p>
//         </div>
//       )}

//       { }
//       <div className={`border-b border-amber-200 bg-white sticky ${suspended ? 'top-12' : 'top-0'} z-20 shadow-sm`}>
//         <div className="max-w-4xl mx-auto px-4 py-3">
//           <button
//             onClick={() => navigate(`/r/${slug}/menu`)}
//             className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition-colors group"
//           >
//             <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//             </svg>
//             Back to Menu
//           </button>
//         </div>
//       </div>

//       { }
//       <div className="max-w-6xl mx-auto p-4 md:p-8">
//         <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

//           { }
//           <div className="w-full lg:w-1/2">
//             <div className="sticky top-24 space-y-6">
//               <div className="relative aspect-square md:aspect-4/3 w-full bg-gray-50 rounded-3xl overflow-hidden shadow-md border border-amber-100">
//                 {!imageError && dish.imageUrl ? (
//                   <img
//                     src={dish.imageUrl}
//                     alt={dish.name}
//                     className={`w-full h-full object-cover transition-all duration-700 ${!dish.available ? 'grayscale blur-[2px] opacity-70' : ''}`}
//                     onError={() => setImageError(true)}
//                   />
//                 ) : (
//                   <div className="w-full h-full flex items-center justify-center bg-amber-50">
//                     <div className="text-center text-amber-400">
//                       <span className="text-4xl block mb-2">🍽️</span>
//                       <p className="text-sm font-medium">Image Not Available</p>
//                     </div>
//                   </div>
//                 )}

//                 {!dish.available && (
//                   <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
//                     <span className="bg-red-600 text-white px-6 py-2 rounded-full text-lg font-bold shadow-2xl transform -rotate-6 border-4 border-white tracking-widest">
//                       SOLD OUT
//                     </span>
//                   </div>
//                 )}
//               </div>

//               { }
//               <div className="bg-white rounded-2xl p-1 shadow-sm border border-amber-50">
//                 {arStatus.color === "green" ? (
//                   <button
//                     onClick={arStatus.action}
//                     disabled={suspended}
//                     className={`w-full group bg-linear-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white py-4 px-6 rounded-xl font-bold shadow-lg transition-all flex items-center justify-between transform hover:-translate-y-0.5 ${suspended ? 'opacity-50 cursor-not-allowed' : ''}`}
//                   >
//                     <span className="flex items-center gap-3">
//                       <span className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
//                         {arStatus.icon}
//                       </span>
//                       <div className="text-left">
//                         <span className="block type-secondary text-gray-300">Experience it in 3D</span>
//                         <span className="block type-h2 text-white">View in AR</span>
//                       </div>
//                     </span>
//                     <svg className="w-6 h-6 text-white/50 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                     </svg>
//                   </button>
//                 ) : (
//                   <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-center gap-3 text-gray-400 border border-dashed border-gray-200">
//                     {arStatus.icon}
//                     <span className="text-sm font-medium">{arStatus.label}</span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           { }
//           <div className="w-full lg:w-1/2 space-y-8 pb-20 lg:pb-0">
//             { }
//             <div>
//               <div className="flex items-center gap-3 mb-4">
//                 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-800">
//                   {dish.category}
//                 </span>
//                 {dish.tags?.map((tag, idx) => (
//                   <span key={idx} className={`text-xs px-2 py-1 rounded-full font-medium border ${getTagColor(tag).replace('bg-', 'border-').replace('text-', 'text-opacity-80 text-')} bg-transparent`}>
//                     {tag}
//                   </span>
//                 ))}
//               </div>

//               <h1 className="type-h1 text-gray-900 mb-4">
//                 {dish.name}
//               </h1>

//               <div className="flex items-baseline gap-4 py-4 border-b border-gray-100">
//                 <span className="type-h1 text-amber-600">₹{dish.price}</span>
//                 {dish.portionSize && (
//                   <span className="type-secondary text-gray-400">/ {dish.portionSize}</span>
//                 )}
//               </div>
//             </div>

//             <div className={`lg:hidden mb-6 pb-6 border-b border-gray-100 ${(!dish.available || suspended) ? 'opacity-50 pointer-events-none' : ''}`}>
//               <div className="flex flex-col gap-4">
//                 <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
//                   <button
//                     onClick={() => setQuantity(q => Math.max(1, q - 1))}
//                     className="w-10 h-10 flex items-center justify-center type-h2 text-gray-500 hover:text-amber-600 transition-colors"
//                   >-</button>
//                   <span className="type-h2 text-gray-800 w-8 text-center">{quantity}</span>
//                   <button
//                     onClick={() => setQuantity(q => q + 1)}
//                     className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-500 hover:text-amber-600 transition-colors"
//                   >+</button>
//                 </div>

//                 <button
//                   onClick={handleAddToOrder}
//                   disabled={suspended || !dish.available}
//                   className={`w-full type-btn text-lg py-4 px-8 rounded-xl shadow-xl transition-all transform flex items-center justify-center gap-3 ${suspended ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white hover:-translate-y-1 hover:shadow-2xl shadow-amber-200'}`}
//                 >
//                   <span>{suspended ? 'Ordering Unavailable' : 'Add to Order'}</span>
//                   {!suspended && <span className="bg-amber-700/50 px-2 py-0.5 rounded text-sm">₹{dish.price * quantity}</span>}
//                 </button>

//                 <div className="text-center">
//                   <button onClick={() => navigate(`/r/${slug}/cart`)} className="text-sm font-semibold text-gray-500 hover:text-amber-600 underline decoration-2 decoration-transparent hover:decoration-amber-200 transition-all">
//                     View current order →
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {dish.description && (
//               <div className="prose prose-amber type-secondary text-lg">
//                 <p>{dish.description}</p>
//               </div>
//             )}

//             {recommendations.length > 0 && (
//               <div className="py-4">
//                 <h3 className="type-label mb-4">People Also Ordered With This Dish</h3>
//                 <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
//                   <div className="flex gap-4 w-max">
//                     {recommendations.map((recDish) => (
//                       <div key={recDish._id} className="w-40 card-premium border-gray-100/50 overflow-hidden shrink-0">
//                         <div
//                           className="h-28 w-full bg-gray-100 cursor-pointer"
//                           onClick={() => navigate(`/r/${slug}/dish/${recDish._id}`)}
//                         >
//                           {recDish.imageUrl ? (
//                             <img src={recDish.imageUrl} alt={recDish.name} className="w-full h-full object-cover" />
//                           ) : (
//                             <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
//                           )}
//                         </div>
//                         <div className="p-3">
//                           <h4
//                             className="type-body font-bold text-gray-900 truncate cursor-pointer hover:text-amber-600"
//                             onClick={() => navigate(`/r/${slug}/dish/${recDish._id}`)}
//                           >
//                             {recDish.name}
//                           </h4>
//                           <div className="mt-2 flex items-center justify-between">
//                             <span className="type-body font-semibold text-amber-600">₹{recDish.price}</span>
//                             <button
//                               onClick={() => handleAddRecommendationToOrder(recDish)}
//                               className="bg-amber-100 hover:bg-amber-200 text-amber-700 p-1.5 rounded-lg transition-colors"
//                               title="Add to Order"
//                               disabled={suspended}
//                             >
//                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                               </svg>
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {dish.ingredients?.length > 0 && (
//                 <div>
//                   <h3 className="type-label mb-3 flex items-center gap-2">
//                     <span>🥬</span> Ingredients
//                   </h3>
//                   <div className="flex flex-wrap gap-2">
//                     {dish.ingredients.map((ing, i) => (
//                       <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
//                         {ing}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               <div>
//                 <h3 className="type-label mb-3 flex items-center gap-2">
//                   <span>ℹ️</span> Dietary Info
//                 </h3>
//                 <div className="bg-blue-50 p-4 rounded-xl type-secondary text-blue-800 leading-snug">
//                   Specific allergies? Please verify with staff. Kitchen handles common allergens.
//                 </div>
//               </div>
//             </div>

//             {dish.nutritionalInfo && (
//               <div className="card-premium p-5 border-gray-100/50">
//                 <h3 className="type-label mb-4">Nutritional Facts</h3>
//                 <div className="grid grid-cols-4 gap-2 text-center divide-x divide-gray-100">
//                   <div>
//                     <div className="type-metric text-amber-600">{dish.nutritionalInfo.calories || 0}</div>
//                     <div className="type-label text-gray-400">Cals</div>
//                   </div>
//                   <div>
//                     <div className="type-metric text-gray-800">{dish.nutritionalInfo.protein || 0}g</div>
//                     <div className="type-label text-gray-400">Protein</div>
//                   </div>
//                   <div>
//                     <div className="type-metric text-gray-800">{dish.nutritionalInfo.carbs || 0}g</div>
//                     <div className="type-label text-gray-400">Carbs</div>
//                   </div>
//                   <div>
//                     <div className="type-metric text-gray-800">{dish.nutritionalInfo.sugar || 0}g</div>
//                     <div className="type-label text-gray-400">Sugar</div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div className={`hidden lg:block mt-8 pt-8 border-t border-gray-100 ${(!dish.available || suspended) ? 'opacity-50 pointer-events-none' : ''}`}>
//               <div className="flex flex-col sm:flex-row gap-4">
//                 <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 sm:w-40">
//                   <button
//                     onClick={() => setQuantity(q => Math.max(1, q - 1))}
//                     className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-500 hover:text-amber-600 transition-colors"
//                   >-</button>
//                   <span className="font-bold text-xl text-gray-800 w-8 text-center">{quantity}</span>
//                   <button
//                     onClick={() => setQuantity(q => q + 1)}
//                     className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-500 hover:text-amber-600 transition-colors"
//                   >+</button>
//                 </div>

//                 <button
//                   onClick={handleAddToOrder}
//                   disabled={suspended || !dish.available}
//                   className={`flex-1 type-btn text-lg py-4 px-8 rounded-xl shadow-xl transition-all transform flex items-center justify-center gap-3 ${suspended ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white hover:-translate-y-1 hover:shadow-2xl shadow-amber-200'}`}
//                 >
//                   <span>{suspended ? 'Ordering Unavailable' : 'Add to Order'}</span>
//                   {!suspended && <span className="bg-amber-700/50 px-2 py-0.5 rounded text-sm">₹{dish.price * quantity}</span>}
//                 </button>
//               </div>

//               <div className="mt-4 text-center">
//                 <button onClick={() => navigate(`/r/${slug}/cart`)} className="text-sm font-semibold text-gray-500 hover:text-amber-600 underline decoration-2 decoration-transparent hover:decoration-amber-200 transition-all">
//                   View current order →
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div className="text-center pb-8">
//         <p className="text-sm text-gray-500">
//           💫 All prices include taxes & service charges.
//         </p>
//       </div>
//     </div>
//   );
// }

// import { useParams, useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { useOrder } from "../../context/OrderContext";
// import { useToast } from "../../components/common/Toast/ToastContext";
// import { useTenant } from "../../context/TenantProvider";

// export default function DishDetails() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { slug } = useTenant();
//   const { addItem } = useOrder();
//   const { showSuccess, showError } = useToast();
//   const [dish, setDish] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [imageError, setImageError] = useState(false);
//   const [quantity, setQuantity] = useState(1);
//   const [suspended, setSuspended] = useState(false);

//   const [recommendations, setRecommendations] = useState([]);

//   const handleAddToOrder = () => {
//     if (suspended) {
//       showError("Ordering is temporarily unavailable as the restaurant is suspended.");
//       return;
//     }
//     if (dish) {
//       addItem(dish, quantity);
//       showSuccess(`Added ${quantity} x ${dish.name} to order!`);
//     }
//   };

//   const handleAddRecommendationToOrder = (recDish) => {
//     if (suspended) {
//       showError("Ordering is temporarily unavailable.");
//       return;
//     }
//     addItem(recDish, 1);
//     showSuccess(`Added 1 x ${recDish.name} to order!`);
//   };

//   const getTagColor = (tag) => {
//     const tagLower = tag.toLowerCase();
//     if (tagLower.includes('spicy')) return 'bg-red-500/20 text-red-300 border border-red-500/30';
//     if (tagLower.includes('vegan')) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
//     if (tagLower.includes('vegetarian')) return 'bg-green-500/20 text-green-300 border border-green-500/30';
//     if (tagLower.includes('gluten')) return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
//     if (tagLower.includes('hot')) return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
//     return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
//   };

//   const fetchDish = async () => {
//     if (!slug || !id) return;

//     try {
//       const { data } = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}`);
//       setDish(data.data.dish);

//       try {
//         const recData = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}/also-ordered`);
//         if (recData.data.success) {
//           setRecommendations(recData.data.data);
//         }
//       } catch (recError) {
//         console.error("Error fetching recommendations:", recError);
//       }

//     } catch (error) {
//       console.error("Error fetching dish:", error);
//       if (error.response?.status === 423) {
//         setSuspended(true);
//       } else if (error.response?.status === 404) {
//         setDish(null);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDish();
//     setQuantity(1);
//     window.scrollTo(0, 0);
//   }, [id]);

//   const arStatusConfig = {
//     completed: {
//       label: "View in AR",
//       color: "green",
//       icon: (
//         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
//         </svg>
//       ),
//       action: () => navigate(`/r/${slug}/ar/${id}`)
//     },
//     processing: {
//       label: "Generating AR Model...",
//       color: "yellow",
//       icon: <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
//     },
//     default: {
//       label: "AR Not Available",
//       color: "gray",
//       icon: (
//         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
//         </svg>
//       )
//     }
//   };

//   const getArStatus = () => {
//     return arStatusConfig[dish?.modelStatus] || arStatusConfig.default;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
//           <p className="text-slate-400 mt-3">Loading dish details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!dish) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
//         <div className="text-center max-w-md mx-auto p-6">
//           <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
//             <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
//             </svg>
//           </div>
//           <h3 className="text-xl font-semibold text-slate-100 mb-2">Dish Not Found</h3>
//           <p className="text-slate-400 mb-4">The dish you're looking for doesn't exist or has been removed.</p>
//           <button
//             onClick={() => navigate("/")}
//             className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-2 rounded-lg transition-all shadow-lg shadow-amber-500/30"
//           >
//             Back to Menu
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const arStatus = getArStatus();

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
//       {suspended && (
//         <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-3 text-center shadow-lg sticky top-0 z-50 border-b border-red-400/20">
//           <p className="font-bold flex items-center justify-center gap-2">
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
//             Temporarily Closed
//           </p>
//         </div>
//       )}

//       {/* Header */}
//       <div className={`bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky ${suspended ? 'top-12' : 'top-0'} z-20 shadow-2xl`}>
//         <div className="max-w-7xl mx-auto px-4 py-3">
//           <button
//             onClick={() => navigate(`/r/${slug}/menu`)}
//             className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium transition-colors group"
//           >
//             <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//             </svg>
//             Back to Menu
//           </button>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto p-4 md:p-8">
//         <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

//           {/* Left Column - Image and AR */}
//           <div className="w-full lg:w-1/2">
//             <div className="sticky top-24 space-y-6">
//               <div className="relative aspect-square md:aspect-4/3 w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800/50">
//                 {!imageError && dish.imageUrl ? (
//                   <img
//                     src={dish.imageUrl}
//                     alt={dish.name}
//                     className={`w-full h-full object-cover transition-all duration-700 ${!dish.available ? 'grayscale blur-[2px] opacity-70' : ''}`}
//                     onError={() => setImageError(true)}
//                   />
//                 ) : (
//                   <div className="w-full h-full flex items-center justify-center bg-slate-800">
//                     <div className="text-center text-amber-400">
//                       <span className="text-4xl block mb-2">🍽️</span>
//                       <p className="text-sm font-medium">Image Not Available</p>
//                     </div>
//                   </div>
//                 )}

//                 {!dish.available && (
//                   <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
//                     <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-full text-lg font-bold shadow-2xl transform -rotate-6 border-4 border-white tracking-widest">
//                       SOLD OUT
//                     </span>
//                   </div>
//                 )}
//               </div>

//               {/* AR Button */}
//               <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-slate-700/50">
//                 {arStatus.color === "green" ? (
//                   <button
//                     onClick={arStatus.action}
//                     disabled={suspended}
//                     className={`w-full group bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white py-4 px-6 rounded-xl font-bold shadow-lg transition-all flex items-center justify-between transform hover:-translate-y-0.5 border border-slate-700/50 ${suspended ? 'opacity-50 cursor-not-allowed' : ''}`}
//                   >
//                     <span className="flex items-center gap-3">
//                       <span className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center border border-amber-500/30">
//                         {arStatus.icon}
//                       </span>
//                       <div className="text-left">
//                         <span className="block text-sm text-slate-400">Experience it in 3D</span>
//                         <span className="block text-lg text-white">View in AR</span>
//                       </div>
//                     </span>
//                     <svg className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                     </svg>
//                   </button>
//                 ) : (
//                   <div className="p-4 bg-slate-800/50 rounded-xl flex items-center justify-center gap-3 text-slate-500 border border-dashed border-slate-700/50">
//                     {arStatus.icon}
//                     <span className="text-sm font-medium">{arStatus.label}</span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Details */}
//           <div className="w-full lg:w-1/2 space-y-8 pb-20 lg:pb-0">
//             {/* Header Info */}
//             <div>
//               <div className="flex items-center gap-3 mb-4 flex-wrap">
//                 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
//                   {dish.category}
//                 </span>
//                 {dish.tags?.map((tag, idx) => (
//                   <span key={idx} className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTagColor(tag)}`}>
//                     {tag}
//                   </span>
//                 ))}
//               </div>

//               <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
//                 {dish.name}
//               </h1>

//               <div className="flex items-baseline gap-4 py-4 border-b border-slate-800/50">
//                 <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">₹{dish.price}</span>
//                 {dish.portionSize && (
//                   <span className="text-sm text-slate-500">/ {dish.portionSize}</span>
//                 )}
//               </div>
//             </div>

//             {/* Mobile Add to Order */}
//             <div className={`lg:hidden mb-6 pb-6 border-b border-slate-800/50 ${(!dish.available || suspended) ? 'opacity-50 pointer-events-none' : ''}`}>
//               <div className="flex flex-col gap-4">
//                 <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 shadow-lg">
//                   <button
//                     onClick={() => setQuantity(q => Math.max(1, q - 1))}
//                     className="w-10 h-10 flex items-center justify-center text-xl font-bold text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-700/50"
//                   >-</button>
//                   <span className="text-xl font-bold text-slate-100 w-8 text-center">{quantity}</span>
//                   <button
//                     onClick={() => setQuantity(q => q + 1)}
//                     className="w-10 h-10 flex items-center justify-center text-xl font-bold text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-700/50"
//                   >+</button>
//                 </div>

//                 <button
//                   onClick={handleAddToOrder}
//                   disabled={suspended || !dish.available}
//                   className={`w-full text-lg font-bold py-4 px-8 rounded-xl shadow-xl transition-all transform flex items-center justify-center gap-3 ${suspended ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 hover:-translate-y-1 hover:shadow-2xl shadow-amber-500/20 border border-amber-500/30'}`}
//                 >
//                   <span>{suspended ? 'Ordering Unavailable' : 'Add to Order'}</span>
//                   {!suspended && <span className="bg-black/20 px-2.5 py-0.5 rounded-lg text-sm">₹{dish.price * quantity}</span>}
//                 </button>

//                 <div className="text-center">
//                   <button onClick={() => navigate(`/r/${slug}/cart`)} className="text-sm font-semibold text-slate-400 hover:text-amber-400 underline decoration-2 decoration-transparent hover:decoration-amber-400 transition-all">
//                     View current order →
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Description */}
//             {dish.description && (
//               <div className="prose prose-invert max-w-none">
//                 <p className="text-base text-slate-300 leading-relaxed">{dish.description}</p>
//               </div>
//             )}

//             {/* Recommendations */}
//             {recommendations.length > 0 && (
//               <div className="py-4">
//                 <h3 className="text-lg font-bold text-slate-100 mb-4">People Also Ordered With This Dish</h3>
//                 <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
//                   <div className="flex gap-4 w-max">
//                     {recommendations.map((recDish) => (
//                       <div key={recDish._id} className="w-40 bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shrink-0 hover:border-amber-500/30 transition-all shadow-lg">
//                         <div
//                           className="h-28 w-full bg-slate-900 cursor-pointer"
//                           onClick={() => navigate(`/r/${slug}/dish/${recDish._id}`)}
//                         >
//                           {recDish.imageUrl ? (
//                             <img src={recDish.imageUrl} alt={recDish.name} className="w-full h-full object-cover" />
//                           ) : (
//                             <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
//                           )}
//                         </div>
//                         <div className="p-3">
//                           <h4
//                             className="text-sm font-bold text-slate-100 truncate cursor-pointer hover:text-amber-400 transition-colors"
//                             onClick={() => navigate(`/r/${slug}/dish/${recDish._id}`)}
//                           >
//                             {recDish.name}
//                           </h4>
//                           <div className="mt-2 flex items-center justify-between">
//                             <span className="text-sm font-semibold text-amber-400">₹{recDish.price}</span>
//                             <button
//                               onClick={() => handleAddRecommendationToOrder(recDish)}
//                               className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 p-1.5 rounded-lg transition-colors border border-amber-500/30"
//                               title="Add to Order"
//                               disabled={suspended}
//                             >
//                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                               </svg>
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Ingredients and Dietary Info */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {dish.ingredients?.length > 0 && (
//                 <div>
//                   <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
//                     <span>🥬</span> Ingredients
//                   </h3>
//                   <div className="flex flex-wrap gap-2">
//                     {dish.ingredients.map((ing, i) => (
//                       <span key={i} className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 shadow-sm">
//                         {ing}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               <div>
//                 <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
//                   <span>ℹ️</span> Dietary Info
//                 </h3>
//                 <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-sm text-blue-300 leading-snug shadow-sm">
//                   Specific allergies? Please verify with staff. Kitchen handles common allergens.
//                 </div>
//               </div>
//             </div>

//             {/* Nutritional Info */}
//             {dish.nutritionalInfo && (
//               <div className="bg-slate-800/40 backdrop-blur-sm p-5 rounded-2xl border border-slate-700/50 shadow-lg">
//                 <h3 className="text-lg font-bold text-slate-100 mb-4">Nutritional Facts</h3>
//                 <div className="grid grid-cols-4 gap-2 text-center divide-x divide-slate-700/50">
//                   <div>
//                     <div className="text-2xl font-bold text-amber-400">{dish.nutritionalInfo.calories || 0}</div>
//                     <div className="text-xs font-medium text-slate-500 mt-1">Cals</div>
//                   </div>
//                   <div>
//                     <div className="text-2xl font-bold text-slate-200">{dish.nutritionalInfo.protein || 0}g</div>
//                     <div className="text-xs font-medium text-slate-500 mt-1">Protein</div>
//                   </div>
//                   <div>
//                     <div className="text-2xl font-bold text-slate-200">{dish.nutritionalInfo.carbs || 0}g</div>
//                     <div className="text-xs font-medium text-slate-500 mt-1">Carbs</div>
//                   </div>
//                   <div>
//                     <div className="text-2xl font-bold text-slate-200">{dish.nutritionalInfo.sugar || 0}g</div>
//                     <div className="text-xs font-medium text-slate-500 mt-1">Sugar</div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Desktop Add to Order */}
//             <div className={`hidden lg:block mt-8 pt-8 border-t border-slate-800/50 ${(!dish.available || suspended) ? 'opacity-50 pointer-events-none' : ''}`}>
//               <div className="flex flex-col sm:flex-row gap-4">
//                 <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 sm:w-40 shadow-lg">
//                   <button
//                     onClick={() => setQuantity(q => Math.max(1, q - 1))}
//                     className="w-10 h-10 flex items-center justify-center text-xl font-bold text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-700/50"
//                   >-</button>
//                   <span className="font-bold text-xl text-slate-100 w-8 text-center">{quantity}</span>
//                   <button
//                     onClick={() => setQuantity(q => q + 1)}
//                     className="w-10 h-10 flex items-center justify-center text-xl font-bold text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-700/50"
//                   >+</button>
//                 </div>

//                 <button
//                   onClick={handleAddToOrder}
//                   disabled={suspended || !dish.available}
//                   className={`flex-1 text-lg font-bold py-4 px-8 rounded-xl shadow-xl transition-all transform flex items-center justify-center gap-3 ${suspended ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 hover:-translate-y-1 hover:shadow-2xl shadow-amber-500/20 border border-amber-500/30'}`}
//                 >
//                   <span>{suspended ? 'Ordering Unavailable' : 'Add to Order'}</span>
//                   {!suspended && <span className="bg-black/20 px-2.5 py-0.5 rounded-lg text-sm">₹{dish.price * quantity}</span>}
//                 </button>
//               </div>

//               <div className="mt-4 text-center">
//                 <button onClick={() => navigate(`/r/${slug}/cart`)} className="text-sm font-semibold text-slate-400 hover:text-amber-400 underline decoration-2 decoration-transparent hover:decoration-amber-400 transition-all">
//                   View current order →
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="text-center pb-8 px-4">
//         <p className="text-sm text-slate-500">
//           💫 All prices include taxes & service charges.
//         </p>
//       </div>
//     </div>
//   );
// }

// -------------------------------- Dark below --------------------------------

// import { useParams, useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { useOrder } from "../../context/OrderContext";
// import { useToast } from "../../components/common/Toast/ToastContext";
// import { useTenant } from "../../context/TenantProvider";

// export default function DishDetails() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { slug } = useTenant();
//   const { addItem } = useOrder();
//   const { showSuccess, showError } = useToast();
//   const [dish, setDish] = useState(null);

//   const normalizeCategory = (category) => {
//     if (!category) return "Uncategorized";
//     return category
//       .toLowerCase()
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
//   };
//   const [loading, setLoading] = useState(true);
//   const [imageError, setImageError] = useState(false);
//   const [quantity, setQuantity] = useState(1);
//   const [suspended, setSuspended] = useState(false);

//   const [recommendations, setRecommendations] = useState([]);

//   const handleAddToOrder = () => {
//     if (suspended) {
//       showError("Ordering is temporarily unavailable as the restaurant is suspended.");
//       return;
//     }
//     if (dish) {
//       addItem(dish, quantity);
//       showSuccess(`Added ${quantity} x ${dish.name} to order!`);
//     }
//   };

//   const handleAddRecommendationToOrder = (recDish) => {
//     if (suspended) {
//       showError("Ordering is temporarily unavailable.");
//       return;
//     }
//     addItem(recDish, 1);
//     showSuccess(`Added 1 x ${recDish.name} to order!`);
//   };

//   const getTagColor = (tag) => {
//     const tagLower = tag.toLowerCase();
//     if (tagLower.includes('spicy')) return 'bg-red-500/20 text-red-300 border border-red-500/30';
//     if (tagLower.includes('vegan')) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
//     if (tagLower.includes('vegetarian')) return 'bg-green-500/20 text-green-300 border border-green-500/30';
//     if (tagLower.includes('gluten')) return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
//     if (tagLower.includes('hot')) return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
//     return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
//   };

//   // Function to get unique tags (excluding category if it's in tags)
//   const getUniqueTags = () => {
//     if (!dish?.tags) return [];

//     // Filter out duplicates and category from tags
//     const uniqueTags = dish.tags.filter((tag, index, self) => {
//       const normalizedTag = tag.toLowerCase().trim();
//       const normalizedCategory = dish.category?.toLowerCase().trim();

//       // Remove if it's the same as category or a duplicate
//       return normalizedTag !== normalizedCategory &&
//         self.findIndex(t => t.toLowerCase().trim() === normalizedTag) === index;
//     });

//     return uniqueTags;
//   };

//   const fetchDish = async () => {
//     if (!slug || !id) return;

//     try {
//       const { data } = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}`);
//       setDish(data.data.dish);

//       try {
//         const recData = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}/also-ordered`);
//         if (recData.data.success) {
//           setRecommendations(recData.data.data);
//         }
//       } catch (recError) {
//         console.error("Error fetching recommendations:", recError);
//       }

//     } catch (error) {
//       console.error("Error fetching dish:", error);
//       if (error.response?.status === 423) {
//         setSuspended(true);
//       } else if (error.response?.status === 404) {
//         setDish(null);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDish();
//     setQuantity(1);
//     window.scrollTo(0, 0);
//   }, [id]);

//   const arStatusConfig = {
//     completed: {
//       label: "View in AR",
//       color: "green",
//       icon: (
//         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
//         </svg>
//       ),
//       action: () => navigate(`/r/${slug}/ar/${id}`)
//     },
//     processing: {
//       label: "Generating AR Model...",
//       color: "yellow",
//       icon: <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
//     },
//     default: {
//       label: "AR Not Available",
//       color: "gray",
//       icon: (
//         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
//         </svg>
//       )
//     }
//   };

//   const getArStatus = () => {
//     return arStatusConfig[dish?.modelStatus] || arStatusConfig.default;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
//           <p className="text-slate-400 mt-3">Loading dish details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!dish) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
//         <div className="text-center max-w-md mx-auto p-6">
//           <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
//             <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
//             </svg>
//           </div>
//           <h3 className="text-xl font-semibold text-slate-100 mb-2">Dish Not Found</h3>
//           <p className="text-slate-400 mb-4">The dish you're looking for doesn't exist or has been removed.</p>
//           <button
//             onClick={() => navigate("/")}
//             className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-2 rounded-lg transition-all shadow-lg shadow-amber-500/30"
//           >
//             Back to Menu
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const arStatus = getArStatus();
//   const uniqueTags = getUniqueTags();

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
//       {suspended && (
//         <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-3 text-center shadow-lg sticky top-0 z-50 border-b border-red-400/20">
//           <p className="font-bold flex items-center justify-center gap-2">
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
//             Temporarily Closed
//           </p>
//         </div>
//       )}

//       {/* Header */}
//       <div className={`bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky ${suspended ? 'top-12' : 'top-0'} z-20 shadow-2xl`}>
//         <div className="max-w-7xl mx-auto px-4 py-3">
//           <button
//             onClick={() => navigate(`/r/${slug}/menu`)}
//             className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium transition-colors group"
//           >
//             <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//             </svg>
//             Back to Menu
//           </button>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto p-4 md:p-8">
//         <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

//           {/* Left Column - Image and AR */}
//           <div className="w-full lg:w-1/2">
//             <div className="sticky top-24 space-y-6">
//               <div className="relative aspect-square md:aspect-4/3 w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800/50">
//                 {!imageError && dish.imageUrl ? (
//                   <img
//                     src={dish.imageUrl}
//                     alt={dish.name}
//                     className={`w-full h-full object-cover transition-all duration-700 ${!dish.available ? 'grayscale blur-[2px] opacity-70' : ''}`}
//                     onError={() => setImageError(true)}
//                   />
//                 ) : (
//                   <div className="w-full h-full flex items-center justify-center bg-slate-800">
//                     <div className="text-center text-amber-400">
//                       <span className="text-4xl block mb-2">🍽️</span>
//                       <p className="text-sm font-medium">Image Not Available</p>
//                     </div>
//                   </div>
//                 )}

//                 {!dish.available && (
//                   <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
//                     <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-full text-lg font-bold shadow-2xl transform -rotate-6 border-4 border-white tracking-widest">
//                       SOLD OUT
//                     </span>
//                   </div>
//                 )}
//               </div>

//               {/* AR Button */}
//               <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-slate-700/50">
//                 {arStatus.color === "green" ? (
//                   <button
//                     onClick={arStatus.action}
//                     disabled={suspended}
//                     className={`w-full group bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white py-4 px-6 rounded-xl font-bold shadow-lg transition-all flex items-center justify-between transform hover:-translate-y-0.5 border border-slate-700/50 ${suspended ? 'opacity-50 cursor-not-allowed' : ''}`}
//                   >
//                     <span className="flex items-center gap-3">
//                       <span className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center border border-amber-500/30">
//                         {arStatus.icon}
//                       </span>
//                       <div className="text-left">
//                         <span className="block text-sm text-slate-400">Experience it in 3D</span>
//                         <span className="block text-lg text-white">View in AR</span>
//                       </div>
//                     </span>
//                     <svg className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                     </svg>
//                   </button>
//                 ) : (
//                   <div className="p-4 bg-slate-800/50 rounded-xl flex items-center justify-center gap-3 text-slate-500 border border-dashed border-slate-700/50">
//                     {arStatus.icon}
//                     <span className="text-sm font-medium">{arStatus.label}</span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Details */}
//           <div className="w-full lg:w-1/2 space-y-8 pb-20 lg:pb-0">
//             {/* Header Info */}
//             <div>
//               <div className="flex items-center gap-3 mb-4 flex-wrap">
//                 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
//                   {normalizeCategory(dish.category)}
//                 </span>
//                 {uniqueTags.map((tag, idx) => (
//                   <span key={idx} className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTagColor(tag)}`}>
//                     {tag}
//                   </span>
//                 ))}
//               </div>

//               <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
//                 {dish.name}
//               </h1>

//               <div className="flex items-baseline gap-4 py-4 border-b border-slate-800/50">
//                 <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">₹{dish.price}</span>
//                 {dish.portionSize && (
//                   <span className="text-sm text-slate-500">/ {dish.portionSize}</span>
//                 )}
//               </div>
//             </div>

//             {/* Mobile Add to Order */}
//             <div className={`lg:hidden mb-6 pb-6 border-b border-slate-800/50 ${(!dish.available || suspended) ? 'opacity-50 pointer-events-none' : ''}`}>
//               <div className="flex flex-col gap-4">
//                 <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 shadow-lg">
//                   <button
//                     onClick={() => setQuantity(q => Math.max(1, q - 1))}
//                     className="w-10 h-10 flex items-center justify-center text-xl font-bold text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-700/50"
//                   >-</button>
//                   <span className="text-xl font-bold text-slate-100 w-8 text-center">{quantity}</span>
//                   <button
//                     onClick={() => setQuantity(q => q + 1)}
//                     className="w-10 h-10 flex items-center justify-center text-xl font-bold text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-700/50"
//                   >+</button>
//                 </div>

//                 <button
//                   onClick={handleAddToOrder}
//                   disabled={suspended || !dish.available}
//                   className={`w-full text-lg font-bold py-4 px-8 rounded-xl shadow-xl transition-all transform flex items-center justify-center gap-3 ${suspended ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 hover:-translate-y-1 hover:shadow-2xl shadow-amber-500/20 border border-amber-500/30'}`}
//                 >
//                   <span>{suspended ? 'Ordering Unavailable' : 'Add to Order'}</span>
//                   {!suspended && <span className="bg-black/20 px-2.5 py-0.5 rounded-lg text-sm">₹{dish.price * quantity}</span>}
//                 </button>

//                 <div className="text-center">
//                   <button onClick={() => navigate(`/r/${slug}/cart`)} className="text-sm font-semibold text-slate-400 hover:text-amber-400 underline decoration-2 decoration-transparent hover:decoration-amber-400 transition-all">
//                     View current order →
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Description */}
//             {dish.description && (
//               <div className="prose prose-invert max-w-none">
//                 <p className="text-base text-slate-300 leading-relaxed">{dish.description}</p>
//               </div>
//             )}

//             {/* Recommendations */}
//             {recommendations.length > 0 && (
//               <div className="py-4">
//                 <h3 className="text-lg font-bold text-slate-100 mb-4">People Also Ordered With This Dish</h3>
//                 <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
//                   <div className="flex gap-4 w-max">
//                     {recommendations.map((recDish) => (
//                       <div key={recDish._id} className="w-40 bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shrink-0 hover:border-amber-500/30 transition-all shadow-lg">
//                         <div
//                           className="h-28 w-full bg-slate-900 cursor-pointer"
//                           onClick={() => navigate(`/r/${slug}/dish/${recDish._id}`)}
//                         >
//                           {recDish.imageUrl ? (
//                             <img src={recDish.imageUrl} alt={recDish.name} className="w-full h-full object-cover" />
//                           ) : (
//                             <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
//                           )}
//                         </div>
//                         <div className="p-3">
//                           <h4
//                             className="text-sm font-bold text-slate-100 truncate cursor-pointer hover:text-amber-400 transition-colors"
//                             onClick={() => navigate(`/r/${slug}/dish/${recDish._id}`)}
//                           >
//                             {recDish.name}
//                           </h4>
//                           <div className="mt-2 flex items-center justify-between">
//                             <span className="text-sm font-semibold text-amber-400">₹{recDish.price}</span>
//                             <button
//                               onClick={() => handleAddRecommendationToOrder(recDish)}
//                               className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 p-1.5 rounded-lg transition-colors border border-amber-500/30"
//                               title="Add to Order"
//                               disabled={suspended}
//                             >
//                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                               </svg>
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Ingredients and Dietary Info */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {dish.ingredients?.length > 0 && (
//                 <div>
//                   <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
//                     <span>🥬</span> Ingredients
//                   </h3>
//                   <div className="flex flex-wrap gap-2">
//                     {dish.ingredients.map((ing, i) => (
//                       <span key={i} className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 shadow-sm">
//                         {ing}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               <div>
//                 <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
//                   <span>ℹ️</span> Dietary Info
//                 </h3>
//                 <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-sm text-blue-300 leading-snug shadow-sm">
//                   Specific allergies? Please verify with staff. Kitchen handles common allergens.
//                 </div>
//               </div>
//             </div>

//             {/* Nutritional Info */}
//             {dish.nutritionalInfo && (
//               <div className="bg-slate-800/40 backdrop-blur-sm p-5 rounded-2xl border border-slate-700/50 shadow-lg">
//                 <h3 className="text-lg font-bold text-slate-100 mb-4">Nutritional Facts</h3>
//                 <div className="grid grid-cols-4 gap-2 text-center divide-x divide-slate-700/50">
//                   <div>
//                     <div className="text-2xl font-bold text-amber-400">{dish.nutritionalInfo.calories || 0}</div>
//                     <div className="text-xs font-medium text-slate-500 mt-1">Cals</div>
//                   </div>
//                   <div>
//                     <div className="text-2xl font-bold text-slate-200">{dish.nutritionalInfo.protein || 0}g</div>
//                     <div className="text-xs font-medium text-slate-500 mt-1">Protein</div>
//                   </div>
//                   <div>
//                     <div className="text-2xl font-bold text-slate-200">{dish.nutritionalInfo.carbs || 0}g</div>
//                     <div className="text-xs font-medium text-slate-500 mt-1">Carbs</div>
//                   </div>
//                   <div>
//                     <div className="text-2xl font-bold text-slate-200">{dish.nutritionalInfo.sugar || 0}g</div>
//                     <div className="text-xs font-medium text-slate-500 mt-1">Sugar</div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Desktop Add to Order */}
//             <div className={`hidden lg:block mt-8 pt-8 border-t border-slate-800/50 ${(!dish.available || suspended) ? 'opacity-50 pointer-events-none' : ''}`}>
//               <div className="flex flex-col sm:flex-row gap-4">
//                 <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 sm:w-40 shadow-lg">
//                   <button
//                     onClick={() => setQuantity(q => Math.max(1, q - 1))}
//                     className="w-10 h-10 flex items-center justify-center text-xl font-bold text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-700/50"
//                   >-</button>
//                   <span className="font-bold text-xl text-slate-100 w-8 text-center">{quantity}</span>
//                   <button
//                     onClick={() => setQuantity(q => q + 1)}
//                     className="w-10 h-10 flex items-center justify-center text-xl font-bold text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-700/50"
//                   >+</button>
//                 </div>

//                 <button
//                   onClick={handleAddToOrder}
//                   disabled={suspended || !dish.available}
//                   className={`flex-1 text-lg font-bold py-4 px-8 rounded-xl shadow-xl transition-all transform flex items-center justify-center gap-3 ${suspended ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 hover:-translate-y-1 hover:shadow-2xl shadow-amber-500/20 border border-amber-500/30'}`}
//                 >
//                   <span>{suspended ? 'Ordering Unavailable' : 'Add to Order'}</span>
//                   {!suspended && <span className="bg-black/20 px-2.5 py-0.5 rounded-lg text-sm">₹{dish.price * quantity}</span>}
//                 </button>
//               </div>

//               <div className="mt-4 text-center">
//                 <button onClick={() => navigate(`/r/${slug}/cart`)} className="text-sm font-semibold text-slate-400 hover:text-amber-400 underline decoration-2 decoration-transparent hover:decoration-amber-400 transition-all">
//                   View current order →
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="text-center pb-8 px-4">
//         <p className="text-sm text-slate-500">
//           💫 All prices include taxes & service charges.
//         </p>
//       </div>
//     </div>
//   );
// }

// -------------------------------- Light below --------------------------------

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useOrder } from "../../context/OrderContext";
import { useToast } from "../../components/common/Toast/ToastContext";
import { useTenant } from "../../context/TenantProvider";
import upsellApi from "../../api/upsellApi";
import { useMenuTheme } from "../../hooks/useMenuTheme";

export default function DishDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { slug } = useTenant();
  const { addItem } = useOrder();
  const { showSuccess, showError } = useToast();
  useMenuTheme(slug);
  const [dish, setDish] = useState(null);

  const normalizeCategory = (category) => {
    if (!category) return "Uncategorized";
    return category
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [suspended, setSuspended] = useState(false);

  const [recommendations, setRecommendations] = useState([]);

  const handleAddToOrder = () => {
    if (suspended) {
      showError("Ordering is temporarily unavailable as the restaurant is suspended.");
      return;
    }
    if (dish) {
      addItem(dish, quantity);
      showSuccess(`Added ${quantity} x ${dish.name} to order!`);
    }
  };

  const handleAddRecommendationToOrder = (recDish, discountedPrice = null) => {
    if (suspended) {
      showError("Ordering is temporarily unavailable.");
      return;
    }

    // If a discounted price is provided, create a modified dish object with that price
    const dishToAdd = discountedPrice !== null && discountedPrice !== recDish.price
      ? { ...recDish, price: discountedPrice }
      : recDish;

    addItem(dishToAdd, 1, {
      upsellRuleId: recDish.ruleId,
      source: 'UPSELL',
      originalPrice: recDish.price
    });
    showSuccess(`Added 1 x ${recDish.name} to order!`);
  };

  const getTagColor = (tag) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('spicy')) return 'bg-transparent text-red-600 border-red-600/50';
    if (tagLower.includes('vegan')) return 'bg-transparent text-emerald-600 border-emerald-600/50';
    if (tagLower.includes('vegetarian')) return 'bg-transparent text-green-600 border-green-600/50';
    if (tagLower.includes('gluten')) return 'bg-transparent text-yellow-600 border-yellow-600/50';
    if (tagLower.includes('hot')) return 'bg-transparent text-orange-600 border-orange-600/50';
    return 'bg-transparent text-slate-500 border-slate-500/50';
  };

  // Function to get unique tags (excluding category if it's in tags)
  const getUniqueTags = () => {
    if (!dish?.tags) return [];

    // Filter out duplicates and category from tags
    const uniqueTags = dish.tags.filter((tag, index, self) => {
      const normalizedTag = tag.toLowerCase().trim();
      const normalizedCategory = dish.category?.toLowerCase().trim();

      // Remove if it's the same as category or a duplicate
      return normalizedTag !== normalizedCategory &&
        self.findIndex(t => t.toLowerCase().trim() === normalizedTag) === index;
    });

    return uniqueTags;
  };

  const fetchDish = async () => {
    if (!slug || !id) return;

    try {
      const { data } = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}`);
      setDish(data.data.dish);

      // Try fetching smart upsell recommendations first
      try {
        const upsellRes = await upsellApi.getRecommendationsForDish(slug, id, 'VIEW_DISH');
        if (upsellRes.success && upsellRes.data.length > 0) {
          setRecommendations(upsellRes.data);
        } else {
          // Fallback to "People Also Ordered"
          const recData = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}/also-ordered`);
          if (recData.data.success) {
            setRecommendations(recData.data.data); // These will be standard dish objects
          }
        }
      } catch (recError) {
        console.error("Error fetching recommendations:", recError);
        // Fallback on error
        const recData = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}/also-ordered`);
        if (recData.data.success) {
          setRecommendations(recData.data.data);
        }
      }

    } catch (error) {
      console.error("Error fetching dish:", error);
      if (error.response?.status === 423) {
        setSuspended(true);
      } else if (error.response?.status === 404) {
        setDish(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDish();
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [id, slug]);

  const arStatusConfig = {
    completed: {
      label: "View in AR",
      color: "green",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: () => navigate(`/r/${slug}/ar/${id}`)
    },
    processing: {
      label: "Generating AR Model...",
      color: "yellow",
      icon: <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
    },
    default: {
      label: "AR Not Available",
      color: "gray",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    }
  };

  const getArStatus = () => {
    return arStatusConfig[dish?.modelStatus] || arStatusConfig.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--menu-bg)', color: 'var(--menu-secondary)', fontFamily: 'var(--menu-font)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--menu-primary)' }}></div>
          <p className="mt-3 font-medium" style={{ color: 'var(--menu-secondary)', opacity: 0.7 }}>Loading dish details...</p>
        </div>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--menu-bg)', color: 'var(--menu-secondary)', fontFamily: 'var(--menu-font)' }}>
        <div className="text-center max-w-md mx-auto p-6 rounded-3xl shadow-xl border" style={{ background: 'var(--menu-bg)', borderColor: 'var(--menu-accent)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border" style={{ background: 'var(--menu-accent)', borderColor: 'var(--menu-accent)' }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--menu-primary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Dish Not Found</h3>
          <p className="opacity-70 mb-4">The dish you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate(`/r/${slug}/menu`)}
            className="px-6 py-2 rounded-lg transition-all shadow-md font-bold"
            style={{ background: 'var(--menu-primary)', color: 'var(--menu-primary-text)' }}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const arStatus = getArStatus();
  const uniqueTags = getUniqueTags();

  return (
    <div style={{ background: 'var(--menu-bg)', color: 'var(--menu-secondary)', fontFamily: 'var(--menu-font)', minHeight: '100dvh' }}>
      {suspended && (
        <div className="bg-red-600 text-white px-4 py-3 text-center shadow-lg sticky top-0 z-50 border-b border-red-400/20">
          <p className="font-bold flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            Temporarily Closed
          </p>
        </div>
      )}

      {/* Header */}
      <div className={`backdrop-blur-xl border-b sticky ${suspended ? 'top-12' : 'top-0'} z-20 shadow-sm`} style={{ background: 'var(--menu-bg)', borderColor: 'var(--menu-accent)', opacity: 0.98 }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button
            onClick={() => navigate(`/r/${slug}/menu`)}
            className="flex items-center gap-2 font-bold transition-colors group"
            style={{ color: 'var(--menu-primary)' }}
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Menu
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-3 md:p-8 lg:p-10 pb-0">
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-20">

          {/* Left Column - Image and AR */}
          <div className="w-full lg:w-1/2">
            <div className="sticky top-24 space-y-6">
              <div className="relative aspect-square md:aspect-4/3 w-full rounded-3xl overflow-hidden shadow-xl border" style={{ background: 'var(--menu-bg)', borderColor: 'var(--menu-accent)' }}>
                {!imageError && dish.imageUrl ? (
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className={`w-full h-full object-cover transition-all duration-700 ${!dish.available ? 'grayscale blur-[2px] opacity-70' : ''}`}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                    <div className="text-center text-amber-400">
                      <span className="text-4xl block mb-2">🍽️</span>
                      <p className="text-sm font-medium">Image Not Available</p>
                    </div>
                  </div>
                )}

                {!dish.available && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                    <span className="bg-red-600 text-white px-6 py-2 rounded-full text-lg font-bold shadow-2xl transform -rotate-6 border-4 border-white tracking-widest">
                      SOLD OUT
                    </span>
                  </div>
                )}
              </div>

              {/* AR Button */}
              <div className="rounded-2xl p-1 shadow-md border" style={{ background: 'var(--menu-bg)', borderColor: 'var(--menu-accent)' }}>
                {arStatus.color === "green" ? (
                  <button
                    onClick={arStatus.action}
                    disabled={suspended}
                    className={`w-full group bg-slate-900 hover:bg-black text-white py-4 px-6 rounded-xl font-bold shadow-lg transition-all flex items-center justify-between transform hover:-translate-y-0.5 ${suspended ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                        {arStatus.icon}
                      </span>
                      <div className="text-left">
                        <span className="block text-sm text-slate-400">Experience it in 3D</span>
                        <span className="block text-lg text-white">View in AR</span>
                      </div>
                    </span>
                    <svg className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-center gap-3 text-slate-400 border border-dashed border-slate-200">
                    {arStatus.icon}
                    <span className="text-sm font-medium">{arStatus.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="w-full lg:w-1/2 space-y-6 lg:pb-0">
            {/* Header Info */}
            <div>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm" style={{ background: 'transparent', color: 'var(--menu-primary)', borderColor: 'var(--menu-primary)' }}>
                  {normalizeCategory(dish.category)}
                </span>
                {uniqueTags.map((tag, idx) => (
                  <span key={idx} className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getTagColor(tag)}`}>
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-xl md:text-3xl font-black mb-3" style={{ color: 'var(--menu-secondary)' }}>
                {dish.name}
              </h1>

              <div className="flex items-baseline gap-4 py-4 border-b" style={{ borderColor: 'var(--menu-accent)' }}>
                <span className="text-xl md:text-3xl font-black" style={{ color: 'var(--menu-primary)' }}>₹{dish.price}</span>
                {dish.portionSize && (
                  <span className="text-sm font-bold" style={{ color: 'var(--menu-secondary)', opacity: 0.5 }}>/ {dish.portionSize}</span>
                )}
              </div>
            </div>

            {/* Mobile Add to Order */}
            <div className={`lg:hidden mb-6 pb-6 border-b ${(!dish.available || suspended) ? 'opacity-50 pointer-events-none' : ''}`} style={{ borderColor: 'var(--menu-accent)' }}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border rounded-xl px-4 py-3 shadow-md" style={{ background: 'var(--menu-bg)', borderColor: 'var(--menu-accent)' }}>
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-xl font-black transition-colors rounded-lg shadow-sm disabled:opacity-30"
                    style={{ color: 'var(--menu-secondary)' }}
                    disabled={quantity <= 1}
                  >-</button>
                  <span className="text-xl font-black w-8 text-center" style={{ color: 'var(--menu-secondary)' }}>{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-xl font-black transition-colors rounded-lg shadow-sm"
                    style={{ color: 'var(--menu-secondary)' }}
                  >+</button>
                </div>

                <button
                  onClick={handleAddToOrder}
                  disabled={suspended || !dish.available}
                  className={`w-full text-sm font-black py-3 px-5 rounded-xl shadow-lg transition-all transform flex items-center justify-center gap-3 ${suspended || !dish.available ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-1'}`}
                  style={suspended || !dish.available ? { background: 'var(--menu-accent)', color: 'var(--menu-secondary)' } : { background: 'var(--menu-primary)', color: 'var(--menu-primary-text)' }}
                >
                  <span>{suspended ? 'Ordering Unavailable' : 'Add to Order'}</span>
                  {!suspended && dish.available && <span className="bg-black/10 px-2.5 py-0.5 rounded-lg text-sm">₹{dish.price * quantity}</span>}
                </button>

                <div className="text-center">
                  <button onClick={() => navigate(`/r/${slug}/cart`)} className="text-sm font-bold text-slate-500 hover:text-amber-600 underline decoration-2 decoration-transparent hover:decoration-amber-200 transition-all">
                    View current order →
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            {dish.description && (
              <div className="prose prose-slate max-w-none">
                <p className="text-base text-slate-600 leading-relaxed font-medium">{dish.description}</p>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="py-4">
                <h3 className="text-lg font-black mb-4" style={{ color: 'var(--menu-secondary)' }}>People Also Ordered With This Dish</h3>
                <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                  <div className="flex gap-4 w-max">
                    {recommendations.map((recDish) => {
                      const isSmartRec = recDish.recommendedDish;
                      const dish = isSmartRec ? recDish.recommendedDish : recDish;
                      const message = isSmartRec ? recDish.message : "Popular with this item";
                      const finalPrice = isSmartRec && recDish.discountPercentage > 0
                        ? Math.round(dish.price * (1 - recDish.discountPercentage / 100))
                        : dish.price;

                      return (
                        <div key={dish._id} className="w-48 rounded-2xl border overflow-hidden shrink-0 transition-all shadow-md group"
                          style={{ background: 'var(--menu-bg)', borderColor: 'var(--menu-accent)' }}>
                          <div
                            className="h-32 w-full cursor-pointer overflow-hidden relative"
                            style={{ background: 'var(--menu-accent)' }}
                            onClick={() => navigate(`/r/${slug}/dish/${dish._id}`)}
                          >
                            {dish.imageUrl ? (
                              <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🍽️</div>
                            )}
                            {isSmartRec && recDish.discountPercentage > 0 && (
                              <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                                {recDish.discountPercentage}% OFF
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h4
                              className="text-sm font-black truncate cursor-pointer transition-colors"
                              style={{ color: 'var(--menu-secondary)' }}
                              onClick={() => navigate(`/r/${slug}/dish/${dish._id}`)}
                            >
                              {dish.name}
                            </h4>
                            {isSmartRec && message && (
                              <p className="text-[10px] text-slate-500 italic leading-tight mt-1 line-clamp-2">
                                "{message}"
                              </p>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-sm font-black" style={{ color: 'var(--menu-primary)' }}>₹{finalPrice}</span>
                                {isSmartRec && recDish.discountPercentage > 0 && (
                                  <span className="text-[10px] text-slate-400 line-through">₹{dish.price}</span>
                                )}
                              </div>
                              <button
                                onClick={() => handleAddRecommendationToOrder(dish, finalPrice)}
                                className="p-1.5 rounded-lg transition-all shadow-sm active:scale-95 border"
                                style={{ background: 'var(--menu-accent)', color: 'var(--menu-primary)', borderColor: 'var(--menu-accent)' }}
                                title="Add to Order"
                                disabled={suspended}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Ingredients and Dietary Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dish.ingredients?.length > 0 && (
                <div>
                  <h3 className="text-lg font-black mb-3 flex items-center gap-2" style={{ color: 'var(--menu-secondary)' }}>
                    <span>🥬</span> Ingredients
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {dish.ingredients.map((ing, i) => (
                      <span key={i} className="px-3 py-1.5 border rounded-xl text-sm font-bold shadow-sm"
                        style={{ background: 'transparent', borderColor: 'var(--menu-primary)', color: 'var(--menu-primary)' }}>
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-black mb-3 flex items-center gap-2" style={{ color: 'var(--menu-secondary)' }}>
                  <span>ℹ️</span> Dietary Info
                </h3>
                <div className="p-4 rounded-xl text-sm leading-snug shadow-sm font-bold border"
                  style={{ background: 'transparent', borderColor: 'var(--menu-primary)', color: 'var(--menu-primary)' }}>
                  Specific allergies? Please verify with staff. Kitchen handles common allergens.
                </div>
              </div>
            </div>

            {/* Nutritional Info */}
            {dish.nutritionalInfo && (
              <div className="p-5 rounded-2xl border shadow-md" style={{ background: 'transparent', borderColor: 'var(--menu-primary)' }}>
                <h3 className="text-lg font-black mb-4" style={{ color: 'var(--menu-secondary)' }}>Nutritional Facts</h3>
                <div className="grid grid-cols-4 gap-2 text-center divide-x" style={{ borderColor: 'var(--menu-accent)' }}>
                  <div>
                    <div className="text-lg font-black" style={{ color: 'var(--menu-primary)' }}>{dish.nutritionalInfo.calories || 0}</div>
                    <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--menu-secondary)', opacity: 0.5 }}>Cals</div>
                  </div>
                  <div>
                    <div className="text-lg font-black" style={{ color: 'var(--menu-secondary)' }}>{dish.nutritionalInfo.protein || 0}g</div>
                    <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--menu-secondary)', opacity: 0.5 }}>Protein</div>
                  </div>
                  <div>
                    <div className="text-lg font-black" style={{ color: 'var(--menu-secondary)' }}>{dish.nutritionalInfo.carbs || 0}g</div>
                    <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--menu-secondary)', opacity: 0.5 }}>Carbs</div>
                  </div>
                  <div>
                    <div className="text-lg font-black" style={{ color: 'var(--menu-secondary)' }}>{dish.nutritionalInfo.sugar || 0}g</div>
                    <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--menu-secondary)', opacity: 0.5 }}>Sugar</div>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Add to Order */}
            <div className={`hidden lg:block mt-8 pt-8 border-t ${(!dish.available || suspended) ? 'opacity-50 pointer-events-none' : ''}`} style={{ borderColor: 'var(--menu-accent)' }}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center justify-between border rounded-xl px-4 py-2 sm:w-40 shadow-md" style={{ background: 'var(--menu-bg)', borderColor: 'var(--menu-accent)' }}>
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-xl font-black transition-colors rounded-lg shadow-sm disabled:opacity-30"
                    style={{ color: 'var(--menu-secondary)' }}
                    disabled={quantity <= 1}
                  >-</button>
                  <span className="font-black text-xl w-8 text-center" style={{ color: 'var(--menu-secondary)' }}>{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-xl font-black transition-colors rounded-lg shadow-sm"
                    style={{ color: 'var(--menu-secondary)' }}
                  >+</button>
                </div>

                <button
                  onClick={handleAddToOrder}
                  disabled={suspended || !dish.available}
                  className={`flex-1 text-base font-black py-3 px-6 rounded-xl shadow-lg transition-all transform flex items-center justify-center gap-3 ${suspended || !dish.available ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-1'}`}
                  style={suspended || !dish.available ? { background: 'var(--menu-accent)', color: 'var(--menu-secondary)' } : { background: 'var(--menu-primary)', color: 'var(--menu-primary-text)' }}
                >
                  <span>{suspended ? 'Ordering Unavailable' : 'Add to Order'}</span>
                  {!suspended && dish.available && <span className="bg-black/10 px-2.5 py-0.5 rounded-lg text-sm">₹{dish.price * quantity}</span>}
                </button>
              </div>

              <div className="mt-4 text-center">
                <button onClick={() => navigate(`/r/${slug}/cart`)} className="text-sm font-bold text-slate-500 hover:text-amber-600 underline decoration-2 decoration-transparent hover:decoration-amber-200 transition-all">
                  View current order →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-2 px-4">
        <p className="text-sm text-slate-500 font-bold">
          💫 All prices include taxes & service charges.
        </p>
      </div>
    </div>
  );
}