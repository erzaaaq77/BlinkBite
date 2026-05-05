import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import * as signalR from "@microsoft/signalr";

const API_BASE_URL = "http://localhost:5063/api";

const STATUS_MAP = {
  1: "Pending",
  2: "Accepted",
  3: "Preparing",
  4: "Ready",
  5: "Delivered",
  6: "Cancelled"
};

const statusBadge = (code) => {
  const name = STATUS_MAP[code] || "Unknown";
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
  const [activeTab, setActiveTab] = useState("current");
  const [actionLoading, setActionLoading] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | sharing | error
  const locationIntervalRef = useRef(null);
  const hubConnectionRef = useRef(null);

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
        .withUrl(`http://localhost:5063/locationHub`, { accessTokenFactory: () => token })
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
    };
  }, []);

  const markDelivered = async (orderId) => {
    setActionLoading(`${orderId}-deliver`);
    try {
      await axios.put(
        `${API_BASE_URL}/orders/${orderId}/status`,
        { status: 5 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
    } catch {
      alert("Failed to mark as delivered.");
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
    } catch (err) {
      alert(err?.response?.data || "Failed to accept order.");
    } finally {
      setActionLoading(null);
    }
  };

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

  return (
    <section className="container py-4">
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

      <div className="card p-4 mb-4">
        <h5 className="mb-3">📋 Driver Information</h5>
        <div className="row">
          <div className="col-md-4">
            <strong>Vehicle:</strong> {driver.automjeti || "-"}
          </div>
          <div className="col-md-4">
            <strong>Status:</strong>{" "}
            <span className={`badge ${driver.statusi === 1 ? "bg-success" : "bg-secondary"}`}>
              {driver.statusi === 1 ? "Available" : "Unavailable"}
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
                  {currentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.restaurantName || "-"}</td>
                      <td>{order.adresaDorezimit || "-"}</td>
                      <td>€{order.shumaTotale?.toFixed(2)}</td>
                      <td>{statusBadge(order.statusi)}</td>
                      <td>
                        {order.statusi === 4 && (
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
          )}
        </div>
      )}

      {activeTab === "available" && (
        <div className="card p-4">
          {availableOrders.length === 0 ? (
            <p className="text-muted">No orders available for pickup right now.</p>
          ) : (
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
                  {availableOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.restaurantName || "-"}</td>
                      <td>{order.adresaDorezimit || "-"}</td>
                      <td>€{order.shumaTotale?.toFixed(2)}</td>
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
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="card p-4">
          {deliveryHistory.length === 0 ? (
            <p className="text-muted">No completed deliveries yet.</p>
          ) : (
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
                  {deliveryHistory.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.restaurantName || "-"}</td>
                      <td>{order.adresaDorezimit || "-"}</td>
                      <td>€{order.shumaTotale?.toFixed(2)}</td>
                      <td>{order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default DriverDashboard;
