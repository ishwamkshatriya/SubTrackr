import React, { useState, useContext } from 'react';
import useFetch from '../../hooks/useFetch.js';
import { NotificationContext } from '../../context/NotificationContext.jsx';
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount } from '../../services/adminService.js';
import styles from '../../styles/dashboard.module.css';

const ManageDiscounts = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    type: 'percentage',
    value: '',
    maxDiscountAmount: '',
    minOrderAmount: '0',
    applicableProductTypes: [],
    conditions: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    isPublic: true
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const { data: discounts, loading: discountsLoading, error, refetch } = useFetch(getDiscounts);
  const { showNotification } = useContext(NotificationContext);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'applicableProductTypes') {
      const newTypes = checked 
        ? [...formData.applicableProductTypes, value]
        : formData.applicableProductTypes.filter(type => type !== value);
      setFormData({ ...formData, applicableProductTypes: newTypes });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const discountData = {
        ...formData,
        value: parseFloat(formData.value),
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
        minOrderAmount: parseFloat(formData.minOrderAmount),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate)
      };

      if (editId) {
        await updateDiscount(editId, discountData);
        showNotification('Discount updated successfully!', 'success');
      } else {
        await createDiscount(discountData);
        showNotification('Discount created successfully!', 'success');
      }

      resetForm();
      refetch();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save discount';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await deleteDiscount(id);
      showNotification('Discount deleted successfully!', 'success');
      refetch();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete discount';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (discount) => {
    setFormData({
      name: discount.name,
      description: discount.description || '',
      code: discount.code,
      type: discount.type,
      value: discount.value.toString(),
      maxDiscountAmount: discount.maxDiscountAmount?.toString() || '',
      minOrderAmount: discount.minOrderAmount.toString(),
      applicableProductTypes: discount.applicableProductTypes || [],
      conditions: discount.conditions || '',
      startDate: new Date(discount.startDate).toISOString().split('T')[0],
      endDate: new Date(discount.endDate).toISOString().split('T')[0],
      usageLimit: discount.usageLimit?.toString() || '',
      isPublic: discount.isPublic
    });
    setEditId(discount._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      type: 'percentage',
      value: '',
      maxDiscountAmount: '',
      minOrderAmount: '0',
      applicableProductTypes: [],
      conditions: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      isPublic: true
    });
    setEditId(null);
    setShowForm(false);
  };

  if (discountsLoading) return <div className="loading"><div className="spinner"></div>Loading discounts...</div>;
  if (error) return <div className="alert alert-error">Error loading discounts: {error}</div>;

  return (
    <div className="container">
      <div className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.dashboardTitle}>Manage Discounts</h1>
            <p className={styles.dashboardSubtitle}>Create and manage discount codes and promotions</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : 'Add New Discount'}
          </button>
        </div>

        {/* Discount Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editId ? 'Edit Discount' : 'Create New Discount'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Discount Name *</label>
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
                  <label className="form-label">Discount Code *</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., WELCOME20"
                    required
                  />
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
                  <label className="form-label">Discount Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Discount Value *</label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    className="form-input"
                    step="0.01"
                    min="0"
                    placeholder={formData.type === 'percentage' ? '20' : '10'}
                    required
                  />
                </div>
                {formData.type === 'percentage' && (
                  <div>
                    <label className="form-label">Max Discount Amount</label>
                    <input
                      type="number"
                      name="maxDiscountAmount"
                      value={formData.maxDiscountAmount}
                      onChange={handleChange}
                      className="form-input"
                      step="0.01"
                      min="0"
                      placeholder="50"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Minimum Order Amount</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleChange}
                    className="form-input"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">Usage Limit</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    className="form-input"
                    min="1"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Applicable Product Types</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="applicableProductTypes"
                      value="Fibernet"
                      checked={formData.applicableProductTypes.includes('Fibernet')}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Fibernet
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="applicableProductTypes"
                      value="Broadband Copper"
                      checked={formData.applicableProductTypes.includes('Broadband Copper')}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Broadband Copper
                  </label>
                </div>
              </div>

              <div>
                <label className="form-label">Conditions</label>
                <input
                  type="text"
                  name="conditions"
                  value={formData.conditions}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., new_customer, seasonal_promotion"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Make this discount visible to users
                </label>
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
                    editId ? 'Update Discount' : 'Create Discount'
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

        {/* Discounts List */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">All Discounts</h2>
          {discounts?.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🎫</div>
              <h3 className={styles.emptyStateTitle}>No Discounts</h3>
              <p className={styles.emptyStateDescription}>
                No discount codes have been created yet. Create your first discount to get started.
              </p>
            </div>
          ) : (
            <div className="tableContainer">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Valid Period</th>
                    <th>Usage</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts?.map(discount => (
                    <tr key={discount._id}>
                      <td>
                        <div>
                          <p className="font-medium">{discount.name}</p>
                          {discount.description && (
                            <p className="text-sm text-gray-600">{discount.description}</p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                          {discount.code}
                        </span>
                      </td>
                      <td>
                        <span className="planType">
                          {discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                        </span>
                      </td>
                      <td>
                        {discount.type === 'percentage' 
                          ? `${discount.value}%` 
                          : `$${discount.value}`
                        }
                        {discount.maxDiscountAmount && (
                          <p className="text-xs text-gray-500">
                            Max: ${discount.maxDiscountAmount}
                          </p>
                        )}
                      </td>
                      <td>
                        <div className="text-sm">
                          <p>{new Date(discount.startDate).toLocaleDateString()}</p>
                          <p>to {new Date(discount.endDate).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <p>{discount.usedCount} / {discount.usageLimit || '∞'}</p>
                          <p className="text-gray-500">
                            {discount.remainingUses} left
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className={`statusBadge ${discount.isCurrentlyValid ? 'active' : 'cancelled'}`}>
                          {discount.isCurrentlyValid ? 'Active' : 'Inactive'}
                        </span>
                        {!discount.isPublic && (
                          <p className="text-xs text-gray-500 mt-1">Private</p>
                        )}
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => startEdit(discount)}
                            className="btn btn-outline btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(discount._id)}
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

export default ManageDiscounts;
