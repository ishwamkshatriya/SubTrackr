import React, { useContext } from 'react';
import useFetch from '../../hooks/useFetch.js';
import { NotificationContext } from '../../context/NotificationContext.jsx';
import { getUserDashboard } from '../../services/userService.js';
import styles from '../../styles/dashboard.module.css';

const UserDashboard = () => {
  const { data: dashboard, loading, error } = useFetch(getUserDashboard);
  const { showNotification } = useContext(NotificationContext);

  if (loading) return <div className="loading"><div className="spinner"></div>Loading dashboard...</div>;
  if (error) return <div className="alert alert-error">Error loading dashboard: {error}</div>;

  const { activeSubscription, usageStats, upcomingBilling, unreadNotifications } = dashboard || {};

  return (
    <div className="container">
      <div className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.dashboardTitle}>User Dashboard</h1>
            <p className={styles.dashboardSubtitle}>Manage your subscription and view usage</p>
          </div>
          {unreadNotifications > 0 && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {unreadNotifications} new notifications
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${activeSubscription ? styles.success : styles.warning}`}>
            <h3 className={styles.statValue}>
              {activeSubscription ? 'Active' : 'No Active Plan'}
            </h3>
            <p className={styles.statLabel}>
              {activeSubscription ? activeSubscription.planId.name : 'Current Status'}
            </p>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statValue}>
              {usageStats?.usagePercentage?.toFixed(1) || 0}%
            </h3>
            <p className={styles.statLabel}>Data Usage This Month</p>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statValue}>
              {usageStats?.totalUsage?.toFixed(1) || 0} GB
            </h3>
            <p className={styles.statLabel}>Total Data Used</p>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statValue}>
              {usageStats?.averageSpeed?.toFixed(1) || 0} Mbps
            </h3>
            <p className={styles.statLabel}>Average Speed</p>
          </div>
        </div>

        {/* Active Subscription */}
        {activeSubscription && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Plan Details</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Plan:</span> {activeSubscription.planId.name}</p>
                  <p><span className="font-medium">Type:</span> {activeSubscription.planId.productType}</p>
                  <p><span className="font-medium">Price:</span> ${activeSubscription.planId.price}/month</p>
                  <p><span className="font-medium">Data Quota:</span> {activeSubscription.planId.quota} GB</p>
                  <p><span className="font-medium">Speed:</span> {activeSubscription.planId.downloadSpeed} Mbps</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Subscription Info</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Status:</span> 
                    <span className={`statusBadge ${activeSubscription.status}`}>
                      {activeSubscription.status}
                    </span>
                  </p>
                  <p><span className="font-medium">Start Date:</span> 
                    {new Date(activeSubscription.startDate).toLocaleDateString()}
                  </p>
                  <p><span className="font-medium">End Date:</span> 
                    {new Date(activeSubscription.endDate).toLocaleDateString()}
                  </p>
                  <p><span className="font-medium">Auto Renew:</span> 
                    {activeSubscription.autoRenew ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Statistics */}
        {usageStats && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Data Usage</span>
                  <span className="text-sm text-gray-600">
                    {usageStats.totalUsage?.toFixed(1)} / {activeSubscription?.planId.quota || 0} GB
                  </span>
                </div>
                <div className={styles.usageBar}>
                  <div 
                    className={`${styles.usageProgress} ${
                      usageStats.usagePercentage > 80 ? 'danger' : 
                      usageStats.usagePercentage > 60 ? 'warning' : ''
                    }`}
                    style={{ width: `${Math.min(usageStats.usagePercentage, 100)}%` }}
                  ></div>
                </div>
                <p className={styles.usageText}>
                  {usageStats.usagePercentage?.toFixed(1)}% of monthly quota used
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {usageStats.averageDailyUsage?.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Avg Daily Usage (GB)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {usageStats.peakUsage?.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Peak Usage (GB)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {usageStats.averageSpeed?.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Avg Speed (Mbps)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {usageStats.daysWithData || 0}
                  </p>
                  <p className="text-sm text-gray-600">Active Days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Billing */}
        {upcomingBilling && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Upcoming Billing</h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Next Payment</p>
                  <p className="text-sm text-gray-600">
                    Due: {new Date(upcomingBilling.nextBillingDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    ${upcomingBilling.amount}
                  </p>
                  <p className="text-sm text-gray-600">
                    {upcomingBilling.autoRenew ? 'Auto-renewal enabled' : 'Auto-renewal disabled'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/user/plans" className="btn btn-primary text-center">
              View Plans
            </a>
            <a href="/user/subscription" className="btn btn-secondary text-center">
              Manage Subscription
            </a>
            <a href="/user/offers" className="btn btn-success text-center">
              View Offers
            </a>
            <button className="btn btn-outline text-center">
              View Usage History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
