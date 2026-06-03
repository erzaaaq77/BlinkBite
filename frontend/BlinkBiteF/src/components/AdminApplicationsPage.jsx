import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import CategoryManagement from "./CategoryManagement";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5063/api").replace(/\/+$/, "");

const AdminApplicationsPage = () => {
  const [restaurantApps, setRestaurantApps] = useState([]);
  const [courierApps, setCourierApps] = useState([]);
  const [branchApps, setBranchApps] = useState([]);
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
      const headers = { Authorization: `Bearer ${token}` };
      
      const [restaurantsRes, couriersRes, branchesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/applications/restaurants`, { headers }),
        axios.get(`${API_BASE_URL}/admin/applications/couriers`, { headers }),
        axios.get(`${API_BASE_URL}/admin/applications/branches`, { headers })
      ]);
      
      setRestaurantApps(restaurantsRes.data || []);
      setCourierApps(couriersRes.data || []);
      setBranchApps(branchesRes.data || []);
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

  // Approve handlers
  const handleApproveRestaurant = async (id) => {
    const token = getToken();
    setActionLoading(`restaurant-${id}`);
    try {
      await axios.post(`${API_BASE_URL}/admin/applications/restaurant/${id}/approve`,
        { notes: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ Restaurant application approved! Credentials sent via email.`);
      fetchApplications();
    } catch (error) {
      setMessage(`❌ Error approving application: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveCourier = async (id) => {
    const token = getToken();
    setActionLoading(`courier-${id}`);
    try {
      await axios.post(`${API_BASE_URL}/admin/applications/courier/${id}/approve`,
        { notes: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ Courier application approved! Credentials sent via email.`);
      fetchApplications();
    } catch (error) {
      setMessage(`❌ Error approving application: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveBranch = async (id) => {
    const token = getToken();
    setActionLoading(`branch-${id}`);
    try {
      await axios.post(`${API_BASE_URL}/admin/applications/branch/${id}/approve`,
        { notes: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ Branch application approved! Branch created successfully.`);
      fetchApplications();
    } catch (error) {
      setMessage(`❌ Error approving branch: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Reject handlers
  const handleRejectRestaurant = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Reject application",
      input: "textarea",
      inputLabel: "Rejection reason",
      inputPlaceholder: "Enter the reason for rejection...",
      showCancelButton: true,
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      preConfirm: (value) => {
        if (!value || !value.trim()) {
          Swal.showValidationMessage("Please enter a rejection reason.");
        }
        return value;
      }
    });

    if (!reason) return;

    const token = getToken();
    setActionLoading(`restaurant-reject-${id}`);
    try {
      await axios.post(`${API_BASE_URL}/admin/applications/restaurant/${id}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("❌ Restaurant application rejected");
      fetchApplications();
    } catch (error) {
      setMessage("❌ Error rejecting application");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCourier = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Reject application",
      input: "textarea",
      inputLabel: "Rejection reason",
      inputPlaceholder: "Enter the reason for rejection...",
      showCancelButton: true,
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      preConfirm: (value) => {
        if (!value || !value.trim()) {
          Swal.showValidationMessage("Please enter a rejection reason.");
        }
        return value;
      }
    });

    if (!reason) return;

    const token = getToken();
    setActionLoading(`courier-reject-${id}`);
    try {
      await axios.post(`${API_BASE_URL}/admin/applications/courier/${id}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("❌ Courier application rejected");
      fetchApplications();
    } catch (error) {
      setMessage("❌ Error rejecting application");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBranch = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Reject branch application",
      input: "textarea",
      inputLabel: "Rejection reason",
      inputPlaceholder: "Enter the reason for rejection...",
      showCancelButton: true,
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      preConfirm: (value) => {
        if (!value || !value.trim()) {
          Swal.showValidationMessage("Please enter a rejection reason.");
        }
        return value;
      }
    });

    if (!reason) return;

    const token = getToken();
    setActionLoading(`branch-reject-${id}`);
    try {
      await axios.post(`${API_BASE_URL}/admin/applications/branch/${id}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("❌ Branch application rejected");
      fetchApplications();
    } catch (error) {
      setMessage("❌ Error rejecting branch application");
    } finally {
      setActionLoading(null);
    }
  };

  // 🔥 DELETE HANDLERS ME URL-TË E SAKTA
  const handleDeleteRestaurantApplication = async (id) => {
    const result = await Swal.fire({
      title: "Delete application?",
      text: "Are you sure you want to delete this restaurant application?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    const token = getToken();
    setActionLoading(`delete-restaurant-${id}`);
    try {
      await axios.delete(`${API_BASE_URL}/admin/applications/restaurant-application/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("✅ Restaurant application deleted successfully!");
      fetchApplications();
    } catch (error) {
      console.error("Delete error:", error);
      setMessage(`❌ Error deleting application: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCourierApplication = async (id) => {
    const result = await Swal.fire({
      title: "Delete application?",
      text: "Are you sure you want to delete this courier application?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    const token = getToken();
    setActionLoading(`delete-courier-${id}`);
    try {
      await axios.delete(`${API_BASE_URL}/admin/applications/courier-application/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("✅ Courier application deleted successfully!");
      fetchApplications();
    } catch (error) {
      console.error("Delete error:", error);
      setMessage(`❌ Error deleting application: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBranchApplication = async (id) => {
    const result = await Swal.fire({
      title: "Delete branch application?",
      text: "Are you sure you want to delete this branch application?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    const token = getToken();
    setActionLoading(`delete-branch-${id}`);
    try {
      await axios.delete(`${API_BASE_URL}/admin/applications/branch-application/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("✅ Branch application deleted successfully!");
      fetchApplications();
    } catch (error) {
      console.error("Delete error:", error);
      setMessage(`❌ Error deleting application: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete restaurant (approved restaurant)
  const handleDeleteRestaurant = async (applicationId) => {
    const result = await Swal.fire({
      title: "Delete restaurant?",
      text: "This will permanently delete the restaurant and all related data!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    const token = getToken();
    setActionLoading(`delete-restaurant-full-${applicationId}`);
    try {
      await axios.delete(`${API_BASE_URL}/admin/applications/restaurant/${applicationId}`, {
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

  const getApplicationsByTab = () => {
    switch (activeTab) {
      case "restaurants":
        return restaurantApps;
      case "couriers":
        return courierApps;
      case "branches":
        return branchApps;
      default:
        return restaurantApps;
    }
  };

  const applications = getApplicationsByTab();
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
          <button 
            className="btn btn-outline-success me-2"
            onClick={() => { window.location.hash = "/admin/restaurants"; }}
          >
            🏪 Manage Restaurants
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
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === "branches" ? "active" : ""}`}
            onClick={() => setActiveTab("branches")}>
            🏪 Branches ({branchApps.filter(a => a.status === "Pending").length} pending / {branchApps.length} total)
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
                        {activeTab === "restaurants" ? app.restaurantName : 
                         activeTab === "couriers" ? app.fullName : 
                         app.address}
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

                    {activeTab === "branches" && (
                      <div className="mt-2 pt-2 border-top">
                        <div><i className="bi bi-geo-alt me-2"></i>{app.address}</div>
                        <div><i className="bi bi-building me-2"></i>{app.city}</div>
                        <div><i className="bi bi-tag me-2"></i>Zone: {app.zone || "N/A"}</div>
                        <div><i className="bi bi-currency-euro me-2"></i>Delivery Fee: €{app.deliveryFee}</div>
                        {app.createBranchManager && (
                          <div><i className="bi bi-person-badge me-2"></i>Branch Manager requested</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {app.status === "Pending" && (
                    <div className="d-flex gap-2 mt-3">
                      <button 
                        className="btn btn-success btn-sm flex-grow-1" 
                        onClick={() => {
                          if (activeTab === "restaurants") handleApproveRestaurant(app.id);
                          else if (activeTab === "couriers") handleApproveCourier(app.id);
                          else handleApproveBranch(app.id);
                        }}
                        disabled={actionLoading === `${activeTab.slice(0, -1)}-${app.id}` || 
                                  actionLoading === `${activeTab}-${app.id}`}>
                        {actionLoading === `${activeTab.slice(0, -1)}-${app.id}` || 
                         actionLoading === `${activeTab}-${app.id}` ? (
                          <>⏳ Processing...</>
                        ) : (
                          <>✓ Approve</>
                        )}
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm" 
                        onClick={() => {
                          if (activeTab === "restaurants") handleRejectRestaurant(app.id);
                          else if (activeTab === "couriers") handleRejectCourier(app.id);
                          else handleRejectBranch(app.id);
                        }}
                        disabled={actionLoading === `${activeTab}-reject-${app.id}`}>
                        ✗ Reject
                      </button>
                    </div>
                  )}
                  
                  {/* Delete buttons */}
                  {app.status === "Pending" && (
                    <div className="mt-2">
                      <button 
                        className="btn btn-outline-secondary btn-sm w-100"
                        onClick={() => {
                          if (activeTab === "restaurants") handleDeleteRestaurantApplication(app.id);
                          else if (activeTab === "couriers") handleDeleteCourierApplication(app.id);
                          else handleDeleteBranchApplication(app.id);
                        }}
                        disabled={actionLoading === `delete-${activeTab.slice(0, -1)}-${app.id}`}>
                        {actionLoading === `delete-${activeTab.slice(0, -1)}-${app.id}` ? "⏳ Deleting..." : "🗑️ Delete Application"}
                      </button>
                    </div>
                  )}
                  
                  {app.status === "Approved" && activeTab === "restaurants" && (
                    <button 
                      className="btn btn-outline-danger btn-sm mt-3 w-100"
                      onClick={() => handleDeleteRestaurant(app.id)}
                      disabled={actionLoading === `delete-restaurant-full-${app.id}`}
                    >
                      {actionLoading === `delete-restaurant-full-${app.id}` ? "⏳ Deleting..." : "🗑️ Delete Restaurant"}
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