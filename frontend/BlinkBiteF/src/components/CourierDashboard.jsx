import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "https://localhost:5063/api";

const CourierDashboard = ({ token, onBack }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/dashboard/driver`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboard(response.data);
      } catch (err) {
        setError("Failed to load courier dashboard data");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading courier dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-outline-secondary" onClick={onBack}>
          <i className="bi bi-arrow-left me-2"></i>Back
        </button>
      </div>
    );
  }

  const orders = dashboard?.orders || [];
  const performance = dashboard?.performance || {};

  return (
    <section className="container py-4">
      <div className="mb-4">
        <button className="btn btn-outline-secondary" onClick={onBack}>
          <i className="bi bi-arrow-left me-2"></i>Back to Home
        </button>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🚚 Courier Dashboard</h2>
        <div className="text-end">
          <span className="badge bg-success fs-6 p-2">Active</span>
        </div>
      </div>
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="restaurant-menu p-4">
            <h5 className="mb-3">📦 Orders to Deliver</h5>
            {orders.length === 0 ? (
              <p className="text-muted">No orders assigned for delivery.</p>
            ) : (
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Address</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Restaurant</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.adresaDorezimit || "-"}</td>
                      <td>€{(order.shumaTotale || 0).toFixed(2)}</td>
                      <td>{order.statusi}</td>
                      <td>{order.restaurantName || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="restaurant-menu p-4">
            <h5 className="mb-3">📊 Performance</h5>
            <p><strong>Rating:</strong> ⭐ {performance.rating || 0} / 5</p>
            <p><strong>Total Earnings:</strong> €{(performance.totalEarnings || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourierDashboard;
