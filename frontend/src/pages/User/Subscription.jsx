import React, { useState, useContext } from 'react';
import useFetch from '../../hooks/useFetch.js';
import { NotificationContext } from '../../context/NotificationContext.jsx';
import { getUserSubscriptions, upgradeDowngrade, cancelSubscription, renewSubscription, toggleAutoRenew, getPlans } from '../../services/userService.js';
import styles from '../../styles/dashboard.module.css';

const Subscription = () => {
  console.log('Subscription component is rendering'); // Debug log
  
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [newPlanId, setNewPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: subscriptions, loading: subscriptionsLoading, error, refetch } = useFetch(getUserSubscriptions);
  const { data: plans } = useFetch(getPlans);
  const { showNotification } = useContext(NotificationContext);

  const handleUpgradeDowngrade = async () => {
    if (!selectedSubscription || !newPlanId) {
      showNotification('Please select a subscription and new plan', 'warning');
      return;
    }

    if (selectedSubscription?.planId?._id === newPlanId) {
      showNotification('You are already on this plan', 'info');
      return;
    }

    setLoading(true);
    try {
      await upgradeDowngrade({
        subscriptionId: selectedSubscription._id,
        newPlanId,
        reason: 'User requested plan change'
      });
      showNotification('Subscription updated successfully!', 'success');
      refetch();
      setSelectedSubscription(null);
      setNewPlanId('');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update subscription';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (subscription) => {
    if (!window.confirm(`Are you sure you want to cancel your subscription to ${subscription.planId.name}?`)) {
      return;
    }

    setLoading(true);
    try {
      await cancelSubscription(subscription._id, {
        reason: 'User requested cancellation'
      });
      showNotification('Subscription cancelled successfully', 'success');
      refetch();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel subscription';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (subscription) => {
    setLoading(true);
    try {
      await renewSubscription(subscription._id);
      showNotification('Subscription renewed successfully!', 'success');
      refetch();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to renew subscription';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoRenew = async (subscription) => {
    setLoading(true);
    try {
      await toggleAutoRenew(subscription._id);
      showNotification(`Auto-renewal ${subscription.autoRenew ? 'disabled' : 'enabled'}`, 'success');
      refetch();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update auto-renewal';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  console.log('Subscription component - loading:', subscriptionsLoading, 'error:', error, 'data:', subscriptions); // Debug log
  
  if (subscriptionsLoading) return <div className="loading"><div className="spinner"></div>Loading subscriptions...</div>;
  if (error) return <div className="alert alert-error">Error loading subscriptions: {error}</div>;

  return (
    <div className="container">
      <div className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.dashboardTitle}>Manage Subscription</h1>
            <p className={styles.dashboardSubtitle}>View and manage your subscription details</p>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Your Subscriptions</h2>
          {subscriptions?.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📋</div>
              <h3 className={styles.emptyStateTitle}>No Subscriptions</h3>
              <p className={styles.emptyStateDescription}>
                You don't have any subscriptions yet. <a href="/user/plans" className="text-blue-600 hover:underline">Browse plans</a> to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions?.map(subscription => (
                <div key={subscription._id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{subscription.planId.name}</h3>
                      <p className="text-gray-600">{subscription.planId.productType}</p>
                    </div>
                    <span className={`statusBadge ${subscription.status}`}>
                      {subscription.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="font-semibold">${subscription.planId.price}/month</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Data Quota</p>
                      <p className="font-semibold">{subscription.planId.quota} GB</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Speed</p>
                      <p className="font-semibold">{subscription.planId.downloadSpeed} Mbps</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="font-medium">{new Date(subscription.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">End Date</p>
                      <p className="font-medium">{new Date(subscription.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Auto Renewal</p>
                      <p className="font-medium">{subscription.autoRenew ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Days Remaining</p>
                      <p className="font-medium">{subscription.daysRemaining || 0} days</p>
                    </div>
                  </div>

                  {subscription.isExpiringSoon && (
                    <div className="alert alert-warning mb-4">
                      ⚠️ Your subscription is expiring soon! Consider renewing to avoid service interruption.
                    </div>
                  )}

                  <div className={styles.actionButtons}>
                    {subscription.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleToggleAutoRenew(subscription)}
                          disabled={loading}
                          className="btn btn-outline btn-sm"
                        >
                          {subscription.autoRenew ? 'Disable' : 'Enable'} Auto-Renew
                        </button>
                        <button
                          onClick={() => handleCancel(subscription)}
                          disabled={loading}
                          className="btn btn-danger btn-sm"
                        >
                          Cancel Subscription
                        </button>
                      </>
                    )}
                    {subscription.status === 'expired' && (
                      <button
                        onClick={() => handleRenew(subscription)}
                        disabled={loading}
                        className="btn btn-success btn-sm"
                      >
                        Renew Subscription
                      </button>
                    )}
                    {subscription.status === 'cancelled' && (
                      <button
                        onClick={() => handleRenew(subscription)}
                        disabled={loading}
                        className="btn btn-success btn-sm"
                      >
                        Reactivate Subscription
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plan Change */}
        {subscriptions?.some(sub => sub.status === 'active') && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Change Plan</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Select Subscription to Modify</label>
                <select
                  className="form-select"
                  value={selectedSubscription?._id || ''}
                  onChange={(e) => {
                    const sub = subscriptions.find(s => s._id === e.target.value);
                    setSelectedSubscription(sub);
                  }}
                >
                  <option value="">Choose a subscription...</option>
                  {subscriptions
                    ?.filter(sub => sub.status === 'active')
                    .map(sub => (
                      <option key={sub._id} value={sub._id}>
                        {sub.planId.name} - ${sub.planId.price}/month
                      </option>
                    ))}
                </select>
              </div>

              {selectedSubscription && (
                <div>
                  <label className="form-label">Select New Plan</label>
                  <select
                    className="form-select"
                    value={newPlanId}
                    onChange={(e) => setNewPlanId(e.target.value)}
                  >
                    <option value="">Choose a new plan...</option>
                    {plans
                      ?.filter(p => p._id !== selectedSubscription?.planId?._id)
                      .map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} - ${p.price}/month
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {selectedSubscription && newPlanId && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Plan Change Summary</h4>
                  <p className="text-sm text-gray-600">
                    You are changing from <strong>{selectedSubscription.planId.name}</strong> to a new plan.
                    The change will take effect immediately and you will be charged the prorated amount.
                  </p>
                </div>
              )}

              <button
                onClick={handleUpgradeDowngrade}
                disabled={!selectedSubscription || !newPlanId || loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Updating...
                  </>
                ) : (
                  'Update Plan'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Subscription History */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Subscription History</h2>
          <div className="tableContainer">
            <table className="table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions?.map(subscription => (
                  <tr key={subscription._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{subscription.planId.name}</span>
                        <span className="planType">{subscription.planId.productType}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`statusBadge ${subscription.status}`}>
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {new Date(subscription.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      {new Date(subscription.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="text-right">${
                      typeof subscription.planId.price === 'number'
                        ? subscription.planId.price.toFixed(2)
                        : subscription.planId.price
                    }</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
