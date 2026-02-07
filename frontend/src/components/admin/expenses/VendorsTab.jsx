import { useState, useEffect } from "react";
import { getVendors, createVendor, updateVendor } from "../../../api/expensesApi";
import { useAuth } from "../../../context/AuthProvider";
import { useToast } from "../../common/Toast/ToastContext";
import Loading from "../../common/Loading";
import EmptyState from "../../common/EmptyState";
import Modal from "../../common/Modal";

export default function VendorsTab() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "INGREDIENTS",
    phone: "",
    email: "",
    status: "ACTIVE"
  });

  const restaurantSlug = user?.restaurantId?.slug;

  const fetchVendors = async () => {
    if (!restaurantSlug) return;
    try {
      setLoading(true);
      const res = await getVendors(restaurantSlug);
      setVendors(res.data.data || []);
    } catch (error) {
      showError("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [restaurantSlug]);

  const handleOpenModal = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        category: vendor.category,
        phone: vendor.phone || "",
        email: vendor.email || "",
        status: vendor.status
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: "",
        category: "INGREDIENTS",
        phone: "",
        email: "",
        status: "ACTIVE"
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVendor(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await updateVendor(restaurantSlug, editingVendor._id, formData);
        showSuccess("Vendor updated successfully");
      } else {
        await createVendor(restaurantSlug, formData);
        showSuccess("Vendor created successfully");
      }
      fetchVendors();
      handleCloseModal();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to save vendor");
    }
  };

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      { }
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block pl-10 p-2.5"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
            </svg>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Vendor
        </button>
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <Loading />
      ) : filteredVendors.length === 0 ? (
        <EmptyState
          title="No vendors found"
          message={searchTerm ? "Try adjusting your search" : "Start by adding your first vendor"}
          onAction={searchTerm ? () => setSearchTerm("") : () => handleOpenModal()}
          actionLabel={searchTerm ? "Clear Search" : "Add Vendor"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => (
            <div key={vendor._id} className="bg-white border border-slate-200 rounded-xl py-3 px-4 relative group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold text-sm leading-tight">{vendor.name}</h3>
                    <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5 border border-slate-200">
                      {vendor.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenModal(vendor)}
                  className="p-1 px-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white transition-all shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>

              <div className="mt-6 space-y-2">
                {vendor.phone && (
                  <div className="text-slate-500 text-sm flex items-center gap-2">
                    <span className="text-slate-400">+91</span> {vendor.phone}
                  </div>
                )}
                {vendor.email && (
                  <div className="text-slate-500 text-sm truncate">
                    {vendor.email}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${vendor.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
                  }`}>
                  {vendor.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      { }
      {showModal && (
        <Modal
          onClose={handleCloseModal}
          title={editingVendor ? "Edit Vendor" : "Add New Vendor"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Merchant Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-standard w-full"
                placeholder="e.g. Fresh Farms Ltd."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Account Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-standard w-full appearance-none"
                >
                  <option value="INGREDIENTS">Ingredients & Food</option>
                  <option value="UTILITIES">Utility Services</option>
                  <option value="HOUSEKEEPING">Maintenance</option>
                  <option value="SERVICES">Logistics</option>
                  <option value="OTHER">Miscellaneous</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Fulfillment Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-standard w-full appearance-none"
                >
                  <option value="ACTIVE">Active Partner</option>
                  <option value="INACTIVE">Archived</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-standard w-full"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Email for Correspondence</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-standard w-full"
                placeholder="vendor@company.com"
              />
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-8">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingVendor ? "Update Merchant Profile" : "Onboard Merchant"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
