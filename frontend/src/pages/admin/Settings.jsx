import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import settingsApi from "../../api/settingsApi";
import { useToast } from "../../components/common/Toast/ToastContext";

export default function Settings() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    logo: "",
  });

  const [hours, setHours] = useState({
    openingTime: "",
    closingTime: "",
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    newOrders: true,
    orderUpdates: true,
    lowStockAlerts: true,
    dailyReport: false,
  });

  useEffect(() => {
    if (user?.restaurantId) {
      fetchProfile();
    }
  }, [user]);

  // Reset editing state when switching tabs
  useEffect(() => {
    setIsEditing(false);
  }, [activeTab]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getProfile();
      if (data.success) {
        const r = data.data;
        setProfile({
          name: r.name || "",
          address: r.address || "",
          contactEmail: r.contactEmail || "",
          contactPhone: r.contactPhone || "",
          logo: r.logo || "",
        });
        setHours({
          openingTime: r.openingTime || "",
          closingTime: r.closingTime || "",
        });
        if (r.notificationPreferences) {
          setNotificationPreferences({
            newOrders: r.notificationPreferences.newOrders ?? true,
            orderUpdates: r.notificationPreferences.orderUpdates ?? true,
            lowStockAlerts: r.notificationPreferences.lowStockAlerts ?? true,
            dailyReport: r.notificationPreferences.dailyReport ?? false,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load settings", error);
      addToast("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsApi.updateProfile({ ...profile });
      addToast("Profile updated successfully", "success");
      setIsEditing(false);
    } catch (error) {
      addToast(error.response?.data?.message || "Update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleHoursSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsApi.updateProfile({ ...hours });
      addToast("Working hours updated", "success");
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

  const handleNotificationsSave = async () => {
    setLoading(true);
    try {
      await settingsApi.updateProfile({ notificationPreferences });
      addToast("Notification preferences updated", "success");
    } catch (error) {
      addToast("Failed to update preferences", "error");
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === id
        ? "bg-white text-slate-900 shadow-sm"
        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
        }`}
    >
      {icon}
      {label}
    </button>
  );

  const formatTime12Hour = (time24) => {
    if (!time24) return "--:--";
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${suffix}`;
  };

  const TimePickerField = ({ label, value, onChange }) => {
    // Parse initial value (24h) to 12h
    const [h, m] = (value || "09:00").split(':');
    const hourInt = parseInt(h, 10);

    // Components state
    const [hour12, setHour12] = useState(hourInt > 12 ? hourInt - 12 : (hourInt === 0 ? 12 : hourInt));
    const [minute, setMinute] = useState(m);
    const [ampm, setAmpm] = useState(hourInt >= 12 ? 'PM' : 'AM');

    // Update parent when any part changes
    useEffect(() => {
      let h24 = parseInt(hour12, 10);
      if (ampm === 'PM' && h24 < 12) h24 += 12;
      if (ampm === 'AM' && h24 === 12) h24 = 0;

      const timeString = `${h24.toString().padStart(2, '0')}:${minute}`;
      if (value !== timeString) {
        onChange(timeString);
      }
    }, [hour12, minute, ampm]);

    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="flex bg-white border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500 transition-all">
          <select
            value={hour12}
            onChange={(e) => setHour12(e.target.value)}
            className="flex-1 py-2 pl-3 pr-1 bg-transparent outline-none text-slate-700 font-medium appearance-none text-center hover:bg-slate-50 cursor-pointer border-r border-slate-100"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <div className="flex items-center px-1 text-slate-400 font-bold">:</div>
          <select
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className="flex-1 py-2 px-1 bg-transparent outline-none text-slate-700 font-medium appearance-none text-center hover:bg-slate-50 cursor-pointer border-r border-slate-100"
          >
            {['00', '15', '30', '45'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={ampm}
            onChange={(e) => setAmpm(e.target.value)}
            className="flex-1 py-2 pr-3 pl-1 bg-transparent outline-none text-amber-600 font-bold appearance-none text-center bg-slate-50 hover:bg-amber-50 cursor-pointer"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      <div>
        <h1 className="type-h1">Restaurant Settings</h1>
        <p className="text-slate-500 mt-2">Manage your restaurant profile, operating hours, and security preferences.</p>
      </div>

      <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1 overflow-x-auto">
        <TabButton
          id="profile"
          label="Profile & Branding"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <TabButton
          id="hours"
          label="Operating Hours"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <TabButton
          id="notifications"
          label="Notifications"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
        />
        <TabButton
          id="security"
          label="Security"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="max-w-3xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Restaurant Details</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Edit Details
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  <div className="col-span-full flex items-center gap-6 py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-24 h-24 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {profile.logo ? (
                        <img src={profile.logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">🏪</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{profile.name || "Restaurant Name"}</h3>
                      <p className="text-slate-500 text-sm mt-1">{profile.address || "No address set"}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact Information</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{profile.contactEmail || "Not Set"}</p>
                          <p className="text-xs text-slate-500">Email Address</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{profile.contactPhone || "Not Set"}</p>
                          <p className="text-xs text-slate-500">Phone Number</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant Name</label>
                      <input
                        type="text"
                        required
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                      <textarea
                        rows={3}
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                        <input
                          type="email"
                          required
                          value={profile.contactEmail}
                          onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                        <input
                          type="tel"
                          value={profile.contactPhone}
                          onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
                      <input
                        type="url"
                        value={profile.logo}
                        onChange={(e) => setProfile({ ...profile, logo: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      />
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
                      className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 min-w-[120px]"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* HOURS TAB */}
          {activeTab === "hours" && (
            <div className="max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Standard Operating Hours</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Edit Hours
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="py-3 px-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-amber-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Everyday Schedule</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">
                        {formatTime12Hour(hours.openingTime)} <span className="text-slate-400 font-normal mx-2">to</span> {formatTime12Hour(hours.closingTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Active Schedule
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleHoursSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TimePickerField
                      label="Opening Time"
                      value={hours.openingTime}
                      onChange={(val) => setHours({ ...hours, openingTime: val })}
                    />
                    <TimePickerField
                      label="Closing Time"
                      value={hours.closingTime}
                      onChange={(val) => setHours({ ...hours, closingTime: val })}
                    />
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
                      className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 min-w-[120px]"
                    >
                      {loading ? "Saving..." : "Save Schedule"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                {/* New Orders */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <h3 className="text-base font-medium text-slate-900">New Orders</h3>
                    <p className="text-sm text-slate-500">Get notified when new orders come in</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationPreferences.newOrders}
                      onChange={(e) => setNotificationPreferences({ ...notificationPreferences, newOrders: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Order Updates */}
                <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <h3 className="text-base font-medium text-slate-900">Order Updates</h3>
                    <p className="text-sm text-slate-500">Notifications for order status changes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationPreferences.orderUpdates}
                      onChange={(e) => setNotificationPreferences({ ...notificationPreferences, orderUpdates: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Low Stock Alerts */}
                <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <h3 className="text-base font-medium text-slate-900">Low Stock Alerts</h3>
                    <p className="text-sm text-slate-500">Alert when items are running low</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationPreferences.lowStockAlerts}
                      onChange={(e) => setNotificationPreferences({ ...notificationPreferences, lowStockAlerts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Daily Report */}
                <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <h3 className="text-base font-medium text-slate-900">Daily Report</h3>
                    <p className="text-sm text-slate-500">Receive daily summary email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationPreferences.dailyReport}
                      onChange={(e) => setNotificationPreferences({ ...notificationPreferences, dailyReport: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleNotificationsSave}
                    disabled={loading}
                    className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 min-w-[150px]"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
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
