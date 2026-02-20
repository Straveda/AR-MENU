import { useState, useEffect } from 'react';
import {
    getReportsSummary,
    getDailySales,
    getMonthlyGST,
    getAggregatorMismatches,
    getPaymentReconciliation,
    resolveAggregatorMismatch,
    exportReport,
} from '../../api/reportsApi';
import Loading from "../../components/common/Loading";
import { useToast } from "../../components/common/Toast/ToastContext";
import { getDemoAggregatorMismatch, getDemoPaymentReconciliation } from '../../utils/demoData';

export default function Reports() {
    const { showError } = useToast();
    const [activeTab, setActiveTab] = useState('sales');
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDemoMode, setIsDemoMode] = useState(false);

    // Sales tab state
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailySalesData, setDailySalesData] = useState(null);

    // GST tab state
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [gstData, setGstData] = useState(null);

    // Aggregator tab state (DEMO MODE)
    const [aggregatorData, setAggregatorData] = useState(null);
    const [aggregatorFilters, setAggregatorFilters] = useState({});

    // Reconciliation tab state (DEMO MODE)
    const [reconciliationData, setReconciliationData] = useState(null);
    const [reconciliationFilters, setReconciliationFilters] = useState({});

    // Load summary on mount
    useEffect(() => {
        loadSummary();
    }, []);

    // Load data when tab changes
    useEffect(() => {
        if (activeTab === 'sales') {
            loadDailySales();
        } else if (activeTab === 'gst') {
            loadGSTReport();
        } else if (activeTab === 'aggregator') {
            loadAggregatorData();
        } else if (activeTab === 'reconciliation') {
            loadReconciliationData();
        }
    }, [activeTab, selectedDate, selectedMonth, selectedYear, aggregatorFilters, reconciliationFilters, isDemoMode]);

    const loadSummary = async () => {
        try {
            setLoading(true);
            const response = await getReportsSummary();
            setSummary(response.data.data);
        } catch (err) {
            console.error("Failed to load summary", err);
            showError('Failed to load summary');
        } finally {
            setLoading(false);
        }
    };

    const loadDailySales = async () => {
        try {
            setLoading(true);
            const response = await getDailySales(selectedDate);
            setDailySalesData(response.data.data);
        } catch (err) {
            console.error("Failed to load daily sales", err);
            showError('Failed to load daily sales');
        } finally {
            setLoading(false);
        }
    };

    const loadGSTReport = async () => {
        try {
            setLoading(true);
            const response = await getMonthlyGST(selectedMonth, selectedYear);
            setGstData(response.data.data);
        } catch (err) {
            console.error("Failed to load GST report", err);
            showError('Failed to load GST report');
        } finally {
            setLoading(false);
        }
    };

    const loadAggregatorData = async () => {
        try {
            setLoading(true);
            if (isDemoMode) {
                await new Promise(resolve => setTimeout(resolve, 800));
                const data = getDemoAggregatorMismatch(aggregatorFilters);
                setAggregatorData(data);
            } else {
                const response = await getAggregatorMismatches(aggregatorFilters);
                setAggregatorData(response.data.data);
            }
        } catch (err) {
            console.error("Failed to load aggregator data", err);
            showError('Failed to load aggregator data');
        } finally {
            setLoading(false);
        }
    };

    const loadReconciliationData = async () => {
        try {
            setLoading(true);
            if (isDemoMode) {
                await new Promise(resolve => setTimeout(resolve, 800));
                const data = getDemoPaymentReconciliation(reconciliationFilters);
                setReconciliationData(data);
            } else {
                const response = await getPaymentReconciliation(reconciliationFilters);
                setReconciliationData(response.data.data);
            }
        } catch (err) {
            console.error("Failed to load reconciliation data", err);
            showError('Failed to load reconciliation data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type) => {
        try {
            let filters = {};
            if (type === 'daily-sales') {
                filters = { date: selectedDate };
            } else if (type === 'monthly-gst') {
                filters = { month: selectedMonth, year: selectedYear };
            }
            await exportReport(type, filters);
        } catch (err) {
            showError('Failed to export report');
        }
    };

    if (loading && !summary) {
        return <Loading message="Loading reports..." />;
    }

    return (
        <div className="space-y-4 animate-fade-in pb-12 transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="type-h1">Reports & Reconciliation</h1>
                    <p className="type-secondary mt-1">Comprehensive reporting for GST, sales, and payment reconciliation</p>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
                    <span className={`text-sm font-bold ${isDemoMode ? 'text-indigo-600' : 'text-slate-500'}`}>Demo Mode</span>
                    <button
                        onClick={() => setIsDemoMode(!isDemoMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isDemoMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDemoMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <SummaryCard
                        label="Daily Sales"
                        value={`₹${summary.dailySales?.totalSales?.toFixed(2) || 0}`}
                        subtext={`${summary.dailySales?.totalOrders || 0} orders today`}
                        accent="blue"
                        icon="📊"
                        action={() => handleExport('daily-sales')}
                        actionLabel="Download"
                    />
                    <SummaryCard
                        label="GST Summary"
                        value={`₹${summary.gstSummary?.totalGST?.toFixed(2) || 0}`}
                        subtext={`CGST: ₹${summary.gstSummary?.cgst?.toFixed(2) || 0} | SGST: ₹${summary.gstSummary?.sgst?.toFixed(2) || 0}`}
                        accent="emerald"
                        icon="🧾"
                        action={() => handleExport('monthly-gst')}
                        actionLabel="Download GST"
                    />
                    <SummaryCard
                        label="Aggregator Mismatch"
                        value={`${summary.aggregatorMismatch?.pendingCount || 0} pending`}
                        subtext={`Difference: ₹${summary.aggregatorMismatch?.totalDifference?.toFixed(2) || 0}`}
                        accent="rose"
                        icon="⚠️"
                        action={() => setActiveTab('aggregator')}
                        actionLabel="View Details"
                    />
                    <SummaryCard
                        label="Payment Reconciliation"
                        value={`${summary.paymentReconciliation?.pendingCount || 0} pending`}
                        subtext={`Difference: ₹${summary.paymentReconciliation?.totalDifference?.toFixed(2) || 0}`}
                        accent="indigo"
                        icon="💳"
                        action={() => setActiveTab('reconciliation')}
                        actionLabel="View Details"
                    />
                </div>
            )}

            {/* Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1 overflow-x-auto max-w-full">
                <TabButton active={activeTab === 'sales'} onClick={() => setActiveTab('sales')}>Daily Sales</TabButton>
                <TabButton active={activeTab === 'gst'} onClick={() => setActiveTab('gst')}>GST Reports</TabButton>
                <TabButton active={activeTab === 'aggregator'} onClick={() => setActiveTab('aggregator')}>Aggregator Mismatch</TabButton>
                <TabButton active={activeTab === 'reconciliation'} onClick={() => setActiveTab('reconciliation')}>Payment Reconciliation</TabButton>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'sales' && dailySalesData && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-900 border-l-4 border-emerald-500 pl-3">Daily Sales Report</h2>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700 bg-white shadow-sm"
                                />
                                <ActionButton onClick={() => handleExport('daily-sales')} icon="📥">Export</ActionButton>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <MetricCard label="TOTAL SALES" value={`₹${dailySalesData.summary.totalSales?.toFixed(2) || 0}`} accent="emerald" />
                            <MetricCard label="TOTAL ORDERS" value={dailySalesData.summary.totalOrders || 0} accent="blue" />
                            <MetricCard label="CANCELLED" value={dailySalesData.summary.cancelledOrders || 0} accent="rose" />
                            <MetricCard label="TAX COLLECTED" value={`₹${dailySalesData.summary.totalTax?.toFixed(2) || 0}`} accent="amber" />
                        </div>

                        {/* Payment Breakdown */}
                        <div className="mt-8">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Payment Mode Breakdown</h3>
                            <div className="grid gap-4">
                                {(() => {
                                    const ALL_PAYMENT_MODES = ['CASH', 'UPI', 'CARD', 'RAZORPAY'];
                                    const normalizedBreakdown = ALL_PAYMENT_MODES.map(mode => {
                                        const found = dailySalesData.paymentBreakdown?.find(p => p.paymentMode === mode);
                                        return found || { paymentMode: mode, amount: 0, count: 0 };
                                    });
                                    const maxAmount = Math.max(...normalizedBreakdown.map(p => p.amount));

                                    return normalizedBreakdown.map((payment, index) => {
                                        const percentage = maxAmount > 0 ? (payment.amount / maxAmount) * 100 : 0;
                                        const isZero = payment.amount === 0;

                                        return (
                                            <div key={index} className="space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-semibold text-slate-700">{payment.paymentMode}</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`font-bold ${isZero ? 'text-slate-400' : 'text-slate-900'}`}>
                                                            ₹{payment.amount?.toFixed(2)}
                                                        </span>
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isZero ? 'bg-slate-50 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                                            {payment.count} bills
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${isZero ? 'bg-slate-200' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                                                        style={{ width: isZero ? '5px' : `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'gst' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-900 border-l-4 border-emerald-500 pl-3">Monthly GST Report</h2>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700 bg-white shadow-sm"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700 bg-white shadow-sm"
                                >
                                    {[2023, 2024, 2025, 2026].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <ActionButton onClick={() => handleExport('monthly-gst')} icon="📥">Export GSTR-3B</ActionButton>
                            </div>
                        </div>

                        {gstData && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <MetricCard label="TAXABLE AMOUNT" value={`₹${gstData.taxableAmount?.toFixed(2) || 0}`} accent="blue" />
                                    <MetricCard label="CGST (9%)" value={`₹${gstData.cgst?.toFixed(2) || 0}`} accent="indigo" />
                                    <MetricCard label="SGST (9%)" value={`₹${gstData.sgst?.toFixed(2) || 0}`} accent="indigo" />
                                    <MetricCard label="TOTAL GST" value={`₹${gstData.totalGST?.toFixed(2) || 0}`} accent="emerald" highlight />
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Daily Breakdown</h3>
                                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                                <tr>
                                                    <th className="px-6 py-3 border-b border-slate-200">Date</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Orders</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Taxable</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">CGST</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">SGST</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Total Tax</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {gstData.dailyBreakdown?.map((day, index) => (
                                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-3 font-medium text-slate-900">{day.date}</td>
                                                        <td className="px-6 py-3 text-slate-600">{day.orderCount}</td>
                                                        <td className="px-6 py-3 text-slate-600">₹{day.taxableAmount?.toFixed(2)}</td>
                                                        <td className="px-6 py-3 text-slate-600">₹{day.cgst?.toFixed(2)}</td>
                                                        <td className="px-6 py-3 text-slate-600">₹{day.sgst?.toFixed(2)}</td>
                                                        <td className="px-6 py-3 font-bold text-slate-900">₹{day.totalTax?.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'aggregator' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 border-l-4 border-emerald-500 pl-3">Aggregator Mismatch</h2>
                                {isDemoMode && <p className="text-slate-500 text-sm mt-1 ml-4 sm:ml-4 sm:mt-0">🎭 Demo Mode - Showing sample data</p>}
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={aggregatorFilters.source || ''}
                                    onChange={(e) => setAggregatorFilters({ ...aggregatorFilters, source: e.target.value || undefined })}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700 bg-white shadow-sm"
                                >
                                    <option value="">All Sources</option>
                                    <option value="SWIGGY">Swiggy</option>
                                    <option value="ZOMATO">Zomato</option>
                                </select>
                                <select
                                    value={aggregatorFilters.status || ''}
                                    onChange={(e) => setAggregatorFilters({ ...aggregatorFilters, status: e.target.value || undefined })}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700 bg-white shadow-sm"
                                >
                                    <option value="">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="MATCHED">Matched</option>
                                    <option value="SHORTAGE">Shortage</option>
                                    <option value="EXCESS">Excess</option>
                                    <option value="RESOLVED">Resolved</option>
                                </select>
                            </div>
                        </div>

                        {aggregatorData && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                                    <MetricCard label="TOTAL ORDERS" value={aggregatorData.stats.total} accent="blue" compact />
                                    <MetricCard label="PENDING" value={aggregatorData.stats.pending} accent="amber" compact />
                                    <MetricCard label="MATCHED" value={aggregatorData.stats.matched} accent="emerald" compact />
                                    <MetricCard label="SHORTAGE" value={aggregatorData.stats.shortage} accent="rose" compact />
                                    <MetricCard label="EXCESS" value={aggregatorData.stats.excess} accent="blue" compact />
                                    <MetricCard label="DIFFERENCE" value={`₹${aggregatorData.stats.totalDifference?.toFixed(2)}`} accent="slate" compact />
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Order Mismatches</h3>
                                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                                <tr>
                                                    <th className="px-6 py-3 border-b border-slate-200">Source</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Order ID</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Date</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Platform Amt</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">POS Amt</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Difference</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {aggregatorData.mismatches?.map((mismatch) => (
                                                    <tr key={mismatch._id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-3">
                                                            <Badge type={mismatch.source} />
                                                        </td>
                                                        <td className="px-6 py-3 font-mono text-xs text-slate-600">{mismatch.platformOrderId}</td>
                                                        <td className="px-6 py-3 text-slate-600">{new Date(mismatch.orderDate).toLocaleDateString()}</td>
                                                        <td className="px-6 py-3 text-slate-600">₹{mismatch.platformAmount?.toFixed(2)}</td>
                                                        <td className="px-6 py-3 text-slate-600">₹{mismatch.matchedOrderId?.total?.toFixed(2) || '-'}</td>
                                                        <td className={`px-6 py-3 font-bold ${mismatch.difference > 0 ? 'text-emerald-600' : mismatch.difference < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                                            ₹{mismatch.difference?.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <StatusBadge status={mismatch.matchStatus} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reconciliation' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 border-l-4 border-emerald-500 pl-3">Payment Reconciliation</h2>
                                {isDemoMode && <p className="text-slate-500 text-sm mt-1 ml-4 sm:ml-4 sm:mt-0">🎭 Demo Mode - Showing sample Razorpay data</p>}
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={reconciliationFilters.status || ''}
                                    onChange={(e) => setReconciliationFilters({ ...reconciliationFilters, status: e.target.value || undefined })}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700 bg-white shadow-sm"
                                >
                                    <option value="">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="MATCHED">Matched</option>
                                    <option value="SHORTAGE">Shortage</option>
                                    <option value="EXCESS">Excess</option>
                                </select>
                            </div>
                        </div>

                        {reconciliationData && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                                    <MetricCard label="TOTAL SETTLEMENTS" value={reconciliationData.stats.total} accent="blue" compact />
                                    <MetricCard label="PENDING" value={reconciliationData.stats.pending} accent="amber" compact />
                                    <MetricCard label="MATCHED" value={reconciliationData.stats.matched} accent="emerald" compact />
                                    <MetricCard label="SHORTAGE" value={reconciliationData.stats.shortage} accent="rose" compact />
                                    <MetricCard label="EXCESS" value={reconciliationData.stats.excess} accent="blue" compact />
                                    <MetricCard label="DIFFERENCE" value={`₹${reconciliationData.stats.totalDifference?.toFixed(2)}`} accent="slate" compact />
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Settlement Details</h3>
                                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                                <tr>
                                                    <th className="px-6 py-3 border-b border-slate-200">Settlement ID</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Date</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Received</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Expected</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Difference</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Orders</th>
                                                    <th className="px-6 py-3 border-b border-slate-200">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {reconciliationData.settlements?.map((settlement) => (
                                                    <tr key={settlement._id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-3 font-mono text-xs text-slate-600">{settlement.settlementId}</td>
                                                        <td className="px-6 py-3 text-slate-600">{new Date(settlement.settlementDate).toLocaleDateString()}</td>
                                                        <td className="px-6 py-3 text-slate-600">₹{settlement.receivedAmount?.toFixed(2)}</td>
                                                        <td className="px-6 py-3 text-slate-600">₹{settlement.expectedAmount?.toFixed(2)}</td>
                                                        <td className={`px-6 py-3 font-bold ${settlement.difference > 0 ? 'text-emerald-600' : settlement.difference < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                                            ₹{settlement.difference?.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-3 text-slate-600">{settlement.orderIds?.length || 0}</td>
                                                        <td className="px-6 py-3">
                                                            <StatusBadge status={settlement.status} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Internal Helper Components

function SummaryCard({ label, value, subtext, accent, icon, action, actionLabel }) {
    const bgs = {
        blue: "bg-blue-50 text-blue-600",
        rose: "bg-rose-50 text-rose-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        violet: "bg-violet-50 text-violet-600",
        indigo: "bg-indigo-50 text-indigo-600",
        slate: "bg-slate-50 text-slate-600"
    };

    return (
        <div className="bg-white py-4 px-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${bgs[accent]}`}>
                    {icon}
                </div>
                {action && (
                    <button
                        onClick={action}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
            <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">{value}</h3>
                <p className="text-xs text-slate-500 font-medium">{subtext}</p>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${active
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
        >
            {children}
        </button>
    );
}

function ActionButton({ onClick, icon, children }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-emerald-200"
        >
            {icon && <span>{icon}</span>}
            <span>{children}</span>
        </button>
    );
}

function MetricCard({ label, value, accent, compact = false, highlight = false }) {
    const colors = {
        blue: "text-blue-600",
        rose: "text-rose-600",
        emerald: "text-emerald-600",
        amber: "text-amber-600",
        indigo: "text-indigo-600",
        slate: "text-slate-900"
    };

    return (
        <div className={`bg-slate-50 border border-slate-100 rounded-lg p-4 text-center transition-all hover:border-slate-200 ${highlight ? 'bg-emerald-50/50 border-emerald-100' : ''}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h4 className={`${compact ? 'text-xl' : 'text-2xl'} font-black text-slate-900 ${colors[accent] || 'text-slate-900'} tracking-tight`}>{value}</h4>
        </div>
    );
}

function Badge({ type }) {
    const styles = {
        SWIGGY: "bg-orange-50 text-orange-600 border-orange-200",
        ZOMATO: "bg-red-50 text-red-600 border-red-200",
    };
    return (
        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider ${styles[type] || "bg-slate-100 text-slate-600"}`}>
            {type}
        </span>
    );
}

function StatusBadge({ status }) {
    const styles = {
        MATCHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
        PENDING: "bg-amber-50 text-amber-700 border-amber-200",
        SHORTAGE: "bg-red-50 text-red-700 border-red-200",
        EXCESS: "bg-blue-50 text-blue-700 border-blue-200",
        RESOLVED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wide ${styles[status] || "bg-slate-100 text-slate-600"}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'MATCHED' ? 'bg-emerald-500' : status === 'PENDING' ? 'bg-amber-500' : status === 'SHORTAGE' ? 'bg-red-500' : status === 'EXCESS' ? 'bg-blue-500' : status === 'RESOLVED' ? 'bg-indigo-500' : 'bg-slate-400'}`}></span>
            {status}
        </span>
    );
}
