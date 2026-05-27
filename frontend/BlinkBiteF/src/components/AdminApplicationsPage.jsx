import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import CategoryManagement from "./CategoryManagement";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5063/api").replace(/\/+$/, "");
const AdminApplicationsPage = () => {
  const [restaurantApps, setRestaurantApps] = useState([]);
  const [courierApps, setCourierApps] = useState([]);
  const [activeTab, setActiveTab] = useState("restaurants");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);


  const getToken = () => sessionStorage.getItem("access_token") || localStorage.getItem("access_token");

  const fetchApplications = async () => {
    const token = getToken();
    if (!token) {
      setMessage("❌ You are not logged in.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [restaurantsRes, couriersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/applications/restaurants`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/admin/applications/couriers`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setRestaurantApps(restaurantsRes.data || []);
      setCourierApps(couriersRes.data || []);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("❌ Error loading applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (type, id) => {
    const token = getToken();
    setActionLoading(`${type}-${id}`);
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/applications/${type}/${id}/approve`,
        { notes: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ Application approved!`);
      
      // Save the restaurantId from response
      if (response.data.restaurantId) {
        setRestaurantApps(prev => prev.map(app => 
          app.id === id ? { ...app, restaurantId: response.data.restaurantId } : app
        ));
      }
      
      if (response.data.username && response.data.password) {
        setMessage(prev => `${prev} Credentials: ${response.data.username} / ${response.data.password}`);
      }
      fetchApplications();
    } catch (error) {
      setMessage(`❌ Error approving application: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (type, id) => {
    const { value: reason } = await Swal.fire({
      title: "Reject application",
      input: "textarea",
      inputLabel: "Rejection reason",
      inputPlaceholder: "Enter the reason for rejection...",
      inputAttributes: {
        "aria-label": "Rejection reason"
      },
      showCancelButton: true,
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      preConfirm: (value) => {
        if (!value || !value.trim()) {
          Swal.showValidationMessage("Please enter a rejection reason.");
        }
        return value;
      },
      width: 500,
    });

    if (!reason) return;

    const token = getToken();
    setActionLoading(`${type}-${id}`);
    try {
      await axios.post(`${API_BASE_URL}/admin/applications/${type}/${id}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("❌ Application rejected");
      fetchApplications();
    } catch (error) {
      setMessage("❌ Error rejecting application");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete using application ID (not restaurant ID)
  const handleDeleteRestaurant = async (applicationId) => {
    if (!window.confirm("Are you sure you want to delete this restaurant?")) return;
    
    const token = getToken();
    setActionLoading(`delete-${applicationId}`);
    try {
      await axios.delete(`${API_BASE_URL}/admin/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("✅ Restaurant deleted successfully!");
      fetchApplications();
    } catch (error) {
      console.error("Delete error:", error);
      setMessage(`❌ Error deleting restaurant: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };
  if (showCategoryManagement) {
    return (
      <div className="container py-4" style={{ marginTop: "120px" }}>
        <CategoryManagement 
          token={getToken()} 
          onBack={() => setShowCategoryManagement(false)} 
        />
      </div>
    );
  }
  const applications = activeTab === "restaurants" ? restaurantApps : courierApps;
  const pendingCount = applications.filter(a => a.status === "Pending").length;

  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ marginTop: "120px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading applications...</p>
      </div>
    );
  }

  return (
   <div className="container py-5" style={{ marginTop: "120px" }}>
    <div className="d-flex justify-content-between align-items-center mb-4">
      <h2>📋 Admin Dashboard</h2>
      <div>
        <button 
          className="btn btn-outline-primary me-2"
          onClick={() => setShowCategoryManagement(true)}
        >
          🏷️ Manage Categories
        </button>
        <button 
          className="btn btn-outline-info me-2"
          onClick={() => { window.location.hash = "/admin/branch-requests"; }}
        >
          🏢 Branch Requests
        </button>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchApplications}>
          🔄 Refresh
        </button>
      </div>
    </div>

      <div className="mb-4">
        <button 
          className="btn btn-outline-primary"
          onClick={() => { window.location.hash = "/"; }}
        >
          ← Back to Home
        </button>
      </div>
      
      {message && (
        <div className={`alert ${message.includes("✅") ? "alert-success" : "alert-danger"} alert-dismissible fade show`} role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
        </div>
      )}
      
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === "restaurants" ? "active" : ""}`}
            onClick={() => setActiveTab("restaurants")}>
            🍔 Restaurants ({restaurantApps.filter(a => a.status === "Pending").length} pending / {restaurantApps.length} total)
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === "couriers" ? "active" : ""}`}
            onClick={() => setActiveTab("couriers")}>
            🚚 Couriers ({courierApps.filter(a => a.status === "Pending").length} pending / {courierApps.length} total)
          </button>
        </li>
      </ul>

      {applications.length === 0 ? (
        <div className="alert alert-info text-center py-4">
          <i className="bi bi-inbox fs-1"></i>
          <p className="mb-0 mt-2">No applications to display</p>
        </div>
      ) : (
        <div className="row">
          {applications.map((app) => (
            <div className="col-md-6 col-lg-4 mb-4" key={app.id}>
              <div className="card h-100 shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="card-title mb-0">
                        {activeTab === "restaurants" ? app.restaurantName : app.fullName}
                      </h5>
                      {activeTab === "restaurants" && app.restaurantId && (
                        <small className="text-muted">ID: {app.restaurantId}</small>
                      )}
                    </div>
                    <span className={`badge ${
                      app.status === "Pending" ? "bg-warning text-dark" : 
                      app.status === "Approved" ? "bg-success" : "bg-danger"
                    }`}>
                      {app.status === "Pending" ? "⏳ Pending" : 
                       app.status === "Approved" ? "✅ Approved" : "❌ Rejected"}
                    </span>
                  </div>
                  
                  <div className="small text-muted mb-3">
                    <div><i className="bi bi-envelope me-2"></i>{app.email}</div>
                    <div><i className="bi bi-telephone me-2"></i>{app.phone}</div>
                    <div><i className="bi bi-calendar me-2"></i>Applied: {new Date(app.appliedAt).toLocaleString()}</div>
                    
                    {activeTab === "restaurants" && (
                      <>
                        <div className="mt-2 pt-2 border-top">
                          <div><i className="bi bi-geo-alt me-2"></i>{app.address}</div>
                          <div><i className="bi bi-building me-2"></i>{app.city}</div>
                          {app.category && <div><i className="bi bi-tag me-2"></i>{app.category}</div>}
                        </div>
                      </>
                    )}
                    
                    {activeTab === "couriers" && (
                      <div className="mt-2 pt-2 border-top">
                        <div><i className="bi bi-car-front me-2"></i>{app.vehicleType}</div>
                        {app.licensePlate && <div><i className="bi bi-card-text me-2"></i>License: {app.licensePlate}</div>}
                        <div><i className="bi bi-map me-2"></i>Area: {app.workingArea}</div>
                      </div>
                    )}
                  </div>
                  
                  {app.status === "Pending" && (
                    <div className="d-flex gap-2 mt-3">
                      <button 
                        className="btn btn-success btn-sm flex-grow-1" 
                        onClick={() => handleApprove(activeTab === "restaurants" ? "restaurant" : "courier", app.id)}
                        disabled={actionLoading === `${activeTab === "restaurants" ? "restaurant" : "courier"}-${app.id}`}>
                        {actionLoading === `${activeTab === "restaurants" ? "restaurant" : "courier"}-${app.id}` ? (
                          <>⏳ Processing...</>
                        ) : (
                          <>✓ Approve</>
                        )}
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm" 
                        onClick={() => handleReject(activeTab === "restaurants" ? "restaurant" : "courier", app.id)}
                        disabled={actionLoading === `${activeTab === "restaurants" ? "restaurant" : "courier"}-${app.id}`}>
                        ✗ Reject
                      </button>
                    </div>
                  )}
                  
                  {/* Delete button - using application ID */}
                  {app.status === "Approved" && activeTab === "restaurants" && (
                    <button 
                      className="btn btn-outline-danger btn-sm mt-3 w-100"
                      onClick={() => handleDeleteRestaurant(app.id)}
                      disabled={actionLoading === `delete-${app.id}`}
                    >
                      {actionLoading === `delete-${app.id}` ? "⏳ Deleting..." : "🗑️ Delete Restaurant"}
                    </button>
                  )}
                  
                  {app.adminNotes && (
                    <div className="mt-3 p-2 bg-light rounded small">
                      <strong>📝 Note:</strong> {app.adminNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApplicationsPage;