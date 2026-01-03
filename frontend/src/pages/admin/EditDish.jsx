import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

export default function EditDish() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    ingredients: "",
    tags: "",
    portionSize: "",
    calories: "",
    protein: "",
    carbs: "",
    sugar: "",
    available: true,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDish = async () => {
      try {
        const res = await axiosClient.get(`/dishes/getdish/${id}`);
        const dish = res.data.data.dish;

        setForm({
          name: dish.name || "",
          description: dish.description || "",
          price: dish.price || "",
          category: dish.category || "",
          imageUrl: dish.imageUrl || "",
          ingredients: dish.ingredients?.join(', ') || "",
          tags: dish.tags?.join(', ') || "",
          portionSize: dish.portionSize || "",
          calories: dish.nutritionalInfo?.calories || "",
          protein: dish.nutritionalInfo?.protein || "",
          carbs: dish.nutritionalInfo?.carbs || "",
          sugar: dish.nutritionalInfo?.sugar || "",
          available: dish.available !== undefined ? dish.available : true,
        });
      } catch (error) {
        console.error("Error fetching dish:", error);
        showError("Failed to load dish");
      } finally {
        setLoading(false);
      }
    };

    fetchDish();
  }, [id]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        ingredients: form.ingredients.split(',').map(i => i.trim()).filter(Boolean),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        nutritionalInfo: {
          calories: Number(form.calories) || 0,
          protein: Number(form.protein) || 0,
          carbs: Number(form.carbs) || 0,
          sugar: Number(form.sugar) || 0
        }
      };

      const res = await axiosClient.put(`/dishes/updatedish/${id}`, payload);

      if (res.status === 200) {
        showSuccess("Dish updated successfully!");
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("Update error:", error);
      showError("Failed to update dish");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/dashboard");
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

  return (
    <div className="min-h-screen bg-amber-50 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Edit Dish</h1>
          <p className="text-gray-600 mt-2">Update the dish information below</p>
        </div>

        {}
        <div className="bg-white rounded-xl shadow-lg border border-amber-100 overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {}
              {form.imageUrl && (
                <div className="flex justify-center">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-amber-200">
                    <img
                      src={form.imageUrl}
                      alt="Dish preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 hidden items-center justify-center bg-amber-100">
                      <div className="text-center text-amber-400">
                        <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs font-medium">Invalid Image</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dish Name *
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50 transition-colors"
                    placeholder="Enter dish name"
                  />
                </div>

                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    required
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50 transition-colors"
                  >
                    <option value="">Select a category</option>
                    <option value="Appetizers">Appetizers</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Middle Eastern">Middle Eastern</option>
                    <option value="Indian">Indian</option>
                    <option value="Italian">Italian</option>
                    <option value="Chinese">Chinese</option>
                  </select>
                </div>

                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      name="price"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50 transition-colors resize-none"
                    placeholder="Describe the dish, ingredients, and special features..."
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ingredients (comma separated)
                    </label>
                    <textarea
                      name="ingredients"
                      value={form.ingredients}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50 transition-colors"
                      placeholder="Flour, Tomato Sauce, Cheese, Basil"
                    />
                  </div>

                  {}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (comma separated)
                    </label>
                    <input
                      name="tags"
                      type="text"
                      value={form.tags}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50 transition-colors"
                      placeholder="Spicy, Vegan, Bestseller"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portion Size
                    </label>
                    <input
                      name="portionSize"
                      type="text"
                      value={form.portionSize}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50 transition-colors"
                      placeholder="e.g., 250g, 1 bowl"
                    />
                  </div>

                  <div className="flex items-center justify-between border border-amber-200 rounded-lg bg-amber-50 px-4">
                    <span className="text-sm font-medium text-gray-700">Available</span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, available: !form.available })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.available ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.available ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>

                {}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nutritional Info (per serving)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Calories</label>
                      <input
                        type="number"
                        name="calories"
                        value={form.calories}
                        onChange={handleChange}
                        placeholder="kcal"
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Protein (g)</label>
                      <input
                        type="number"
                        name="protein"
                        value={form.protein}
                        onChange={handleChange}
                        placeholder="g"
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Carbs (g)</label>
                      <input
                        type="number"
                        name="carbs"
                        value={form.carbs}
                        onChange={handleChange}
                        placeholder="g"
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Sugar (g)</label>
                      <input
                        type="number"
                        name="sugar"
                        value={form.sugar}
                        onChange={handleChange}
                        placeholder="g"
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    name="imageUrl"
                    type="url"
                    value={form.imageUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50 transition-colors"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Provide a direct link to the dish image
                  </p>
                </div>
              </div>

              {}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-amber-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 border border-amber-300 text-amber-700 rounded-lg font-semibold hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {}
        <div className="mt-6 bg-amber-100 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quick Tips
          </h3>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Use high-quality images for better customer appeal</li>
            <li>• Keep descriptions clear and enticing</li>
            <li>• Categorize dishes properly for easy navigation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}