import { useState, useEffect } from "react";
import { getDetailedAnalytics } from "../../api/analyticsApi";
import Loading from "../../components/common/Loading";
import { useToast } from "../../components/common/Toast/ToastContext";
import FeatureGate from "../../components/common/FeatureGate";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function AnalyticsContent() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week');
    const { showError } = useToast();

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await getDetailedAnalytics(timeRange);
            setData(res.data.data);
        } catch (error) {
            console.error("Error fetching analytics:", error);
            showError("Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading message="Loading analytics..." />;
    if (!data) return <div className="p-8 text-center text-gray-500">No data available</div>;

    const { metrics, revenueTrend = [], topItems = [], orderStatus = [], categoryPerformance = [], hourlyOrders = [], labels = [] } = data;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    padding: 15,
                    font: {
                        size: 11,
                    },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                    size: 13,
                },
                bodyFont: {
                    size: 12,
                },
            },
        },
    };

    const mixedChartOptions = {
        ...chartOptions,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                grid: { display: false }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { display: false }
            },
            x: {
                grid: { display: false }
            }
        },
    };

    // Prepare chart data from real API response
    const prepareRevenueTrendData = () => {
        const revenueData = [];
        const ordersData = [];
        const chartLabels = labels || [];

        // Fill in data for all labels
        chartLabels.forEach(label => {
            const key = timeRange === 'today' ? parseInt(label) : label;
            const item = revenueTrend?.find(d => {
                if (timeRange === 'today') return d._id === key;
                return d._id === label || (typeof d._id === 'string' && d._id.includes(label));
            });
            revenueData.push(item?.revenue || 0);
            ordersData.push(item?.orders || 0);
        });

        return {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Revenue (₹)',
                    data: revenueData,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Orders',
                    data: ordersData,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
            ],
        };
    };


    const prepareTopItemsData = () => {
        return {
            labels: topItems.map(item => item.name || 'Unknown'),
            datasets: [
                {
                    label: 'Orders',
                    data: topItems.map(item => item.count),
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                    ],
                },
            ],
        };
    };

    const prepareOrderStatusData = () => {
        const statuses = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
        const counts = statuses.map(status =>
            orderStatus.find(s => s._id === status)?.count || 0
        );

        return {
            labels: statuses,
            datasets: [
                {
                    label: 'Order Count',
                    data: counts,
                    backgroundColor: [
                        'rgba(245, 158, 11, 0.8)', // Pending
                        'rgba(59, 130, 246, 0.8)', // Preparing
                        'rgba(16, 185, 129, 0.8)', // Ready
                        'rgba(99, 102, 241, 0.8)', // Completed
                        'rgba(239, 68, 68, 0.8)',  // Cancelled
                    ],
                    borderRadius: 4,
                },
            ],
        };
    };


    const prepareCategoryData = () => {
        return {
            labels: categoryPerformance.map(item => item._id || 'Other'),
            datasets: [
                {
                    data: categoryPerformance.map(item => item.revenue),
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                    ],
                    borderWidth: 1,
                    borderColor: '#fff',
                },
            ],
        };
    };

    const prepareHourlyData = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const hourlyData = hours.map(hour => {
            const item = hourlyOrders.find(h => h._id === hour);
            return item?.count || 0;
        });

        return {
            labels: hours.map(h => `${h}:00`).filter((_, i) => i >= 11 && i <= 23),
            datasets: [
                {
                    label: 'Orders',
                    data: hourlyData.filter((_, i) => i >= 11 && i <= 23),
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderColor: 'rgb(245, 158, 11)',
                    borderWidth: 1,
                },
            ],
        };
    };

    // Mock payment methods (can be replaced with real data when available)
    const paymentMethodsData = {
        labels: ['Cash', 'Card', 'UPI', 'Wallet'],
        datasets: [
            {
                data: [35, 30, 25, 10],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                ],
            },
        ],
    };

    const formatDisplayLabel = (label) => {
        if (timeRange === 'today') return label;
        try {
            if (timeRange === 'week' || timeRange === 'month') {
                const d = new Date(label);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            if (timeRange === 'year') {
                const [year, month] = label.split('-');
                const d = new Date(year, month - 1);
                return d.toLocaleDateString('en-US', { month: 'short' });
            }
        } catch (e) {
            return label;
        }
        return label;
    };

    // 1. Sales Performance (Mixed: Bar + Line)
    const prepareSalesData = () => {
        const rawLabels = data.labels || [];
        const revenueData = [];
        const ordersData = [];

        // Map data to raw labels
        rawLabels.forEach(label => {
            const key = timeRange === 'today' ? parseInt(label) : label;
            const item = revenueTrend?.find(d => {
                if (timeRange === 'today') return d._id === key;
                return d._id === label;
            }) || {};
            revenueData.push(item.revenue || 0);
            ordersData.push(item.orders || 0);
        });

        return {
            labels: rawLabels.map(formatDisplayLabel),
            datasets: [
                {
                    type: 'line',
                    label: 'Orders',
                    data: ordersData,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1',
                    pointBackgroundColor: 'rgb(255, 255, 255)',
                    pointBorderColor: 'rgb(16, 185, 129)',
                    pointRadius: 4,
                },
                {
                    type: 'line',
                    label: 'Revenue (₹)',
                    data: revenueData,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y',
                    pointBackgroundColor: 'rgb(255, 255, 255)',
                    pointBorderColor: 'rgb(99, 102, 241)',
                    pointRadius: 4,
                },
            ],
        };
    };





    return (
        <div className="space-y-4 animate-fade-in pb-12 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                    <h1 className="type-h1">Analytics</h1>
                    <p className="type-secondary mt-1">Comprehensive restaurant performance insights & trends</p>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                    {['today', 'week', 'month', 'year'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all duration-200 ${timeRange === range
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title={timeRange === 'month' ? "Monthly Revenue" : "Revenue"}
                    value={`₹${metrics.totalRevenue?.toLocaleString() || '0'}`}
                    change="+12.5%"
                    trend="up"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <MetricCard
                    title={timeRange === 'month' ? "Monthly Orders" : "Orders"}
                    value={metrics.totalOrders || '0'}
                    change="+8.2%"
                    trend="up"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                />
                <MetricCard
                    title="Avg Order Value"
                    value={`₹${metrics.avgOrderValue || '0'}`}
                    change="+3.1%"
                    trend="up"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                />
                <MetricCard
                    title="Completed Orders"
                    value={metrics.completedOrders || '0'}
                    change="+5.3%"
                    trend="up"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            {/* Main Charts Grid - 2x2 Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <ChartCard title="Sales Performance" subtitle="Revenue vs Orders">
                    <div className="h-72">
                        <Line data={prepareSalesData()} options={mixedChartOptions} />
                    </div>
                </ChartCard>

                {/* 2. Top Selling Items (Horizontal Bar) */}
                <ChartCard title="Top Selling Dishes" subtitle="By order volume">
                    <div className="h-72">
                        <Bar
                            data={prepareTopItemsData()}
                            options={{
                                ...chartOptions,
                                indexAxis: 'y',
                                scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
                            }}
                        />
                    </div>
                </ChartCard>

                {/* 3. Category Distribution (Pie) */}
                <ChartCard title="Revenue Share" subtitle="By category">
                    <div className="h-72 flex items-center justify-center">
                        <div className="w-full max-w-sm">
                            <Pie
                                data={prepareCategoryData()}
                                options={{
                                    ...chartOptions,
                                    plugins: { legend: { position: 'right' } }
                                }}
                            />
                        </div>
                    </div>
                </ChartCard>

                {/* 4. Order Status Flow (Vertical Bar) */}
                <ChartCard title="Order Status Flow" subtitle="Order lifecycle count">
                    <div className="h-72">
                        <Bar
                            data={prepareOrderStatusData()}
                            options={{
                                ...chartOptions,
                                scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
                            }}
                        />
                    </div>
                </ChartCard>
            </div>

            {/* Inventory & Expenses Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatBox
                    title="Low Stock Items"
                    items={[
                        { label: "Need Restocking", value: data.inventory?.lowStockCount || 0, color: "text-red-600" },
                        { label: "Out of Stock", value: data.inventory?.deadStockCount || 0, color: "text-slate-400" },
                    ]}
                />
                <StatBox
                    title="Inventory Value"
                    items={[
                        { label: "Total Value", value: `₹${data.inventory?.totalValue?.toLocaleString() || '0'}`, color: "text-slate-900" },
                        { label: "Low Stock", value: data.inventory?.lowStockCount || 0, color: "text-amber-600" },
                    ]}
                />
                <StatBox
                    title="Monthly Expenses"
                    items={[
                        { label: "Total Expenses", value: `₹${data.expenses?.monthlyTotal?.toLocaleString() || '0'}`, color: "text-slate-900" },
                        { label: "Top Category", value: data.expenses?.topCategory || 'N/A', color: "text-indigo-600" },
                    ]}
                />
                <StatBox
                    title="Quick Stats"
                    items={[
                        { label: "Active Orders", value: orderStatus.find(s => s._id === 'Pending')?.count || 0, color: "text-amber-600" },
                        { label: "Completed", value: orderStatus.find(s => s._id === 'Completed')?.count || 0, color: "text-emerald-600" },
                    ]}
                />
            </div>
        </div>
    );
}

function MetricCard({ title, value, change, trend, icon }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    {icon}
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                    {change}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">vs last period</span>
            </div>
        </div>
    );
}

function ChartCard({ title, subtitle, children }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}

function StatBox({ title, items }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">{title}</h4>
            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{item.label}</span>
                        <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Analytics() {
    return (
        <FeatureGate feature="analytics" showUpgrade>
            <AnalyticsContent />
        </FeatureGate>
    );
}
