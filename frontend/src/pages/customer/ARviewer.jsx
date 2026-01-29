// import { useParams, useNavigate } from "react-router-dom";
// import { useState, useEffect, useRef } from "react";
// import axiosClient from "../../api/axiosClient";
// import "@google/model-viewer";

// // Ingredient icon mapping
// const ingredientIcons = {
//     // Vegetables
//     'tomato': '🍅', 'onion': '🧅', 'garlic': '🧄', 'ginger': '🫚',
//     'chilli': '🌶️', 'chili': '🌶️', 'pepper': '🫑', 'carrot': '🥕',
//     'potato': '🥔', 'broccoli': '🥦', 'mushroom': '🍄',

//     // Proteins
//     'chicken': '🍗', 'beef': '🥩', 'fish': '🐟', 'egg': '🥚',
//     'tofu': '🧊', 'paneer': '🧀', 'cheese': '🧀',

//     // Nuts & Seeds
//     'peanuts': '🥜', 'peanut': '🥜', 'cashews': '🌰', 'cashew': '🌰',
//     'almonds': '🌰', 'almond': '🌰', 'nuts': '🌰',

//     // Spices
//     'salt': '🧂', 'sugar': '🍬', 'cumin': '🌿', 'coriander': '🌿',

//     // Grains
//     'rice': '🍚', 'flour': '🌾', 'bread': '🍞', 'noodles': '🍜',

//     // Sauces & Liquids
//     'sauce': '🥫', 'oil': '🫗', 'butter': '🧈', 'cream': '🥛',

//     // Default
//     'default': '🍽️'
// };

// // Dietary tag icon mapping
// const tagIcons = {
//     'vegetarian': '🥬',
//     'vegan': '🌱',
//     'gluten free': '🌾',
//     'dairy free': '🥛',
//     'contains nuts': '🌰',
//     'spicy': '🌶️',
//     'halal': '☪️',
//     'kosher': '✡️',
//     'bestseller': '⭐',
//     'chef special': '👨‍🍳'
// };

// function getIngredientIcon(ingredient) {
//     const normalized = ingredient.toLowerCase().trim();
//     for (const [key, icon] of Object.entries(ingredientIcons)) {
//         if (normalized.includes(key)) {
//             return icon;
//         }
//     }
//     return ingredientIcons['default'];
// }

// function getTagIcon(tag) {
//     const normalized = tag.toLowerCase().trim();
//     return tagIcons[normalized] || '✓';
// }

// // Calculate circular positions for ingredients (3D coordinates for AR hotspots)
// function calculateCircularPositions(count) {
//     if (count === 0) return [];

//     const positions = [];
//     const radius = 0.65; // Reduced from 0.8 to fit within mobile screen widths
//     const height = 0.2;
//     const xOffset = 0.2; // Slightly shift to the right
//     const angleStep = (2 * Math.PI) / count;

//     for (let i = 0; i < count; i++) {
//         const angle = i * angleStep;

//         const x = (parseFloat((radius * Math.cos(angle)).toFixed(2)) + xOffset).toFixed(2);
//         const z = (radius * Math.sin(angle)).toFixed(2);

//         positions.push(`${x}m ${height}m ${z}m`);
//     }

//     return positions;
// }

// export default function ARViewer() {
//     const { slug, id } = useParams();
//     const navigate = useNavigate();
//     const modelViewerRef = useRef(null);
//     const [dish, setDish] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [arError, setArError] = useState(false);
//     const [modelLoaded, setModelLoaded] = useState(false);
//     const [displayMode, setDisplayMode] = useState('nutrition'); // 'nutrition' or 'ingredients'

//     const fetchDish = async () => {
//         try {
//             const { data } = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}`);
//             console.log("AR Viewer - Dish Data:", data.data.dish);
//             console.log("Ingredients:", data.data.dish.ingredients);
//             console.log("Nutritional Info:", data.data.dish.nutritionalInfo);
//             setDish(data.data.dish);
//         } catch (error) {
//             console.error("Error loading AR model:", error);
//             setArError(true);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchDish();
//     }, [id]);

//     useEffect(() => {
//         if (dish && dish.modelStatus === "completed") {
//             const timer = setTimeout(() => {
//                 setModelLoaded(true);
//             }, 2000);

//             return () => clearTimeout(timer);
//         }
//     }, [dish]);

//     const handleModelLoad = () => {
//         console.log("Model loaded successfully");
//         setModelLoaded(true);
//     };

//     const handleModelError = (error) => {
//         console.error("Model loading error:", error);
//         setArError(true);
//         setModelLoaded(false);
//     };

//     if (loading) {
//         return (
//             <div className="min-h-screen bg-amber-50 flex items-center justify-center">
//                 <div className="text-center">
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
//                     <p className="text-gray-600 mt-3">Loading AR experience...</p>
//                 </div>
//             </div>
//         );
//     }

//     if (!dish || arError) {
//         return (
//             <div className="min-h-screen bg-amber-50 flex items-center justify-center">
//                 <div className="text-center max-w-md mx-auto p-6">
//                     <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                         <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                         </svg>
//                     </div>
//                     <h3 className="text-xl font-semibold text-gray-800 mb-2">AR Model Error</h3>
//                     <p className="text-gray-600 mb-4">Unable to load the AR experience for this dish.</p>
//                     <button
//                         onClick={() => navigate(`/r/${slug}/menu`)}
//                         className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
//                     >
//                         Back to Menu
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     if (dish.modelStatus !== "completed") {
//         return (
//             <div className="min-h-screen bg-amber-50 flex items-center justify-center">
//                 <div className="text-center max-w-md mx-auto p-6">
//                     <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                         <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                         </svg>
//                     </div>
//                     <h3 className="text-xl font-semibold text-gray-800 mb-2">AR Model Processing</h3>
//                     <p className="text-gray-600 mb-2">The 3D model for this dish is still being generated.</p>
//                     <p className="text-sm text-gray-500 mb-4">This usually takes a few minutes. Please check back later.</p>
//                     <button
//                         onClick={() => navigate(`/r/${slug}/menu`)}
//                         className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
//                     >
//                         Back to Menu
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     // Prepare data
//     const nutritionalInfo = dish.nutritionalInfo || {};
//     const ingredients = dish.ingredients || [];
//     const tags = dish.tags || [];
//     const ingredientPositions = calculateCircularPositions(Math.min(ingredients.length, 8)); // Limit to 8 for better UX

//     return (
//         <div className="fixed inset-0 bg-gray-100 flex flex-col font-sans">
//             {/* Floating Back Button */}
//             <button
//                 onClick={() => navigate(`/r/${slug}/menu`)}
//                 className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-md shadow-lg px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-amber-600 transition-all active:scale-95"
//             >
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//                 </svg>
//                 Back
//             </button>

//             {/* Main Viewer Area - Flexible Height */}
//             <div className="flex-1 relative w-full bg-linear-to-b from-gray-50 to-gray-200 overflow-hidden">

//                 {/* Loading Overlay */}
//                 {!modelLoaded && (
//                     <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
//                         <div className="text-center">
//                             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto mb-3"></div>
//                             <p className="text-gray-500 font-medium">Loading 3D Experience...</p>
//                         </div>
//                     </div>
//                 )}

//                 {/* Toggle Mode Button (Floating Top Right) */}
//                 {modelLoaded && (ingredients.length > 0 || Object.values(nutritionalInfo).some(v => v > 0)) && (
//                     <button
//                         onClick={() => setDisplayMode(displayMode === 'nutrition' ? 'ingredients' : 'nutrition')}
//                         className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/50 text-xs font-bold text-gray-700 active:scale-95 transition-all flex items-center gap-1.5"
//                     >
//                         {displayMode === 'nutrition' ? '🥗 Ingredients' : '📊 Nutrition'}
//                     </button>
//                 )}

//                 {/* 3D Model Viewer */}
//                 <model-viewer
//                     ref={modelViewerRef}
//                     src={dish.modelUrls?.glb ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/dishes/r/${slug}/dishes/proxy-model/${dish._id}/glb` : undefined}
//                     ios-src={dish.modelUrls?.usdz ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/dishes/r/${slug}/dishes/proxy-model/${dish._id}/usdz` : undefined}
//                     alt={`3D model of ${dish.name}`}
//                     ar
//                     ar-modes="webxr scene-viewer quick-look"
//                     ar-scale="auto"
//                     camera-controls
//                     touch-action="pan-y"
//                     auto-rotate
//                     class="w-full h-full"
//                     onLoad={handleModelLoad}
//                     onError={handleModelError}
//                     style={{
//                         width: '100%',
//                         height: '100%',
//                         display: modelLoaded ? 'block' : 'none',
//                         '--poster-color': 'transparent'
//                     }}
//                 >
//                     {/* Native AR Button - Positioned Customly */}
//                     <button
//                         slot="ar-button"
//                         className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-amber-600 text-white px-8 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 z-50 animate-bounce-slight hover:bg-amber-700 transition-colors"
//                     >
//                         <span className="text-xl">✨</span>
//                         <span>View in AR</span>
//                     </button>

//                     {/* Ingredient Hotspots */}
//                     {modelLoaded && displayMode === 'ingredients' && ingredients.length > 0 &&
//                         ingredients.slice(0, 8).map((ingredient, index) => (
//                             <button
//                                 key={`ing-${index}`}
//                                 slot={`hotspot-ingredient-${index}`}
//                                 data-position={ingredientPositions[index]}
//                                 data-normal="0m 1m 0m"
//                                 className="bg-white/95 backdrop-blur-md rounded-2xl px-3 py-2 shadow-lg border border-white/50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
//                                 style={{ border: 'none' }}
//                             >
//                                 <div className="text-center leading-none">
//                                     <div className="text-xl mb-1 drop-shadow-sm">{getIngredientIcon(ingredient)}</div>
//                                     <div className="text-[10px] font-bold text-gray-700 uppercase tracking-tight max-w-[60px] truncate">{ingredient}</div>
//                                 </div>
//                             </button>
//                         ))
//                     }

//                     {/* Nutritional Hotspots */}
//                     {modelLoaded && displayMode === 'nutrition' && (
//                         <>
//                             {nutritionalInfo.calories > 0 && (
//                                 <button slot="hotspot-cal" data-position="-0.35m 0.2m -0.35m" data-normal="-1m 1m -1m" className="hotspot-card" style={{ border: 'none' }}>
//                                     <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 text-center shadow-lg border border-white/50">
//                                         <div className="text-xl mb-1">🔥</div>
//                                         <div className="text-sm font-bold text-gray-800">{nutritionalInfo.calories}</div>
//                                         <div className="text-[10px] text-gray-500 uppercase font-bold">kcal</div>
//                                     </div>
//                                 </button>
//                             )}
//                             {nutritionalInfo.protein > 0 && (
//                                 <button slot="hotspot-prot" data-position="0.35m 0.2m -0.35m" data-normal="1m 1m -1m" className="hotspot-card" style={{ border: 'none' }}>
//                                     <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 text-center shadow-lg border border-white/50">
//                                         <div className="text-xl mb-1">🍖</div>
//                                         <div className="text-sm font-bold text-gray-800">{nutritionalInfo.protein}g</div>
//                                         <div className="text-[10px] text-gray-500 uppercase font-bold">prot</div>
//                                     </div>
//                                 </button>
//                             )}
//                             {nutritionalInfo.carbs > 0 && (
//                                 <button slot="hotspot-carb" data-position="0.35m 0.15m 0.35m" data-normal="1m 1m 1m" className="hotspot-card" style={{ border: 'none' }}>
//                                     <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 text-center shadow-lg border border-white/50">
//                                         <div className="text-xl mb-1">🌾</div>
//                                         <div className="text-sm font-bold text-gray-800">{nutritionalInfo.carbs}g</div>
//                                         <div className="text-[10px] text-gray-500 uppercase font-bold">carbs</div>
//                                     </div>
//                                 </button>
//                             )}
//                             {nutritionalInfo.sugar > 0 && (
//                                 <button slot="hotspot-sugar" data-position="-0.35m 0.15m 0.35m" data-normal="-1m 1m 1m" className="hotspot-card" style={{ border: 'none' }}>
//                                     <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 text-center shadow-lg border border-white/50">
//                                         <div className="text-xl mb-1">🍬</div>
//                                         <div className="text-sm font-bold text-gray-800">{nutritionalInfo.sugar}g</div>
//                                         <div className="text-[10px] text-gray-500 uppercase font-bold">sugar</div>
//                                     </div>
//                                 </button>
//                             )}
//                         </>
//                     )}
//                 </model-viewer>
//             </div>

//             {/* Bottom Info Sheet */}
//             <div className="bg-white rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-40 shrink-0 relative">
//                 <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1"></div>
//                 <div className="px-6 pb-8 pt-4">
//                     <div className="flex justify-between items-start mb-4">
//                         <div>
//                             <span className="inline-block text-[10px] font-bold tracking-widest text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded mb-1">
//                                 {dish.category}
//                             </span>
//                             <h1 className="text-2xl font-bold text-gray-900 leading-tight">
//                                 {dish.name}
//                             </h1>
//                         </div>
//                         <div className="text-right">
//                             <span className="text-2xl font-bold text-amber-600">₹{dish.price}</span>
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-2 gap-3 mb-4">
//                         <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
//                             <h3 className="text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
//                                 <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                                 </svg>
//                                 Instructions
//                             </h3>
//                             <ul className="text-[10px] text-gray-600 space-y-1 font-medium leading-tight">
//                                 <li>1. Click "View in AR"</li>
//                                 <li>2. Point camera at surface</li>
//                                 <li>3. Tap to place dish</li>
//                             </ul>
//                         </div>
//                         <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
//                             <h3 className="text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
//                                 <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//                                 </svg>
//                                 Pro Tips
//                             </h3>
//                             <ul className="text-[10px] text-gray-600 space-y-1 font-medium leading-tight">
//                                 <li>• Pinch to resize/zoom</li>
//                                 <li>• Drag to rotate</li>
//                                 <li>• Good lighting helps!</li>
//                             </ul>
//                         </div>
//                     </div>

//                     {/* AR Visibility Note */}
//                     <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
//                         <p className="text-[9px] text-gray-500 font-medium leading-tight text-center">
//                             <span className="font-bold text-amber-600">Note:</span> Floating icons (Ingredients/Nutrition) in camera view are supported on most Android devices (Chrome). iOS users can see these icons in the 3D preview before entering AR.
//                         </p>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// ----------------------------- Dark below -----------------------------

// import { useParams, useNavigate } from "react-router-dom";
// import { useState, useEffect, useRef } from "react";
// import axiosClient from "../../api/axiosClient";
// import "@google/model-viewer";

// // Ingredient icon mapping
// const ingredientIcons = {
//     // Vegetables
//     'tomato': '🍅', 'onion': '🧅', 'garlic': '🧄', 'ginger': '🫚',
//     'chilli': '🌶️', 'chili': '🌶️', 'pepper': '🫑', 'carrot': '🥕',
//     'potato': '🥔', 'broccoli': '🥦', 'mushroom': '🍄',

//     // Proteins
//     'chicken': '🍗', 'beef': '🥩', 'fish': '🐟', 'egg': '🥚',
//     'tofu': '🧊', 'paneer': '🧀', 'cheese': '🧀',

//     // Nuts & Seeds
//     'peanuts': '🥜', 'peanut': '🥜', 'cashews': '🌰', 'cashew': '🌰',
//     'almonds': '🌰', 'almond': '🌰', 'nuts': '🌰',

//     // Spices
//     'salt': '🧂', 'sugar': '🍬', 'cumin': '🌿', 'coriander': '🌿',

//     // Grains
//     'rice': '🍚', 'flour': '🌾', 'bread': '🍞', 'noodles': '🍜',

//     // Sauces & Liquids
//     'sauce': '🥫', 'oil': '🫗', 'butter': '🧈', 'cream': '🥛',

//     // Default
//     'default': '🍽️'
// };

// // Dietary tag icon mapping
// const tagIcons = {
//     'vegetarian': '🥬',
//     'vegan': '🌱',
//     'gluten free': '🌾',
//     'dairy free': '🥛',
//     'contains nuts': '🌰',
//     'spicy': '🌶️',
//     'halal': '☪️',
//     'kosher': '✡️',
//     'bestseller': '⭐',
//     'chef special': '👨‍🍳'
// };

// function getIngredientIcon(ingredient) {
//     const normalized = ingredient.toLowerCase().trim();
//     for (const [key, icon] of Object.entries(ingredientIcons)) {
//         if (normalized.includes(key)) {
//             return icon;
//         }
//     }
//     return ingredientIcons['default'];
// }

// function getTagIcon(tag) {
//     const normalized = tag.toLowerCase().trim();
//     return tagIcons[normalized] || '✓';
// }

// // Calculate circular positions for ingredients (3D coordinates for AR hotspots)
// function calculateCircularPositions(count) {
//     if (count === 0) return [];

//     const positions = [];
//     const radius = 0.65; // Reduced from 0.8 to fit within mobile screen widths
//     const height = 0.2;
//     const xOffset = 0.2; // Slightly shift to the right
//     const angleStep = (2 * Math.PI) / count;

//     for (let i = 0; i < count; i++) {
//         const angle = i * angleStep;

//         const x = (parseFloat((radius * Math.cos(angle)).toFixed(2)) + xOffset).toFixed(2);
//         const z = (radius * Math.sin(angle)).toFixed(2);

//         positions.push(`${x}m ${height}m ${z}m`);
//     }

//     return positions;
// }

// export default function ARViewer() {
//     const { slug, id } = useParams();
//     const navigate = useNavigate();
//     const modelViewerRef = useRef(null);
//     const [dish, setDish] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [arError, setArError] = useState(false);
//     const [modelLoaded, setModelLoaded] = useState(false);
//     const [displayMode, setDisplayMode] = useState('nutrition'); // 'nutrition' or 'ingredients'

//     const fetchDish = async () => {
//         try {
//             const { data } = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}`);
//             console.log("AR Viewer - Dish Data:", data.data.dish);
//             console.log("Ingredients:", data.data.dish.ingredients);
//             console.log("Nutritional Info:", data.data.dish.nutritionalInfo);
//             setDish(data.data.dish);
//         } catch (error) {
//             console.error("Error loading AR model:", error);
//             setArError(true);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchDish();
//     }, [id]);

//     useEffect(() => {
//         if (dish && dish.modelStatus === "completed") {
//             const timer = setTimeout(() => {
//                 setModelLoaded(true);
//             }, 2000);

//             return () => clearTimeout(timer);
//         }
//     }, [dish]);

//     const handleModelLoad = () => {
//         console.log("Model loaded successfully");
//         setModelLoaded(true);
//     };

//     const handleModelError = (error) => {
//         console.error("Model loading error:", error);
//         setArError(true);
//         setModelLoaded(false);
//     };

//     if (loading) {
//         return (
//             <div className="min-h-screen bg-slate-50 flex items-center justify-center">
//                 <div className="text-center">
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
//                     <p className="text-slate-600 mt-3 font-medium">Loading AR experience...</p>
//                 </div>
//             </div>
//         );
//     }

//     if (!dish || arError) {
//         return (
//             <div className="min-h-screen bg-slate-50 flex items-center justify-center">
//                 <div className="text-center max-w-md mx-auto p-6">
//                     <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
//                         <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                         </svg>
//                     </div>
//                     <h3 className="text-xl font-bold text-slate-900 mb-2">AR Model Error</h3>
//                     <p className="text-slate-600 mb-4">Unable to load the AR experience for this dish.</p>
//                     <button
//                         onClick={() => navigate(`/r/${slug}/menu`)}
//                         className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
//                     >
//                         Back to Menu
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     if (dish.modelStatus !== "completed") {
//         return (
//             <div className="min-h-screen bg-slate-50 flex items-center justify-center">
//                 <div className="text-center max-w-md mx-auto p-6">
//                     <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-100">
//                         <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                         </svg>
//                     </div>
//                     <h3 className="text-xl font-bold text-slate-900 mb-2">AR Model Processing</h3>
//                     <p className="text-slate-600 mb-2">The 3D model for this dish is still being generated.</p>
//                     <p className="text-sm text-slate-500 mb-4 font-medium">This usually takes a few minutes. Please check back later.</p>
//                     <button
//                         onClick={() => navigate(`/r/${slug}/menu`)}
//                         className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
//                     >
//                         Back to Menu
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     // Prepare data
//     const nutritionalInfo = dish.nutritionalInfo || {};
//     const ingredients = dish.ingredients || [];
//     const tags = dish.tags || [];
//     const ingredientPositions = calculateCircularPositions(Math.min(ingredients.length, 8)); // Limit to 8 for better UX

//     return (
//         <div className="fixed inset-0 bg-slate-950 flex flex-col font-sans">
//             {/* Floating Back Button */}
//             <button
//                 onClick={() => navigate(`/r/${slug}/menu`)}
//                 className="absolute top-4 left-4 z-50 bg-slate-900/90 backdrop-blur-md shadow-2xl px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-amber-400 transition-all active:scale-95 border border-slate-700/50"
//             >
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//                 </svg>
//                 Back
//             </button>

//             {/* Main Viewer Area - White Background */}
//             <div className="flex-1 relative w-full bg-white overflow-hidden">
//                 {/* Subtle Radial Gradient to give depth */}
//                 <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_#f1f5f9_0%,_transparent_100%)]"></div>

//                 {/* Loading Overlay */}
//                 {!modelLoaded && (
//                     <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
//                         <div className="text-center">
//                             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-3"></div>
//                             <p className="text-slate-500 font-medium">Loading 3D Experience...</p>
//                         </div>
//                     </div>
//                 )}

//                 {/* Toggle Mode Button (Floating Top Right) */}
//                 {modelLoaded && (ingredients.length > 0 || Object.values(nutritionalInfo).some(v => v > 0)) && (
//                     <button
//                         onClick={() => setDisplayMode(displayMode === 'nutrition' ? 'ingredients' : 'nutrition')}
//                         className="absolute top-4 right-4 z-50 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-slate-700/50 text-xs font-bold text-slate-300 active:scale-95 transition-all flex items-center gap-1.5 hover:text-amber-400 hover:border-amber-500/30"
//                     >
//                         {displayMode === 'nutrition' ? '🥗 Ingredients' : '📊 Nutrition'}
//                     </button>
//                 )}

//                 {/* 3D Model Viewer */}
//                 <model-viewer
//                     ref={modelViewerRef}
//                     src={dish.modelUrls?.glb ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/dishes/r/${slug}/dishes/proxy-model/${dish._id}/glb` : undefined}
//                     ios-src={dish.modelUrls?.usdz ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/dishes/r/${slug}/dishes/proxy-model/${dish._id}/usdz` : undefined}
//                     alt={`3D model of ${dish.name}`}
//                     ar
//                     ar-modes="webxr scene-viewer quick-look"
//                     ar-scale="auto"
//                     camera-controls
//                     touch-action="pan-y"
//                     auto-rotate
//                     class="w-full h-full"
//                     onLoad={handleModelLoad}
//                     onError={handleModelError}
//                     style={{
//                         width: '100%',
//                         height: '100%',
//                         display: modelLoaded ? 'block' : 'none',
//                         '--poster-color': 'transparent'
//                     }}
//                 >
//                     {/* Native AR Button - Positioned Customly */}
//                     <button
//                         slot="ar-button"
//                         className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 z-50 animate-bounce-slight hover:from-amber-600 hover:to-orange-700 transition-all border border-amber-500/30"
//                     >
//                         <span className="text-xl">✨</span>
//                         <span>View in AR</span>
//                     </button>

//                     {/* Ingredient Hotspots - Dark Theme */}
//                     {modelLoaded && displayMode === 'ingredients' && ingredients.length > 0 &&
//                         ingredients.slice(0, 8).map((ingredient, index) => (
//                             <button
//                                 key={`ing-${index}`}
//                                 slot={`hotspot-ingredient-${index}`}
//                                 data-position={ingredientPositions[index]}
//                                 data-normal="0m 1m 0m"
//                                 className="bg-slate-900/95 backdrop-blur-md rounded-2xl px-3 py-2 shadow-2xl border border-slate-700/50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
//                                 style={{ border: 'none' }}
//                             >
//                                 <div className="text-center leading-none">
//                                     <div className="text-xl mb-1 drop-shadow-sm">{getIngredientIcon(ingredient)}</div>
//                                     <div className="text-[10px] font-bold text-slate-100 uppercase tracking-tight max-w-[60px] truncate">{ingredient}</div>
//                                 </div>
//                             </button>
//                         ))
//                     }

//                     {/* Nutritional Hotspots - Dark Theme */}
//                     {modelLoaded && displayMode === 'nutrition' && (
//                         <>
//                             {nutritionalInfo.calories > 0 && (
//                                 <button slot="hotspot-cal" data-position="-0.35m 0.2m -0.35m" data-normal="-1m 1m -1m" className="hotspot-card" style={{ border: 'none' }}>
//                                     <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 text-center shadow-2xl border border-slate-700/50">
//                                         <div className="text-xl mb-1">🔥</div>
//                                         <div className="text-sm font-bold text-slate-100">{nutritionalInfo.calories}</div>
//                                         <div className="text-[10px] text-slate-400 uppercase font-bold">kcal</div>
//                                     </div>
//                                 </button>
//                             )}
//                             {nutritionalInfo.protein > 0 && (
//                                 <button slot="hotspot-prot" data-position="0.35m 0.2m -0.35m" data-normal="1m 1m -1m" className="hotspot-card" style={{ border: 'none' }}>
//                                     <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 text-center shadow-2xl border border-slate-700/50">
//                                         <div className="text-xl mb-1">🍖</div>
//                                         <div className="text-sm font-bold text-slate-100">{nutritionalInfo.protein}g</div>
//                                         <div className="text-[10px] text-slate-400 uppercase font-bold">prot</div>
//                                     </div>
//                                 </button>
//                             )}
//                             {nutritionalInfo.carbs > 0 && (
//                                 <button slot="hotspot-carb" data-position="0.35m 0.15m 0.35m" data-normal="1m 1m 1m" className="hotspot-card" style={{ border: 'none' }}>
//                                     <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 text-center shadow-2xl border border-slate-700/50">
//                                         <div className="text-xl mb-1">🌾</div>
//                                         <div className="text-sm font-bold text-slate-100">{nutritionalInfo.carbs}g</div>
//                                         <div className="text-[10px] text-slate-400 uppercase font-bold">carbs</div>
//                                     </div>
//                                 </button>
//                             )}
//                             {nutritionalInfo.sugar > 0 && (
//                                 <button slot="hotspot-sugar" data-position="-0.35m 0.15m 0.35m" data-normal="-1m 1m 1m" className="hotspot-card" style={{ border: 'none' }}>
//                                     <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 text-center shadow-2xl border border-slate-700/50">
//                                         <div className="text-xl mb-1">🍬</div>
//                                         <div className="text-sm font-bold text-slate-100">{nutritionalInfo.sugar}g</div>
//                                         <div className="text-[10px] text-slate-400 uppercase font-bold">sugar</div>
//                                     </div>
//                                 </button>
//                             )}
//                         </>
//                     )}
//                 </model-viewer>
//             </div>

//             {/* Bottom Info Sheet - Reverted to Dark */}
//             <div className="bg-slate-900/95 backdrop-blur-xl rounded-t-[2.5rem] shadow-2xl border-t border-slate-800/50 z-40 shrink-0 relative">
//                 <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-4 mb-2"></div>
//                 <div className="px-6 pb-10 pt-4">
//                     <div className="flex justify-between items-start mb-5">
//                         <div>
//                             <span className="inline-block text-[10px] font-bold tracking-widest text-amber-400 uppercase bg-amber-500/10 px-2.5 py-1 rounded-lg mb-2 border border-amber-500/30">
//                                 {dish.category}
//                             </span>
//                             <h1 className="text-2xl font-black text-slate-100 leading-tight">
//                                 {dish.name}
//                             </h1>
//                         </div>
//                         <div className="text-right">
//                             <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">₹{dish.price}</span>
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-2 gap-4 mb-6">
//                         <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30">
//                             <h3 className="text-xs font-bold text-slate-100 mb-2 flex items-center gap-2">
//                                 <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                                 </svg>
//                                 Instructions
//                             </h3>
//                             <ul className="text-[10px] text-slate-300 space-y-1.5 font-semibold leading-tight">
//                                 <li className="flex gap-2"><span>1.</span><span>Click "View in AR"</span></li>
//                                 <li className="flex gap-2"><span>2.</span><span>Point camera at surface</span></li>
//                                 <li className="flex gap-2"><span>3.</span><span>Tap to place dish</span></li>
//                             </ul>
//                         </div>
//                         <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/30">
//                             <h3 className="text-xs font-bold text-slate-100 mb-2 flex items-center gap-2">
//                                 <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//                                 </svg>
//                                 Pro Tips
//                             </h3>
//                             <ul className="text-[10px] text-slate-300 space-y-1.5 font-semibold leading-tight">
//                                 <li>• Pinch to resize / zoom</li>
//                                 <li>• Drag to rotate dish</li>
//                                 <li>• Bright lighting works best</li>
//                             </ul>
//                         </div>
//                     </div>

//                     {/* AR Visibility Note */}
//                     <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
//                         <p className="text-[10px] text-slate-400 font-medium leading-relaxed text-center">
//                             <span className="font-bold text-amber-400 italic">Quick Note:</span> 3D annotation icons are visible in preview for all users. Native AR mode (camera view) annotations are optimized for Android (Chrome).
//                         </p>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// ------------------------------Light below-----------------------------

import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axiosClient from "../../api/axiosClient";
import "@google/model-viewer";

// Ingredient icon mapping
const ingredientIcons = {
    // Vegetables
    'tomato': '🍅', 'onion': '🧅', 'garlic': '🧄', 'ginger': '🫚',
    'chilli': '🌶️', 'chili': '🌶️', 'pepper': '🫑', 'carrot': '🥕',
    'potato': '🥔', 'broccoli': '🥦', 'mushroom': '🍄',

    // Proteins
    'chicken': '🍗', 'beef': '🥩', 'fish': '🐟', 'egg': '🥚',
    'tofu': '🧊', 'paneer': '🧀', 'cheese': '🧀',

    // Nuts & Seeds
    'peanuts': '🥜', 'peanut': '🥜', 'cashews': '🌰', 'cashew': '🌰',
    'almonds': '🌰', 'almond': '🌰', 'nuts': '🌰',

    // Spices
    'salt': '🧂', 'sugar': '🍬', 'cumin': '🌿', 'coriander': '🌿',

    // Grains
    'rice': '🍚', 'flour': '🌾', 'bread': '🍞', 'noodles': '🍜',

    // Sauces & Liquids
    'sauce': '🥫', 'oil': '🫗', 'butter': '🧈', 'cream': '🥛',

    // Default
    'default': '🍽️'
};

// Dietary tag icon mapping
const tagIcons = {
    'vegetarian': '🥬',
    'vegan': '🌱',
    'gluten free': '🌾',
    'dairy free': '🥛',
    'contains nuts': '🌰',
    'spicy': '🌶️',
    'halal': '☪️',
    'kosher': '✡️',
    'bestseller': '⭐',
    'chef special': '👨‍🍳'
};

function getIngredientIcon(ingredient) {
    const normalized = ingredient.toLowerCase().trim();
    for (const [key, icon] of Object.entries(ingredientIcons)) {
        if (normalized.includes(key)) {
            return icon;
        }
    }
    return ingredientIcons['default'];
}

function getTagIcon(tag) {
    const normalized = tag.toLowerCase().trim();
    return tagIcons[normalized] || '✓';
}

// Calculate circular positions for ingredients (3D coordinates for AR hotspots)
function calculateCircularPositions(count) {
    if (count === 0) return [];

    const positions = [];
    const radius = 0.65; // Reduced from 0.8 to fit within mobile screen widths
    const height = 0.2;
    const xOffset = 0.2; // Slightly shift to the right
    const angleStep = (2 * Math.PI) / count;

    for (let i = 0; i < count; i++) {
        const angle = i * angleStep;

        const x = (parseFloat((radius * Math.cos(angle)).toFixed(2)) + xOffset).toFixed(2);
        const z = (radius * Math.sin(angle)).toFixed(2);

        positions.push(`${x}m ${height}m ${z}m`);
    }

    return positions;
}

export default function ARViewer() {
    const { slug, id } = useParams();
    const navigate = useNavigate();
    const modelViewerRef = useRef(null);
    const [dish, setDish] = useState(null);
    const [loading, setLoading] = useState(true);
    const [arError, setArError] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [displayMode, setDisplayMode] = useState('nutrition'); // 'nutrition' or 'ingredients'

    const fetchDish = async () => {
        try {
            const { data } = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}`);
            console.log("AR Viewer - Dish Data:", data.data.dish);
            console.log("Ingredients:", data.data.dish.ingredients);
            console.log("Nutritional Info:", data.data.dish.nutritionalInfo);
            setDish(data.data.dish);
        } catch (error) {
            console.error("Error loading AR model:", error);
            setArError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDish();
    }, [id]);

    useEffect(() => {
        if (dish && dish.modelStatus === "completed") {
            const timer = setTimeout(() => {
                setModelLoaded(true);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [dish]);

    const handleModelLoad = () => {
        console.log("Model loaded successfully");
        setModelLoaded(true);
    };

    const handleModelError = (error) => {
        console.error("Model loading error:", error);
        setArError(true);
        setModelLoaded(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="text-slate-600 mt-3 font-medium">Loading AR experience...</p>
                </div>
            </div>
        );
    }

    if (!dish || arError) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
                        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">AR Model Error</h3>
                    <p className="text-slate-600 mb-4">Unable to load the AR experience for this dish.</p>
                    <button
                        onClick={() => navigate(`/r/${slug}/menu`)}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
                    >
                        Back to Menu
                    </button>
                </div>
            </div>
        );
    }

    if (dish.modelStatus !== "completed") {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-100">
                        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">AR Model Processing</h3>
                    <p className="text-slate-600 mb-2">The 3D model for this dish is still being generated.</p>
                    <p className="text-sm text-slate-500 mb-4 font-medium">This usually takes a few minutes. Please check back later.</p>
                    <button
                        onClick={() => navigate(`/r/${slug}/menu`)}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
                    >
                        Back to Menu
                    </button>
                </div>
            </div>
        );
    }

    // Prepare data
    const nutritionalInfo = dish.nutritionalInfo || {};
    const ingredients = dish.ingredients || [];
    const tags = dish.tags || [];
    const ingredientPositions = calculateCircularPositions(Math.min(ingredients.length, 8)); // Limit to 8 for better UX

    return (
        <div className="h-screen bg-white flex flex-col font-sans overflow-hidden">
            {/* Floating Back Button */}
            <button
                onClick={() => navigate(`/r/${slug}/menu`)}
                className="absolute top-4 left-4 z-50 bg-white/80 backdrop-blur-md shadow-lg px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-amber-600 transition-all active:scale-95 border border-slate-100"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>

            {/* Main Viewer Area - White Background */}
            <div className="flex-1 relative w-full bg-white overflow-hidden">
                {/* Subtle Radial Gradient to give depth */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_#f1f5f9_0%,_transparent_100%)]"></div>

                {/* Loading Overlay */}
                {!modelLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-3"></div>
                            <p className="text-slate-500 font-medium">Loading 3D Experience...</p>
                        </div>
                    </div>
                )}

                {/* Toggle Mode Button (Floating Top Right) */}
                {modelLoaded && (ingredients.length > 0 || Object.values(nutritionalInfo).some(v => v > 0)) && (
                    <button
                        onClick={() => setDisplayMode(displayMode === 'nutrition' ? 'ingredients' : 'nutrition')}
                        className="absolute top-4 right-4 z-50 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-100 text-xs font-bold text-slate-600 active:scale-95 transition-all flex items-center gap-1.5 hover:text-amber-600"
                    >
                        {displayMode === 'nutrition' ? '🥗 Ingredients' : '📊 Nutrition'}
                    </button>
                )}

                {/* 3D Model Viewer */}
                <model-viewer
                    ref={modelViewerRef}
                    src={dish.modelUrls?.glb ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/dishes/r/${slug}/dishes/proxy-model/${dish._id}/glb` : undefined}
                    ios-src={dish.modelUrls?.usdz ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/dishes/r/${slug}/dishes/proxy-model/${dish._id}/usdz` : undefined}
                    alt={`3D model of ${dish.name}`}
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    ar-scale="auto"
                    camera-controls
                    touch-action="pan-y"
                    auto-rotate
                    className="w-full h-full"
                    onLoad={handleModelLoad}
                    onError={handleModelError}
                    style={{
                        width: '100%',
                        height: '100%',
                        '--poster-color': 'transparent'
                    }}
                >
                    {/* Native AR Button - Positioned Customly */}
                    <button
                        slot="ar-button"
                        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 z-50 animate-bounce-slight hover:from-amber-600 hover:to-orange-700 transition-all border border-amber-500/30"
                    >
                        <span className="text-xl">✨</span>
                        <span>View in AR</span>
                    </button>

                    {/* Ingredient Hotspots - Light Theme */}
                    {modelLoaded && displayMode === 'ingredients' && ingredients.length > 0 &&
                        ingredients.slice(0, 8).map((ingredient, index) => (
                            <button
                                key={`ing-${index}`}
                                slot={`hotspot-ingredient-${index}`}
                                data-position={ingredientPositions[index]}
                                data-normal="0m 1m 0m"
                                className="bg-white/90 backdrop-blur-md rounded-2xl px-3 py-2 shadow-lg border border-slate-100 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                                style={{ border: 'none' }}
                            >
                                <div className="text-center leading-none">
                                    <div className="text-xl mb-1 drop-shadow-sm">{getIngredientIcon(ingredient)}</div>
                                    <div className="text-[10px] font-bold text-slate-700 uppercase tracking-tight max-w-[60px] truncate">{ingredient}</div>
                                </div>
                            </button>
                        ))
                    }

                    {/* Nutritional Hotspots - Light Theme */}
                    {modelLoaded && displayMode === 'nutrition' && (
                        <>
                            {nutritionalInfo.calories > 0 && (
                                <button slot="hotspot-cal" data-position="-0.35m 0.2m -0.35m" data-normal="-1m 1m -1m" className="hotspot-card" style={{ border: 'none' }}>
                                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 text-center shadow-lg border border-slate-100">
                                        <div className="text-xl mb-1">🔥</div>
                                        <div className="text-sm font-bold text-slate-800">{nutritionalInfo.calories}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">kcal</div>
                                    </div>
                                </button>
                            )}
                            {nutritionalInfo.protein > 0 && (
                                <button slot="hotspot-prot" data-position="0.35m 0.2m -0.35m" data-normal="1m 1m -1m" className="hotspot-card" style={{ border: 'none' }}>
                                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 text-center shadow-lg border border-slate-100">
                                        <div className="text-xl mb-1">🍖</div>
                                        <div className="text-sm font-bold text-slate-800">{nutritionalInfo.protein}g</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">prot</div>
                                    </div>
                                </button>
                            )}
                            {nutritionalInfo.carbs > 0 && (
                                <button slot="hotspot-carb" data-position="0.35m 0.15m 0.35m" data-normal="1m 1m 1m" className="hotspot-card" style={{ border: 'none' }}>
                                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 text-center shadow-lg border border-slate-100">
                                        <div className="text-xl mb-1">🌾</div>
                                        <div className="text-sm font-bold text-slate-800">{nutritionalInfo.carbs}g</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">carbs</div>
                                    </div>
                                </button>
                            )}
                            {nutritionalInfo.sugar > 0 && (
                                <button slot="hotspot-sugar" data-position="-0.35m 0.15m 0.35m" data-normal="-1m 1m 1m" className="hotspot-card" style={{ border: 'none' }}>
                                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 text-center shadow-lg border border-slate-100">
                                        <div className="text-xl mb-1">🍬</div>
                                        <div className="text-sm font-bold text-slate-800">{nutritionalInfo.sugar}g</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">sugar</div>
                                    </div>
                                </button>
                            )}
                        </>
                    )}
                </model-viewer>
            </div>

            {/* Bottom Info Sheet - Light Theme */}
            <div className="bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border-t md:border border-slate-100 z-40 shrink-0 relative md:max-w-4xl md:mx-auto md:mb-8 md:w-[calc(100%-4rem)]">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2"></div>
                <div className="px-6 pb-6 pt-4">
                    <div className="flex justify-between items-start mb-5">
                        <div>
                            <span className="inline-block text-[10px] font-bold tracking-widest text-amber-600 uppercase bg-slate-50 px-2.5 py-1 rounded-lg mb-2 border border-slate-100">
                                {dish.category}
                            </span>
                            <h1 className="text-2xl font-black text-slate-900 leading-tight">
                                {dish.name}
                            </h1>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">₹{dish.price}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Instructions
                            </h3>
                            <ul className="text-[10px] text-slate-600 space-y-1.5 font-semibold leading-tight">
                                <li className="flex gap-2"><span>1.</span><span>Click "View in AR"</span></li>
                                <li className="flex gap-2"><span>2.</span><span>Point camera at surface</span></li>
                                <li className="flex gap-2"><span>3.</span><span>Tap to place dish</span></li>
                            </ul>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Pro Tips
                            </h3>
                            <ul className="text-[10px] text-slate-600 space-y-1.5 font-semibold leading-tight">
                                <li>• Pinch to resize / zoom</li>
                                <li>• Drag to rotate dish</li>
                                <li>• Bright lighting works best</li>
                            </ul>
                        </div>
                    </div>

                    {/* AR Visibility Note */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 md:max-w-2xl md:mx-auto">
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed text-center">
                            <span className="font-bold text-amber-600 italic">Quick Note:</span> 3D annotation icons are visible in preview for all users. Native AR mode (camera view) annotations are optimized for Android (Chrome).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
