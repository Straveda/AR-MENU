import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

export default function PlatformDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState({
    apiServer: "loading...",
    database: "loading...",
    modelService: "loading...",
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    trial: 0,
    suspended: 0,
    expired: 0,
    expiringSoon: 0,
    noPlan: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [restaurantsRes, healthRes, statsRes] = await Promise.all([
          axiosClient.get("/platform/get-all-restaurants"),
          axiosClient.get("/platform/get-system-health"),
          axiosClient.get("/platform/get-subscription-stats"),
        ]);

        if (restaurantsRes.data.success) {
          setRestaurants(restaurantsRes.data.data || []);
        }
        if (healthRes.data.success) {
          setHealth(healthRes.data.data);
        }
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isHealthy = Object.values(health).every(s => s === "operational");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome to your Super Admin dashboard</p>
      </div>

      { }
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Restaurants" value={stats.total} color="indigo" icon="building" />
        <StatCard label="Active" value={stats.active} color="green" icon="check" />
        <StatCard label="Trial" value={stats.trial} color="amber" icon="clock" />
        <StatCard label="Suspended" value={stats.suspended} color="red" icon="ban" />
        <StatCard label="Expired" value={stats.expired} color="gray" icon="archive" />
      </div>

      { }
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            title="Manage Restaurants"
            description="View all restaurants, create new ones, manage admins and subscriptions"
            link="/platform/restaurants"
            color="indigo"
          />
          <QuickAction
            title="Manage Plans"
            description="Create and configure subscription plans with features and limits"
            link="/platform/plans"
            color="purple"
          />
          <QuickAction
            title="Onboard Restaurant"
            description="Quickly onboard a new restaurant to the platform"
            link="/platform/restaurants"
            color="emerald"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        { }
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Restaurants</h2>
            <Link to="/platform/restaurants" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>
          {restaurants.length === 0 ? (
            <p className="text-gray-500 text-sm">No restaurants</p>
          ) : (
            <div className="space-y-3">
              {restaurants.slice(0, 4).map((r) => (
                <div key={r._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                    <p className="text-xs text-gray-400">/r/{r.slug}</p>
                  </div>
                  <StatusBadge status={r.subscriptionStatus} />
                </div>
              ))}
            </div>
          )}
        </div>

        { }
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">System Health</h2>
          <div className="space-y-3">
            <HealthItem label="API Server" status={health.apiServer} />
            <HealthItem label="Database" status={health.database} />
            <HealthItem label="3D Model Service" status={health.modelService} />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            {isHealthy ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                All Systems Operational
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-2.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Some Services Need Attention
              </div>
            )}
          </div>
        </div>
      </div>

      { }
      {(stats.suspended > 0 || stats.expiringSoon > 0 || stats.noPlan > 0) && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Needs Attention</h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {stats.suspended > 0 && (
              <AttentionRow
                label="Suspended restaurants"
                count={stats.suspended}
                severity="high"
                link="/platform/restaurants"
              />
            )}
            {stats.expiringSoon > 0 && (
              <AttentionRow
                label="Expiring within 7 days"
                count={stats.expiringSoon}
                severity="medium"
                link="/platform/restaurants"
              />
            )}
            {stats.noPlan > 0 && (
              <AttentionRow
                label="No plan assigned"
                count={stats.noPlan}
                severity="low"
                link="/platform/restaurants"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  const colorStyles = {
    indigo: "bg-indigo-600 text-white",
    green: "bg-emerald-500 text-white",
    amber: "bg-amber-500 text-white",
    red: "bg-red-500 text-white",
    gray: "bg-gray-400 text-white",
  };

  const icons = {
    building: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
    check: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    clock: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    ban: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    ),
    archive: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    ),
  };

  return (
    <div className={`rounded-xl p-2.5 md:p-5 shadow-sm flex flex-col justify-between h-full ${colorStyles[color]}`}>
      <div className="flex items-center justify-between mb-1.5 md:mb-2">
        <span className="w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/10">
          <svg className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icons[icon]}
          </svg>
        </span>
      </div>
      <div>
        <h3 className="text-lg md:text-2xl font-bold text-white">{value}</h3>
        <p className="text-[10px] md:text-xs font-medium text-white/80 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ title, description, link, color }) {
  const borderColors = {
    indigo: "border-l-indigo-500 hover:bg-indigo-50",
    purple: "border-l-purple-500 hover:bg-purple-50",
    emerald: "border-l-emerald-500 hover:bg-emerald-50",
  };

  return (
    <Link
      to={link}
      className={`block bg-white border border-gray-200 border-l-4 ${borderColors[color]} rounded-lg p-4 transition-colors`}
    >
      <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </Link>
  );
}

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    SUSPENDED: "bg-red-100 text-red-700",
    TRIAL: "bg-amber-100 text-amber-700",
    EXPIRED: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status || "Unknown"}
    </span>
  );
}

function HealthItem({ label, status }) {
  const isOperational = status === "operational";
  const isUnconfigured = status === "unconfigured";

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <span className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider ${isOperational ? "text-emerald-600" :
        isUnconfigured ? "text-amber-600" : "text-red-600"
        }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isOperational ? "bg-emerald-500" :
          isUnconfigured ? "bg-amber-500" : "bg-red-500"
          }`}></span>
        {status}
      </span>
    </div>
  );
}

function AttentionRow({ label, count, severity, link }) {
  const dot = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-gray-400",
  };

  return (
    <Link to={link} className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full ${dot[severity]}`}></span>
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-900">{count}</span>
    </Link>
  );
}
