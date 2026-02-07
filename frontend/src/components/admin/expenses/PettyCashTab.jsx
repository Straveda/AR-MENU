import { useState, useEffect } from "react";
import { getExpenses, createExpense, getVendors } from "../../../api/expensesApi";
import { useAuth } from "../../../context/AuthProvider";
import { useToast } from "../../common/Toast/ToastContext";
import Loading from "../../common/Loading";
import Pagination from "../../common/Pagination";
import PageSizeSelector from "../../common/PageSizeSelector";
import Modal from "../../common/Modal";

export default function PettyCashTab() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    openingBalance: 0,
    expenses: 0,
    additions: 0,
    closingBalance: 0
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1
  });

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("EXPENSE"); // 'EXPENSE' or 'ADD_CASH'

  const [formData, setFormData] = useState({
    amount: "",
    vendorId: "", // Optional for Add Cash
    notes: "",
    expenseDate: new Date().toISOString().split('T')[0],
    expenseType: "" // Description
  });

  const restaurantSlug = user?.restaurantId?.slug;

  const fetchData = async () => {
    if (!restaurantSlug) return;
    try {
      setLoading(true);
      const [expRes, venRes] = await Promise.all([
        getExpenses(restaurantSlug, {
          paymentMode: "CASH", // Only cash transactions
          page: pagination.page,
          limit: pagination.limit
        }),
        getVendors(restaurantSlug)
      ]);

      setExpenses(expRes.data.data.expenses || []);
      setStats(expRes.data.data.pettyCashStats || { openingBalance: 0, expenses: 0, additions: 0, closingBalance: 0 });

      setPagination(prev => ({
        ...prev,
        totalCount: expRes.data.data.totalCount,
        totalPages: expRes.data.data.totalPages
      }));
      setVendors(venRes.data.data || []);
    } catch (error) {
      console.error(error);
      showError("Failed to fetch petty cash data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [restaurantSlug, pagination.page, pagination.limit]);

  const handleOpenModal = (mode) => {
    setModalMode(mode);
    setFormData({
      amount: "",
      vendorId: "",
      notes: "",
      expenseDate: new Date().toISOString().split('T')[0],
      expenseType: mode === "ADD_CASH" ? "Cash Addition" : ""
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        restaurantId: user?.restaurantId?._id,
        amount: parseFloat(formData.amount),
        expenseDate: formData.expenseDate,
        notes: formData.notes,
        paymentMode: "CASH",
        // Logic for Transaction Type & Vendor
        transactionType: modalMode === "ADD_CASH" ? "CREDIT" : "DEBIT",
        vendorId: modalMode === "ADD_CASH" ? undefined : formData.vendorId, // Optional for credit
        expenseType: formData.expenseType || (modalMode === "ADD_CASH" ? "Cash Addition" : "Petty Cash Expense")
      };

      await createExpense(restaurantSlug, payload);
      showSuccess(modalMode === "ADD_CASH" ? "Cash added successfully" : "Expense recorded successfully");
      setShowModal(false);
      fetchData();
    } catch (error) {
      showError(error.response?.data?.message || "Transaction failed");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl py-3 px-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Opening Balance</p>
            <p className="text-xl font-black text-slate-900 tracking-tight">₹{stats.openingBalance.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl py-3 px-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Total Outflow</p>
            <p className="text-xl font-black text-rose-600 tracking-tight">₹{stats.expenses.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl py-3 px-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Total Inflow</p>
            <p className="text-xl font-black text-emerald-600 tracking-tight">₹{stats.additions.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl py-3 px-4 shadow-sm flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stats.closingBalance >= 0 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Closing Balance</p>
            <p className="text-xl font-black text-slate-900 tracking-tight">₹{stats.closingBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h4>
        <div className="flex gap-4">
          <button
            onClick={() => handleOpenModal("EXPENSE")}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
          >
            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Record Cash Expense
          </button>
          <button
            onClick={() => handleOpenModal("ADD_CASH")}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
          >
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Cash
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3 text-right">Debit / Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4" className="py-20"><Loading /></td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan="4" className="py-20 text-center text-slate-500">No petty cash records found</td></tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-bold text-slate-700">
                      {new Date(expense.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-bold text-slate-900 leading-tight">{expense.expenseType}</p>
                      {expense.notes && <p className="text-[10px] font-medium text-slate-400 mt-0.5">{expense.notes}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-bold text-slate-500">
                      {expense.vendorId?.name || "N/A"}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-black ${expense.transactionType === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {expense.transactionType === 'CREDIT' ? '+' : '-'}₹{expense.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-200">
          <PageSizeSelector
            pageSize={pagination.limit}
            onPageSizeChange={(val) => setPagination({ ...pagination, limit: val, page: 1 })}
          />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(val) => setPagination({ ...pagination, page: val })}
            totalItems={pagination.totalCount}
            limit={pagination.limit}
          />
        </div>
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          title={modalMode === "ADD_CASH" ? "Add Cash to Drawer" : "Record Cash Expense"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">
                {modalMode === "ADD_CASH" ? "Source / Reason" : "Expense Description"} *
              </label>
              <input
                type="text"
                required
                className="input-standard w-full"
                placeholder={modalMode === "ADD_CASH" ? "e.g. Withdrawal from Bank" : "e.g. Tea & Snacks"}
                value={formData.expenseType}
                onChange={e => setFormData({ ...formData, expenseType: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Amount (₹) *</label>
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
                <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Transaction Date *</label>
                <input
                  type="date"
                  required
                  className="input-standard w-full"
                  value={formData.expenseDate}
                  onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                />
              </div>
            </div>

            {modalMode === "EXPENSE" && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Vendor (Optional)</label>
                <select
                  className="input-standard w-full appearance-none"
                  value={formData.vendorId}
                  onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                >
                  <option value="">Select Vendor (if applicable)</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Notes</label>
              <textarea
                className="input-standard w-full min-h-[80px]"
                placeholder="Additional details..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              ></textarea>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn-primary ${modalMode === "ADD_CASH" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
              >
                {modalMode === "ADD_CASH" ? "Add Cash" : "Record Expense"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
