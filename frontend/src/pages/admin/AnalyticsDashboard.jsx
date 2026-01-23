import { useState, useEffect } from "react";
import { getDashboardAnalytics } from "../../api/analyticsApi";
import { Link } from "react-router-dom";
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
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Welcome back! Here's your restaurant overview</p>
        </div>
        <Link
          to="/admin/analytics"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          View Analytics
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Orders"
          value={sales.ordersToday}
          subtitle="Total orders received"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
          color="indigo"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${sales.revenueToday.toLocaleString()}`}
          subtitle="Total earnings"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          color="emerald"
        />
        <StatCard
          title="Monthly Orders"
          value={sales.ordersThisMonth}
          subtitle="Last 30 days"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
          color="purple"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${sales.revenueThisMonth.toLocaleString()}`}
          subtitle={`Avg: ₹${sales.avgOrderValue}`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="amber"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoCard
          title="Active Orders"
          value={operations.inProgress}
          description="Currently in preparation"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="amber"
        />
        <InfoCard
          title="Completed Today"
          value={operations.completedToday}
          description="Successfully delivered"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="emerald"
        />
        <InfoCard
          title="Low Stock Items"
          value={inventory.lowStockCount}
          description="Need restocking"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          color="red"
        />
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightCard
          title="Menu Performance"
          items={[
            { label: "Top Selling Item", value: menu.topSelling, color: "text-emerald-600" },
            { label: "Least Selling Item", value: menu.leastSelling, color: "text-slate-500" },
            { label: "AR Ready Items", value: `${menu.arReadyCount} / ${menu.arReadyCount + menu.nonArCount}`, color: "text-indigo-600" },
          ]}
        />
        <InsightCard
          title="Financial Overview"
          items={[
            { label: "Monthly Expenses", value: `₹${expenses.monthlyTotal.toLocaleString()}`, color: "text-slate-900" },
            { label: "Top Expense Category", value: expenses.topCategory, color: "text-amber-600" },
            { label: "Inventory Value", value: `₹${inventory.totalValue.toLocaleString()}`, color: "text-indigo-600" },
          ]}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }) {
  const colors = {
    indigo: "text-indigo-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    purple: "text-purple-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
          <div className={colors[color]}>
            {icon}
          </div>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-0.5">{value}</h3>
      <p className="text-xs font-medium text-slate-900">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

function InfoCard({ title, value, description, icon, color }) {
  const colors = {
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium text-slate-600">{title}</h4>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}

function InsightCard({ title, items }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="p-6 space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-sm text-slate-600">{item.label}</span>
            <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
