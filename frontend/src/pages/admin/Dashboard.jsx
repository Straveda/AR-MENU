import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { deleteDish, getAllDishes, retryModelGeneration, updateDishAvailability, updateDishActiveStatus } from "../../api/dishApi.js";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../../context/AuthProvider";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/common/Toast/ToastContext";
import ConfirmationModal from "../../components/common/ConfirmationModal";

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [retryLoading, setRetryLoading] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  const [showQRModal, setShowQRModal] = useState(false);
  const [homepageUrl, setHomepageUrl] = useState("");
  
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: "", 
    message: "", 
    onConfirm: null, 
    isDangerous: false,
    confirmLabel: "Confirm"
  });

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const fetchDishes = async () => {
    try {
      const res = await getAllDishes();
      setDishes(res.data.data.dishes || []);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      showError("Failed to load dishes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();
    
    setHomepageUrl(`${window.location.origin}`);
  }, []);

  const initiateDelete = (id, name) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Dish",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      isDangerous: true,
      onConfirm: () => handleDelete(id, name)
    });
  };

  const handleDelete = async (id, name) => {
    setDeleteLoading(id);
    closeConfirmModal(); // Close modal immediately, show loading on button if needed, but here we show loading on the action
    try {
      await deleteDish(id);
      setDishes((prev) => prev.filter((dish) => dish._id !== id));
      showSuccess(`Dish "${name}" deleted successfully`);
    } catch (error) {
      console.error("Delete error:", error);
      if (error.response?.status === 423) {
          showError("Action Blocked: Restaurant is Suspended. Please contact support.");
      } else {
          showError("Failed to delete dish");
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleImageError = (dishId) => {
    setImageErrors(prev => ({ ...prev, [dishId]: true }));
  };

  const generateQRCode = () => {
    setShowQRModal(true);
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "website-qr-code.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(homepageUrl).then(() => {
      showSuccess("URL copied to clipboard!");
    });
  };

  const initiateRetryModel = (id, name) => {
    setConfirmModal({
      isOpen: true,
      title: "Retry Model Generation",
      message: `Are you sure you want to retry 3D model generation for "${name}"?`,
      confirmLabel: "Retry",
      isDangerous: false,
      onConfirm: () => {
        closeConfirmModal();
        handleRetryModel(id, name);
      }
    });
  };

  const handleRetryModel = async (id, dishName) => {
    // Confirmation handled by initiateRetryModel
    setRetryLoading(id);
    try {
      await retryModelGeneration(id);
      
      await fetchDishes();
      showInfo(`Model generation started for "${dishName}". This may take 2-5 minutes.`);
    } catch (error) {
      console.error("Retry error:", error);
      if (error.response?.status === 403) {
           showWarning("Plan Upgrade Required: AR Models feature is not included in your current plan.", 5000);
      } else if (error.response?.status === 423) {
           showError("Action Blocked: Restaurant is Suspended.");
      } else {
           showError("Failed to retry model generation");
      }
    } finally {
      setRetryLoading(null);
    }
  };

  const categories = ["all", ...new Set(dishes.map(dish => dish.category).filter(Boolean))];

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || dish.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: dishes.length,
    completed: dishes.filter(d => d.modelStatus === "completed").length,
    processing: dishes.filter(d => d.modelStatus === "processing").length,
    pending: dishes.filter(d => !d.modelStatus || d.modelStatus === "pending").length
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  const getTagColor = (tag) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('spicy')) return 'bg-red-100 text-red-700';
    if (tagLower.includes('vegan')) return 'bg-green-100 text-green-700';
    if (tagLower.includes('vegetarian')) return 'bg-emerald-100 text-emerald-700';
    if (tagLower.includes('gluten')) return 'bg-yellow-100 text-yellow-700';
    if (tagLower.includes('hot')) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  const handleToggleAvailability = async (id, available) => {
    setToggleLoading(id);
    try {
      await updateDishAvailability(id, available);
      setDishes((prev) =>
        prev.map((dish) =>
          dish._id === id ? { ...dish, available } : dish
        )
      );
      showSuccess(`Dish marked as ${available ? 'Available' : 'Unavailable'}`);
    } catch (error) {
      console.error("Toggle error:", error);
      if (error.response?.status === 423) {
          showError("Action Blocked: Restaurant is Suspended.");
      } else {
          showError("Failed to update availability");
      }
    } finally {
      setToggleLoading(null);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    setToggleLoading(id);
    try {
      await updateDishActiveStatus(id, isActive);
      setDishes((prev) =>
        prev.map((dish) =>
          dish._id === id ? { ...dish, isActive } : dish
        )
      );
      showSuccess(`Dish ${isActive ? 'Activated' : 'Deactivated'} successfully`);
    } catch (error) {
      console.error("Toggle active error:", error);
      if (error.response?.status === 403 && error.response?.data?.message?.includes("limit")) {
         showWarning(error.response.data.message, 5000);
      } else if (error.response?.status === 423) {
          showError("Action Blocked: Restaurant is Suspended.");
      } else {
          showError("Failed to update active status");
      }
    } finally {
      setToggleLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 px-4 py-6">
      {}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {useAuth().user?.restaurantId?.name || "Restaurant"} Admin
            </h1>
            <p className="text-gray-600">Manage your restaurant menu and AR models</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {}
            <button
               onClick={() => navigate("/admin/staff")}
               className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
               Manage Staff
            </button>

            {}
            <button
              onClick={generateQRCode}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              QR Code
            </button>

            <button
              onClick={() => navigate("/admin/add-dish")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Dish
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Dishes", value: stats.total, color: "blue", icon: "📋" },
            { label: "AR Ready", value: stats.completed, color: "green", icon: "✅" },
            { label: "Processing", value: stats.processing, color: "yellow", icon: "⏳" },
            { label: "Pending", value: stats.pending, color: "gray", icon: "⏸️" }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center text-lg`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Dishes</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {}
          {(searchTerm || selectedCategory !== 'all') && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm">
                  Search: "{searchTerm}"
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm">
                  Category: {selectedCategory}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-amber-600 hover:text-amber-700 text-sm font-medium ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-amber-100 overflow-hidden">
          {}
          <div className="px-6 py-4 border-b border-amber-100">
            <h2 className="text-xl font-semibold text-gray-800">
              Menu Items ({filteredDishes.length})
            </h2>
          </div>

          {}
          <div className="p-6">
            {loading ? (
              <Loading message="Loading dishes..." />
            ) : filteredDishes.length === 0 ? (
               dishes.length === 0 ? (
                  <EmptyState 
                    title="No dishes yet" 
                    message="Get started by adding your first dish to the menu." 
                    icon="📋"
                    actionLabel="Add Your First Dish"
                    onAction={() => navigate("/admin/add-dish")}
                  />
               ) : (
                  <EmptyState 
                    title="No dishes found" 
                    message="Try adjusting your search or filter criteria." 
                    icon="🔍"
                    actionLabel="Clear Filters"
                    onAction={clearFilters}
                  />
               )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDishes.map((dish) => (
                  <div
                    key={dish._id}
                    className="border border-amber-100 rounded-lg bg-white hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col h-full"
                  >
                    {}
                    <div className="relative h-48 bg-amber-50 overflow-hidden shrink-0">
                      {!imageErrors[dish._id] && dish.imageUrl ? (
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => handleImageError(dish._id)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-100">
                          <div className="text-center text-amber-400">
                            <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs font-medium">No Image</p>
                          </div>
                        </div>
                      )}

                      {}
                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${dish.modelStatus === "completed"
                          ? "bg-green-100 text-green-800"
                          : dish.modelStatus === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-600"
                          }`}>
                          {dish.modelStatus || "pending"}
                        </span>
                      </div>

                      {}
                      <div className="absolute top-3 right-3 bg-amber-600 text-white px-2 py-1 rounded-lg text-sm font-bold">
                        ₹{dish.price}
                      </div>
                    </div>

                    {}
                    <div className="p-4 flex flex-col grow">
                      {}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-1">{dish.name}</h3>
                      </div>

                      {}
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          🍽️ {dish.category.charAt(0).toUpperCase() + dish.category.slice(1)}
                        </span>
                      </div>

                      {dish.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 italic leading-relaxed">
                          "{dish.description}"
                        </p>
                      )}

                      <div className="space-y-3 mb-4 mt-auto">
                        {}
                        {dish.ingredients?.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                            <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                              <span>🥘</span> Ingredients
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                              {dish.ingredients.join(", ")}
                            </p>
                          </div>
                        )}

                        {}
                        {dish.tags?.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                            <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                              <span>🏷️</span> Tags
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {dish.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTagColor(tag)}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {}
                      <div className="flex items-center justify-between mb-2 py-2 border-t border-gray-100">
                        <span className="text-sm text-gray-700 font-medium">Plan Status</span>
                         <button
                          onClick={() => handleToggleActive(dish._id, !dish.isActive)}
                          disabled={toggleLoading === dish._id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${dish.isActive ? 'bg-indigo-500' : 'bg-gray-200'
                            } ${toggleLoading === dish._id ? 'opacity-50' : ''}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${dish.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-4 py-2 border-t border-gray-100">
                        <span className="text-sm text-gray-700 font-medium flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${dish.available ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          Available
                        </span>
                        <button
                          onClick={() => handleToggleAvailability(dish._id, !dish.available)}
                          disabled={toggleLoading === dish._id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${dish.available ? 'bg-green-500' : 'bg-gray-200'
                            } ${toggleLoading === dish._id ? 'opacity-50' : ''}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${dish.available ? 'translate-x-6' : 'translate-x-1'
                              }`}
                          />
                        </button>
                      </div>

                      {}
                      <div className="flex flex-col gap-2 mt-auto">
                        {}
                        {dish.modelStatus === 'failed' && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                            <p className="text-xs text-red-700 text-center">❌ Model generation failed</p>
                          </div>
                        )}
                        {dish.modelStatus === 'processing' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                            <p className="text-xs text-yellow-700 text-center">⏳ Generating 3D model...</p>
                          </div>
                        )}
                        {dish.modelStatus === 'completed' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                            <p className="text-xs text-green-700 text-center">✅ AR Ready</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/admin/edit-dish/${dish._id}`)}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>

                          {dish.modelStatus === 'failed' ? (
                            <button
                              onClick={() => initiateRetryModel(dish._id, dish.name)}
                              disabled={retryLoading === dish._id}
                              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                            >
                              {retryLoading === dish._id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              )}
                              {retryLoading === dish._id ? 'Retrying...' : 'Retry 3D'}
                            </button>
                          ) : (
                            <button
                              onClick={() => initiateDelete(dish._id, dish.name)}
                              disabled={deleteLoading === dish._id}
                              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                            >
                              {deleteLoading === dish._id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                              {deleteLoading === dish._id ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Website QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex justify-center mb-4 p-4 bg-white rounded-lg">
              <QRCodeSVG
                id="qr-code-svg"
                value={homepageUrl}
                size={200}
                level="H"
                includeMargin={true}
                fgColor="#1f2937"
                bgColor="#ffffff"
              />
            </div>

            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 break-all bg-gray-50 p-2 rounded">
                {homepageUrl}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyUrlToClipboard}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy URL
              </button>

              <button
                onClick={downloadQRCode}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download QR
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        confirmLabel={confirmModal.confirmLabel}
        isDangerous={confirmModal.isDangerous}
      />
    </div>
  );
}