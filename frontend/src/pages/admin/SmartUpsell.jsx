import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useToast } from '../../components/common/Toast/ToastContext';
import upsellApi from '../../api/upsellApi';
import AddRuleModal from '../../components/upsell/AddRuleModal';

export default function SmartUpsell() {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();

    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        revenueGenerated: 0,
        avgConversion: 0,
        avgBillIncrease: 0,
        activeRules: 0,
    });
    const [rules, setRules] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    useEffect(() => {
        if (user?.restaurantId) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, rulesRes, suggestionsRes] = await Promise.all([
                upsellApi.getStats(),
                upsellApi.getRules(),
                upsellApi.getSuggestions(),
            ]);

            if (statsRes.success) setStats(statsRes.data);
            if (rulesRes.success) setRules(rulesRes.data);
            if (suggestionsRes.success) setSuggestions(suggestionsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Failed to load upsell data');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRule = async (ruleId) => {
        try {
            const res = await upsellApi.toggleRule(ruleId);
            if (res.success) {
                setRules(rules.map(rule =>
                    rule._id === ruleId ? { ...rule, isActive: res.data.isActive } : rule
                ));
                showSuccess(`Rule ${res.data.isActive ? 'activated' : 'deactivated'}`);
            }
        } catch (error) {
            showError('Failed to toggle rule');
        }
    };

    const handleDeleteRule = async (ruleId) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;

        try {
            const res = await upsellApi.deleteRule(ruleId);
            if (res.success) {
                setRules(rules.filter(rule => rule._id !== ruleId));
                showSuccess('Rule deleted successfully');
                fetchData(); // Refresh stats
            }
        } catch (error) {
            showError('Failed to delete rule');
        }
    };

    const handleGenerateExplanation = async (ruleId) => {
        try {
            showSuccess('Generating AI explanation...');
            const res = await upsellApi.generateExplanation(ruleId);
            if (res.success) {
                setRules(rules.map(rule =>
                    rule._id === ruleId ? { ...rule, aiExplanation: res.data.aiExplanation } : rule
                ));
                showSuccess('Explanation generated successfully!');
            }
        } catch (error) {
            console.error(error);
            showError('Failed to generate explanation');
        }
    };

    const handleRefreshAnalytics = async () => {
        try {
            showSuccess('Refreshing analytics data...');
            const res = await upsellApi.triggerAnalytics();
            if (res.success) {
                // Wait a moment for aggregation to complete, then refresh stats
                setTimeout(async () => {
                    await fetchData();
                    showSuccess('Analytics refreshed successfully!');
                }, 2000);
            }
        } catch (error) {
            showError('Failed to refresh analytics');
        }
    };

    const getFilteredRules = () => {
        if (activeTab === 'all') return rules;

        const typeMap = {
            'pairings': ['LOW_ATTACHMENT', 'FREQUENT_PAIR'],
            'combos': ['COMBO_DISCOUNT'],
            'cart': ['CART_THRESHOLD'],
        };

        return rules.filter(rule => typeMap[activeTab]?.includes(rule.ruleType));
    };

    const getRuleBadgeColor = (ruleType) => {
        const colors = {
            'LOW_ATTACHMENT': 'bg-blue-100 text-blue-800 border-blue-200',
            'FREQUENT_PAIR': 'bg-purple-100 text-purple-800 border-purple-200',
            'COMBO_DISCOUNT': 'bg-orange-100 text-orange-800 border-orange-200',
            'CART_THRESHOLD': 'bg-green-100 text-green-800 border-green-200',
        };
        return colors[ruleType] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getRuleTypeLabel = (ruleType) => {
        const labels = {
            'LOW_ATTACHMENT': 'Pairing',
            'FREQUENT_PAIR': 'Pairing',
            'COMBO_DISCOUNT': 'Combo',
            'CART_THRESHOLD': 'Cart Upsell',
        };
        return labels[ruleType] || ruleType;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
                    <p className="text-gray-600">Loading Smart Upsell...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="type-h1">Smart Upsell</h1>
                    <p className="text-slate-500 mt-2">Configure AI-powered upsell recommendations for WebAR menu</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRefreshAnalytics}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm border border-slate-200"
                        title="Refresh analytics data from order history"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Analytics
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Rule
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Revenue Generated */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-slate-500 font-medium mb-1">Revenue Generated</p>
                            <p className="text-2xl font-bold text-slate-900">₹{stats.revenueGenerated.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Avg Conversion */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-slate-500 font-medium mb-1">Avg. Conversion</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.avgConversion}%</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Avg Bill Increase */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-slate-500 font-medium mb-1">Avg. Bill Increase</p>
                            <p className="text-2xl font-bold text-slate-900">₹{stats.avgBillIncrease}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Active Rules */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-slate-500 font-medium mb-1">Active Rules</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.activeRules}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 px-6 flex gap-1 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'all'
                            ? 'border-amber-500 text-amber-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        All Rules
                    </button>
                    <button
                        onClick={() => setActiveTab('pairings')}
                        className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pairings'
                            ? 'border-amber-500 text-amber-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        WebAR Pairings
                    </button>
                    <button
                        onClick={() => setActiveTab('combos')}
                        className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'combos'
                            ? 'border-amber-500 text-amber-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Combo Deals
                    </button>
                    <button
                        onClick={() => setActiveTab('cart')}
                        className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'cart'
                            ? 'border-amber-500 text-amber-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Cart Upsells
                    </button>
                </div>

                {/* Rules List */}
                <div className="p-6 space-y-4">
                    {getFilteredRules().length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-lg font-medium text-slate-600">No rules yet</p>
                            <p className="text-sm mt-1">Create your first upsell rule to get started</p>
                        </div>
                    ) : (
                        getFilteredRules().map((rule) => (
                            <div
                                key={rule._id}
                                className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Rule Header */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getRuleBadgeColor(rule.ruleType)}`}>
                                                {getRuleTypeLabel(rule.ruleType)}
                                            </span>
                                            {rule.isActive && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                                    Active
                                                </span>
                                            )}
                                            {rule.discountPercentage > 0 && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                    {rule.discountPercentage}% OFF
                                                </span>
                                            )}
                                        </div>

                                        {/* Rule Name */}
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">{rule.ruleName}</h3>

                                        {/* Dish Names */}
                                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                                            {rule.mainDishId && (
                                                <>
                                                    <span className="font-semibold">{rule.mainDishId.name}</span>
                                                    <span className="text-slate-400">→</span>
                                                </>
                                            )}
                                            {rule.secondaryDishId && (
                                                <span className="font-semibold">
                                                    {rule.secondaryDishId.name}
                                                    {rule.secondaryDishId.price && (
                                                        <span className="text-slate-400 ml-1">(₹{rule.secondaryDishId.price})</span>
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        {/* AI Explanation */}
                                        {rule.aiExplanation ? (
                                            <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg mb-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">AI Suggestion</span>
                                                </div>
                                                <p className="text-sm text-purple-900 italic">"{rule.aiExplanation}"</p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 italic mb-4">
                                                "Most people also add {rule.secondaryDishId?.name || 'this item'} with this!"
                                            </p>
                                        )}

                                        {/* Stats */}
                                        <div className="flex items-center gap-6 text-sm">
                                            <div>
                                                <span className="text-slate-500">Conversion:</span>
                                                <span className="font-bold text-slate-900 ml-2">{rule.conversion?.toFixed(1) || '0.0'}%</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Revenue:</span>
                                                <span className="font-bold text-slate-900 ml-2">₹{rule.revenue?.toLocaleString() || '0'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3">
                                        {/* Toggle Switch */}
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={rule.isActive}
                                                onChange={() => handleToggleRule(rule._id)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                        </label>

                                        {/* Generate AI Button */}
                                        <button
                                            onClick={() => handleGenerateExplanation(rule._id)}
                                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                            title="Generate AI Explanation"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                        </button>

                                        {/* Edit Button */}
                                        <button
                                            onClick={() => {
                                                setEditingRule(rule);
                                                setShowAddModal(true);
                                            }}
                                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => handleDeleteRule(rule._id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* AI-Powered Suggestions */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">AI-Powered Suggestions</h2>
                        <p className="text-sm text-slate-500">Based on your sales data, here are recommended upsell strategies</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {suggestions.map((suggestion) => (
                        <div
                            key={suggestion.id}
                            className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all"
                        >
                            <div className="text-3xl mb-3">{suggestion.icon}</div>
                            <h3 className="font-bold text-slate-900 mb-2">{suggestion.title}</h3>
                            <p className="text-sm text-slate-600 mb-4 line-clamp-3">{suggestion.description}</p>
                            <button className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                                Create Rule
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add/Edit Rule Modal */}
            <AddRuleModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setEditingRule(null);
                }}
                onSuccess={() => {
                    fetchData();
                    showSuccess(editingRule ? 'Rule updated successfully' : 'Rule created successfully');
                }}
                editRule={editingRule}
            />
        </div>
    );
}
