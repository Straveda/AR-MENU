import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

export default function SubscriptionsManagement() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, logsRes, restRes] = await Promise.all([
        axiosClient.get("/platform/get-subscription-stats"),
        axiosClient.get("/platform/get-subscription-logs"),
        axiosClient.get("/platform/get-all-restaurants"),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (logsRes.data.success) setLogs(logsRes.data.data || []);
      if (restRes.data.success) setRestaurants(restRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calculate some insights for timeline
  const now = new Date();
  const sortedExpiring = [...restaurants]
    .filter(r => r.subscriptionEndsAt && r.subscriptionStatus !== "SUSPENDED")
    .sort((a, b) => new Date(a.subscriptionEndsAt) - new Date(b.subscriptionEndsAt));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500">Monitor platform revenue and expiration timelines</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <RevenueCard 
          label="Estimated MRR" 
          value={`₹${stats?.totalMRR?.toLocaleString()}`} 
          desc="Monthly Recurring Revenue" 
        />
        <RevenueCard 
          label="Active Subs" 
          value={stats?.activeSubscriptions} 
          desc="Non-suspended restaurants" 
        />
        <RevenueCard 
          label="Expiring (7d)" 
          value={stats?.expiringSoon} 
          color="text-amber-600"
          desc="Critical renewals" 
        />
        <RevenueCard 
          label="Expired" 
          value={stats?.expired} 
          color="text-red-600"
          desc="Immediate attention" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Expiration Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Expiration Timeline</h2>
            <span className="text-xs text-gray-500">Sorted by soonest expiry</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Restaurant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Expires</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Urgency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedExpiring.slice(0, 10).map((r) => {
                  const expiry = new Date(r.subscriptionEndsAt);
                  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.name}</div>
                        <div className="text-xs text-gray-400">/r/{r.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{expiry.toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.subscriptionStatus === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {r.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {diffDays < 0 ? (
                          <span className="text-red-600 font-medium">Expired</span>
                        ) : diffDays <= 7 ? (
                          <span className="text-amber-600 font-medium">In {diffDays}d</span>
                        ) : (
                          <span className="text-gray-400">In {diffDays}d</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Logs */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-6">
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="relative pl-6 pb-6 border-l border-gray-100 last:pb-0">
                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-indigo-500" />
                  <div className="text-xs text-gray-400 mb-1">
                    {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{log.restaurantId?.name}</span>{' '}
                    <ActionText action={log.action} />{' '}
                    <span className="font-medium text-indigo-600">{log.planId?.name}</span>
                  </div>
                  {log.durationInDays && (
                    <div className="text-xs text-gray-500 mt-1">
                      Duration: {log.durationInDays} days
                    </div>
                  )}
                  {log.performedBy && (
                    <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                      By {log.performedBy.username}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueCard({ label, value, desc, color = "text-gray-900" }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-2">{desc}</p>
    </div>
  );
}

function ActionText({ action }) {
  switch (action) {
    case "ASSIGN": return <span className="text-gray-600">assigned to</span>;
    case "EXTEND": return <span className="text-gray-600">extended with</span>;
    case "CHANGE": return <span className="text-gray-600">changed to</span>;
    default: return <span className="text-gray-600">updated</span>;
  }
}
