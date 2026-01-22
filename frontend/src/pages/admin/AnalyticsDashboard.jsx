import { useState, useEffect } from "react";
import { getDashboardAnalytics } from "../../api/analyticsApi";
import Loading from "../../components/common/Loading";
import { useToast } from "../../components/common/Toast/ToastContext";

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await getDashboardAnalytics();
      setData(res.data.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      showError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading your dashboard..." />;
  if (!data) return <div className="p-8 text-center text-gray-500">No data available</div>;

  const { sales, operations, inventory, expenses, menu } = data;

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      { }
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Operational Ledger</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">Real-time performance & asset tracking</p>
      </div>

      { }
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Orders Today"
          value={sales.ordersToday}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
          accent="indigo"
          subValue="Gross throughput"
        />
        <StatCard
          label="Revenue Today"
          value={`₹${sales.revenueToday.toLocaleString()}`}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          accent="emerald"
          subValue="Settled transactions"
        />
        <StatCard
          label="Monthly Volume"
          value={sales.ordersThisMonth}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          accent="indigo"
          subValue="Rolling 30-day"
        />
        <StatCard
          label="Monthly Revenue"
          value={`₹${sales.revenueThisMonth.toLocaleString()}`}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          accent="amber"
          subValue={`AOV: ₹${sales.avgOrderValue}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        { }
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SummaryList
            title="Service Status"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            items={[
              { label: "Active Prep", value: operations.inProgress, color: "text-amber-600 font-semibold" },
              { label: "Closed Checks", value: operations.completedToday, color: "text-emerald-600 font-semibold" },
              { label: "Voided Orders", value: operations.cancelledToday, color: "text-rose-600 font-semibold" }
            ]}
          />
          <SummaryList
            title="Asset Control"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
            items={[
              { label: "Low Stock Alert", value: inventory.lowStockCount, color: "text-rose-600 font-semibold" },
              { label: "Dead Assets", value: inventory.deadStockCount, color: "text-slate-400 font-medium" },
              { label: "Inventory Value", value: `₹${inventory.totalValue.toLocaleString()}`, color: "text-slate-900 font-bold" }
            ]}
          />
        </div>

        { }
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SummaryList
            title="Financial Flux"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            items={[
              { label: "Monthly OpEx", value: `₹${expenses.monthlyTotal.toLocaleString()}`, color: "text-slate-900 font-bold" },
              { label: "Major Outflow", value: expenses.topCategory, color: "text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-indigo-100" }
            ]}
          />
          <SummaryList
            title="Menu Performance"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            items={[
              { label: "Top Performer", value: menu.topSelling, color: "text-amber-600 font-semibold" },
              { label: "Cold Item", value: menu.leastSelling, color: "text-slate-400 font-medium" },
              { label: "AR Coverage", value: `${menu.arReadyCount} / ${menu.arReadyCount + menu.nonArCount}`, color: "text-emerald-600 font-semibold" }
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent, subValue }) {
  const accents = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
  };

  return (
    <div className="card-premium p-6 group hover:translate-y-[-2px] transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="w-10 h-10 rounded text-slate-400 flex items-center justify-center bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:text-slate-900 group-hover:border-slate-200 transition-all">
          {icon}
        </div>
        <div className={`w-1 h-4 rounded-full ${accents[accent] || 'bg-slate-300'}`}></div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
        <h3 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none mb-2">{value}</h3>
        {subValue && <p className="text-[10px] text-slate-400 font-medium tracking-tight mb-0.5">{subValue}</p>}
      </div>
    </div>
  );
}

function SummaryList({ title, icon, items }) {
  return (
    <div className="card-premium overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-600 flex items-center gap-2">
          <span className="text-slate-400">{icon}</span>
          {title}
        </h3>
      </div>
      <div className="p-6 space-y-5 grow">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-4 last:pb-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
            <span className={`text-xs ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

