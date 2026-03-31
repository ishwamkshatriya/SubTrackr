import React, { useState, useContext } from 'react';
import useFetch from '../../hooks/useFetch.js';
import { NotificationContext } from '../../context/NotificationContext.jsx';
import { getPublicDiscounts, getRecommendations } from '../../services/userService.js';
import styles from '../../styles/dashboard.module.css';

const Offers = () => {
  const [selectedOffer, setSelectedOffer] = useState(null);
  const { data: offers, loading: offersLoading, error: offersError } = useFetch(getPublicDiscounts);
  const { data: recommendations, loading: recLoading } = useFetch(getRecommendations);
  const { showNotification } = useContext(NotificationContext);

  const handleApplyOffer = (offer) => {
    setSelectedOffer(offer);
    showNotification(`Discount code ${offer.code} copied to clipboard!`, 'success');
    // In a real app, you would copy to clipboard
    navigator.clipboard?.writeText(offer.code);
  };

  if (offersLoading) return <div className="loading"><div className="spinner"></div>Loading offers...</div>;
  if (offersError) return <div className="alert alert-error">Error loading offers: {offersError}</div>;

  return (
    <div className="container">
      <div className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.dashboardTitle}>Offers & Discounts</h1>
            <p className={styles.dashboardSubtitle}>Save money with our exclusive offers</p>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Personalized Recommendations</h2>
            <div className="space-y-4">
              {recommendations.recommendations?.map((rec, index) => (
                <div key={index} className={styles.recommendationCard}>
                  <h3 className={styles.recommendationTitle}>{rec.reason}</h3>
                  <p className={styles.recommendationDescription}>{rec.description}</p>
                  {rec.plan && (
                    <div className="mt-3">
                      <p className="text-sm">
                        <strong>Recommended Plan:</strong> {rec.plan.name} - ${rec.plan.price}/month
                      </p>
                      {rec.savings && (
                        <p className="text-sm">
                          <strong>Potential Savings:</strong> ${rec.savings}/month
                        </p>
                      )}
                    </div>
                  )}
                  <p className={styles.recommendationReason}>
                    Priority: {rec.priority} • {rec.type}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Offers */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Discounts</h2>
          {offers?.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🎫</div>
              <h3 className={styles.emptyStateTitle}>No Active Offers</h3>
              <p className={styles.emptyStateDescription}>
                There are no active discount offers at the moment. Check back later for new deals!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers?.map(offer => (
                <div key={offer._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{offer.name}</h3>
                      <p className="text-sm text-gray-600">{offer.conditions}</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                        {offer.type === 'percentage' ? `${offer.value}% OFF` : `$${offer.value} OFF`}
                      </div>
                    </div>
                  </div>

                  {offer.description && (
                    <p className="text-sm text-gray-600 mb-4">{offer.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Code:</span>
                      <span className="font-mono font-medium bg-gray-100 px-2 py-1 rounded">
                        {offer.code}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valid Until:</span>
                      <span>{new Date(offer.endDate).toLocaleDateString()}</span>
                    </div>
                    {offer.minOrderAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Min. Order:</span>
                        <span>${offer.minOrderAmount}</span>
                      </div>
                    )}
                    {offer.usageLimit && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Uses Left:</span>
                        <span>{offer.remainingUses}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleApplyOffer(offer)}
                    className="btn btn-success w-full"
                  >
                    Copy Code
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How to Use Discounts */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">How to Use Discount Codes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Step 1: Copy the Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Click on "Copy Code" for any discount you want to use. The code will be copied to your clipboard.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Step 2: Select a Plan</h3>
              <p className="text-sm text-gray-600 mb-4">
                Go to the <a href="/user/plans" className="text-blue-600 hover:underline">Plans page</a> and choose the plan you want to subscribe to.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Step 3: Apply During Checkout</h3>
              <p className="text-sm text-gray-600 mb-4">
                When subscribing to a plan, paste the discount code in the "Promo Code" field during checkout.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Step 4: Enjoy Savings</h3>
              <p className="text-sm text-gray-600 mb-4">
                The discount will be automatically applied to your subscription. You'll see the savings reflected in your billing.
              </p>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Terms & Conditions</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Discount codes are valid for new subscriptions only unless otherwise specified.</p>
            <p>• Some codes may have minimum order requirements or usage limits.</p>
            <p>• Discounts cannot be combined with other promotional offers.</p>
            <p>• All offers are subject to availability and may be withdrawn at any time.</p>
            <p>• Discounts apply to the first billing cycle unless otherwise stated.</p>
            <p>• Lumen Technologies reserves the right to modify or cancel offers at any time.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Offers;
