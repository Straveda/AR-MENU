import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useToast } from "../../components/common/Toast/ToastContext";
import { useFeatureAccess } from "../../contexts/FeatureAccessContext";

export default function AddDish() {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  const { hasFeature } = useFeatureAccess();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    ingredients: "",
    tags: "",
    portionSize: "",
    calories: "",
    protein: "",
    carbs: "",
    sugar: "",
    available: true,
  });

  const [imageFile, setImageFile] = useState(null);

  const categories = [
    "appetizers",
    "main course",
    "desserts",
    "beverages",
    "soups",
    "salads",
    "specials",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (errors.image) {
      setErrors({ ...errors, image: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Dish name is required";
    if (!form.description.trim())
      newErrors.description = "Description is required";
    if (!form.price || Number(form.price) <= 0)
      newErrors.price = "Valid price is required";
    if (!form.category) newErrors.category = "Category is required";
    if (!imageFile) newErrors.image = "Dish image is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const data = new FormData();
      data.append("name", form.name);

      data.append("description", form.description);
      data.append("price", form.price);
      data.append("category", form.category);
      data.append("image", imageFile);

      const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const ingredientsArray = form.ingredients.split(',').map(i => i.trim()).filter(Boolean);

      data.append("tags", JSON.stringify(tagsArray));
      data.append("ingredients", JSON.stringify(ingredientsArray));
      data.append("portionSize", form.portionSize);
      data.append("available", form.available);

      const nutritionalInfo = {
        calories: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        sugar: Number(form.sugar) || 0
      };

      data.append("nutritionalInfo", JSON.stringify(nutritionalInfo));

      const res = await axiosClient.post("/dishes/add", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status === 201) {
        showSuccess("Dish added successfully!");
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("Error adding dish:", error);
      if (error.response?.status === 423) {
        showError("Action Blocked: Restaurant is Suspended.");
      } else {
        showError(error.response?.data?.message || "Failed to add dish. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 px-4 py-8">
      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium mb-6"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Add New Dish
        </h1>
        <div className="w-16 h-1 bg-amber-600 mx-auto"></div>
      </div>

      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl p-6">
        {!hasFeature('arModels') && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
            <span className="text-xl">✨</span>
            <div>
              <p className="text-sm font-bold text-indigo-900">3D Models are Locked</p>
              <p className="text-xs text-indigo-700">Upgrade to Pro to automatically generate immersive AR models for your dishes.</p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dish Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Margherita Pizza"
              className="w-full px-4 py-3 border rounded-lg bg-amber-50 border-amber-200"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the dish..."
              className="w-full px-4 py-3 border rounded-lg bg-amber-50 border-amber-200"
            ></textarea>
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            { }
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingredients (comma separated) *
              </label>
              <textarea
                name="ingredients"
                value={form.ingredients}
                onChange={handleChange}
                rows={2}
                placeholder="Flour, Tomato Sauce, Cheese, Basil"
                className="w-full px-4 py-3 border rounded-lg bg-amber-50 border-amber-200"
              ></textarea>
            </div>

            { }
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="Spicy, Vegan, Bestseller"
                className="w-full px-4 py-3 border rounded-lg bg-amber-50 border-amber-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="100"
                className="w-full px-4 py-3 border rounded-lg bg-amber-50 border-amber-200"
              />
              {errors.price && (
                <p className="text-red-600 text-sm mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-lg bg-amber-50 border-amber-200"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option value={c} key={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-600 text-sm mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portion Size
              </label>
              <input
                type="text"
                name="portionSize"
                value={form.portionSize}
                onChange={handleChange}
                placeholder="e.g., 250g, 1 bowl"
                className="w-full px-4 py-3 border rounded-lg bg-amber-50 border-amber-200"
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg bg-amber-50 border-amber-200 px-4">
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

          { }
          <div>
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
                  className="w-full px-3 py-2 border rounded-lg bg-amber-50 border-amber-200 text-sm"
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
                  className="w-full px-3 py-2 border rounded-lg bg-amber-50 border-amber-200 text-sm"
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
                  className="w-full px-3 py-2 border rounded-lg bg-amber-50 border-amber-200 text-sm"
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
                  className="w-full px-3 py-2 border rounded-lg bg-amber-50 border-amber-200 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dish Image *
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border rounded-lg bg-amber-50 border-amber-200"
            />

            {errors.image && (
              <p className="text-red-600 text-sm mt-1">{errors.image}</p>
            )}

            {imageFile && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Image Preview:</p>
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="w-32 h-32 rounded-lg object-cover border"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold transition min-w-[120px]"
          >
            {loading ? "Adding Dish..." : "Add Dish"}
          </button>
        </form>
      </div>
    </div>
  );
}
