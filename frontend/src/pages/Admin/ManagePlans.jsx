import React, { useState, useContext } from 'react';
import useFetch from '../../hooks/useFetch.js';
import { NotificationContext } from '../../context/NotificationContext.jsx';
import { getPlans, createPlan, updatePlan, deletePlan, togglePlanStatus } from '../../services/adminService.js';
import styles from '../../styles/dashboard.module.css';

const ManagePlans = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quota: '',
    productType: 'Fibernet',
    downloadSpeed: '',
    uploadSpeed: '',
    setupFee: '0',
    contractLength: '12',
    maxUsers: '1',
    billingCycle: 'monthly'
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const { data: plans, loading: plansLoading, error, refetch } = useFetch(getPlans);
  const { showNotification } = useContext(NotificationContext);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const planData = {
        ...formData,
        price: parseFloat(formData.price),
        quota: parseInt(formData.quota),
        downloadSpeed: parseInt(formData.downloadSpeed),
        uploadSpeed: parseInt(formData.uploadSpeed),
        setupFee: parseFloat(formData.setupFee),
        contractLength: parseInt(formData.contractLength),
        maxUsers: parseInt(formData.maxUsers)
      };

      if (editId) {
        await updatePlan(editId, planData);
        showNotification('Plan updated successfully!', 'success');
      } else {
        await createPlan(planData);
        showNotification('Plan created successfully!', 'success');
      }

      resetForm();
      refetch();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save plan';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await deletePlan(id);
      showNotification('Plan deleted successfully!', 'success');
      refetch();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete plan';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    setLoading(true);
    try {
      await togglePlanStatus(id);
      showNotification('Plan status updated successfully!', 'success');
      refetch();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update plan status';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (plan) => {
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      quota: plan.quota.toString(),
      productType: plan.productType,
      downloadSpeed: plan.downloadSpeed.toString(),
      uploadSpeed: plan.uploadSpeed.toString(),
      setupFee: plan.setupFee.toString(),
      contractLength: plan.contractLength.toString(),
      maxUsers: plan.maxUsers.toString(),
      billingCycle: plan.billingCycle
    });
    setEditId(plan._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      quota: '',
      productType: 'Fibernet',
      downloadSpeed: '',
      uploadSpeed: '',
      setupFee: '0',
      contractLength: '12',
      maxUsers: '1',
      billingCycle: 'monthly'
    });
    setEditId(null);
    setShowForm(false);
  };

  if (plansLoading) return <div className="loading"><div className="spinner"></div>Loading plans...</div>;
  if (error) return <div className="alert alert-error">Error loading plans: {error}</div>;

  return (
    <div className="container">
      <div className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.dashboardTitle}>Manage Plans</h1>
            <p className={styles.dashboardSubtitle}>Create, edit, and manage subscription plans</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : 'Add New Plan'}
          </button>
        </div>

        {/* Plan Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editId ? 'Edit Plan' : 'Create New Plan'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Plan Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Product Type *</label>
                  <select
                    name="productType"
                    value={formData.productType}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="Fibernet">Fibernet</option>
                    <option value="Broadband Copper">Broadband Copper</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Price (USD) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="form-input"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Data Quota (GB) *</label>
                  <input
                    type="number"
                    name="quota"
                    value={formData.quota}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Setup Fee (USD)</label>
                  <input
                    type="number"
                    name="setupFee"
                    value={formData.setupFee}
                    onChange={handleChange}
                    className="form-input"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Download Speed (Mbps) *</label>
                  <input
                    type="number"
                    name="downloadSpeed"
                    value={formData.downloadSpeed}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Upload Speed (Mbps) *</label>
                  <input
                    type="number"
                    name="uploadSpeed"
                    value={formData.uploadSpeed}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Contract Length (months)</label>
                  <input
                    type="number"
                    name="contractLength"
                    value={formData.contractLength}
                    onChange={handleChange}
                    className="form-input"
                    min="1"
                  />
                </div>
                <div>
                  <label className="form-label">Max Users</label>
                  <input
                    type="number"
                    name="maxUsers"
                    value={formData.maxUsers}
                    onChange={handleChange}
                    className="form-input"
                    min="1"
                  />
                </div>
                <div>
                  <label className="form-label">Billing Cycle</label>
                  <select
                    name="billingCycle"
                    value={formData.billingCycle}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      {editId ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editId ? 'Update Plan' : 'Create Plan'
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Plans List */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">All Plans</h2>
          {plans?.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📋</div>
              <h3 className={styles.emptyStateTitle}>No Plans</h3>
              <p className={styles.emptyStateDescription}>
                No plans have been created yet. Create your first plan to get started.
              </p>
            </div>
          ) : (
            <div className="tableContainer">
              <table className="table">
                <thead>
                  <tr>
                    <th>Plan Name</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Quota</th>
                    <th>Speed</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans?.map(plan => (
                    <tr key={plan._id}>
                      <td>
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          {plan.description && (
                            <p className="text-sm text-gray-600">{plan.description}</p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="planType">{plan.productType}</span>
                      </td>
                      <td>${plan.price}</td>
                      <td>{plan.quota} GB</td>
                      <td>{plan.downloadSpeed}/{plan.uploadSpeed} Mbps</td>
                      <td>
                        <span className={`statusBadge ${plan.isActive ? 'active' : 'cancelled'}`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => startEdit(plan)}
                            className="btn btn-outline btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(plan._id)}
                            disabled={loading}
                            className={`btn btn-sm ${plan.isActive ? 'btn-warning' : 'btn-success'}`}
                          >
                            {plan.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(plan._id)}
                            disabled={loading}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePlans;
