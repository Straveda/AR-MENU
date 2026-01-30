import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import settingsApi from "../../api/settingsApi";
import { useToast } from "../../components/common/Toast/ToastContext";

export default function PlatformSettings() {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState("profile");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [profile, setProfile] = useState({
        username: "",
        email: "",
        phone: "",
    });

    const [password, setPassword] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [platformSettings, setPlatformSettings] = useState({
        featureToggles: {
            arMenuPreview: true,
            multiLanguageSupport: true,
            kdsIntegration: true,
            advancedAnalytics: true,
        },
        notificationSettings: {
            subscriptionReminders: true,
            usageAlerts: true,
            reminderDaysBeforeExpiry: 14,
            gracePeriodDays: 7,
        },
    });

    useEffect(() => {
        fetchProfile();
        fetchPlatformSettings();
    }, [user]);

    const fetchPlatformSettings = async () => {
        try {
            const data = await settingsApi.getPlatformSettings();
            if (data.success) {
                setPlatformSettings(data.data);
            }
        } catch (error) {
            console.error("Failed to load platform settings", error);
        }
    };

    // Reset editing state when switching tabs
    useEffect(() => {
        setIsEditing(false);
    }, [activeTab]);

    const [error, setError] = useState(null);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await settingsApi.getProfile();
            if (data.success) {
                const u = data.data;
                // Assuming API returns user object or similar structure
                // Adjust these fields based on actual API response for Super Admin
                setProfile({
                    username: u.username || u.name || "",
                    email: u.email || u.contactEmail || "",
                    phone: u.phone || u.contactPhone || "",
                });
            }
        } catch (error) {
            console.error("Failed to load settings", error);
            setError(error.response?.data?.message || "Failed to load profile settings");
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Logic for updating profile (might need specific API for user update vs restaurant update)
            // If existing settingsApi.updateProfile targets restaurant, we might need a different endpoint
            // for updating the logged-in user's own profile if they are not a restaurant.
            // For now, assuming generic profile update is supported or we will find out.
            await settingsApi.updateProfile(profile);
            addToast("Profile updated successfully", "success");
            setIsEditing(false);
        } catch (error) {
            addToast(error.response?.data?.message || "Update failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSave = async (e) => {
        e.preventDefault();
        if (password.newPassword !== password.confirmPassword) {
            addToast("New passwords do not match", "error");
            return;
        }
        setLoading(true);
        try {
            await settingsApi.changePassword({
                currentPassword: password.currentPassword,
                newPassword: password.newPassword,
            });
            addToast("Password changed successfully", "success");
            setPassword({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error) {
            addToast(error.response?.data?.message || "Password change failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePlatformSettingsSave = async () => {
        setLoading(true);
        try {
            await settingsApi.updatePlatformSettings(platformSettings);
            addToast("Platform settings updated successfully", "success");
        } catch (error) {
            addToast("Failed to update platform settings", "error");
        } finally {
            setLoading(false);
        }
    };

    const TabButton = ({ id, label, icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 sm:flex-none px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === id
                ? "border-indigo-500 text-indigo-600 bg-indigo-50/50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
        >
            {icon}
            {label}
        </button>
    );

    const ToggleSwitch = ({ checked, onChange }) => (
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    );

    if (loading && !profile.username) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
                <p className="text-slate-500 mt-2">Manage your profile and security preferences.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200">
                    <div className="flex overflow-x-auto">
                        <TabButton
                            id="profile"
                            label="Profile Information"
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                        />
                        <TabButton
                            id="security"
                            label="Security"
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                        />
                        <TabButton
                            id="platform"
                            label="Platform Config"
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                        />
                    </div>
                </div>

                <div className="p-8">
                    {/* PROFILE TAB */}
                    {activeTab === "profile" && (
                        <div className="max-w-3xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-slate-900">Personal Details</h2>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Edit Details
                                    </button>
                                )}
                            </div>

                            {!isEditing ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    <div className="col-span-full flex items-center gap-6 p-6 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-24 h-24 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 text-3xl font-bold text-indigo-600">
                                            {profile.username?.charAt(0).toUpperCase() || "A"}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">{profile.username || "Super Admin"}</h3>
                                            <p className="text-slate-500 text-sm mt-1">{user?.role || "Platform Administrator"}</p>
                                        </div>
                                    </div>

                                    <div className="col-span-full">
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact Information</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{profile.email || "Not Set"}</p>
                                                    <p className="text-xs text-slate-500">Email Address</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{profile.phone || "Not Set"}</p>
                                                    <p className="text-xs text-slate-500">Phone Number</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleProfileSave} className="space-y-6">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                            <input
                                                type="text"
                                                required
                                                value={profile.username}
                                                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={profile.email}
                                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    value={profile.phone}
                                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => { setIsEditing(false); fetchProfile(); }}
                                            className="px-6 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 min-w-[120px]"
                                        >
                                            {loading ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                    {/* SECURITY TAB */}
                    {activeTab === "security" && (
                        <div className="max-w-xl">
                            <h2 className="text-lg font-semibold text-slate-900 mb-6">Password & Authentication</h2>
                            <form onSubmit={handlePasswordSave} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={password.currentPassword}
                                        onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={password.newPassword}
                                            onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password.confirmPassword}
                                        onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 min-w-[180px]"
                                    >
                                        {loading ? "Updating..." : "Change Password"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* PLATFORM CONFIG TAB */}
                    {activeTab === "platform" && (
                        <div className="max-w-4xl space-y-8">
                            {/* Feature Toggles */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">Feature Toggles</h2>
                                        <p className="text-slate-500 text-sm">Enable or disable platform features globally</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">AR Menu Preview</h3>
                                            <p className="text-sm text-slate-500">Allow restaurants to preview AR menus before publishing</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={platformSettings.featureToggles?.arMenuPreview}
                                            onChange={(e) => setPlatformSettings({
                                                ...platformSettings,
                                                featureToggles: { ...platformSettings.featureToggles, arMenuPreview: e.target.checked }
                                            })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">KDS Integration</h3>
                                            <p className="text-sm text-slate-500">Kitchen Display System integration for orders</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={platformSettings.featureToggles?.kdsIntegration}
                                            onChange={(e) => setPlatformSettings({
                                                ...platformSettings,
                                                featureToggles: { ...platformSettings.featureToggles, kdsIntegration: e.target.checked }
                                            })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">Advanced Analytics</h3>
                                            <p className="text-sm text-slate-500">Detailed analytics and reporting features</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={platformSettings.featureToggles?.advancedAnalytics}
                                            onChange={(e) => setPlatformSettings({
                                                ...platformSettings,
                                                featureToggles: { ...platformSettings.featureToggles, advancedAnalytics: e.target.checked }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notification Settings */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">Notification Settings</h2>
                                        <p className="text-slate-500 text-sm">Configure automated notifications</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">Subscription Reminders</h3>
                                            <p className="text-sm text-slate-500">Send email reminders before subscription expiry</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={platformSettings.notificationSettings?.subscriptionReminders}
                                            onChange={(e) => setPlatformSettings({
                                                ...platformSettings,
                                                notificationSettings: { ...platformSettings.notificationSettings, subscriptionReminders: e.target.checked }
                                            })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">Usage Alerts</h3>
                                            <p className="text-sm text-slate-500">Alert restaurants when approaching limits</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={platformSettings.notificationSettings?.usageAlerts}
                                            onChange={(e) => setPlatformSettings({
                                                ...platformSettings,
                                                notificationSettings: { ...platformSettings.notificationSettings, usageAlerts: e.target.checked }
                                            })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Reminder Days Before Expiry</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={platformSettings.notificationSettings?.reminderDaysBeforeExpiry}
                                                onChange={(e) => setPlatformSettings({
                                                    ...platformSettings,
                                                    notificationSettings: { ...platformSettings.notificationSettings, reminderDaysBeforeExpiry: parseInt(e.target.value) }
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Grace Period (Days)</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={platformSettings.notificationSettings?.gracePeriodDays}
                                                onChange={(e) => setPlatformSettings({
                                                    ...platformSettings,
                                                    notificationSettings: { ...platformSettings.notificationSettings, gracePeriodDays: parseInt(e.target.value) }
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handlePlatformSettingsSave}
                                    disabled={loading}
                                    className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 min-w-[180px]"
                                >
                                    {loading ? "Saving Settings..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
