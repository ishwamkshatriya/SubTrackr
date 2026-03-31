import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import { NotificationContext } from '../../context/NotificationContext.jsx';
import { getPlans, subscribe, getGlobalRecommendation, getUserDashboard } from '../../services/userService.js';
import styles from '../../styles/dashboard.module.css';

const Plans = () => {
  console.log('Plans component is rendering'); // Debug log
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const { data: plans, loading: plansLoading, error } = useFetch(getPlans);
  const { data: globalRec } = useFetch(getGlobalRecommendation);
  const { data: dashboard } = useFetch(getUserDashboard);
  const { showNotification } = useContext(NotificationContext);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      showNotification('Please select a plan first', 'warning');
      return;
    }

    setLoading(true);
    try {
      await subscribe({ planId: selectedPlan._id, ...(discountCode ? { discountCode } : {}) });
      showNotification('Successfully subscribed to the plan!', 'success');
      setSelectedPlan(null);
      setDiscountCode('');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Subscription failed. Please try again.';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChooseRecommended = async (plan) => {
    if (!plan) return;
    if (dashboard?.activeSubscription) {
      setSelectedPlan(plan);
      showNotification('Plan selected. Use Manage Subscription to change plans.', 'info');
      return;
    }
    setLoading(true);
    try {
      await subscribe({ planId: plan._id, ...(discountCode ? { discountCode } : {}) });
      showNotification('Successfully subscribed to the recommended plan!', 'success');
      setSelectedPlan(null);
      setDiscountCode('');
      navigate('/user/subscription');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Subscription failed. Please try again.';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  console.log('Plans component - loading:', plansLoading, 'error:', error, 'data:', plans); // Debug log
  
  if (plansLoading) return <div className="loading"><div className="spinner"></div>Loading plans...</div>;
  if (error) return <div className="alert alert-error">Error loading plans: {error}</div>;

  return (
    <div className="container">
      <div className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.dashboardTitle}>Available Plans</h1>
            <p className={styles.dashboardSubtitle}>Choose the perfect plan for your internet needs</p>
          </div>
        </div>

        {/* Recommended Plan (Personalized if applicable, otherwise Global) */}
        {(() => {
          const activeSub = dashboard?.activeSubscription;
          const usagePct = dashboard?.usageStats?.usagePercentage || 0;
          let personalPlan = null;
          if (activeSub?.planId && usagePct > 75 && Array.isArray(plans)) {
            const currentPlan = activeSub.planId;
            personalPlan = plans
              ?.filter(p => p.productType === currentPlan.productType && p.price > currentPlan.price)
              ?.sort((a, b) => a.price - b.price)[0] || null;
          }
          const recommended = personalPlan
            ? { type: 'personal', plan: personalPlan, usagePct }
            : (globalRec?.plan ? { type: 'global', plan: globalRec.plan, subscribers: globalRec.subscribers } : null);

          return recommended ? (
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {recommended.type === 'personal' ? 'Personalized Recommendation' : 'Recommended Plan'}
                  <span className="planType">{recommended.type === 'personal' ? 'High Usage' : 'Popular Choice'}</span>
                </h2>
                <p className="text-sm text-gray-600">
                  {recommended.type === 'personal' ? 'Based on your recent usage (> 75% of quota)' : 'Based on active subscribers across all users'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-outline"
                  disabled={loading}
                  onClick={() => handleChooseRecommended(recommended.plan)}
                >
                  {dashboard?.activeSubscription ? 'Select' : 'Subscribe'} {recommended.plan.name}
                </button>
                {!dashboard?.activeSubscription && (
                  <button
                    className="btn btn-primary"
                    disabled={loading}
                    onClick={() => handleChooseRecommended(recommended.plan)}
                  >
                    Subscribe Now
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="font-semibold">{recommended.plan.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-semibold">${recommended.plan.price}/month</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Quota</p>
                <p className="font-semibold">{recommended.plan.quota} GB</p>
              </div>
              {recommended.type === 'global' ? (
                <div>
                  <p className="text-sm text-gray-600">Subscribers</p>
                  <p className="font-semibold">{recommended.subscribers}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600">Your Usage</p>
                  <p className="font-semibold">{Math.round(recommended.usagePct)}%</p>
                </div>
              )}
            </div>
          </div>
          ) : null;
        })()}



        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map(plan => (
            <div
              key={plan._id}
              className={`${styles.planCard} ${selectedPlan?._id === plan._id ? styles.selected : ''}`}
              onClick={() => setSelectedPlan(plan)}
            >
              <div className="text-center mb-4">
                <span className={styles.planType}>
                  {(dashboard?.usageStats?.usagePercentage > 75 && dashboard?.activeSubscription?.planId &&
                    plans?.some(p => p._id === plan._id && p.price > dashboard.activeSubscription.planId.price && p.productType === dashboard.activeSubscription.planId.productType) &&
                    plans
                      .filter(p => p.productType === dashboard.activeSubscription.planId.productType && p.price > dashboard.activeSubscription.planId.price)
                      .sort((a,b)=>a.price-b.price)[0]?._id === plan._id)
                    ? 'Recommended • ' : (globalRec?.plan?._id === plan._id ? 'Recommended • ' : '')}
                  {plan.productType}
                </span>
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.planPrice}>
                  <span className="currency">$</span>
                  {plan.price}
                  <span className="text-sm text-gray-500">/month</span>
                </div>
              </div>

              <div className="mb-6">
                <ul className={styles.planFeatures}>
                  <li className={styles.planFeature}>
                    {plan.quota} GB data quota
                  </li>
                  <li className={styles.planFeature}>
                    {plan.downloadSpeed} Mbps download speed
                  </li>
                  <li className={styles.planFeature}>
                    {plan.uploadSpeed} Mbps upload speed
                  </li>
                  <li className={styles.planFeature}>
                    {plan.contractLength} month contract
                  </li>
                  {plan.setupFee > 0 && (
                    <li className={styles.planFeature}>
                      ${plan.setupFee} setup fee
                    </li>
                  )}
                  <li className={styles.planFeature}>
                    Up to {plan.maxUsers} user{plan.maxUsers > 1 ? 's' : ''}
                  </li>
                </ul>
              </div>

              {plan.description && (
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              )}

              <button
                className={`btn w-full ${selectedPlan?._id === plan._id ? 'btn-success' : 'btn-outline'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlan(plan);
                }}
              >
                {selectedPlan?._id === plan._id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        {/* Subscribe Button */}
        {selectedPlan && (
          <div className="card">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Selected Plan: {selectedPlan.name}</h3>
                <p className="text-gray-600">
                  ${selectedPlan.price}/month • {selectedPlan.quota} GB • {selectedPlan.downloadSpeed} Mbps
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Promo code (optional)"
                    className="form-input"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Discount will be applied at checkout if valid.</p>
              </div>
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="btn btn-primary btn-lg"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Subscribing...
                  </>
                ) : (
                  'Subscribe Now'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Plan Features Details */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Plan Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Fibernet Plans</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• High-speed fiber optic connection</li>
                <li>• Symmetric upload/download speeds</li>
                <li>• Low latency for gaming and streaming</li>
                <li>• Reliable connection with minimal downtime</li>
                <li>• Premium customer support</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Broadband Plans</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Cost-effective copper wire connection</li>
                <li>• Good for basic internet needs</li>
                <li>• Suitable for browsing and email</li>
                <li>• Standard customer support</li>
                <li>• Quick installation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;
