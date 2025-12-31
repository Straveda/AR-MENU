import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useOrder } from "../../context/OrderContext";
import { useTenant } from "../../context/TenantProvider";

export default function DishDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { slug } = useTenant(); 
  const { addItem } = useOrder();
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [suspended, setSuspended] = useState(false);

  const [recommendations, setRecommendations] = useState([]);

  const handleAddToOrder = () => {
    if (suspended) {
        alert("Ordering is temporarily unavailable as the restaurant is suspended.");
        return;
    }
    if (dish) {
      
      addItem(dish, quantity);
      alert(`Added ${quantity} x ${dish.name} to order!`);
    }
  };

  const handleAddRecommendationToOrder = (recDish) => {
    if (suspended) {
        alert("Ordering is temporarily unavailable.");
        return;
    }
    addItem(recDish, 1);
    alert(`Added 1 x ${recDish.name} to order!`);
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

  const fetchDish = async () => {
    if (!slug || !id) return;

    try {
      
      const { data } = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}`);
      setDish(data.data.dish);
      
      try {
        const recData = await axiosClient.get(`/dishes/r/${slug}/dishes/${id}/also-ordered`);
        if (recData.data.success) {
          setRecommendations(recData.data.data);
        }
      } catch (recError) {
        console.error("Error fetching recommendations:", recError);
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
  }, [id]);

  const arStatusConfig = {
    completed: {
      label: "View in AR",
      color: "green",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: () => navigate(`/ar/${id}`)
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
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="text-gray-600 mt-3">Loading dish details...</p>
        </div>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Dish Not Found</h3>
          <p className="text-gray-600 mb-4">The dish you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const arStatus = getArStatus();

  return (
    <div className="min-h-screen bg-amber-50">
      {suspended && (
          <div className="bg-red-600 text-white px-4 py-3 text-center shadow-md sticky top-0 z-50">
              <p className="font-bold flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  Temporarily Closed
              </p>
          </div>
      )}
      
      {}
      <div className={`border-b border-amber-200 bg-white sticky ${suspended ? 'top-12' : 'top-0'} z-20 shadow-sm`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button
            onClick={() => navigate(`/r/${slug}/menu`)}
            className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition-colors group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Menu
          </button>
        </div>
      </div>

      {}
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {}
          <div className="w-full lg:w-1/2">
            <div className="sticky top-24 space-y-6">
              <div className="relative aspect-square md:aspect-4/3 w-full bg-gray-50 rounded-3xl overflow-hidden shadow-md border border-amber-100">
                {!imageError && dish.imageUrl ? (
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className={`w-full h-full object-cover transition-all duration-700 ${!dish.available ? 'grayscale blur-[2px] opacity-70' : ''}`}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-amber-50">
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

              {}
              <div className="bg-white rounded-2xl p-1 shadow-sm border border-amber-50">
                {arStatus.color === "green" ? (
                  <button
                    onClick={arStatus.action}
                    disabled={suspended}
                    className={`w-full group bg-linear-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white py-4 px-6 rounded-xl font-bold shadow-lg transition-all flex items-center justify-between transform hover:-translate-y-0.5 ${suspended ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        {arStatus.icon}
                      </span>
                      <div className="text-left">
                        <span className="block text-sm font-normal text-gray-300">Experience it in 3D</span>
                        <span className="block text-lg heading-font">View in AR</span>
                      </div>
                    </span>
                    <svg className="w-6 h-6 text-white/50 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-center gap-3 text-gray-400 border border-dashed border-gray-200">
                    {arStatus.icon}
                    <span className="text-sm font-medium">{arStatus.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {}
          <div className="w-full lg:w-1/2 space-y-8 pb-20 lg:pb-0">
            {}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-800">
                  {dish.category}
                </span>
                {dish.tags?.map((tag, idx) => (
                  <span key={idx} className={`text-xs px-2 py-1 rounded-full font-medium border ${getTagColor(tag).replace('bg-', 'border-').replace('text-', 'text-opacity-80 text-')} bg-transparent`}>
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {dish.name}
              </h1>

              <div className="flex items-baseline gap-4 py-4 border-b border-gray-100">
                <span className="text-4xl font-extrabold text-amber-600">₹{dish.price}</span>
                {dish.portionSize && (
                  <span className="text-lg text-gray-400 font-medium">/ {dish.portionSize}</span>
                )}
              </div>
            </div>

            {}
            <div className={`lg:hidden mb-6 pb-6 border-b border-gray-100 ${(!dish.available || suspended) ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-500 hover:text-amber-600 transition-colors"
                  >-</button>
                  <span className="font-bold text-xl text-gray-800 w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-500 hover:text-amber-600 transition-colors"
                  >+</button>
                </div>

                <button
                  onClick={handleAddToOrder}
                  disabled={suspended || !dish.available}
                  className={`w-full font-bold text-lg py-4 px-8 rounded-xl shadow-xl transition-all transform flex items-center justify-center gap-3 ${suspended ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white hover:-translate-y-1 hover:shadow-2xl shadow-amber-200'}`}
                >
                  <span>{suspended ? 'Ordering Unavailable' : 'Add to Order'}</span>
                  {!suspended && <span className="bg-amber-700/50 px-2 py-0.5 rounded text-sm">₹{dish.price * quantity}</span>}
                </button>

                {}

                <div className="text-center">
                  <button onClick={() => navigate(`/r/${slug}/cart`)} className="text-sm font-semibold text-gray-500 hover:text-amber-600 underline decoration-2 decoration-transparent hover:decoration-amber-200 transition-all">
                    View current order →
                  </button>
                </div>
              </div>
            </div>

            {}
            {dish.description && (
              <div className="prose prose-amber text-gray-600 leading-relaxed text-lg">
                <p>{dish.description}</p>
              </div>
            )}

            {}
            {recommendations.length > 0 && (
              <div className="py-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">People Also Ordered With This Dish</h3>
                <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                  <div className="flex gap-4 w-max">
                    {recommendations.map((recDish) => (
                      <div key={recDish._id} className="w-40 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden shrink-0">
                        <div 
                          className="h-28 w-full bg-gray-100 cursor-pointer"
                          onClick={() => navigate(`/r/${slug}/dish/${recDish._id}`)}
                        >
                          {recDish.imageUrl ? (
                            <img src={recDish.imageUrl} alt={recDish.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 
                            className="font-bold text-gray-900 text-sm truncate cursor-pointer hover:text-amber-600"
                            onClick={() => navigate(`/r/${slug}/dish/${recDish._id}`)}
                          >
                            {recDish.name}
                          </h4>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-bold text-amber-600 text-sm">₹{recDish.price}</span>
                            <button 
                              onClick={() => handleAddRecommendationToOrder(recDish)}
                              className="bg-amber-100 hover:bg-amber-200 text-amber-700 p-1.5 rounded-lg transition-colors"
                              title="Add to Order"
                              disabled={suspended}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dish.ingredients?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span>🥬</span> Ingredients
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {dish.ingredients.map((ing, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span>ℹ️</span> Dietary Info
                </h3>
                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 leading-snug">
                  Specific allergies? Please verify with staff. Kitchen handles common allergens.
                </div>
              </div>
            </div>

            {}
            {dish.nutritionalInfo && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Nutritional Facts</h3>
                <div className="grid grid-cols-4 gap-2 text-center divide-x divide-gray-100">
                  <div>
                    <div className="font-bold text-lg text-amber-600">{dish.nutritionalInfo.calories || 0}</div>
                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Cals</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-800">{dish.nutritionalInfo.protein || 0}g</div>
                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Protein</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-800">{dish.nutritionalInfo.carbs || 0}g</div>
                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Carbs</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-800">{dish.nutritionalInfo.sugar || 0}g</div>
                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Sugar</div>
                  </div>
                </div>
              </div>
            )}

            {}
            <div className={`hidden lg:block mt-8 pt-8 border-t border-gray-100 ${(!dish.available || suspended) ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex flex-col sm:flex-row gap-4">
                {}
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 sm:w-40">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-500 hover:text-amber-600 transition-colors"
                  >-</button>
                  <span className="font-bold text-xl text-gray-800 w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-500 hover:text-amber-600 transition-colors"
                  >+</button>
                </div>

                {}
                <button
                  onClick={handleAddToOrder}
                  disabled={suspended || !dish.available}
                  className={`flex-1 font-bold text-lg py-4 px-8 rounded-xl shadow-xl transition-all transform flex items-center justify-center gap-3 ${suspended ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white hover:-translate-y-1 hover:shadow-2xl shadow-amber-200'}`}
                >
                  <span>{suspended ? 'Ordering Unavailable' : 'Add to Order'}</span>
                  {!suspended && <span className="bg-amber-700/50 px-2 py-0.5 rounded text-sm">₹{dish.price * quantity}</span>}
                </button>
              </div>

              {}

              <div className="mt-4 text-center">
                <button onClick={() => navigate(`/r/${slug}/cart`)} className="text-sm font-semibold text-gray-500 hover:text-amber-600 underline decoration-2 decoration-transparent hover:decoration-amber-200 transition-all">
                  View current order →
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
      {}
      <div className="text-center pb-8">
        <p className="text-sm text-gray-500">
          💫 All prices include taxes & service charges.
        </p>
      </div>
    </div>
  );
}