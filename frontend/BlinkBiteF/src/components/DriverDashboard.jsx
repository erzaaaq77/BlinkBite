import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import * as signalR from "@microsoft/signalr";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5063/api").replace(/\/+$/, "");
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
const DRIVER_ORDERS_BATCH_SIZE = 5;

const STATUS_MAP = {
  1: "Pending",
  2: "Accepted",
  3: "Preparing",
  4: "Ready",
  5: "Delivered",
  6: "Cancelled"
};

const normalizeStatusLabel = (value) => {
  if (typeof value === "number") {
    return STATUS_MAP[value] || "Unknown";
  }

  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "pending") return "Pending";
  if (normalized === "accepted") return "Accepted";
  if (normalized === "preparing") return "Preparing";
  if (normalized === "ready") return "Ready";
  if (normalized === "delivered") return "Delivered";
  if (normalized === "cancelled") return "Cancelled";
  return "Unknown";
};

const normalizeDriverAvailability = (value) => {
  if (typeof value === "number") {
    if (value === 1) return "Available";
    if (value === 2) return "Busy";
    if (value === 3) return "Offline";
  }

  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "available") return "Available";
  if (normalized === "busy") return "Busy";
  if (normalized === "offline") return "Offline";
  return "Unknown";
};

const statusBadge = (code) => {
  const name = normalizeStatusLabel(code);
  const cls = {
    Pending: "bg-warning text-dark",
    Accepted: "bg-primary",
    Preparing: "bg-info text-dark",
    Ready: "bg-secondary",
    Delivered: "bg-success",
    Cancelled: "bg-danger"
  }[name] || "bg-secondary";

  return <span className={`badge ${cls}`}>{name}</span>;
};

const DriverDashboard = ({ token, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, type: "success", message: "" });
  const [activeTab, setActiveTab] = useState("current");
  const [actionLoading, setActionLoading] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | sharing | error
  const [visibleCurrentCount, setVisibleCurrentCount] = useState(DRIVER_ORDERS_BATCH_SIZE);
  const [visibleAvailableCount, setVisibleAvailableCount] = useState(DRIVER_ORDERS_BATCH_SIZE);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(DRIVER_ORDERS_BATCH_SIZE);
  const locationIntervalRef = useRef(null);
  const hubConnectionRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(toastTimerRef.current);
    setToast({ visible: true, type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2600);
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) {
      setError("No authentication token. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/dashboard/driver`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setError("");
    } catch (err) {
      const msg = err?.response
        ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`
        : err?.message || "Failed to fetch driver data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startSharingLocation = async () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    try {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_ORIGIN}/locationHub`, { accessTokenFactory: () => token })
        .withAutomaticReconnect()
        .build();
      await connection.start();
      hubConnectionRef.current = connection;
      setLocationStatus("sharing");

      const currentOrders = data?.currentOrders || [];
      const activeOrderId = currentOrders[0]?.id;

      locationIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const payload = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            lastUpdate: new Date().toISOString(),
          };
          try {
            if (activeOrderId) {
              await connection.invoke("UpdateDriverLocation", activeOrderId, payload);
            }
          } catch (e) {
            console.error("Location send failed:", e);
          }
        });
      }, 5000);
    } catch (e) {
      console.error("Hub connection failed:", e);
      setLocationStatus("error");
    }
  };

  const stopSharingLocation = () => {
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    if (hubConnectionRef.current) hubConnectionRef.current.stop();
    hubConnectionRef.current = null;
    setLocationStatus("idle");
  };

  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      if (hubConnectionRef.current) hubConnectionRef.current.stop();
      clearTimeout(toastTimerRef.current);
    };
  }, []);

  const markDelivered = async (orderId) => {
    setActionLoading(`${orderId}-deliver`);
    try {
      await axios.put(
        `${API_BASE_URL}/orders/${orderId}/status`,
        { status: "Delivered" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
      showToast(`Order #${orderId} marked as delivered.`, "success");
    } catch {
      showToast("Failed to mark as delivered.", "danger");
    } finally {
      setActionLoading(null);
    }
  };

  const acceptOrder = async (orderId) => {
    setActionLoading(`${orderId}-accept`);
    try {
      await axios.post(
        `${API_BASE_URL}/dashboard/driver/accept/${orderId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
      setActiveTab("current");
      showToast(`Order #${orderId} accepted.`, "success");
    } catch (err) {
      showToast(String(err?.response?.data || "Failed to accept order."), "danger");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    setVisibleCurrentCount(DRIVER_ORDERS_BATCH_SIZE);
    setVisibleAvailableCount(DRIVER_ORDERS_BATCH_SIZE);
    setVisibleHistoryCount(DRIVER_ORDERS_BATCH_SIZE);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Loading driver dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-outline-secondary" onClick={onBack}>
          ← Back to Home
        </button>
      </div>
    );
  }

  const driver = data?.driver || {};
  const stats = data?.deliveries || {};
  const performance = data?.performance || {};
  const currentOrders = data?.currentOrders || [];
  const availableOrders = data?.availableOrders || [];
  const deliveryHistory = data?.deliveryHistory || [];

  const visibleCurrentOrders = currentOrders.slice(0, visibleCurrentCount);
  const hasMoreCurrentOrders = currentOrders.length > visibleCurrentOrders.length;
  const visibleAvailableOrders = availableOrders.slice(0, visibleAvailableCount);
  const hasMoreAvailableOrders = availableOrders.length > visibleAvailableOrders.length;
  const visibleDeliveryHistory = deliveryHistory.slice(0, visibleHistoryCount);
  const hasMoreDeliveryHistory = deliveryHistory.length > visibleDeliveryHistory.length;

  const driverStatusLabel = normalizeDriverAvailability(driver.statusi ?? driver.Statusi);

  return (
    <section className="container py-4" style={{ marginTop: "88px" }}>
      <div className="mb-4">
        <button className="btn btn-outline-secondary" onClick={onBack}>
          ← Back to Home
        </button>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🚚 Driver Dashboard</h2>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success fs-6 p-2">{driver.automjeti || "Vehicle"}</span>
          {locationStatus === "sharing" ? (
            <button className="btn btn-danger btn-sm" onClick={stopSharingLocation}>
              <i className="bi bi-geo-alt-fill me-1"></i>Stop Location
            </button>
          ) : (
            <button className="btn btn-success btn-sm" onClick={startSharingLocation}>
              <i className="bi bi-geo-alt me-1"></i>Share Location
            </button>
          )}
          {locationStatus === "sharing" && (
            <span className="badge bg-success"><i className="bi bi-broadcast me-1"></i>Live</span>
          )}
          {locationStatus === "error" && (
            <span className="badge bg-danger">Location Error</span>
          )}
        </div>
      </div>

      {toast.visible && (
        <div className={`app-toast app-toast--${toast.type}`} role="alert" aria-live="polite">
          <div className="app-toast__body">{toast.message}</div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
          ></button>
        </div>
      )}

      <div className="card p-4 mb-4">
        <h5 className="mb-3">📋 Driver Information</h5>
        <div className="row">
          <div className="col-md-4">
            <strong>Vehicle:</strong> {driver.automjeti || "-"}
          </div>
          <div className="col-md-4">
            <strong>Status:</strong>{" "}
            <span className={`badge ${driverStatusLabel === "Available" ? "bg-success" : driverStatusLabel === "Busy" ? "bg-warning text-dark" : "bg-secondary"}`}>
              {driverStatusLabel === "Unknown" ? "Unavailable" : driverStatusLabel}
            </span>
          </div>
          <div className="col-md-4">
            <strong>Rating:</strong> ⭐ {driver.vlersimi?.toFixed(1) || "0.0"} / 5
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card text-center p-3 border-0 shadow-sm">
            <h3 className="text-primary mb-0">{stats.total ?? 0}</h3>
            <small className="text-muted">Total Deliveries</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center p-3 border-0 shadow-sm">
            <h3 className="text-success mb-0">{stats.today ?? 0}</h3>
            <small className="text-muted">Today</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center p-3 border-0 shadow-sm">
            <h3 className="text-info mb-0">{stats.thisWeek ?? 0}</h3>
            <small className="text-muted">This Week</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center p-3 border-0 shadow-sm">
            <h3 className="text-warning mb-0">€{(performance.totalEarnings ?? 0).toFixed(2)}</h3>
            <small className="text-muted">Total Earnings</small>
          </div>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "current" ? "active" : ""}`}
            onClick={() => setActiveTab("current")}
          >
            📦 Current Deliveries
            {currentOrders.length > 0 && (
              <span className="badge bg-primary ms-2">{currentOrders.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "available" ? "active" : ""}`}
            onClick={() => setActiveTab("available")}
          >
            🟢 Available Orders
            {availableOrders.length > 0 && (
              <span className="badge bg-success ms-2">{availableOrders.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            📜 History
          </button>
        </li>
      </ul>

      {activeTab === "current" && (
        <div className="card p-4">
          {currentOrders.length === 0 ? (
            <p className="text-muted">No active deliveries.</p>
          ) : (
            <>
              <p className="small text-muted mb-2">Showing {visibleCurrentOrders.length} of {currentOrders.length}</p>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Restaurant</th>
                      <th>Delivery Address</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCurrentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.restaurantName || "-"}</td>
                        <td>{order.adresaDorezimit || "-"}</td>
                        <td>€{Number(order.shumaTotale || 0).toFixed(2)}</td>
                        <td>{statusBadge(order.statusi)}</td>
                        <td>
                          {normalizeStatusLabel(order.statusi) === "Ready" && (
                            <button
                              className="btn btn-sm btn-success"
                              disabled={actionLoading === `${order.id}-deliver`}
                              onClick={() => markDelivered(order.id)}
                            >
                              {actionLoading === `${order.id}-deliver`
                                ? "..."
                                : "Mark as Delivered"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="orders-pagination-bar mt-2">
                {hasMoreCurrentOrders && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setVisibleCurrentCount((current) => current + DRIVER_ORDERS_BATCH_SIZE)}
                  >
                    Show more ({currentOrders.length - visibleCurrentOrders.length} left)
                  </button>
                )}
                {visibleCurrentCount > DRIVER_ORDERS_BATCH_SIZE && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => setVisibleCurrentCount(DRIVER_ORDERS_BATCH_SIZE)}
                  >
                    Show less
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "available" && (
        <div className="card p-4">
          {availableOrders.length === 0 ? (
            <p className="text-muted">No orders available for pickup right now.</p>
          ) : (
            <>
              <p className="small text-muted mb-2">Showing {visibleAvailableOrders.length} of {availableOrders.length}</p>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Restaurant</th>
                      <th>Delivery Address</th>
                      <th>Amount</th>
                      <th>Placed At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAvailableOrders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.restaurantName || "-"}</td>
                        <td>{order.adresaDorezimit || "-"}</td>
                        <td>€{Number(order.shumaTotale || 0).toFixed(2)}</td>
                        <td>{new Date(order.dataPorosis).toLocaleTimeString()}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            disabled={actionLoading === `${order.id}-accept`}
                            onClick={() => acceptOrder(order.id)}
                          >
                            {actionLoading === `${order.id}-accept` ? "..." : "Accept Order"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="orders-pagination-bar mt-2">
                {hasMoreAvailableOrders && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setVisibleAvailableCount((current) => current + DRIVER_ORDERS_BATCH_SIZE)}
                  >
                    Show more ({availableOrders.length - visibleAvailableOrders.length} left)
                  </button>
                )}
                {visibleAvailableCount > DRIVER_ORDERS_BATCH_SIZE && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => setVisibleAvailableCount(DRIVER_ORDERS_BATCH_SIZE)}
                  >
                    Show less
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="card p-4">
          {deliveryHistory.length === 0 ? (
            <p className="text-muted">No completed deliveries yet.</p>
          ) : (
            <>
              <p className="small text-muted mb-2">Showing {visibleDeliveryHistory.length} of {deliveryHistory.length}</p>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Restaurant</th>
                      <th>Delivery Address</th>
                      <th>Amount</th>
                      <th>Delivered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleDeliveryHistory.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.restaurantName || "-"}</td>
                        <td>{order.adresaDorezimit || "-"}</td>
                        <td>€{Number(order.shumaTotale || 0).toFixed(2)}</td>
                        <td>{order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="orders-pagination-bar mt-2">
                {hasMoreDeliveryHistory && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setVisibleHistoryCount((current) => current + DRIVER_ORDERS_BATCH_SIZE)}
                  >
                    Show more ({deliveryHistory.length - visibleDeliveryHistory.length} left)
                  </button>
                )}
                {visibleHistoryCount > DRIVER_ORDERS_BATCH_SIZE && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => setVisibleHistoryCount(DRIVER_ORDERS_BATCH_SIZE)}
                  >
                    Show less
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default DriverDashboard;
