import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axiosClient from "../../api/axiosClient";
import "@google/model-viewer";

export default function ARViewer() {
    const { slug, id } = useParams();
    const navigate = useNavigate();
    const modelViewerRef = useRef(null);
    const [dish, setDish] = useState(null);
    const [loading, setLoading] = useState(true);
    const [arError, setArError] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);

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

    return (
        <div className="min-h-screen bg-amber-50">
            {}
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

            {}
            <div className="max-w-6xl mx-auto p-4">
                <div className="bg-white rounded-xl shadow-lg border border-amber-100 overflow-hidden">
                    {}
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

                    {}
                    <div className="p-6">
                        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative">
                            {}
                            {!modelLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                                        <p className="text-gray-600 mt-2 text-sm">Loading 3D Model...</p>
                                    </div>
                                </div>
                            )}

                            {}
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
                                {}
                                <button
                                    slot="ar-button"
                                    className="absolute bottom-4 right-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
                                >
                                    👆 View in AR
                                </button>
                            </model-viewer>
                        </div>

                        {}
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

                {}
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                        💫 AR experience powered by Google Model Viewer. Requires compatible device.
                    </p>
                </div>
            </div>
        </div>
    );
}