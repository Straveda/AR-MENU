import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useNavigate, useParams } from "react-router-dom";
import { useOrder } from "../../context/OrderContext";
import { useTenant } from "../../context/TenantProvider";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";

export default function Menu() {
  const navigate = useNavigate();
  const { slug } = useTenant();
  const { items } = useOrder();
  const [dishes, setDishes] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("recommended");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [suspended, setSuspended] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const getTagColor = (tag) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('spicy')) return 'bg-red-100 text-red-700';
    if (tagLower.includes('vegan')) return 'bg-green-100 text-green-700';
    if (tagLower.includes('vegetarian')) return 'bg-emerald-100 text-emerald-700';
    if (tagLower.includes('gluten')) return 'bg-yellow-100 text-yellow-700';
    if (tagLower.includes('hot')) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  const categories = [
    "all", "appetizers", "main course", "desserts", "beverages", "soups", "salads", "specials"
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

  const filteredDishes = dishes.filter(dish => {
    const matchesCategory = activeCategory === "all" ||
      dish.category?.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const dishesByCategory = filteredDishes.reduce((acc, dish) => {
    const category = dish.category || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(dish);
    return acc;
  }, {});

  if (notFound) {
      return (
          <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 text-center max-w-md w-full">
                  <div className="text-6xl mb-4">🏠</div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">Restaurant Not Found</h1>
                  <p className="text-gray-600">The restaurant you are looking for does not exist or has closed.</p>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-amber-50 pb-20">
      {suspended && (
          <div className="bg-red-600 text-white px-4 py-3 text-center shadow-md sticky top-0 z-50">
              <p className="font-bold flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  Temporarily Closed
              </p>
              <p className="text-sm opacity-90">Ordering is currently unavailable. Please check back later.</p>
          </div>
      )}
      
      {}
      <div className={`bg-white/80 backdrop-blur-md border-b border-amber-100 sticky ${suspended ? 'top-16' : 'top-0'} z-30 shadow-sm transition-all duration-300`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          {}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {restaurant?.name?.charAt(0) || "R"}
            </div>
            <h1 className="font-bold text-gray-800 text-xl tracking-tight">
              {restaurant?.name || (
                <>
                  Restaurant<span className="text-amber-600">AR</span>
                </>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {}
            <button
              onClick={() => navigate(`/r/${slug}/track-order`)}
              className="px-5 py-2 text-sm font-semibold text-amber-700 bg-orange-50 hover:bg-orange-100 rounded-full border border-orange-100 transition-all shadow-sm hidden sm:flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Track Order
            </button>

            {}
            <button
              onClick={() => navigate(`/r/${slug}/track-order`)}
              className="p-2 text-amber-700 bg-orange-50 hover:bg-orange-100 rounded-full border border-orange-100 sm:hidden transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>

            {}
            <button
              onClick={() => navigate(`/r/${slug}/cart`)}
              className="group relative p-2 text-gray-600 hover:text-amber-600 transition-colors bg-gray-50 hover:bg-amber-50 rounded-full border border-transparent hover:border-amber-100"
            >
              <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-amber-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md ring-2 ring-white animate-fade-in-scale">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4">
        {}
        <div className="max-w-6xl mx-auto mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-amber-700 mb-2">
            Our Menu
          </h2>
          <div className="w-16 h-1 bg-amber-400 mx-auto mb-3 opacity-50"></div>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Discover our carefully crafted dishes made with the finest ingredients
          </p>
        </div>

        {}
        <div className="max-w-4xl mx-auto mb-6 bg-white rounded-xl shadow-sm p-4 border border-amber-100">
          {}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {}
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-base border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {}
            <div className="flex-shrink-0">
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="appearance-none w-full md:w-48 pl-4 pr-10 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-amber-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeCategory === category
                  ? "bg-amber-600 text-white shadow-md transform scale-105"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  }`}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {}
        {loading ? (
          <Loading message="Loading our delicious menu..." />
        ) : filteredDishes.length === 0 ? (
          <EmptyState 
            title="No dishes found" 
            message="Try adjusting your search or filter criteria" 
            icon="🍽️"
            actionLabel="Clear Filters"
            onAction={() => { setSearchTerm(""); setActiveCategory("all"); }}
          />
        ) : (
          
          <div className="max-w-6xl mx-auto">
            {Object.entries(dishesByCategory).map(([category, categoryDishes]) => (
              <div key={category} className="mb-8">
                {}
                <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-amber-200">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h2>
                  <span className="text-sm text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                    {categoryDishes.length} {categoryDishes.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryDishes.map((dish) => (
                    <div
                      key={dish._id}
                      onClick={() => navigate(`/r/${slug}/dish/${dish._id}`)}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group border border-amber-100 flex flex-col h-full"
                    >
                      {}
                      <div className="relative overflow-hidden bg-white h-40 flex-shrink-0">
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 bg-white ${!dish.available ? 'grayscale opacity-75' : ''}`}
                          onError={(e) => {
                            
                            e.target.style.display = 'none';
                            const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                            if (placeholder) {
                              placeholder.classList.remove('hidden');
                            }
                          }}
                        />
                        {}
                        {!dish.available && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] z-10">
                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg transform -rotate-6 border-2 border-white">
                              SOLD OUT
                            </span>
                          </div>
                        )}
                        {}
                        <div className="image-placeholder hidden w-full h-full flex items-center justify-center bg-amber-100">
                          <div className="text-center">
                            <svg className="w-10 h-10 text-amber-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-amber-600 text-xs font-medium">No Image</p>
                          </div>
                        </div>
                        {}
                      </div>

                      {}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors flex-1 mr-2 leading-tight">
                            {dish.name}
                          </h3>
                        </div>

                        {}
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            🍽️ {dish.category.charAt(0).toUpperCase() + dish.category.slice(1)}
                          </span>
                        </div>

                        {}
                        {dish.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {dish.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTagColor(tag)}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {dish.description && (
                          <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                            {dish.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                          <span className="text-amber-600 font-bold text-lg">
                            ₹{dish.price}
                          </span>
                          <button
                            disabled={!dish.available}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 text-sm flex items-center gap-1 shadow-sm ${!dish.available
                              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                              : 'bg-amber-500 hover:bg-amber-600 text-white'
                              }`}
                          >
                            {!dish.available ? 'Unavailable' : 'View'}
                            {dish.available && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
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

        {}
        <div className="max-w-6xl mx-auto mt-8 mb-4 text-center bg-white rounded-lg p-4 border border-amber-100">
          <p className="text-sm text-gray-500">
            💫 All prices include taxes. Please inform us of any dietary restrictions.
          </p>
          <p className="text-amber-600 font-semibold mt-1 text-sm">
            Thank you for choosing us!
          </p>
        </div>
      </div>

      {}
      {}
    </div>
  );
}