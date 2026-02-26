// import { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { useNavigate, useParams } from "react-router-dom";
// import { useOrder } from "../../context/OrderContext";
// import { useTenant } from "../../context/TenantProvider";
// import { useToast } from "../../components/common/Toast/ToastContext";
// import Loading from "../../components/common/Loading";
// import EmptyState from "../../components/common/EmptyState";

// export default function Menu() {
//   const navigate = useNavigate();
//   const { slug } = useTenant();
//   const { items, addItem, updateQuantity } = useOrder();
//   const { showSuccess, showError } = useToast();
//   const [dishes, setDishes] = useState([]);
//   const [restaurant, setRestaurant] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [sortOption, setSortOption] = useState("recommended");
//   const [activeCategory, setActiveCategory] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [suspended, setSuspended] = useState(false);
//   const [notFound, setNotFound] = useState(false);

//   const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

//   const getTagColor = (tag) => {
//     const tagLower = tag.toLowerCase();
//     if (tagLower.includes('spicy')) return 'bg-red-100 text-red-700';
//     if (tagLower.includes('vegan')) return 'bg-green-100 text-green-700';
//     if (tagLower.includes('vegetarian')) return 'bg-emerald-100 text-emerald-700';
//     if (tagLower.includes('gluten')) return 'bg-yellow-100 text-yellow-700';
//     if (tagLower.includes('hot')) return 'bg-orange-100 text-orange-700';
//     return 'bg-gray-100 text-gray-700';
//   };

//   const categories = [
//     "all", "appetizers", "main course", "desserts", "beverages", "soups", "salads", "specials"
//   ];

//   const sortOptions = [
//     { value: "recommended", label: "Recommended" },
//     { value: "most_ordered", label: "Most Ordered" },
//     { value: "budget", label: "Budget Friendly" },
//     { value: "chef_special", label: "Chef's Special" },
//   ];

//   const fetchDishes = async () => {
//     if (!slug) return;

//     try {
//       setLoading(true);
//       const res = await axiosClient.get(`/dishes/r/${slug}/dishes`, {
//         params: { sort: sortOption !== "recommended" ? sortOption : undefined }
//       });
//       setDishes(res.data.data?.dishes || []);
//       if (res.data.data?.restaurant) {
//         setRestaurant(res.data.data.restaurant);
//       }
//     } catch (error) {
//       console.error("Error fetching dishes:", error);
//       if (error.response?.status === 423) {
//         setSuspended(true);
//       } else if (error.response?.status === 404) {
//         setNotFound(true);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDishes();
//   }, [sortOption, slug]);

//   const handleAddToCart = (dish) => {
//     if (suspended) {
//       showError("Ordering is temporarily unavailable.");
//       return;
//     }
//     addItem(dish, 1);
//     showSuccess(`Added 1 x ${dish.name} reached your table!`);
//   };

//   const getItemQuantity = (dishId) => {
//     const item = items.find(i => i.dishId === dishId);
//     return item ? item.quantity : 0;
//   };

//   const filteredDishes = dishes.filter(dish => {
//     const matchesCategory = activeCategory === "all" ||
//       dish.category?.toLowerCase() === activeCategory.toLowerCase();
//     const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       dish.description?.toLowerCase().includes(searchTerm.toLowerCase());
//     return matchesCategory && matchesSearch;
//   });

//   const dishesByCategory = filteredDishes.reduce((acc, dish) => {
//     const category = dish.category || "Uncategorized";
//     if (!acc[category]) acc[category] = [];
//     acc[category].push(dish);
//     return acc;
//   }, {});

//   if (notFound) {
//     return (
//       <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
//         <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 text-center max-w-md w-full">
//           <div className="text-6xl mb-4">🏠</div>
//           <h1 className="text-2xl font-bold text-gray-800 mb-2">Restaurant Not Found</h1>
//           <p className="text-gray-600">The restaurant you are looking for does not exist or has closed.</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-amber-50 pb-20">
//       {suspended && (
//         <div className="bg-red-600 text-white px-4 py-3 text-center shadow-md sticky top-0 z-50">
//           <p className="font-bold flex items-center justify-center gap-2">
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
//             Temporarily Closed
//           </p>
//           <p className="text-sm opacity-90">Ordering is currently unavailable. Please check back later.</p>
//         </div>
//       )}

//       { }
//       <div className={`bg-white/80 backdrop-blur-md border-b border-amber-100 sticky ${suspended ? 'top-16' : 'top-0'} z-30 shadow-sm transition-all duration-300`}>
//         <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
//           { }
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
//               {restaurant?.name?.charAt(0) || "R"}
//             </div>
//             <h1 className="type-h2 text-gray-800 tracking-tight">
//               {restaurant?.name || (
//                 <>
//                   Restaurant<span className="text-amber-600">AR</span>
//                 </>
//               )}
//             </h1>
//           </div>

//           <div className="flex items-center gap-4">
//             { }
//             <button
//               onClick={() => navigate(`/r/${slug}/track-order`)}
//               className="px-5 py-2 text-sm font-semibold text-amber-700 bg-orange-50 hover:bg-orange-100 rounded-full border border-orange-100 transition-all shadow-sm hidden sm:flex items-center gap-2"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//               </svg>
//               Track Order
//             </button>

//             { }
//             <button
//               onClick={() => navigate(`/r/${slug}/track-order`)}
//               className="p-2 text-amber-700 bg-orange-50 hover:bg-orange-100 rounded-full border border-orange-100 sm:hidden transition-colors"
//             >
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//               </svg>
//             </button>

//             { }
//             <button
//               onClick={() => navigate(`/r/${slug}/cart`)}
//               className="group relative p-2 text-gray-600 hover:text-amber-600 transition-colors bg-gray-50 hover:bg-amber-50 rounded-full border border-transparent hover:border-amber-100"
//             >
//               <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
//               </svg>
//               {cartItemCount > 0 && (
//                 <span className="absolute -top-0.5 -right-0.5 bg-amber-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md ring-2 ring-white animate-fade-in-scale">
//                   {cartItemCount}
//                 </span>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="px-4">
//         {/* Header Section */}
//         <div className="max-w-6xl mx-auto mb-6 text-center">
//           <h2 className="type-h1 text-amber-700 mb-2 mt-2">Our Menu</h2>
//           <div className="w-16 h-1 bg-amber-400 mx-auto mb-3 opacity-50"></div>
//           <p className="type-secondary max-w-2xl mx-auto">
//             Discover our carefully crafted dishes made with the finest ingredients
//           </p>
//         </div>

//         {/* Search and Filters Section */}
//         <div className="max-w-4xl mx-auto sticky top-[72px] z-20 bg-amber-50/95 backdrop-blur-sm py-4 -mx-4 px-4 mb-2">
//           <div className="flex flex-col gap-4">
//             {/* Search Bar Row */}
//             <div className="flex gap-2">
//               <div className="relative flex-1">
//                 <input
//                   type="text"
//                   placeholder="Search for dishes..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-3 bg-white border border-amber-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm transition-all"
//                 />
//                 <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
//                   <svg className="w-5 h-5 text-amber-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                   </svg>
//                 </div>
//               </div>

//               {/* Sort Button/Dropdown */}
//               <div className="relative shrink-0">
//                 <select
//                   value={sortOption}
//                   onChange={(e) => setSortOption(e.target.value)}
//                   className="appearance-none h-full pl-4 pr-10 py-3 bg-white border border-amber-100 rounded-2xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium cursor-pointer shadow-sm transition-all text-sm"
//                 >
//                   {sortOptions.map(option => (
//                     <option key={option.value} value={option.value}>
//                       {option.label}
//                     </option>
//                   ))}
//                 </select>
//                 <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-amber-600">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                   </svg>
//                 </div>
//               </div>
//             </div>

//             {/* Horizontal Categories */}
//             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-1 -mx-1">
//               {categories.map(category => (
//                 <button
//                   key={category}
//                   onClick={() => setActiveCategory(category)}
//                   className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all duration-300 border ${activeCategory === category
//                     ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-200"
//                     : "bg-white text-gray-600 border-amber-100 hover:border-amber-300 hover:bg-amber-50"
//                     }`}
//                 >
//                   {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>


//         { }
//         {loading ? (
//           <Loading message="Loading our delicious menu..." />
//         ) : filteredDishes.length === 0 ? (
//           <EmptyState
//             title="No dishes found"
//             message="Try adjusting your search or filter criteria"
//             icon="🍽️"
//             actionLabel="Clear Filters"
//             onAction={() => { setSearchTerm(""); setActiveCategory("all"); }}
//           />
//         ) : (

//           <div className="max-w-6xl mx-auto">
//             {Object.entries(dishesByCategory).map(([category, categoryDishes]) => (
//               <div key={category} className="mb-8">
//                 { }
//                 <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-amber-200">
//                   <h2 className="type-h2 text-gray-800">
//                     {category.charAt(0).toUpperCase() + category.slice(1)}
//                   </h2>
//                   <span className="type-label text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
//                     {categoryDishes.length} {categoryDishes.length === 1 ? 'item' : 'items'}
//                   </span>
//                 </div>

//                 { }
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {categoryDishes.map((dish) => (
//                     <div
//                       key={dish._id}
//                       onClick={() => navigate(`/r/${slug}/dish/${dish._id}`)}
//                       className="card-premium hover:shadow-xl cursor-pointer overflow-hidden group border-amber-100 flex flex-col h-full"
//                     >
//                       { }
//                       <div className="relative overflow-hidden bg-white h-40 shrink-0">
//                         <img
//                           src={dish.imageUrl}
//                           alt={dish.name}
//                           className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 bg-white ${!dish.available ? 'grayscale opacity-75' : ''}`}
//                           onError={(e) => {

//                             e.target.style.display = 'none';
//                             const placeholder = e.target.parentElement.querySelector('.image-placeholder');
//                             if (placeholder) {
//                               placeholder.classList.remove('hidden');
//                             }
//                           }}
//                         />
//                         { }
//                         {!dish.available && (
//                           <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] z-10">
//                             <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg transform -rotate-6 border-2 border-white">
//                               SOLD OUT
//                             </span>
//                           </div>
//                         )}
//                         { }
//                         <div className="image-placeholder hidden w-full h-full items-center justify-center bg-amber-100">
//                           <div className="text-center">
//                             <svg className="w-10 h-10 text-amber-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                             </svg>
//                             <p className="text-amber-600 text-xs font-medium">No Image</p>
//                           </div>
//                         </div>
//                         { }
//                       </div>

//                       { }
//                       <div className="p-4 flex flex-col flex-1">
//                         <div className="flex justify-between items-start mb-2">
//                           <h3 className="type-h3 text-gray-900 group-hover:text-amber-700 transition-colors flex-1 mr-2 leading-tight">
//                             {dish.name}
//                           </h3>
//                         </div>

//                         { }
//                         <div className="mb-2">
//                           <span className="inline-flex items-center gap-1 badge-standard bg-amber-100 text-amber-800">
//                             🍽️ {dish.category.charAt(0).toUpperCase() + dish.category.slice(1)}
//                           </span>
//                         </div>

//                         { }
//                         {dish.tags?.length > 0 && (
//                           <div className="flex flex-wrap gap-1 mb-2">
//                             {dish.tags.map((tag, idx) => (
//                               <span
//                                 key={idx}
//                                 className={`badge-standard ${getTagColor(tag)}`}
//                               >
//                                 {tag}
//                               </span>
//                             ))}
//                           </div>
//                         )}

//                         {dish.description && (
//                           <p className="type-secondary mb-4 line-clamp-2">
//                             {dish.description}
//                           </p>
//                         )}

//                         <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50 gap-2">
//                           <span className="type-metric text-amber-600 font-bold">
//                             ₹{dish.price}
//                           </span>

//                           <div className="flex items-center gap-2">
//                             {getItemQuantity(dish._id) > 0 ? (
//                               <div
//                                 className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-2 py-1 shadow-sm"
//                                 onClick={(e) => e.stopPropagation()}
//                               >
//                                 <button
//                                   onClick={() => updateQuantity(dish._id, getItemQuantity(dish._id) - 1)}
//                                   className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-amber-100 text-amber-600 font-bold hover:bg-amber-100 transition-colors"
//                                 >
//                                   -
//                                 </button>
//                                 <span className="font-bold text-amber-800 text-xs px-2">{getItemQuantity(dish._id)}</span>
//                                 <button
//                                   onClick={() => updateQuantity(dish._id, getItemQuantity(dish._id) + 1)}
//                                   className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-amber-100 text-amber-600 font-bold hover:bg-amber-100 transition-colors"
//                                 >
//                                   +
//                                 </button>
//                               </div>
//                             ) : (
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   handleAddToCart(dish);
//                                 }}
//                                 disabled={!dish.available || suspended}
//                                 className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 ${!dish.available || suspended
//                                   ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
//                                   : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95 shadow-amber-200'
//                                   }`}
//                               >
//                                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                                 </svg>
//                                 Add
//                               </button>
//                             )}

//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 navigate(`/r/${slug}/dish/${dish._id}`);
//                               }}
//                               disabled={!dish.available}
//                               className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 shadow-md ${!dish.available
//                                 ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
//                                 : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95 shadow-amber-200'
//                                 }`}
//                             >
//                               View
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         { }
//         <div className="max-w-6xl mx-auto mt-8 mb-4 text-center bg-white rounded-lg p-4 border border-amber-100">
//           <p className="text-sm text-gray-500">
//             💫 All prices include taxes. Please inform us of any dietary restrictions.
//           </p>
//           <p className="text-amber-600 font-semibold mt-1 text-sm">
//             Thank you for choosing us!
//           </p>
//         </div>
//       </div>

//       { }
//       { }
//     </div>
//   );
// }

// ----------------------------- Dark below -----------------------------

// import { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { useNavigate, useParams } from "react-router-dom";
// import { useOrder } from "../../context/OrderContext";
// import { useTenant } from "../../context/TenantProvider";
// import { useToast } from "../../components/common/Toast/ToastContext";
// import Loading from "../../components/common/Loading";
// import EmptyState from "../../components/common/EmptyState";

// export default function Menu() {
//   const navigate = useNavigate();
//   const { slug } = useTenant();
//   const { items, addItem, updateQuantity } = useOrder();
//   const { showSuccess, showError } = useToast();
//   const [dishes, setDishes] = useState([]);
//   const [restaurant, setRestaurant] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [sortOption, setSortOption] = useState("recommended");
//   const [activeCategory, setActiveCategory] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [suspended, setSuspended] = useState(false);
//   const [notFound, setNotFound] = useState(false);
//   const [showFilters, setShowFilters] = useState(false);

//   const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

//   const normalizeCategory = (category) => {
//     if (!category) return "Uncategorized";
//     return category
//       .toLowerCase()
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
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

//   const categories = [
//     "all",
//     ...new Set(dishes.map((d) => normalizeCategory(d.category)))
//   ];

//   const sortOptions = [
//     { value: "recommended", label: "Recommended" },
//     { value: "most_ordered", label: "Most Ordered" },
//     { value: "budget", label: "Budget Friendly" },
//     { value: "chef_special", label: "Chef's Special" },
//   ];

//   const fetchDishes = async () => {
//     if (!slug) return;

//     try {
//       setLoading(true);
//       const res = await axiosClient.get(`/dishes/r/${slug}/dishes`, {
//         params: { sort: sortOption !== "recommended" ? sortOption : undefined }
//       });
//       setDishes(res.data.data?.dishes || []);
//       if (res.data.data?.restaurant) {
//         setRestaurant(res.data.data.restaurant);
//       }
//     } catch (error) {
//       console.error("Error fetching dishes:", error);
//       if (error.response?.status === 423) {
//         setSuspended(true);
//       } else if (error.response?.status === 404) {
//         setNotFound(true);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDishes();
//   }, [sortOption, slug]);

//   const handleAddToCart = (dish) => {
//     if (suspended) {
//       showError("Ordering is temporarily unavailable.");
//       return;
//     }
//     addItem(dish, 1);
//     showSuccess(`Added 1 x ${dish.name} reached your table!`);
//   };

//   const getItemQuantity = (dishId) => {
//     const item = items.find(i => i.dishId === dishId);
//     return item ? item.quantity : 0;
//   };

//   const filteredDishes = dishes.filter(dish => {
//     const matchesCategory = activeCategory === "all" ||
//       dish.category?.toLowerCase() === activeCategory.toLowerCase();
//     const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       dish.description?.toLowerCase().includes(searchTerm.toLowerCase());
//     return matchesCategory && matchesSearch;
//   });

//   const dishesByCategory = filteredDishes.reduce((acc, dish) => {
//     const normalized = normalizeCategory(dish.category);
//     if (!acc[normalized]) acc[normalized] = [];
//     acc[normalized].push(dish);
//     return acc;
//   }, {});

//   if (notFound) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
//         <div className="bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-red-500/20 text-center max-w-md w-full">
//           <div className="text-6xl mb-4">🏠</div>
//           <h1 className="text-2xl font-bold text-slate-100 mb-2">Restaurant Not Found</h1>
//           <p className="text-slate-400">The restaurant you are looking for does not exist or has closed.</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
//       {suspended && (
//         <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-3 text-center shadow-lg sticky top-0 z-50 border-b border-red-400/20">
//           <p className="font-bold flex items-center justify-center gap-2 text-sm md:text-base">
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
//             Temporarily Closed
//           </p>
//           <p className="text-xs md:text-sm opacity-90">Ordering is currently unavailable. Please check back later.</p>
//         </div>
//       )}

//       {/* Fixed Header */}
//       <div className={`bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky ${suspended ? 'top-16' : 'top-0'} z-40 shadow-2xl`}>
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16 md:h-18">
//             {/* Logo */}
//             <div className="flex items-center gap-2 md:gap-3">
//               <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shadow-amber-500/30 ring-2 ring-amber-500/20">
//                 {restaurant?.name?.charAt(0) || "R"}
//               </div>
//               <h1 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
//                 {restaurant?.name || (
//                   <>
//                     Restaurant<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">AR</span>
//                   </>
//                 )}
//               </h1>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex items-center gap-2 md:gap-3">
//               {/* Track Order Button Desktop */}
//               <button
//                 onClick={() => navigate(`/r/${slug}/track-order`)}
//                 className="px-4 md:px-4 py-2 text-xs md:text-sm font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-full border border-amber-500/30 transition-all shadow-lg shadow-amber-500/10 hidden sm:flex items-center gap-2"
//               >
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//                 </svg>
//                 <span className="hidden lg:inline">Track Order</span>
//               </button>

//               {/* Track Order Button Mobile */}
//               <button
//                 onClick={() => navigate(`/r/${slug}/track-order`)}
//                 className="p-2.5 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-full border border-amber-500/30 sm:hidden transition-colors shadow-lg shadow-amber-500/10"
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//                 </svg>
//               </button>

//               {/* Cart Button */}
//               <button
//                 onClick={() => navigate(`/r/${slug}/cart`)}
//                 className="group relative p-2.5 text-slate-400 hover:text-amber-400 transition-all bg-slate-800/50 hover:bg-amber-500/10 rounded-full border border-slate-700/50 hover:border-amber-500/30 shadow-lg"
//               >
//                 <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
//                 </svg>
//                 {cartItemCount > 0 && (
//                   <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] md:text-xs font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-slate-900 px-1.5">
//                     {cartItemCount}
//                   </span>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Compact Search and Filter Section */}
//       <div className={`sticky ${suspended ? 'top-32 md:top-32' : 'top-16 md:top-18'} z-30 bg-slate-900/98 backdrop-blur-xl border-b border-slate-800/50 shadow-xl`}>
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
//           {/* Top Row: Our Menu + Search + Filter Button */}
//           <div className="flex items-center gap-3 md:gap-4 mb-3">
//             {/* Our Menu Title */}
//             <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 whitespace-nowrap">
//               Our Menu
//             </h2>

//             {/* Search Bar */}
//             <div className="relative flex-1">
//               <input
//                 type="text"
//                 placeholder="Search dishes..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-10 py-2.5 md:py-3 bg-slate-800/50 border border-slate-700/50 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 shadow-lg text-slate-200 placeholder-slate-500 transition-all text-sm md:text-base"
//               />
//               <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
//                 <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                 </svg>
//               </div>
//               {searchTerm && (
//                 <button
//                   onClick={() => setSearchTerm("")}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700/50 rounded-full transition-colors"
//                 >
//                   <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>
//               )}
//             </div>

//             {/* Filter Button */}
//             <button
//               onClick={() => setShowFilters(!showFilters)}
//               className={`flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-full font-semibold text-sm transition-all shadow-lg border whitespace-nowrap ${showFilters || activeCategory !== "all" || sortOption !== "recommended"
//                 ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-500/50 shadow-amber-500/30"
//                 : "bg-slate-800/50 text-slate-300 border-slate-700/50 hover:border-amber-500/30 hover:bg-slate-700/50"
//                 }`}
//             >
//               <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
//               </svg>
//               <span className="hidden sm:inline">Filters</span>
//               {(activeCategory !== "all" || sortOption !== "recommended") && (
//                 <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
//                   {(activeCategory !== "all" ? 1 : 0) + (sortOption !== "recommended" ? 1 : 0)}
//                 </span>
//               )}
//             </button>
//           </div>

//           {/* Collapsible Filters Section */}
//           {showFilters && (
//             <div className="space-y-3 md:space-y-4 animate-slide-down">
//               {/* Sort Dropdown */}
//               <div className="flex items-center gap-3">
//                 <label className="text-sm font-medium text-slate-400 whitespace-nowrap">Sort by:</label>
//                 <div className="relative flex-1">
//                   <select
//                     value={sortOption}
//                     onChange={(e) => setSortOption(e.target.value)}
//                     className="appearance-none w-full pl-4 pr-10 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 font-medium cursor-pointer shadow-lg transition-all text-sm"
//                   >
//                     {sortOptions.map(option => (
//                       <option key={option.value} value={option.value} className="bg-slate-800">
//                         {option.label}
//                       </option>
//                     ))}
//                   </select>
//                   <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-amber-500">
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>

//               {/* Categories */}
//               <div>
//                 <label className="text-sm font-medium text-slate-400 mb-2 block">Categories:</label>
//                 <div className="flex flex-wrap gap-2">
//                   {categories.map(category => (
//                     <button
//                       key={category}
//                       onClick={() => setActiveCategory(category)}
//                       className={`px-4 py-2 rounded-full whitespace-nowrap text-xs md:text-sm font-semibold transition-all duration-300 border shadow-lg ${activeCategory === category
//                         ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-500/50 shadow-amber-500/30 scale-105"
//                         : "bg-slate-800/50 text-slate-300 border-slate-700/50 hover:border-amber-500/30 hover:bg-slate-700/50 hover:text-amber-400"
//                         }`}
//                     >
//                       {category === 'all' ? 'All' : normalizeCategory(category)}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Clear Filters */}
//               {(activeCategory !== "all" || sortOption !== "recommended") && (
//                 <button
//                   onClick={() => {
//                     setActiveCategory("all");
//                     setSortOption("recommended");
//                   }}
//                   className="text-sm text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                   Clear all filters
//                 </button>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Content Section */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-20 md:pb-24">
//         {loading ? (
//           <Loading message="Loading our delicious menu..." />
//         ) : filteredDishes.length === 0 ? (
//           <EmptyState
//             title="No dishes found"
//             message="Try adjusting your search or filter criteria"
//             icon="🍽️"
//             actionLabel="Clear Filters"
//             onAction={() => { setSearchTerm(""); setActiveCategory("all"); }}
//           />
//         ) : (
//           <div className="space-y-8 md:space-y-10">
//             {Object.entries(dishesByCategory).map(([category, categoryDishes]) => (
//               <div key={category} className="animate-fade-in">
//                 {/* Category Header */}
//                 <div className="flex items-center justify-between mb-4 md:mb-5 pb-3 border-b border-slate-800/50">
//                   <h3 className="text-xl md:text-2xl font-bold text-slate-100">
//                     {category}
//                   </h3>
//                   <span className="text-xs md:text-sm font-semibold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30">
//                     {categoryDishes.length} {categoryDishes.length === 1 ? 'item' : 'items'}
//                   </span>
//                 </div>

//                 {/* Dishes Grid */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
//                   {categoryDishes.map((dish) => (
//                     <div
//                       key={dish._id}
//                       onClick={() => navigate(`/r/${slug}/dish/${dish._id}`)}
//                       className="group bg-slate-800/40 backdrop-blur-sm rounded-2xl hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer overflow-hidden border border-slate-700/50 hover:border-amber-500/30 flex flex-col h-full transition-all duration-300 hover:scale-[1.02]"
//                     >
//                       {/* Image Section */}
//                       <div className="relative overflow-hidden bg-slate-900 h-44 md:h-48 shrink-0">
//                         <img
//                           src={dish.imageUrl}
//                           alt={dish.name}
//                           className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${!dish.available ? 'grayscale opacity-50' : ''}`}
//                           onError={(e) => {
//                             e.target.style.display = 'none';
//                             const placeholder = e.target.parentElement.querySelector('.image-placeholder');
//                             if (placeholder) {
//                               placeholder.classList.remove('hidden');
//                             }
//                           }}
//                         />
//                         {/* Sold Out Badge */}
//                         {!dish.available && (
//                           <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
//                             <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-1.5 rounded-full text-xs md:text-sm font-bold shadow-xl transform -rotate-6 border-2 border-red-400/50">
//                               SOLD OUT
//                             </span>
//                           </div>
//                         )}
//                         {/* Placeholder */}
//                         <div className="image-placeholder hidden w-full h-full items-center justify-center bg-slate-800">
//                           <div className="text-center">
//                             <svg className="w-12 h-12 text-amber-500/30 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                             </svg>
//                             <p className="text-amber-500/50 text-xs font-medium">No Image</p>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Content Section */}
//                       <div className="p-4 md:p-4 flex flex-col flex-1">
//                         {/* Title */}
//                         <h4 className="text-base md:text-lg font-bold text-slate-100 group-hover:text-amber-400 transition-colors mb-2 leading-tight line-clamp-2">
//                           {dish.name}
//                         </h4>

//                         {/* Category Badge */}
//                         <div className="mb-2">
//                           <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] md:text-xs px-2 py-1 rounded-lg font-medium">
//                             🍽️ {normalizeCategory(dish.category)}
//                           </span>
//                         </div>

//                         {/* Tags */}
//                         {dish.tags?.length > 0 && (
//                           <div className="flex flex-wrap gap-1 md:gap-1.5 mb-3">
//                             {dish.tags.slice(0, 3).map((tag, idx) => (
//                               <span
//                                 key={idx}
//                                 className={`text-[10px] md:text-xs px-2 py-0.5 rounded-md font-medium ${getTagColor(tag)}`}
//                               >
//                                 {tag}
//                               </span>
//                             ))}
//                             {dish.tags.length > 3 && (
//                               <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-md font-medium bg-slate-700/30 text-slate-400 border border-slate-600/30">
//                                 +{dish.tags.length - 3}
//                               </span>
//                             )}
//                           </div>
//                         )}

//                         {/* Description */}
//                         {dish.description && (
//                           <p className="text-xs md:text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
//                             {dish.description}
//                           </p>
//                         )}

//                         {/* Price and Actions */}
//                         <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-700/30 gap-2">
//                           <span className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
//                             ₹{dish.price}
//                           </span>

//                           <div className="flex items-center gap-2">
//                             {getItemQuantity(dish._id) > 0 ? (
//                               <div
//                                 className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl px-2 py-1 shadow-lg"
//                                 onClick={(e) => e.stopPropagation()}
//                               >
//                                 <button
//                                   onClick={() => updateQuantity(dish._id, getItemQuantity(dish._id) - 1)}
//                                   className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700/50 border border-amber-500/30 text-amber-400 font-bold hover:bg-amber-500/20 transition-colors text-sm"
//                                 >
//                                   -
//                                 </button>
//                                 <span className="font-bold text-amber-400 text-xs md:text-sm px-2 min-w-[24px] text-center">{getItemQuantity(dish._id)}</span>
//                                 <button
//                                   onClick={() => updateQuantity(dish._id, getItemQuantity(dish._id) + 1)}
//                                   className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700/50 border border-amber-500/30 text-amber-400 font-bold hover:bg-amber-500/20 transition-colors text-sm"
//                                 >
//                                   +
//                                 </button>
//                               </div>
//                             ) : (
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   handleAddToCart(dish);
//                                 }}
//                                 disabled={!dish.available || suspended}
//                                 className={`px-3 md:px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 shadow-lg flex items-center justify-center gap-1.5 ${!dish.available || suspended
//                                   ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed shadow-none border border-slate-700/50'
//                                   : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 active:scale-95 shadow-amber-500/20 border border-amber-500/30'
//                                   }`}
//                               >
//                                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                                 </svg>
//                                 Add
//                               </button>
//                             )}

//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 navigate(`/r/${slug}/dish/${dish._id}`);
//                               }}
//                               disabled={!dish.available}
//                               className={`px-3 md:px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 shadow-lg ${!dish.available
//                                 ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed shadow-none border border-slate-700/50'
//                                 : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 active:scale-95 shadow-amber-500/20 border border-amber-500/30'
//                                 }`}
//                             >
//                               View
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Footer Info */}
//         <div className="mt-10 md:mt-12 text-center bg-slate-800/30 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-slate-700/50">
//           <p className="text-xs md:text-sm text-slate-400 mb-2">
//             💫 All prices include taxes. Please inform us of any dietary restrictions.
//           </p>
//           <p className="text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 font-semibold">
//             Thank you for choosing us!
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// ------------------------------Light below-----------------------------

import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useNavigate, useParams } from "react-router-dom";
import { useOrder } from "../../context/OrderContext";
import { useTenant } from "../../context/TenantProvider";
import { useToast } from "../../components/common/Toast/ToastContext";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import { useMenuTheme } from "../../hooks/useMenuTheme";

export default function Menu() {
  const navigate = useNavigate();
  const { slug } = useTenant();
  // Fetch and apply the restaurant's saved theme (CSS vars) — no-op if fails
  useMenuTheme(slug);
  const { items, addItem, updateQuantity } = useOrder();
  const { showSuccess, showError } = useToast();
  const [dishes, setDishes] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("recommended");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [suspended, setSuspended] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const normalizeCategory = (category) => {
    if (!category) return "Uncategorized";
    return category
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTagColor = (tag) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('spicy')) return 'bg-red-50 text-red-600 border border-red-100';
    if (tagLower.includes('vegan')) return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    if (tagLower.includes('vegetarian')) return 'bg-green-50 text-green-600 border border-green-100';
    if (tagLower.includes('gluten')) return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
    if (tagLower.includes('hot')) return 'bg-orange-50 text-orange-600 border border-orange-100';
    return 'bg-slate-50 text-slate-600 border border-slate-100';
  };

  const categories = [
    "all",
    ...new Set(dishes.map((d) => normalizeCategory(d.category)))
  ];

  const sortOptions = [
    { value: "recommended", label: "Recommended" },
    { value: "most_ordered", label: "Most Ordered" },
    { value: "budget", label: "Budget Friendly" },
    { value: "chef_special", label: "Chef's Special" },
  ];

  const fetchDishes = async () => {
    if (!slug) return;

    try {
      setLoading(true);
      const res = await axiosClient.get(`/dishes/r/${slug}/dishes`, {
        params: { sort: sortOption !== "recommended" ? sortOption : undefined }
      });
      setDishes(res.data.data?.dishes || []);
      if (res.data.data?.restaurant) {
        setRestaurant(res.data.data.restaurant);
      }
    } catch (error) {
      console.error("Error fetching dishes:", error);
      if (error.response?.status === 423) {
        setSuspended(true);
      } else if (error.response?.status === 404) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, [sortOption, slug]);

  const handleAddToCart = (dish) => {
    if (suspended) {
      showError("Ordering is temporarily unavailable.");
      return;
    }
    addItem(dish, 1);
    showSuccess(`Added 1 x ${dish.name} reached your table!`);
  };

  const getItemQuantity = (dishId) => {
    const item = items.find(i => i.dishId === dishId);
    return item ? item.quantity : 0;
  };

  const filteredDishes = dishes.filter(dish => {
    const matchesCategory = activeCategory === "all" ||
      dish.category?.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const dishesByCategory = filteredDishes.reduce((acc, dish) => {
    const normalized = normalizeCategory(dish.category);
    if (!acc[normalized]) acc[normalized] = [];
    acc[normalized].push(dish);
    return acc;
  }, {});

  if (notFound) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-amber-100 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Restaurant Not Found</h1>
          <p className="text-slate-600">The restaurant you are looking for does not exist or has closed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-dvh" style={{ background: 'var(--menu-bg)', fontFamily: 'var(--menu-font)' }}>
      <style>{`
        :root {
          --menu-font-size-base: var(--menu-font-size, 16px);
        }
        .menu-container { font-size: var(--menu-font-size-base); }
      `}</style>
      {suspended && (
        <div className="bg-red-600 text-white px-4 py-3 text-center shadow-md sticky top-0 z-50">
          <p className="font-bold flex items-center justify-center gap-2 text-sm md:text-base">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            Temporarily Closed
          </p>
          <p className="text-xs md:text-sm opacity-90">Ordering is currently unavailable. Please check back later.</p>
        </div>
      )}

      {/* Fixed Header */}
      <div className={`border-b sticky ${suspended ? 'top-16' : 'top-0'} z-40 shadow-sm transition-all duration-300`}
        style={{
          background: 'var(--menu-bg)',
          borderColor: 'var(--menu-accent)',
          backdropFilter: 'blur(12px)',
          opacity: 0.95
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-2xl shadow-lg"
                style={{ background: 'var(--menu-primary)' }}>
                {restaurant?.name?.charAt(0) || "R"}
              </div>
              <h1 className="text-lg md:text-2xl font-black tracking-tight" style={{ color: 'var(--menu-secondary)' }}>
                {restaurant?.name || (
                  <>
                    Restaurant<span style={{ color: 'var(--menu-primary)' }}>AR</span>
                  </>
                )}
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Track Order Button Desktop */}
              <button
                onClick={() => navigate(`/r/${slug}/track-order`)}
                className="px-4 py-2 text-sm font-bold rounded-full border transition-all shadow-sm hidden sm:flex items-center gap-2 active:scale-95"
                style={{
                  color: 'var(--menu-primary)',
                  background: 'var(--menu-bg)',
                  borderColor: 'var(--menu-primary)',
                  filter: 'brightness(1.1)'
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--menu-primary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Track Order
              </button>

              {/* Track Order Button Mobile */}
              <button
                onClick={() => navigate(`/r/${slug}/track-order`)}
                className="p-2.5 rounded-full border sm:hidden transition-all active:scale-95"
                style={{
                  color: 'var(--menu-primary)',
                  background: 'var(--menu-bg)',
                  borderColor: 'var(--menu-accent)'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>

              {/* Cart Button */}
              <button
                onClick={() => navigate(`/r/${slug}/cart`)}
                className="group relative p-2.5 transition-all rounded-full border shadow-sm"
                style={{
                  color: 'var(--menu-secondary)',
                  background: 'var(--menu-bg)',
                  borderColor: 'var(--menu-accent)'
                }}
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] md:text-xs font-black min-w-[20px] h-5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-white px-1.5 animate-bounce-slight"
                    style={{ background: 'var(--menu-primary)', color: 'var(--menu-primary-text)' }}>
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Search and Filter Section */}
      <div className={`sticky ${suspended ? 'top-32 md:top-36' : 'top-16 md:top-20'} z-30 border-b shadow-sm transition-all`}
        style={{ background: 'var(--menu-bg)', borderColor: 'var(--menu-accent)', opacity: 0.98 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-6">
          {/* Top Row: Our Menu + Search + Filter Button */}
          <div className="flex items-center gap-3 md:gap-6 mb-1">
            {/* Our Menu Title */}
            <h2 className="text-xl md:text-3xl font-black whitespace-nowrap hidden lg:block" style={{ color: 'var(--menu-secondary)' }}>
              Our Menu
            </h2>

            {/* Search Bar */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search favorite dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 md:py-3 border rounded-full focus:outline-none focus:ring-4 shadow-inner transition-all text-sm md:text-base font-medium"
                style={{
                  background: 'transparent',
                  borderColor: 'var(--menu-secondary)',
                  color: 'var(--menu-secondary)',
                  '--tw-ring-color': 'rgba(var(--menu-primary-rgb), 0.1)'
                }}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--menu-primary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 md:px-6 py-2.5 md:py-3 rounded-full font-bold text-sm transition-all shadow-sm border whitespace-nowrap active:scale-95`}
              style={{
                background: 'white',
                color: (showFilters || activeCategory !== "all" || sortOption !== "recommended") ? 'var(--menu-primary)' : 'var(--menu-secondary)',
                borderColor: (showFilters || activeCategory !== "all" || sortOption !== "recommended") ? 'var(--menu-primary)' : 'var(--menu-accent)'
              }}
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="hidden sm:inline">Filters</span>
              {(activeCategory !== "all" || sortOption !== "recommended") && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--menu-primary)', color: 'white' }}>
                  {(activeCategory !== "all" ? 1 : 0) + (sortOption !== "recommended" ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Collapsible Filters Section */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-50 space-y-4 md:space-y-6 animate-fade-in-scale">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--menu-secondary)', opacity: 0.6 }}>Sort by:</label>
                <div className="relative flex-1">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="appearance-none w-full pl-5 pr-10 py-3 rounded-2xl font-bold cursor-pointer transition-all text-sm border"
                    style={{
                      background: 'white',
                      borderColor: 'var(--menu-accent)',
                      color: 'var(--menu-secondary)'
                    }}
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-white font-medium">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none" style={{ color: 'var(--menu-primary)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-sm font-bold mb-3 block" style={{ color: 'var(--menu-secondary)', opacity: 0.6 }}>Menu Sections:</label>
                <div className="flex flex-wrap gap-2.5">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-3 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all duration-300 border shadow-sm active:scale-95`}
                      style={{
                        background: activeCategory === category ? 'white' : 'white',
                        color: activeCategory === category ? 'var(--menu-primary)' : 'var(--menu-secondary)',
                        borderColor: activeCategory === category ? 'var(--menu-primary)' : 'var(--menu-accent)',
                        fontWeight: activeCategory === category ? '900' : '700'
                      }}
                    >
                      {category === 'all' ? '✨ All' : normalizeCategory(category)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(activeCategory !== "all" || sortOption !== "recommended") && (
                <button
                  onClick={() => {
                    setActiveCategory("all");
                    setSortOption("recommended");
                  }}
                  className="text-sm text-red-500 hover:text-red-700 font-bold flex items-center gap-1.5 transition-colors bg-red-50 px-4 py-2 rounded-full w-fit active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reset preferences
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-8 pb-4">
        {loading ? (
          <Loading message="Preparing our signature menu for you..." />
        ) : filteredDishes.length === 0 ? (
          <EmptyState
            title="We couldn't find that dish"
            message="Try searching for something else or browse another category"
            icon="🍽️"
            actionLabel="View Full Menu"
            onAction={() => { setSearchTerm(""); setActiveCategory("all"); }}
          />
        ) : (
          <div className="space-y-6 md:space-y-12">
            {Object.entries(dishesByCategory).map(([category, categoryDishes]) => (
              <div key={category} className="animate-fade-in">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-3 md:mb-6 pb-2 border-b" style={{ borderColor: 'var(--menu-accent)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full" style={{ background: 'var(--menu-primary)' }}></div>
                    <h3 className="text-lg md:text-2xl font-black tracking-tight" style={{ color: 'var(--menu-secondary)' }}>
                      {category}
                    </h3>
                  </div>
                  <span className="text-xs md:text-sm font-black px-4 py-2 rounded-full border shadow-sm"
                    style={{ background: 'transparent', color: 'var(--menu-primary)', borderColor: 'var(--menu-primary)' }}>
                    {categoryDishes.length} {categoryDishes.length === 1 ? 'Delight' : 'Delights'}
                  </span>
                </div>

                {/* Dishes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6 lg:gap-8">
                  {categoryDishes.map((dish) => (
                    <div
                      key={dish._id}
                      onClick={() => navigate(`/r/${slug}/dish/${dish._id}`)}
                      className="group rounded-[2rem] hover:shadow-xl cursor-pointer overflow-hidden border flex flex-col h-full transition-all duration-500 hover:-translate-y-2 relative"
                      style={{
                        background: 'var(--menu-bg)',
                        borderColor: 'var(--menu-accent)',
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* Image Section */}
                      <div className="relative overflow-hidden bg-slate-50 h-36 md:h-48 shrink-0">
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${!dish.available ? 'grayscale opacity-60' : ''}`}
                          loading="lazy"
                        />

                        {/* Sold Out Overlay */}
                        {!dish.available && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px] z-10">
                            <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-xl transform -rotate-12 border-2 border-white tracking-widest uppercase">
                              Sold Out
                            </span>
                          </div>
                        )}

                        {/* Price Tag Floating */}
                        <div className="absolute top-4 right-4 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border z-20"
                          style={{ background: 'var(--menu-bg)', borderColor: 'var(--menu-accent)', opacity: 0.9 }}>
                          <span className="text-sm font-black" style={{ color: 'var(--menu-primary)' }}>₹{dish.price}</span>
                        </div>
                      </div>

                      {/* Info Section */}
                      <div className="p-3 md:p-5 flex flex-col flex-1">
                        <div className="mb-2">
                          <h4 className="text-sm font-black transition-colors leading-tight mb-1 line-clamp-1"
                            style={{ color: 'var(--menu-secondary)' }}>
                            {dish.name}
                          </h4>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 min-h-[1.2rem]">
                            {dish.tags?.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${getTagColor(tag)}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {dish.description && (
                          <p className="text-xs line-clamp-1 mb-2 font-medium leading-relaxed"
                            style={{ color: 'var(--menu-secondary)', opacity: 0.7 }}>
                            {dish.description}
                          </p>
                        )}

                        {/* Interactions */}
                        <div className="mt-auto pt-2 flex items-center gap-2">
                          {getItemQuantity(dish._id) > 0 ? (
                            <div
                              className="flex-1 flex items-center justify-between bg-slate-50 rounded-2xl p-1.5 border border-slate-100 shadow-inner"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => updateQuantity(dish._id, getItemQuantity(dish._id) - 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl shadow-sm border font-black transition-all active:scale-90"
                                style={{ background: 'var(--menu-bg)', color: 'var(--menu-primary)', borderColor: 'var(--menu-accent)' }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="font-black text-base" style={{ color: 'var(--menu-secondary)' }}>{getItemQuantity(dish._id)}</span>
                              <button
                                onClick={() => updateQuantity(dish._id, getItemQuantity(dish._id) + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl shadow-sm border font-black transition-all active:scale-90"
                                style={{ background: 'var(--menu-bg)', color: 'var(--menu-primary)', borderColor: 'var(--menu-accent)' }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(dish);
                              }}
                              disabled={!dish.available || suspended}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 ${!dish.available || suspended
                                ? 'cursor-not-allowed opacity-50'
                                : ''
                                }`}
                              style={{
                                background: (!dish.available || suspended) ? 'var(--menu-accent)' : 'var(--menu-primary)',
                                color: (!dish.available || suspended) ? 'var(--menu-secondary)' : 'var(--menu-primary-text)'
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                              </svg>
                              Add to Order
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/r/${slug}/dish/${dish._id}`);
                            }}
                            className="p-2 rounded-xl border transition-all shadow-sm active:scale-95"
                            style={{
                              background: 'transparent',
                              borderColor: 'var(--menu-secondary)',
                              color: 'var(--menu-secondary)'
                            }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-2 md:mt-24 text-center rounded-3xl p-5 shadow-sm border max-w-2xl mx-auto"
          style={{ background: 'var(--menu-bg)', borderColor: 'var(--menu-accent)' }}>
          <p className="text-sm md:text-base mb-3 font-medium" style={{ color: 'var(--menu-secondary)', opacity: 0.6 }}>
            💫 All prices include applicable taxes. Please inform our captain of any dietary restrictions or allergies.
          </p>
        </div>
      </div>
    </div>
  );
}
