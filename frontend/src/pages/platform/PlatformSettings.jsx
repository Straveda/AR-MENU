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

    useEffect(() => {
        fetchProfile();
    }, [user]);

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
                </div>
            </div>
        </div>
    );
}
