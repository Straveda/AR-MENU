import { useState, useEffect } from "react";
import { getDashboardAnalytics } from "../../api/analyticsApi";
import { Link } from "react-router-dom";
import Loading from "../../components/common/Loading";
import { useToast } from "../../components/common/Toast/ToastContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

  const { sales, operations, inventory, expenses, menu, plan } = data;

  // Real Chart Logic
  // Current Week (Monday - Sunday) Chart Logic
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const today = new Date();
    const day = today.getDay();
    const diff = (day === 0) ? 6 : day - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    monday.setHours(0, 0, 0, 0);

    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const trendLabels = weekDays.map(date =>
    date.toLocaleDateString('en-US', { weekday: 'short' })
  );

  const trendData = weekDays.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = sales.revenueTrend?.find(item => item._id === dateStr);
    return dayData ? dayData.revenue : 0;
  });

  const totalWeeklyRevenue = trendData.reduce((a, b) => a + b, 0);

  const chartData = {
    labels: trendLabels,
    datasets: [{
      label: 'Weekly Revenue',
      data: trendData,
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointHitRadius: 10,
      pointBackgroundColor: '#06b6d4',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { display: true, border: { display: false }, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
      x: { display: true, border: { display: false }, grid: { display: false }, ticks: { font: { size: 10 } } }
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="type-h1">Dashboard</h1>
          <p className="type-secondary mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Orders"
          value={sales.ordersToday}
          trend={`${sales.ordersToday > 0 ? 'Orders received today' : 'No orders yet'}`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          accent="indigo"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${sales.revenueToday.toLocaleString()}`}
          trend={`${sales.revenueToday > 0 ? 'Earnings for today' : 'Waiting for sales'}`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          accent="emerald"
        />
        <StatCard
          title="Active Tables"
          value={operations.activeTablesCount}
          trend="Tables with open orders"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          accent="blue"
        />
        <StatCard
          title="Avg. Order Value"
          value={`₹${sales.avgOrderValue}`}
          trend="Overall average"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          accent="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-slate-800">Weekly Revenue</h3>
              <span className="text-xl font-bold text-emerald-600">₹{totalWeeklyRevenue.toLocaleString()}</span>
            </div>
            <div className="h-[280px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Right Sidebar Section */}
        <div className="space-y-4">
          {/* Order Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Order Status</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Pending</span>
                <span className="text-sm font-black text-amber-500">{operations.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Preparing</span>
                <span className="text-sm font-black text-blue-500">{operations.preparing}</span>
              </div>
            </div>
          </div>

          {/* Plan Usage */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
              <span>Plan Usage</span>
              <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{plan.name}</span>
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-tight">
                  <span className="text-slate-600">Orders</span>
                  <span className="text-slate-400">{sales.ordersThisMonth} / 5000</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (sales.ordersThisMonth / 5000) * 100)}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-tight">
                  <span className="text-slate-600">Dishes</span>
                  <span className="text-slate-400">{menu.dishCount} / {plan.maxDishes}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (menu.dishCount / plan.maxDishes) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/admin/analytics"
            className="block bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-4 text-center text-xs font-black uppercase tracking-widest text-slate-600 transition-colors"
          >
            Full Analytics Report
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon, accent }) {
  const bgs = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bgs[accent]}`}>
          {icon}
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">
        {trend}
      </p>
    </div>
  );
}
