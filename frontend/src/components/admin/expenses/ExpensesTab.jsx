import { useState, useEffect } from "react";
import { getExpenses, createExpense, getVendors } from "../../../api/expensesApi";
import { useAuth } from "../../../context/AuthProvider";
import { useToast } from "../../common/Toast/ToastContext";
import Loading from "../../common/Loading";
import EmptyState from "../../common/EmptyState";
import Modal from "../../common/Modal";
import Pagination from "../../common/Pagination";
import PageSizeSelector from "../../common/PageSizeSelector";

export default function ExpensesTab() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1
  });

  const [filters, setFilters] = useState({
    vendorId: "",
    paymentMode: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [formData, setFormData] = useState({
    expenseType: "",
    amount: "",
    vendorId: "",
    paymentMode: "CARD",
    notes: "",
    expenseDate: new Date().toISOString().split('T')[0]
  });

  const restaurantSlug = user?.restaurantId?.slug;

  const fetchData = async () => {
    if (!restaurantSlug) return;
    try {
      setLoading(true);
      const [expRes, venRes] = await Promise.all([
        getExpenses(restaurantSlug, { ...filters, page: pagination.page, limit: pagination.limit }),
        getVendors(restaurantSlug)
      ]);

      setExpenses(expRes.data.data.expenses || []);
      setTotalMonthly(expRes.data.data.monthlyTotal || 0);
      setPagination(prev => ({
        ...prev,
        totalCount: expRes.data.data.totalCount,
        totalPages: expRes.data.data.totalPages
      }));
      setVendors(venRes.data.data || []);
    } catch (error) {
      showError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [restaurantSlug, pagination.page, pagination.limit, filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createExpense(restaurantSlug, formData);
      showSuccess("Expense recorded successfully");
      setShowModal(false);
      setFormData({
        expenseType: "",
        amount: "",
        vendorId: "",
        paymentMode: "CARD",
        notes: "",
        expenseDate: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to save expense");
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6">
      { }
      <div className="space-y-8 animate-fade-in">
        { }
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Monthly Expenditure</p>
              <h3 className="text-3xl font-semibold tracking-tight text-white">₹{totalMonthly.toLocaleString()}</h3>
              <div className="mt-4 flex items-center gap-2 text-xs text-amber-500 font-medium tracking-tight">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Current Billing Period
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl transition-all"></div>
          </div>

          <div className="lg:col-span-2 card-premium p-6 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
              <div className="flex gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 ml-1">Period Selection</label>
                  <div className="flex gap-2">
                    <select
                      className="input-standard py-2"
                      value={filters.month}
                      onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                    >
                      {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select
                      className="input-standard py-2"
                      value={filters.year}
                      onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                    >
                      {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Add Record
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 ml-1">Quick Filters</label>
                <div className="flex gap-2">
                  <select
                    className="input-standard py-1.5 text-xs font-medium"
                    value={filters.vendorId}
                    onChange={(e) => setFilters({ ...filters, vendorId: e.target.value })}
                  >
                    <option value="">All Vendors</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                  <select
                    className="input-standard py-1.5 text-xs font-medium"
                    value={filters.paymentMode}
                    onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}
                  >
                    <option value="">All Payments</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK">Bank</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        { }
        <div className="card-premium overflow-hidden transition-all">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-end bg-slate-50/30">
            <PageSizeSelector
              pageSize={pagination.limit}
              onPageSizeChange={(val) => setPagination({ ...pagination, limit: val, page: 1 })}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 text-left">Billing Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 text-left">Expense Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 text-left">Merchant / Vendor</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 text-left">Mode</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr><td colSpan="5" className="py-20"><Loading /></td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan="5" className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">No transaction history found</td></tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-500">{new Date(expense.expenseDate).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 leading-tight">{expense.expenseType}</p>
                        {expense.notes && <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-0.5 truncate max-w-[240px] opacity-60">Note: {expense.notes}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600 font-black uppercase tracking-wider border border-slate-200">
                          {expense.vendorId?.name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${expense.paymentMode === 'CASH' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            expense.paymentMode === 'UPI' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                          {expense.paymentMode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-slate-900 tracking-tight">₹{expense.amount.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          { }
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/30">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(val) => setPagination({ ...pagination, page: val })}
              totalItems={pagination.totalCount}
              limit={pagination.limit}
            />
          </div>
        </div>

        {showModal && (
          <Modal onClose={() => setShowModal(false)} title="Record Business Expense">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  className="input-standard w-full"
                  placeholder="e.g. Bulk Vegetable Purchase"
                  value={formData.expenseType}
                  onChange={e => setFormData({ ...formData, expenseType: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Bill Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    className="input-standard w-full font-semibold text-slate-900"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Merchant / Vendor *</label>
                  <select
                    required
                    className="input-standard w-full appearance-none"
                    value={formData.vendorId}
                    onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                  >
                    <option value="">Select Primary vendor</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Payment Method *</label>
                  <select
                    required
                    className="input-standard w-full appearance-none"
                    value={formData.paymentMode}
                    onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                  >
                    <option value="CASH">Liquid Cash</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="UPI">UPI / Digital</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Transition Date *</label>
                  <input
                    type="date"
                    required
                    className="input-standard w-full font-medium text-slate-600"
                    value={formData.expenseDate}
                    onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Additional Reference / Notes</label>
                <textarea
                  className="input-standard w-full min-h-[100px]"
                  placeholder="Record bill references or specific purchase details..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Confirm Financial Record
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}
