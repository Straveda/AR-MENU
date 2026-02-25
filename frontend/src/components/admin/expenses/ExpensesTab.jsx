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

  // const restaurantSlug = user?.restaurantId?.slug; (No longer needed)

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, venRes] = await Promise.all([
        getExpenses({ ...filters, page: pagination.page, limit: pagination.limit }),
        getVendors()
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
  }, [pagination.page, pagination.limit, filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createExpense(formData);
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
    <div className="space-y-4 animate-fade-in">
      { }
      <div className="space-y-6">
        {/* Summary Card and Actions */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
          <div className="bg-white border border-slate-200 rounded-xl py-3 px-4 min-w-[300px] flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-0.5">Total Expenses (This Month)</p>
              <h3 className="text-2xl font-black text-slate-900">₹{totalMonthly.toLocaleString()}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <select
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block p-2.5"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
              >
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block p-2.5"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 h-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Add Expense
            </button>
          </div>
        </div>

        { }
        {/* Expenses Table */}
        <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="py-20"><Loading /></td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan="6" className="py-20 text-center text-slate-500">No expenses found</td></tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-bold text-slate-700">
                      {new Date(expense.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-black text-slate-900">
                      {expense.expenseType}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-bold text-slate-500">
                      {expense.vendorId?.name || "N/A"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-black text-rose-500">
                      ₹{expense.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                        {expense.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] text-slate-400 font-medium italic max-w-xs truncate">
                      {expense.notes || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
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
