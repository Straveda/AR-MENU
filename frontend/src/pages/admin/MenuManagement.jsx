import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { deleteDish, getAllDishes, retryModelGeneration, updateDishAvailability } from "../../api/dishApi.js";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../../context/AuthProvider";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/common/Toast/ToastContext";
import ConfirmationModal from "../../components/common/ConfirmationModal";

export default function MenuManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    if (user?.restaurantId?.slug) {
      setHomepageUrl(`${window.location.origin}/r/${user.restaurantId.slug}/menu`);
    } else {
      setHomepageUrl(`${window.location.origin}`);
    }
  }, [user]);

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
    closeConfirmModal();
    try {
      await deleteDish(id);
      setDishes((prev) => prev.filter((dish) => dish._id !== id));
      showSuccess(`Dish "${name}" deleted successfully`);
    } catch (error) {
      console.error("Delete error:", error);
      if (error.response?.status === 423) {
        showError("Action Blocked: Restaurant is Suspended.");
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



  return (
    <div className="space-y-6">
      { }
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="type-h1">Menu Overview</h1>
          <p className="type-secondary mt-1">Manage your restaurant menu items and AR status</p>
        </div>

        <div className="flex flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={generateQRCode}
            className="bg-indigo-500 hover:bg-indigo-600 text-white type-btn px-6 py-3 rounded-xl transition-all duration-200 flex flex-1 sm:flex-none justify-center items-center gap-2 shadow-lg hover:shadow-xl group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Quick QR
          </button>

          <button
            onClick={() => navigate("/admin/add-dish")}
            className="btn-primary shadow-lg hover:shadow-xl group px-6 py-3 flex-1 sm:flex-none justify-center flex items-center gap-2"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Dish
          </button>
        </div>
      </div>

      { }
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Dishes", value: stats.total, color: "blue", icon: "📋" },
          { label: "AR Ready", value: stats.completed, color: "green", icon: "✅" },
          { label: "Processing", value: stats.processing, color: "yellow", icon: "⏳" },
          { label: "Pending", value: stats.pending, color: "gray", icon: "⏸️" }
        ].map((stat, index) => (
          <div key={index} className="card-premium p-5 border-amber-100/50">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center text-xl`}>
                {stat.icon}
              </div>
              <div>
                <p className="type-metric">{stat.value}</p>
                <p className="type-label opacity-80">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      { }
      <div className="card-premium p-6 border-amber-100/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block type-label mb-2">Search Dishes</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 input-standard bg-amber-50/50"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block type-label mb-2">Filter by Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 input-standard bg-amber-50/50"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

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

      { }
      <div className="card-premium overflow-hidden border-amber-100/50">
        <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/20">
          <h2 className="type-h2">
            Menu Items ({filteredDishes.length})
          </h2>
        </div>

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
                  className="card-premium hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full border-slate-200"
                >
                  <div className="relative h-48 bg-amber-50 overflow-hidden shrink-0">
                    {!imageErrors[dish._id] && dish.imageUrl ? (
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={() => handleImageError(dish._id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-100/50">
                        <div className="text-center text-amber-400">
                          <svg className="w-8 h-8 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="type-caption text-amber-400 font-medium uppercase tracking-wider">Image Missing</p>
                        </div>
                      </div>
                    )}

                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-lg type-caption font-medium shadow-sm ${dish.modelStatus === "completed"
                        ? "bg-emerald-500 text-white"
                        : dish.modelStatus === "processing"
                          ? "bg-amber-500 text-slate-900"
                          : "bg-slate-200 text-slate-600"
                        }`}>
                        {dish.modelStatus || "pending"}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                      ₹{dish.price}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="type-h3 leading-tight line-clamp-1 group-hover:text-amber-600 transition-colors uppercase tracking-tight">{dish.name}</h3>
                    </div>

                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg badge-standard bg-amber-50 text-amber-600 border border-amber-100">
                        🍽️ {dish.category}
                      </span>
                    </div>

                    {dish.description && (
                      <p className="type-secondary line-clamp-2 mb-4">
                        {dish.description}
                      </p>
                    )}

                    <div className="space-y-4 mb-6 mt-auto">
                      {dish.ingredients?.length > 0 && (
                        <div>
                          <p className="type-label mb-1.5 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-amber-500"></span> Ingredients
                          </p>
                          <p className="type-body-sm text-slate-600 leading-relaxed line-clamp-2 font-medium">
                            {dish.ingredients.join(", ")}
                          </p>
                        </div>
                      )}

                      {dish.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {dish.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className={`badge-standard border ${getTagColor(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-50 space-y-3">


                      <div className="flex items-center justify-between">
                        <span className="type-label">Availability</span>
                        <button
                          onClick={() => handleToggleAvailability(dish._id, !dish.available)}
                          disabled={toggleLoading === dish._id}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ${dish.available ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${dish.available ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => navigate(`/admin/edit-dish/${dish._id}`)}
                        className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 py-2.5 rounded-xl type-btn transition-all duration-200 flex items-center justify-center gap-1.5 border border-amber-100 shadow-sm"
                      >
                        Edit
                      </button>

                      {dish.modelStatus === 'failed' ? (
                        <button
                          onClick={() => initiateRetryModel(dish._id, dish.name)}
                          disabled={retryLoading === dish._id}
                          className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-xl type-btn transition-all duration-200 flex items-center justify-center gap-1.5 border border-indigo-100 shadow-sm"
                        >
                          Retry
                        </button>
                      ) : (
                        <button
                          onClick={() => initiateDelete(dish._id, dish.name)}
                          disabled={deleteLoading === dish._id}
                          className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2.5 rounded-xl type-btn transition-all duration-200 flex items-center justify-center gap-1.5 border border-rose-100 shadow-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        confirmLabel={confirmModal.confirmLabel}
        isDangerous={confirmModal.isDangerous}
      />

      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-60 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Restaurant QR</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Scan to view menu</p>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex justify-center mb-6 p-6 bg-amber-50 rounded-3xl border-2 border-dashed border-amber-200">
              <QRCodeSVG
                id="qr-code-svg"
                value={homepageUrl}
                size={220}
                level="H"
                includeMargin={true}
                fgColor="#0f172a"
                bgColor="transparent"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8 overflow-hidden group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Direct Link</p>
              <p className="text-xs text-slate-600 font-bold break-all group-hover:text-amber-600 transition-colors">
                {homepageUrl}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={copyUrlToClipboard}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
              >
                Copy Link
              </button>

              <button
                onClick={downloadQRCode}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}