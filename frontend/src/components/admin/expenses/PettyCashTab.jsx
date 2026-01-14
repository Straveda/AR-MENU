import { useState, useEffect } from "react";
import { getExpenses, getVendors } from "../../../api/expensesApi";
import { useAuth } from "../../../context/AuthProvider";
import { useToast } from "../../common/Toast/ToastContext";
import Loading from "../../common/Loading";
import Pagination from "../../common/Pagination";
import PageSizeSelector from "../../common/PageSizeSelector";

export default function PettyCashTab() {
  const { user } = useAuth();
  const { showError } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1
  });

  const restaurantSlug = user?.restaurantId?.slug;

  const fetchData = async () => {
    if (!restaurantSlug) return;
    try {
      setLoading(true);
      const res = await getExpenses(restaurantSlug, { 
        paymentMode: "CASH", 
        page: pagination.page, 
        limit: pagination.limit 
      });
      
      setExpenses(res.data.data.expenses || []);
      setPagination(prev => ({
        ...prev,
        totalCount: res.data.data.totalCount,
        totalPages: res.data.data.totalPages
      }));
    } catch (error) {
      showError("Failed to fetch petty cash records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [restaurantSlug, pagination.page, pagination.limit]);

  return (
    <div className="space-y-6 animate-fade-in">
      {}
      <div className="card-premium p-6 flex items-center justify-between">
         <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Petty Cash Log</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Cash Expenditure Stream</p>
         </div>
         <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Monitoring
         </div>
      </div>

      {}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Posting Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description & Narrative</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Merchant</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Debit Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4" className="py-20"><Loading /></td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan="4" className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">No ledger entries found</td></tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      {new Date(expense.expenseDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-sm font-black text-slate-900 tracking-tight">{expense.expenseType}</p>
                       {expense.notes && <p className="text-[10px] text-slate-400 font-bold italic mt-0.5">{expense.notes}</p>}
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{expense.vendorId?.name || "Uncategorized"}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-sm font-black text-slate-900">₹{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-100">
           <PageSizeSelector 
             pageSize={pagination.limit}
             onPageSizeChange={(val) => setPagination({...pagination, limit: val, page: 1})}
           />
           <Pagination 
             currentPage={pagination.page}
             totalPages={pagination.totalPages}
             onPageChange={(val) => setPagination({...pagination, page: val})}
             totalItems={pagination.totalCount}
             limit={pagination.limit}
           />
        </div>
      </div>
    </div>
  );
}
