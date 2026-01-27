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

// Calculate circular positions for ingredients
function calculateCircularPositions(count) {
    if (count === 0) return [];

    const positions = [];
    const radius = 42; // percentage from center
    const angleStep = (2 * Math.PI) / count;

    for (let i = 0; i < count; i++) {
        const angle = i * angleStep - Math.PI / 2; // Start from top
        positions.push({
            top: `${50 + radius * Math.sin(angle)}%`,
            left: `${50 + radius * Math.cos(angle)}%`,
        });
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
            <div className="min-h-screen bg-amber-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="text-gray-600 mt-3">Loading AR experience...</p>
                </div>
            </div>
        );
    }

    if (!dish || arError) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">AR Model Error</h3>
                    <p className="text-gray-600 mb-4">Unable to load the AR experience for this dish.</p>
                    <button
                        onClick={() => navigate(`/r/${slug}/menu`)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Back to Menu
                    </button>
                </div>
            </div>
        );
    }

    if (dish.modelStatus !== "completed") {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">AR Model Processing</h3>
                    <p className="text-gray-600 mb-2">The 3D model for this dish is still being generated.</p>
                    <p className="text-sm text-gray-500 mb-4">This usually takes a few minutes. Please check back later.</p>
                    <button
                        onClick={() => navigate(`/r/${slug}/menu`)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
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
        <div className="min-h-screen bg-amber-50">
            {/* Header */}
            <div className="border-b border-amber-200 bg-white">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <button
                        onClick={() => navigate(`/r/${slug}/menu`)}
                        className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition-colors group"
                    >
                        <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Menu
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto p-4">
                <div className="bg-white rounded-xl shadow-lg border border-amber-100 overflow-hidden">
                    {/* Dish Info Header */}
                    <div className="p-6 border-b border-amber-100">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                            {dish.name}
                        </h1>
                        <div className="flex items-center gap-4">
                            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                                {dish.category}
                            </span>
                            <span className="text-lg font-semibold text-amber-600">
                                ₹{dish.price}
                            </span>
                        </div>
                        <p className="text-green-600 font-medium mt-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            AR View Enabled
                        </p>
                    </div>

                    {/* AR Viewer Section */}
                    <div className="p-6">
                        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative">
                            {/* Loading Overlay */}
                            {!modelLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                                        <p className="text-gray-600 mt-2 text-sm">Loading 3D Model...</p>
                                    </div>
                                </div>
                            )}

                            {/* Toggle Button */}
                            {modelLoaded && (ingredients.length > 0 || Object.values(nutritionalInfo).some(v => v > 0)) && (
                                <button
                                    onClick={() => setDisplayMode(displayMode === 'nutrition' ? 'ingredients' : 'nutrition')}
                                    className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200 hover:bg-white transition-all text-sm font-medium text-gray-700 hover:text-amber-600 flex items-center gap-2"
                                >
                                    {displayMode === 'nutrition' ? (
                                        <>
                                            <span>🥗</span>
                                            <span className="hidden sm:inline">Show Ingredients</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>📊</span>
                                            <span className="hidden sm:inline">Show Nutrition</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Dietary Tags */}
                            {modelLoaded && tags.length > 0 && (
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-2 z-20 hidden md:block">
                                    {tags.slice(0, 5).map((tag, index) => (
                                        <div
                                            key={index}
                                            className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-1.5"
                                        >
                                            <span>{getTagIcon(tag)}</span>
                                            <span>{tag}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Nutritional Info Badges */}
                            {modelLoaded && displayMode === 'nutrition' && (
                                <>
                                    {/* Calories - Top Left */}
                                    {nutritionalInfo.calories > 0 && (
                                        <div className="absolute top-[10%] left-[8%] z-20">
                                            <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-3 shadow-xl border border-gray-200">
                                                <div className="text-center">
                                                    <div className="text-2xl mb-1">🔥</div>
                                                    <div className="text-lg font-bold text-gray-800">{nutritionalInfo.calories}</div>
                                                    <div className="text-xs text-gray-600">kcal</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Protein - Top Right */}
                                    {nutritionalInfo.protein > 0 && (
                                        <div className="absolute top-[10%] right-[8%] z-20">
                                            <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-3 shadow-xl border border-gray-200">
                                                <div className="text-center">
                                                    <div className="text-2xl mb-1">🍖</div>
                                                    <div className="text-lg font-bold text-gray-800">{nutritionalInfo.protein}g</div>
                                                    <div className="text-xs text-gray-600">Protein</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Carbs - Bottom Right */}
                                    {nutritionalInfo.carbs > 0 && (
                                        <div className="absolute bottom-[20%] right-[8%] z-20">
                                            <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-3 shadow-xl border border-gray-200">
                                                <div className="text-center">
                                                    <div className="text-2xl mb-1">🌾</div>
                                                    <div className="text-lg font-bold text-gray-800">{nutritionalInfo.carbs}g</div>
                                                    <div className="text-xs text-gray-600">Carbs</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sugar - Bottom Left */}
                                    {nutritionalInfo.sugar > 0 && (
                                        <div className="absolute bottom-[20%] left-[8%] z-20">
                                            <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-3 shadow-xl border border-gray-200">
                                                <div className="text-center">
                                                    <div className="text-2xl mb-1">🍬</div>
                                                    <div className="text-lg font-bold text-gray-800">{nutritionalInfo.sugar}g</div>
                                                    <div className="text-xs text-gray-600">Sugar</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Ingredient Badges - Circular Layout */}
                            {modelLoaded && displayMode === 'ingredients' && ingredients.length > 0 && (
                                <>
                                    {ingredients.slice(0, 8).map((ingredient, index) => {
                                        const position = ingredientPositions[index];
                                        return (
                                            <div
                                                key={index}
                                                className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
                                                style={{
                                                    top: position.top,
                                                    left: position.left,
                                                }}
                                            >
                                                <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-2 shadow-xl border border-gray-200">
                                                    <div className="text-center">
                                                        <div className="text-xl mb-0.5">{getIngredientIcon(ingredient)}</div>
                                                        <div className="text-xs font-medium text-gray-700 whitespace-nowrap">{ingredient}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}

                            {/* 3D Model Viewer */}
                            <model-viewer
                                ref={modelViewerRef}
                                src={dish.modelUrls?.glb ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/dishes/r/${slug}/dishes/proxy-model/${dish._id}/glb` : undefined}
                                ios-src={dish.modelUrls?.usdz ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/dishes/r/${slug}/dishes/proxy-model/${dish._id}/usdz` : undefined}
                                alt={`3D model of ${dish.name}`}
                                ar
                                ar-modes="webxr scene-viewer quick-look"
                                camera-controls
                                auto-rotate
                                className="w-full h-96 md:h-[500px]"
                                onLoad={handleModelLoad}
                                onError={handleModelError}
                                style={{ display: modelLoaded ? 'block' : 'none' }}
                            >
                                {/* AR Button */}
                                <button
                                    slot="ar-button"
                                    className="absolute bottom-4 right-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
                                >
                                    👆 View in AR
                                </button>
                            </model-viewer>
                        </div>

                        {/* Standalone AR Launch Button */}
                        {modelLoaded && (
                            <div className="mt-4 flex justify-center">
                                <button
                                    onClick={() => {
                                        if (modelViewerRef.current) {
                                            modelViewerRef.current.activateAR();
                                        }
                                    }}
                                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-3"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    View in AR
                                </button>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    How to Use AR
                                </h3>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Click "View in AR" button</li>
                                    <li>• Allow camera access when prompted</li>
                                    <li>• Point your camera at a flat surface</li>
                                    <li>• Tap to place the 3D model</li>
                                </ul>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Tips
                                </h3>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Works best in good lighting</li>
                                    <li>• Use on a stable surface</li>
                                    <li>• Move around to view from different angles</li>
                                    <li>• Compatible with most modern smartphones</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                        💫 AR experience powered by Google Model Viewer. Requires compatible device.
                    </p>
                </div>
            </div>
        </div>
    );
}
