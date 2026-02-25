import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../components/common/Toast/ToastContext';
import { getThemeAdmin, saveTheme, resetTheme, generateThemeWithAI } from '../../api/appearanceApi';
import { applyThemeToDOM, DEFAULT_THEME } from '../../hooks/useMenuTheme';


// ─── Preset Definitions ───────────────────────────────────────────────────────
const PRESETS = [
    {
        id: 'holoplate-classic',
        name: 'Holoplate Classic',
        description: 'Inter · Clean & Modern',
        tags: ['Inter', 'Light'],
        colors: { primary: '#f59e0b', secondary: '#1e293b', accent: '#d97706', background: '#ffffff' },
        typography: { fontFamily: 'Inter', fontSize: 'medium' },
        swatches: ['#ffffff', '#f59e0b', '#d97706', '#1e293b'],
    },
    {
        id: 'dark-luxury',
        name: 'Dark Luxury',
        description: 'Playfair Display · Premium Dark',
        tags: ['Playfair Display', 'Luxury', 'Dark'],
        colors: { primary: '#C19A6B', secondary: '#ffffff', accent: '#E5C07B', background: '#1A1A1A' },
        typography: { fontFamily: 'Playfair Display', fontSize: 'medium' },
        swatches: ['#1A1A1A', '#C19A6B', '#E5C07B', '#ffffff'],
    },
    {
        id: 'modern-cafe',
        name: 'Modern Cafe',
        description: 'Poppins · Warm & Cozy',
        tags: ['Poppins', 'Warm'],
        colors: { primary: '#8B5E3C', secondary: '#1e293b', accent: '#D4956A', background: '#FEFAF5' },
        typography: { fontFamily: 'Poppins', fontSize: 'medium' },
        swatches: ['#FEFAF5', '#8B5E3C', '#D4956A', '#1e293b'],
    },
    {
        id: 'fast-food',
        name: 'Fast Food',
        description: 'Montserrat · Vibrant & Bold',
        tags: ['Montserrat', 'Vibrant'],
        colors: { primary: '#E63946', secondary: '#1e293b', accent: '#FF6B6B', background: '#FFFFFF' },
        typography: { fontFamily: 'Montserrat', fontSize: 'medium' },
        swatches: ['#FFFFFF', '#E63946', '#FF6B6B', '#1e293b'],
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Open Sans · Minimalist',
        tags: ['Open Sans', 'Minimal'],
        colors: { primary: '#334155', secondary: '#1e293b', accent: '#94A3B8', background: '#FFFFFF' },
        typography: { fontFamily: 'Open Sans', fontSize: 'medium' },
        swatches: ['#FFFFFF', '#334155', '#94A3B8', '#1e293b'],
    },
];

function getContrastColor(hexColor) {
    if (!hexColor || hexColor.length < 6) return '#000000';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#1e293b' : '#ffffff';
}

const FONT_OPTIONS = ['Inter', 'Playfair Display', 'Poppins', 'Montserrat', 'Open Sans', 'Lato', 'Nunito', 'Raleway'];

// ─── Live Preview Component ───────────────────────────────────────────────────
function MenuPreview({ theme, size = 'mobile' }) {
    const { colors, typography } = theme;
    const textColor = getContrastColor(colors.background);
    const subTextColor = textColor === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.7)';
    const cardBg = textColor === '#ffffff' ? 'rgba(255,255,255,0.08)' : '#ffffff';
    const cardBorder = textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

    const sampleDishes = [
        { name: 'Paneer Tikka', desc: 'Delicious & fresh', price: '₹280' },
        { name: 'Butter Chicken', desc: 'Delicious & fresh', price: '₹380' },
    ];
    const categories = ['Starters', 'Main Course', 'Desserts'];

    return (
        <div
            style={{
                width: size === 'mobile' ? 170 : 230,
                height: size === 'mobile' ? 280 : 280,
                background: colors.background,
                borderRadius: 12,
                overflow: 'hidden',
                border: `1.5px solid ${cardBorder}`,
                fontFamily: `"${typography.fontFamily}", sans-serif`,
                flexShrink: 0,
                boxShadow: textColor === '#ffffff' ? '0 8px 32px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.12)',
                position: 'relative',
            }}
        >
            {/* Header */}
            <div style={{ padding: '10px 10px 6px', borderBottom: `1px solid ${cardBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: colors.primary,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff',
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                    }}>H</div>
                    <div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: textColor }}>Holoplate</div>
                    </div>
                </div>
                {/* Category tabs */}
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    {categories.map((cat, i) => (
                        <div key={cat} style={{
                            fontSize: 6, fontWeight: 600, padding: '2px 5px', borderRadius: 20,
                            background: i === 0 ? colors.primary : 'transparent',
                            color: i === 0 ? '#fff' : subTextColor,
                            border: i === 0 ? 'none' : `1px solid ${cardBorder}`,
                        }}>{cat}</div>
                    ))}
                </div>
            </div>

            <div style={{
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                overflowY: 'hidden',
            }}>
                {sampleDishes.map((d) => (
                    <div key={d.name} style={{
                        background: cardBg,
                        border: `1px solid ${cardBorder}`,
                        borderRadius: 8,
                        padding: '5px 6px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ fontSize: 14 }}>🍽️</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 7, fontWeight: 600, color: textColor }}>{d.name}</div>
                                <div style={{ fontSize: 6, color: subTextColor }}>{d.desc}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 7, color: colors.primary, fontWeight: 700 }}>{d.price}</div>
                                <div style={{ background: colors.primary, color: '#fff', borderRadius: 4, fontSize: 6, padding: '2px 5px', marginTop: 2 }}>+ Add</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Color Picker Row ─────────────────────────────────────────────────────────
function ColorRow({ label, value, onChange }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-600 font-medium">{label}</span>
            <div className="flex items-center gap-2">
                <label style={{ position: 'relative', cursor: 'pointer' }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: value,
                        border: '2px solid #e2e8f0',
                        cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                    }} />
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }}
                    />
                </label>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
                    }}
                    className="w-24 text-xs font-mono border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Appearance() {
    const { showSuccess, showError, showInfo } = useToast();

    const [activeTab, setActiveTab] = useState('presets');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [draft, setDraft] = useState(DEFAULT_THEME);
    const [savedPreset, setSavedPreset] = useState('holoplate-classic');

    // AI Generation state
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);


    // Load saved theme on mount
    useEffect(() => {
        setLoading(true);
        getThemeAdmin()
            .then((t) => {
                setDraft(t);
                setSavedPreset(t.preset);
            })
            .catch(() => {
                // Use defaults silently
            })
            .finally(() => setLoading(false));
    }, []);

    const updateColor = (key, value) => {
        setDraft((d) => {
            const next = { ...d, colors: { ...d.colors, [key]: value } };
            if (key === 'background') {
                next.colors.secondary = getContrastColor(value);
            }
            return next;
        });
    };

    const updateTypography = (key, value) =>
        setDraft((d) => ({ ...d, typography: { ...d.typography, [key]: value } }));

    const updateLayout = (key, value) =>
        setDraft((d) => ({ ...d, layout: { ...d.layout, [key]: value } }));

    const applyPreset = (preset) => {
        setDraft({ ...preset, preset: preset.id });
        setSavedPreset(preset.id);
        showInfo(`"${preset.name}" theme applied. Customize further or save as-is.`);
        setActiveTab('customize');
    };

    const VIBE_CHIPS = [
        "Luxury fine dining", "Modern cafe", "Dark neon bar",
        "Traditional Indian", "Minimal & clean"
    ];

    const handleAIGenerate = async () => {
        if (!aiPrompt.trim()) return showError("Please describe your vibe first.");

        setAiLoading(true);
        try {
            const theme = await generateThemeWithAI(aiPrompt);
            setAiResult(theme);
            // Auto apply to draft so user sees preview immediately
            setDraft(d => ({ ...d, ...theme, preset: 'custom' }));
            showSuccess("AI Theme generated! previewing now.");
        } catch (err) {
            showError(err.response?.data?.message || "Failed to generate AI theme.");
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = async () => {

        setSaving(true);
        try {
            await saveTheme(draft);
            applyThemeToDOM(draft);
            setSavedPreset(draft.preset);
            showSuccess('Theme saved! Customer menu will reflect the new look.');
        } catch {
            showError('Failed to save theme. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        try {
            const t = await resetTheme();
            setDraft(t);
            setSavedPreset(t.preset);
            applyThemeToDOM(t);
            showInfo('Theme reset to Holoplate Classic.');
        } catch {
            showError('Reset failed.');
        }
    };

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'menu-theme.json'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                setDraft((d) => ({ ...d, ...imported }));
                showSuccess('Theme imported! Review and save when ready.');
            } catch { showError('Invalid theme file.'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleDuplicate = () => {
        const copy = { ...draft, preset: 'holoplate-classic' };
        setDraft(copy);
        showInfo('Theme duplicated as a custom variant. Edit and save.');
        setActiveTab('customize');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ── Page Header ── */}
            <div className="mb-5">
                <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                    <span>Admin</span>
                    <span>›</span>
                    <span>Appearance</span>
                    <span>›</span>
                    <span className="text-slate-700 font-medium">Menu Theme</span>
                </nav>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="type-h1 text-slate-900">Menu Theme Engine</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Design your WebAR menu look &amp; feel</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={handleReset}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Reset
                        </button>
                        <button onClick={handleDuplicate}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Duplicate
                        </button>
                        <button onClick={handleExport}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
                            Export
                        </button>
                        <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            Import
                            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                        </label>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors shadow-sm disabled:opacity-60">
                            {saving ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                            )}
                            Save Theme
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Two column layout ── */}
            <div className="flex flex-col lg:flex-row gap-5">

                {/* LEFT PANEL — Controls */}
                <div className="w-full lg:w-80 xl:w-96 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-100">
                        {[
                            { id: 'presets', label: '✦ Presets' },
                            { id: 'customize', label: '⚙ Customize' },
                            { id: 'ai', label: '✦ AI Gen' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 text-xs font-semibold py-3 transition-colors border-b-2 ${activeTab === tab.id
                                    ? 'text-amber-600 border-amber-500 bg-amber-50/40'
                                    : 'text-slate-500 border-transparent hover:text-slate-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 overflow-y-auto max-h-[calc(100vh-280px)]">
                        {/* ─── PRESETS TAB ─── */}
                        {activeTab === 'presets' && (
                            <div>
                                <p className="text-xs text-slate-400 mb-3">Pick a preset then tweak it in Customize.</p>
                                <div className="space-y-2">
                                    {PRESETS.map((preset) => {
                                        const isActive = draft.preset === preset.id;
                                        return (
                                            <button
                                                key={preset.id}
                                                onClick={() => applyPreset(preset)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all ${isActive
                                                    ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-400/30'
                                                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Color swatches */}
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        {preset.swatches.map((sw, i) => (
                                                            <div key={i} style={{
                                                                width: i === 0 ? 24 : 10,
                                                                height: i === 0 ? 24 : 10,
                                                                borderRadius: i === 0 ? 6 : '50%',
                                                                background: sw,
                                                                border: '1.5px solid rgba(0,0,0,0.08)',
                                                                alignSelf: 'center',
                                                            }} />
                                                        ))}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-sm font-semibold text-slate-800">{preset.name}</span>
                                                            {isActive && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500 text-white rounded-full">Active</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-400 truncate">{preset.description}</p>
                                                    </div>
                                                    <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ─── CUSTOMIZE TAB ─── */}
                        {activeTab === 'customize' && (
                            <div className="space-y-6">
                                {/* Colors */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-rose-500" />
                                        <h3 className="text-sm font-semibold text-slate-700">Colors</h3>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        <ColorRow label="Primary Color" value={draft.colors.primary} onChange={(v) => updateColor('primary', v)} />
                                        <ColorRow label="Accent Color" value={draft.colors.accent} onChange={(v) => updateColor('accent', v)} />
                                        <ColorRow label="Background Color" value={draft.colors.background} onChange={(v) => updateColor('background', v)} />
                                        <div className="flex items-center justify-between py-2.5">
                                            <span className="text-sm text-slate-500 font-medium">Auto-Text Color</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-md border" style={{ background: draft.colors.secondary }} />
                                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                                    {draft.colors.secondary === '#ffffff' ? 'Light' : 'Darkish'} Mode
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Typography */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-base font-bold text-slate-700">T</span>
                                        <h3 className="text-sm font-semibold text-slate-700">Typography</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-slate-500 font-medium block mb-1">Font Family</label>
                                            <select
                                                value={draft.typography.fontFamily}
                                                onChange={(e) => updateTypography('fontFamily', e.target.value)}
                                                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-white"
                                            >
                                                {FONT_OPTIONS.map((f) => (
                                                    <option key={f} value={f}>{f}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 font-medium block mb-1">Font Size</label>
                                            <div className="flex gap-2">
                                                {['small', 'medium', 'large'].map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() => updateTypography('fontSize', size)}
                                                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border capitalize transition-all ${draft.typography.fontSize === size
                                                            ? 'bg-amber-500 text-white border-amber-500'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                                                            }`}
                                                    >
                                                        {size.charAt(0).toUpperCase() + size.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        )}

                        {/* ─── AI GEN TAB ─── */}
                        {activeTab === 'ai' && (
                            <div className="space-y-6">
                                <div className="p-4 bg-violet-50/50 rounded-2xl border border-violet-100 flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">AI Theme Generator</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                                            Describe your restaurant's vibe and let AI craft a theme for you.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 font-medium block mb-2">Describe your restaurant style</label>
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="e.g. Luxury fine dining with gold accents, dark moody atmosphere..."
                                        className="w-full h-32 text-sm border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white resize-none shadow-inner"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {VIBE_CHIPS.map(chip => (
                                        <button
                                            key={chip}
                                            onClick={() => setAiPrompt(chip)}
                                            className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors border border-slate-200"
                                        >
                                            {chip}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleAIGenerate}
                                    disabled={aiLoading}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-70"
                                >
                                    {aiLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.477 2.387a2 2 0 00.547 1.022l1.428 1.428a2 2 0 001.022.547l2.106.421a2 2 0 001.96-1.414l.421-2.106a2 2 0 00-.547-1.022l-1.428-1.428z" />
                                            </svg>
                                            Generate Theme
                                        </>
                                    )}
                                </button>

                                {aiResult && (
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated Output (editable via Customize tab)</p>
                                        <div className="p-3 bg-slate-900 rounded-xl overflow-hidden shadow-xl">
                                            <pre className="text-[10px] font-mono text-emerald-400 overflow-x-auto">
                                                {JSON.stringify(aiResult, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>

                {/* RIGHT PANEL — Live Preview */}
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-sm font-semibold text-slate-700">Live Preview</span>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Real-time</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs text-slate-400">Updates instantly</span>
                        </div>
                    </div>

                    <div className="p-6 flex flex-col sm:flex-row gap-8 items-start justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mobile Menu</span>
                            <MenuPreview theme={draft} size="mobile" />
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tablet Menu</span>
                            <MenuPreview theme={draft} size="tablet" />
                        </div>
                    </div>

                    {/* Current theme summary */}
                    <div className="px-6 pb-5 mt-2">
                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-wrap gap-4 items-center">
                            <div>
                                <p className="text-xs text-slate-400 font-medium mb-0.5">Active Preset</p>
                                <p className="text-sm font-bold text-slate-800 capitalize">{PRESETS.find(p => p.id === draft.preset)?.name || 'Custom'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium mb-0.5">Font</p>
                                <p className="text-sm font-semibold text-slate-700" style={{ fontFamily: draft.typography.fontFamily }}>{draft.typography.fontFamily}</p>
                            </div>
                            <div className="flex gap-2">
                                {Object.entries(draft.colors).map(([key, val]) => (
                                    <div key={key} title={key} style={{ width: 20, height: 20, borderRadius: 6, background: val, border: '1.5px solid rgba(0,0,0,0.1)' }} />
                                ))}
                            </div>
                            <div className="text-xs text-slate-400 ml-auto leading-relaxed max-w-[140px] text-right">
                                Standards: WCAG 2.1 Contrast Aware
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
