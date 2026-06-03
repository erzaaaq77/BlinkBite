import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:5063/api";

const AdminDrivers = ({ token, onBack }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/DeliveryDrivers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrivers(response.data);
    } catch (err) {
      toast.error("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Ndryshon statusin midis "Available" (aktiv) dhe "Offline" (joaktiv)
  const toggleStatus = async (driverId, currentStatus) => {
    const newStatus = currentStatus === "Available" ? "Offline" : "Available";
    try {
      await axios.patch(`${API_BASE_URL}/DeliveryDrivers/${driverId}/status`, newStatus, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Driver ${newStatus === "Available" ? "activated" : "deactivated"}`);
      fetchDrivers();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Available": return <span className="badge bg-success">Active</span>;
      case "Busy": return <span className="badge bg-warning">Busy</span>;
      case "Offline": return <span className="badge bg-secondary">Inactive</span>;
      default: return <span className="badge bg-secondary">{status}</span>;
    }
  };

  if (loading) return <div className="text-center py-5">Loading drivers...</div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between mb-4">
        <h2>🚚 Driver Management</h2>
        <button className="btn btn-outline-secondary" onClick={onBack}>← Back</button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Vehicle</th>
              <th>Zone</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.id}>
                <td>{driver.id}</td>
                <td>{driver.user?.userName || "N/A"}</td>
                <td>{driver.user?.email || "N/A"}</td>
                <td>{driver.automjeti || "-"}</td>
                <td>{driver.zona || "-"}</td>
                <td>{driver.vlersimi}</td>
                <td>{getStatusBadge(driver.statusi)}</td>
                <td>
                  {driver.statusi === "Available" ? (
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => toggleStatus(driver.id, driver.statusi)}
                    >
                      Deactivate
                    </button>
                  ) : driver.statusi === "Offline" ? (
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => toggleStatus(driver.id, driver.statusi)}
                    >
                      Activate
                    </button>
                  ) : (
                    <span className="text-muted">Busy</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDrivers;