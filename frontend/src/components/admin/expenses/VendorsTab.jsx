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
    <div className="space-y-8 animate-fade-in">
      {/* Search and Action Bar */}
      <div className="card-premium p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Search merchants or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-standard w-full pl-10"
          />
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Add Merchant
        </button>
      </div>

      {}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div key={vendor._id} className="card-premium p-6 group hover:translate-y-[-2px] transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                  vendor.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  {vendor.status}
                </div>
                <button 
                  onClick={() => handleOpenModal(vendor)}
                  className="p-2 text-slate-300 hover:text-amber-500 transition-colors"
                >
                  <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{vendor.name}</h3>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-6">{vendor.category}</p>

              <div className="space-y-3">
                {vendor.phone && (
                  <div className="flex items-center gap-3 text-slate-500">
                    <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <span className="text-xs font-bold">{vendor.phone}</span>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-3 text-slate-500">
                    <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <span className="text-xs font-bold">{vendor.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {}
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
