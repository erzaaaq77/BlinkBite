import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "https://localhost:5001/api";

const DriverDashboard = ({ token, onBack }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [driverInfo, setDriverInfo] = useState(null);

  useEffect(() => {
    const fetchDriverData = async () => {
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        return;
      }
      try {
        const driverRes = await axios.get(`${API_BASE_URL}/Dashboard/Driver`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDriverInfo(driverRes.data.driver);
        setDeliveries(driverRes.data.currentOrders || []);
      } catch (err) {
        setError("Failed to fetch driver data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDriverData();
  }, [token]);

  const getStatusBadgeClass = (status) => {
    const statusLower = String(status || "").toLowerCase();
    if (statusLower === "pending") return "badge bg-warning";
    if (statusLower === "accepted") return "badge bg-primary";
    if (statusLower === "preparing") return "badge bg-info";
    if (statusLower === "ready") return "badge bg-secondary";
    if (statusLower === "delivered") return "badge bg-success";
    if (statusLower === "cancelled") return "badge bg-danger";
    return "badge bg-secondary";
  };

  const getStatusName = (statusCode) => {
    const statusMap = {
      1: "Pending",
      2: "Accepted",
      3: "Preparing",
      4: "Ready",
      5: "Delivered",
      6: "Cancelled"
    };
    return statusMap[statusCode] || "Unknown";
  };

  const updateDeliveryStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/Orders/${orderId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const response = await axios.get(`${API_BASE_URL}/Dashboard/Driver`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliveries(response.data.currentOrders || []);
      alert(`Order #${orderId} marked as ${newStatus}`);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
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

  return (
    <section className="container py-4">
      <div className="mb-4">
        <button className="btn btn-outline-secondary" onClick={onBack}>
          ← Back to Home
        </button>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🚚 Driver Dashboard</h2>
        {driverInfo && (
          <div className="text-end">
            <span className="badge bg-success fs-6 p-2">
              {driverInfo.automjeti || "Vehicle"}
            </span>
          </div>
        )}
      </div>

      {driverInfo && (
        <div className="card p-4 mb-4">
          <h5 className="mb-3">📋 Driver Information</h5>
          <div className="row">
            <div className="col-md-4">
              <strong>Vehicle:</strong> {driverInfo.automjeti || "-"}
            </div>
            <div className="col-md-4">
              <strong>Status:</strong> {driverInfo.statusi === 1 ? "Active" : "Inactive"}
            </div>
            <div className="col-md-4">
              <strong>Rating:</strong> ⭐ {driverInfo.vlersimi || "0"} / 5
            </div>
          </div>
        </div>
      )}

      <div className="card p-4">
        <h5 className="mb-3">📦 Current Deliveries</h5>
        {deliveries.length === 0 ? (
          <p className="text-muted">No deliveries assigned yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Restaurant</th>
                  <th>Delivery Address</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.restaurantName || "-"}</td>
                    <td>{order.adresaDorezimit || "-"}</td>
                    <td>€{order.shumaTotale?.toFixed(2)}</td>
                    <td>
                      <span className={getStatusBadgeClass(getStatusName(order.statusi))}>
                        {getStatusName(order.statusi)}
                      </span>
                    </td>
                    <td>
                      {order.statusi === 4 && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => updateDeliveryStatus(order.id, "Delivered")}
                        >
                          Mark as Delivered
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
    </section>
  );
};

export default DriverDashboard;