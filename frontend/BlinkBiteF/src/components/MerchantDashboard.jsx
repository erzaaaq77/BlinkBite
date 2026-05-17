import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./MerchantDashboard.css";

const API_BASE_URL = "http://localhost:5063/api";

const ORDER_STATUS_LABELS = {
  1: "Pending",
  2: "Accepted",
  3: "Preparing",
  4: "Ready",
  5: "Delivered",
  6: "Cancelled",
};

const ORDER_STATUS_CODES = {
  pending: 1,
  accepted: 2,
  preparing: 3,
  ready: 4,
  delivered: 5,
  cancelled: 6,
};

const MERCHANT_ORDERS_BATCH_SIZE = 8;

const MerchantDashboard = ({ token }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [statusActionOrderId, setStatusActionOrderId] = useState(null);
  const [statusActionMessage, setStatusActionMessage] = useState("");
  const [statusActionError, setStatusActionError] = useState(false);
  const [orderDetailsLoadingId, setOrderDetailsLoadingId] = useState(null);
  const [visibleOrdersCount, setVisibleOrdersCount] = useState(MERCHANT_ORDERS_BATCH_SIZE);

  const normalizeStatusLabel = (statusValue) => {
    if (typeof statusValue === "number") {
      return ORDER_STATUS_LABELS[statusValue] || `Status ${statusValue}`;
    }

    const normalized = String(statusValue || "Pending").trim().toLowerCase();
    if (normalized === "accepted") return "Accepted";
    if (normalized === "preparing") return "Preparing";
    if (normalized === "ready") return "Ready";
    if (normalized === "delivered") return "Delivered";
    if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
    if (normalized === "pending") return "Pending";
    return String(statusValue || "Pending");
  };

  const fetchDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) {
        setDashboard(null);
        setLoading(false);
        setError("Your session has expired. Please sign in again.");
        return;
      }

      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/Dashboard/Merchant`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboard(response.data || null);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!token) return undefined;
    const intervalId = window.setInterval(() => {
      fetchDashboard({ silent: true });
    }, 25000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchDashboard, token]);

  useEffect(() => {
    setVisibleOrdersCount(MERCHANT_ORDERS_BATCH_SIZE);
  }, [orderStatusFilter, orderSearch]);

  const getStatusColor = (status) => {
    const statusLower = String(status || "").toLowerCase();
    if (statusLower === "pending") return "warning";
    if (statusLower === "preparing") return "info";
    if (statusLower === "ready") return "primary";
    if (statusLower === "delivered") return "success";
    if (statusLower === "cancelled") return "danger";
    if (statusLower === "accepted") return "secondary";
    return "secondary";
  };

  const getStatusBadgeClass = (status) => {
    const color = getStatusColor(status);
    return `bg-${color}`;
  };

  const getStatusName = (statusCode) => {
    return ORDER_STATUS_LABELS[statusCode] || "Unknown";
  };

  const getOrderActions = (statusName) => {
    const key = String(statusName || "").toLowerCase();
    if (key === "pending") {
      return [{ nextStatus: "Accepted", buttonClass: "btn btn-sm btn-primary", label: "Accept" }];
    }
    if (key === "accepted") {
      return [{ nextStatus: "Preparing", buttonClass: "btn btn-sm btn-warning", label: "Start Preparing" }];
    }
    if (key === "preparing") {
      return [{ nextStatus: "Ready", buttonClass: "btn btn-sm btn-success", label: "Mark Ready" }];
    }
    return [];
  };

  const handleStatusUpdate = async (order, nextStatus) => {
    const orderId = Number(order?.id);
    if (!Number.isFinite(orderId) || !nextStatus) return;

    const normalizedNextStatus = normalizeStatusLabel(nextStatus);
    const statusCode = ORDER_STATUS_CODES[String(normalizedNextStatus).toLowerCase()] || null;

    setStatusActionOrderId(orderId);
    setStatusActionMessage("");
    setStatusActionError(false);

    const payloadVariants = [
      { status: normalizedNextStatus },
      { Status: normalizedNextStatus },
      { newStatus: normalizedNextStatus },
      { NewStatus: normalizedNextStatus },
      ...(statusCode ? [{ status: statusCode }, { Status: statusCode }, { statusi: statusCode }, { Statusi: statusCode }] : []),
      ...(statusCode ? [{ status: normalizedNextStatus, statusCode }] : []),
    ];

    const explicitTransitionCandidates = [];
    if (normalizedNextStatus === "Accepted") {
      explicitTransitionCandidates.push({ method: "post", url: `${API_BASE_URL}/orders/${orderId}/accept`, payload: "" });
    }
    if (normalizedNextStatus === "Preparing") {
      explicitTransitionCandidates.push({ method: "post", url: `${API_BASE_URL}/orders/${orderId}/prepare`, payload: "" });
    }
    if (normalizedNextStatus === "Ready") {
      explicitTransitionCandidates.push({ method: "post", url: `${API_BASE_URL}/orders/${orderId}/ready`, payload: "" });
    }

    const genericCandidates = [
      { method: "put", url: `${API_BASE_URL}/orders/${orderId}/status` },
      { method: "patch", url: `${API_BASE_URL}/orders/${orderId}/status` },
      { method: "post", url: `${API_BASE_URL}/orders/${orderId}/status` },
      { method: "put", url: `${API_BASE_URL}/orders/${orderId}/update-status` },
      { method: "patch", url: `${API_BASE_URL}/orders/${orderId}/update-status` },
      { method: "post", url: `${API_BASE_URL}/orders/${orderId}/update-status` },
      { method: "put", url: `${API_BASE_URL}/orders/update-status/${orderId}` },
      { method: "patch", url: `${API_BASE_URL}/orders/update-status/${orderId}` },
      { method: "post", url: `${API_BASE_URL}/orders/update-status/${orderId}` },
    ];

    const requestCandidates = [...explicitTransitionCandidates, ...genericCandidates];

    try {
      let updated = false;

      for (const candidate of requestCandidates) {
        const candidatePayloads = candidate.payload !== undefined ? [candidate.payload] : payloadVariants;

        for (const payload of candidatePayloads) {
          const config = {
            method: candidate.method,
            url: candidate.url,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            data: payload,
          };

          try {
            const response = await axios(config);
            if (response.status >= 200 && response.status < 300) {
              updated = true;
              break;
            }
          } catch (requestErr) {
            const status = requestErr?.response?.status;
            if (status === 401 || status === 403) {
              setStatusActionError(true);
              setStatusActionMessage("You are not authorized to change this order status.");
              setStatusActionOrderId(null);
              return;
            }
            // For non-auth errors continue trying fallback routes.
          }
        }

        if (updated) break;
      }

      if (!updated) {
        setStatusActionError(true);
        setStatusActionMessage("Order status endpoint was not found. Please check backend routes.");
        return;
      }

      setStatusActionError(false);
      setStatusActionMessage(`Order #${orderId} moved to ${normalizedNextStatus}.`);
      await fetchDashboard({ silent: true });
    } catch (err) {
      console.error(err);
      setStatusActionError(true);
      setStatusActionMessage("Could not update order status right now.");
    } finally {
      setStatusActionOrderId(null);
    }
  };

  const viewOrderDetails = async (orderId) => {
    setOrderDetailsLoadingId(orderId);
    try {
      const response = await axios.get(`${API_BASE_URL}/Orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder(response.data);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      setStatusActionError(true);
      setStatusActionMessage("Could not load order details.");
    } finally {
      setOrderDetailsLoadingId(null);
    }
  };

  if (loading) {
    return (
      <section className="merchant-dashboard-page merchant-dashboard-state">
        <div className="merchant-state-card text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="mt-3 mb-2">Loading your merchant insights</h4>
          <p className="text-muted mb-0">Please wait while we prepare the latest restaurant and order data.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="merchant-dashboard-page merchant-dashboard-state">
        <div className="merchant-state-card merchant-state-error">
          <h4 className="mb-2">Dashboard failed to load</h4>
          <p className="mb-3">{error}</p>
          <button type="button" className="btn btn-outline-dark" onClick={() => fetchDashboard()}>
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="merchant-dashboard-page merchant-dashboard-state">
        <div className="merchant-state-card">
          <h4 className="mb-2">No dashboard data yet</h4>
          <p className="mb-3">There is no merchant data available for this account right now.</p>
          <button type="button" className="btn btn-outline-dark" onClick={() => fetchDashboard()}>
            Refresh dashboard
          </button>
        </div>
      </section>
    );
  }

  const restaurant = dashboard?.restaurant || {};
  const stats = dashboard?.orders || {};
  const revenue = dashboard?.revenue || {};
  const recentOrders = dashboard?.recentOrders || [];
  const reviews = dashboard?.reviews || {};
  const restaurantName = restaurant.emertimi || restaurant.name || "Restaurant";

  const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;

  const normalizedRecentOrders = recentOrders.map((order) => {
    const statusName = getStatusName(order.statusi);
    return {
      ...order,
      statusName,
      statusKey: String(statusName || "unknown").toLowerCase(),
      customerLabel: String(order.customerName || "Customer"),
    };
  });

  const flowSnapshot = normalizedRecentOrders.reduce(
    (acc, order) => {
      if (order.statusKey === "pending") acc.pending += 1;
      if (["accepted", "preparing", "ready"].includes(order.statusKey)) acc.inProgress += 1;
      if (order.statusKey === "delivered") acc.delivered += 1;
      if (order.statusKey === "cancelled") acc.cancelled += 1;
      return acc;
    },
    { pending: 0, inProgress: 0, delivered: 0, cancelled: 0 }
  );

  const normalizedSearch = orderSearch.trim().toLowerCase();
  const filteredOrders = normalizedRecentOrders.filter((order) => {
    const passesStatus = orderStatusFilter === "all" || order.statusKey === orderStatusFilter;
    if (!passesStatus) return false;

    if (!normalizedSearch) return true;
    const byOrderId = String(order.id || "").toLowerCase().includes(normalizedSearch);
    const byCustomer = order.customerLabel.toLowerCase().includes(normalizedSearch);
    return byOrderId || byCustomer;
  });

  const visibleFilteredOrders = filteredOrders.slice(0, visibleOrdersCount);
  const hasMoreFilteredOrders = filteredOrders.length > visibleFilteredOrders.length;

  const statusFilterOptions = [
    { value: "all", label: "All statuses" },
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
    { value: "preparing", label: "Preparing" },
    { value: "ready", label: "Ready" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <section className="merchant-dashboard-page">
      <div className="container py-4 py-lg-5">
        <div className="merchant-dash-topbar mb-4">
          <button
            className="btn btn-outline-primary"
            onClick={() => {
              window.location.hash = `/merchant/menu/${restaurant.id}`;
            }}
          >
            <i className="bi bi-grid-3x3-gap-fill me-2"></i>
            Manage Menu
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary merchant-refresh-btn"
            disabled={refreshing}
            onClick={() => fetchDashboard({ silent: true })}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <div className="merchant-status-chip">
            <span className="merchant-status-dot"></span>
            {restaurant.statusi || "Active"}
          </div>
        </div>

        <div className="merchant-dash-hero mb-4 mb-lg-5">
          <div>
            <p className="merchant-eyebrow mb-2">Merchant Control Center</p>
            <h2 className="merchant-dash-title mb-2">{restaurantName}</h2>
            <p className="merchant-dash-subtitle mb-0">
              Track revenue, monitor live order flow, and keep your restaurant operations in sync.
            </p>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-lg-6">
            <div className="merchant-card merchant-card-soft h-100">
              <h5 className="merchant-section-title mb-3">Restaurant Snapshot</h5>
              <div className="merchant-info-grid">
                <div className="merchant-info-cell">
                  <span className="merchant-label">Name</span>
                  <p className="merchant-value mb-0">{restaurantName}</p>
                </div>
                <div className="merchant-info-cell">
                  <span className="merchant-label">Rating</span>
                  <p className="merchant-value mb-0">{Number(restaurant.rating || 0).toFixed(1)} / 5</p>
                </div>
                <div className="merchant-info-cell">
                  <span className="merchant-label">Reviews</span>
                  <p className="merchant-value mb-0">{reviews.total || 0}</p>
                </div>
                <div className="merchant-info-cell">
                  <span className="merchant-label">Average</span>
                  <p className="merchant-value mb-0">{Number(reviews.average || restaurant.rating || 0).toFixed(1)} stars</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="merchant-card h-100">
              <h5 className="merchant-section-title mb-3">Revenue Summary</h5>
              <div className="merchant-revenue-list">
                <div className="merchant-revenue-row">
                  <span>Today</span>
                  <strong>{formatCurrency(revenue.today)}</strong>
                </div>
                <div className="merchant-revenue-row">
                  <span>This Week</span>
                  <strong>{formatCurrency(revenue.thisWeek)}</strong>
                </div>
                <div className="merchant-revenue-row">
                  <span>This Month</span>
                  <strong>{formatCurrency(revenue.thisMonth)}</strong>
                </div>
                <div className="merchant-revenue-row merchant-revenue-total">
                  <span>Total</span>
                  <strong>{formatCurrency(revenue.total)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="merchant-card mb-4">
          <h5 className="merchant-section-title mb-3">Order Performance</h5>
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <div className="merchant-stat-item merchant-stat-total">
                <p className="merchant-stat-value">{stats.total || 0}</p>
                <small>Total Orders</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="merchant-stat-item merchant-stat-pending">
                <p className="merchant-stat-value">{stats.pending || 0}</p>
                <small>Pending</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="merchant-stat-item merchant-stat-accepted">
                <p className="merchant-stat-value">{stats.accepted || 0}</p>
                <small>Accepted</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="merchant-stat-item merchant-stat-preparing">
                <p className="merchant-stat-value">{stats.preparing || 0}</p>
                <small>Preparing</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="merchant-stat-item merchant-stat-ready">
                <p className="merchant-stat-value">{stats.ready || 0}</p>
                <small>Ready</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="merchant-stat-item merchant-stat-delivered">
                <p className="merchant-stat-value">{stats.delivered || 0}</p>
                <small>Delivered</small>
              </div>
            </div>
          </div>
        </div>

        <div className="merchant-card merchant-orders-card p-4">
          <h5 className="merchant-section-title mb-3">Recent Orders</h5>

          {statusActionMessage && (
            <div className={`alert py-2 mb-3 ${statusActionError ? "alert-danger" : "alert-success"}`} role="alert">
              {statusActionMessage}
            </div>
          )}

          <div className="merchant-orders-toolbar mb-3">
            <div className="merchant-orders-filters">
              <div className="merchant-filter-group">
                <label className="form-label mb-1" htmlFor="merchant-order-status">Status</label>
                <select
                  id="merchant-order-status"
                  className="form-select form-select-sm"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  {statusFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="merchant-filter-group merchant-filter-search">
                <label className="form-label mb-1" htmlFor="merchant-order-search">Search</label>
                <input
                  id="merchant-order-search"
                  className="form-control form-control-sm"
                  type="text"
                  placeholder="Order ID or customer"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="merchant-orders-meta text-muted small">
              Showing {visibleFilteredOrders.length} of {normalizedRecentOrders.length} recent orders
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-6 col-lg-3">
              <div className="merchant-flow-chip merchant-flow-pending">
                <span>Pending</span>
                <strong>{flowSnapshot.pending}</strong>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="merchant-flow-chip merchant-flow-progress">
                <span>In Progress</span>
                <strong>{flowSnapshot.inProgress}</strong>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="merchant-flow-chip merchant-flow-delivered">
                <span>Delivered</span>
                <strong>{flowSnapshot.delivered}</strong>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="merchant-flow-chip merchant-flow-cancelled">
                <span>Cancelled</span>
                <strong>{flowSnapshot.cancelled}</strong>
              </div>
            </div>
          </div>

          {normalizedRecentOrders.length === 0 ? (
            <div className="merchant-inline-state">
              <h6 className="mb-1">No orders yet</h6>
              <p className="text-muted mb-0">New orders will appear here as soon as customers place them.</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="merchant-inline-state">
              <h6 className="mb-1">No matching results</h6>
              <p className="text-muted mb-0">Try a different status filter or clear the search text.</p>
            </div>
          ) : (
            <div className="accordion merchant-orders-accordion" id="ordersAccordion">
              {visibleFilteredOrders.map((order) => {
                const actions = getOrderActions(order.statusName);
                const actionInProgress = statusActionOrderId === Number(order.id);

                return (
                  <div className="accordion-item mb-2" key={order.id}>
                    <h2 className="accordion-header">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#collapse-${order.id}`}
                      >
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 w-100 me-3 merchant-order-summary">
                          <span><strong>Order #{order.id}</strong></span>
                          <span className="merchant-customer-name">{order.customerName || "Customer"}</span>
                          <span className="badge text-bg-dark me-2">{formatCurrency(order.shumaTotale)}</span>
                          <span className={`badge ${getStatusBadgeClass(order.statusName)}`}>
                            {order.statusName}
                          </span>
                        </div>
                      </button>
                    </h2>
                    <div
                      id={`collapse-${order.id}`}
                      className="accordion-collapse collapse"
                      data-bs-parent="#ordersAccordion"
                    >
                      <div className="accordion-body">
                        <h6>Order Items:</h6>
                        {order.items && order.items.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-sm align-middle">
                              <thead>
                                <tr>
                                  <th>Item</th>
                                  <th>Quantity</th>
                                  <th>Price</th>
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item, idx) => (
                                  <tr key={idx}>
                                    <td>{item.name || `Item ${item.menuItemId}`}</td>
                                    <td>{item.quantity || 1}</td>
                                    <td>€{(item.price || 0).toFixed(2)}</td>
                                    <td>€{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                                  <td><strong>{formatCurrency(order.shumaTotale)}</strong></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        ) : (
                          <p className="text-muted">No items details available</p>
                        )}

                        {order.address && (
                          <div className="mt-2">
                            <small className="text-muted">
                              <strong>Delivery Address:</strong> {order.address}
                            </small>
                          </div>
                        )}

                        {order.note && (
                          <div className="mt-1">
                            <small className="text-muted">
                              <strong>Note:</strong> {order.note}
                            </small>
                          </div>
                        )}

                        <div className="merchant-order-actions mt-3">
                          {actions.length === 0 ? (
                            <small className="text-muted">No status actions available for this order.</small>
                          ) : (
                            actions.map((action) => (
                              <button
                                key={`${order.id}-${action.nextStatus}`}
                                type="button"
                                className={action.buttonClass}
                                disabled={actionInProgress}
                                onClick={() => handleStatusUpdate(order, action.nextStatus)}
                              >
                                {actionInProgress ? "Updating..." : action.label}
                              </button>
                            ))
                          )}

                          <button
                            className="btn btn-sm btn-outline-dark"
                            disabled={orderDetailsLoadingId === Number(order.id)}
                            onClick={() => viewOrderDetails(order.id)}
                          >
                            {orderDetailsLoadingId === Number(order.id) ? "Loading..." : "View Full Order Details"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredOrders.length > 0 && (
            <div className="merchant-orders-pagination mt-3">
              {hasMoreFilteredOrders && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setVisibleOrdersCount((current) => current + MERCHANT_ORDERS_BATCH_SIZE)}
                >
                  Show more ({filteredOrders.length - visibleFilteredOrders.length} left)
                </button>
              )}

              {visibleOrdersCount > MERCHANT_ORDERS_BATCH_SIZE && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark"
                  onClick={() => setVisibleOrdersCount(MERCHANT_ORDERS_BATCH_SIZE)}
                >
                  Show less
                </button>
              )}
            </div>
          )}
        </div>

        {showModal && selectedOrder && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content merchant-modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Order #{selectedOrder.id} Details</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Customer:</strong> {selectedOrder.user?.userName || "N/A"}
                    </div>
                    <div className="col-md-6">
                      <strong>Date:</strong> {new Date(selectedOrder.dataPorosis).toLocaleString()}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Status:</strong> {getStatusName(selectedOrder.statusi)}
                    </div>
                    <div className="col-md-6">
                      <strong>Payment:</strong> {selectedOrder.metodaPageses === 1 ? "Cash" : "Other"}
                    </div>
                  </div>

                  <div className="mb-3">
                    <strong>Delivery Address:</strong> {selectedOrder.adresaDorezimit}
                  </div>

                  {selectedOrder.shenimet && (
                    <div className="mb-3">
                      <strong>Notes:</strong> {selectedOrder.shenimet}
                    </div>
                  )}

                  <h6>Order Items:</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Item</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 ? (
                          selectedOrder.orderItems.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.menuItem?.emertimi || item.name || `Item ${item.menuItemId}`}</td>
                              <td>{item.sasia || item.quantity}</td>
                              <td>€{(item.cmimi || item.price || 0).toFixed(2)}</td>
                              <td>€{((item.sasia || item.quantity || 1) * (item.cmimi || item.price || 0)).toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">No items found</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="table-active">
                        <tr>
                          <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                          <td><strong>{formatCurrency(selectedOrder.shumaTotale)}</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MerchantDashboard;