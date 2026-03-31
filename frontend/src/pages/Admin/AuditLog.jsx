import React, { useState } from 'react';
import useFetch from '../../hooks/useFetch.js';
import { getAuditLogs, getAuditLogStats } from '../../services/adminService.js';
import styles from '../../styles/dashboard.module.css';

const AuditLog = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    action: '',
    resource: '',
    category: '',
    severity: '',
    startDate: '',
    endDate: ''
  });
  
  const { data: auditLogs, loading: logsLoading, error: logsError, refetch } = useFetch(
    () => getAuditLogs(filters)
  );
  const { data: stats, loading: statsLoading } = useFetch(getAuditLogStats);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleSearch = () => {
    refetch();
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
      action: '',
      resource: '',
      category: '',
      severity: '',
      startDate: '',
      endDate: ''
    });
  };

  if (logsLoading) return <div className="loading"><div className="spinner"></div>Loading audit logs...</div>;
  if (logsError) return <div className="alert alert-error">Error loading audit logs: {logsError}</div>;

  return (
    <div className="container">
      <div className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.dashboardTitle}>Audit Logs</h1>
            <p className={styles.dashboardSubtitle}>Monitor system activities and user actions</p>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`${styles.statCard} ${styles.success}`}>
              <h3 className={styles.statValue}>{stats.stats?.totalLogs || 0}</h3>
              <p className={styles.statLabel}>Total Logs</p>
            </div>
            <div className={`${styles.statCard} ${styles.warning}`}>
              <h3 className={styles.statValue}>
                {stats.stats?.logsBySeverity?.find(s => s._id === 'high')?.count || 0}
              </h3>
              <p className={styles.statLabel}>High Severity</p>
            </div>
            <div className={`${styles.statCard} ${styles.danger}`}>
              <h3 className={styles.statValue}>
                {stats.stats?.logsBySeverity?.find(s => s._id === 'critical')?.count || 0}
              </h3>
              <p className={styles.statLabel}>Critical Events</p>
            </div>
            <div className={`${styles.statCard} ${styles.success}`}>
              <h3 className={styles.statValue}>
                {stats.stats?.topUsers?.length || 0}
              </h3>
              <p className={styles.statLabel}>Active Users</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Filter Logs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Action</label>
              <input
                type="text"
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
                className="form-input"
                placeholder="e.g., login, create_plan"
              />
            </div>
            <div>
              <label className="form-label">Resource</label>
              <select
                name="resource"
                value={filters.resource}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Resources</option>
                <option value="user">User</option>
                <option value="plan">Plan</option>
                <option value="subscription">Subscription</option>
                <option value="discount">Discount</option>
                <option value="audit">Audit</option>
              </select>
            </div>
            <div>
              <label className="form-label">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Categories</option>
                <option value="authentication">Authentication</option>
                <option value="authorization">Authorization</option>
                <option value="data_access">Data Access</option>
                <option value="data_modification">Data Modification</option>
                <option value="system">System</option>
                <option value="security">Security</option>
              </select>
            </div>
            <div>
              <label className="form-label">Severity</label>
              <select
                name="severity"
                value={filters.severity}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Results per page</label>
              <select
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleSearch} className="btn btn-primary">
                Search
              </button>
              <button onClick={clearFilters} className="btn btn-outline">
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
          {auditLogs?.auditLogs?.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📋</div>
              <h3 className={styles.emptyStateTitle}>No Logs Found</h3>
              <p className={styles.emptyStateDescription}>
                No audit logs match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="tableContainer">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Resource</th>
                      <th>Details</th>
                      <th>Category</th>
                      <th>Severity</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs?.auditLogs?.map(log => (
                      <tr key={log._id}>
                        <td>
                          <div className="text-sm">
                            <p>{new Date(log.timestamp).toLocaleDateString()}</p>
                            <p className="text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </td>
                        <td>
                          {log.userId ? (
                            <div>
                              <p className="font-medium">{log.userId.username}</p>
                              <p className="text-sm text-gray-600">{log.userId.email}</p>
                              <span className={`statusBadge ${log.userId.role === 'admin' ? 'active' : 'pending'}`}>
                                {log.userId.role}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">System</span>
                          )}
                        </td>
                        <td>
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {log.action}
                          </span>
                        </td>
                        <td>
                          {log.resource && (
                            <span className="planType">{log.resource}</span>
                          )}
                        </td>
                        <td>
                          <div className="max-w-xs">
                            <p className="text-sm truncate" title={log.details}>
                              {log.details}
                            </p>
                            {log.resourceId && (
                              <p className="text-xs text-gray-500">
                                ID: {log.resourceId}
                              </p>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="planType">{log.category}</span>
                        </td>
                        <td>
                          <span className={`statusBadge ${
                            log.severity === 'critical' ? 'danger' :
                            log.severity === 'high' ? 'warning' :
                            log.severity === 'medium' ? 'active' : 'pending'
                          }`}>
                            {log.severity}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-sm">
                            {log.ipAddress || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {auditLogs?.pagination && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((auditLogs.pagination.current - 1) * auditLogs.pagination.limit) + 1} to{' '}
                    {Math.min(auditLogs.pagination.current * auditLogs.pagination.limit, auditLogs.pagination.total)} of{' '}
                    {auditLogs.pagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={auditLogs.pagination.current <= 1}
                      className="btn btn-outline btn-sm"
                    >
                      Previous
                    </button>
                    <span className="flex items-center px-3 py-1 text-sm">
                      Page {auditLogs.pagination.current} of {auditLogs.pagination.pages}
                    </span>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={auditLogs.pagination.current >= auditLogs.pagination.pages}
                      className="btn btn-outline btn-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
