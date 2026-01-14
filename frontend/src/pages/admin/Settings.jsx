import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import settingsApi from "../../api/settingsApi";



















import { useToast } from "../../components/common/Toast/ToastContext";

export default function Settings() {
  const { user, setUser } = useAuth(); 
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("profile");
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

  
  useEffect(() => {
    if (user?.restaurantId) {
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      

      fetchProfile();
    }
  }, [user]);

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
      }
    } catch (error) {
      
      console.error("Failed to load settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsApi.updateProfile({
        ...profile,
        
        
        
      });
      addToast("Profile updated successfully", "success");
      
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
      await settingsApi.updateProfile({
        ...hours,
        
      });
      addToast("Working hours updated", "success");
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
      addToast(
        error.response?.data?.message || "Password change failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
        activeTab === id
          ? "border-amber-500 text-amber-600"
          : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 px-6">
          <div className="flex space-x-4">
            <TabButton id="profile" label="Profile" />
            <TabButton id="hours" label="Working Hours" />
            <TabButton id="appearance" label="Appearance" />
            <TabButton id="security" label="Security" />
          </div>
        </div>

        <div className="p-6 min-h-[400px]">
          {}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-6 max-w-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Address
                  </label>
                  <textarea
                    rows={3}
                    value={profile.address}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      required
                      value={profile.contactEmail}
                      onChange={(e) =>
                        setProfile({ ...profile, contactEmail: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={profile.contactPhone}
                      onChange={(e) =>
                        setProfile({ ...profile, contactPhone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={profile.logo}
                    onChange={(e) =>
                      setProfile({ ...profile, logo: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                  {profile.logo && (
                    <div className="mt-2">
                      <img
                        src={profile.logo}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {}
          {activeTab === "hours" && (
            <form onSubmit={handleHoursSave} className="space-y-6 max-w-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    required
                    value={hours.openingTime}
                    onChange={(e) =>
                      setHours({ ...hours, openingTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    required
                    value={hours.closingTime}
                    onChange={(e) =>
                      setHours({ ...hours, closingTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {}
          {activeTab === "appearance" && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900">
                Appearance Settings
              </h3>
              <p className="text-slate-500 max-w-xs mt-2">
                Theme and branding options coming soon.
              </p>
            </div>
          )}

          {}
          {activeTab === "security" && (
            <form onSubmit={handlePasswordSave} className="space-y-6 max-w-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password.currentPassword}
                    onChange={(e) =>
                      setPassword({
                        ...password,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password.newPassword}
                    onChange={(e) =>
                      setPassword({ ...password, newPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password.confirmPassword}
                    onChange={(e) =>
                      setPassword({
                        ...password,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? "Change Password" : "Change Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
