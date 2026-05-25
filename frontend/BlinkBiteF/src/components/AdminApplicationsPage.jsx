import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5063/api").replace(/\/+$/, "");

const AdminApplicationsPage = () => {
  const [restaurantApps, setRestaurantApps] = useState([]);
  const [courierApps, setCourierApps] = useState([]);
  const [activeTab, setActiveTab] = useState("restaurants");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const getToken = () => {
    // Provo të marrësh token nga sessionStorage ose localStorage
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token");
  };

  const fetchApplications = async () => {
    const token = getToken();
    
    if (!token) {
      setMessage("❌ Ju nuk jeni të loguar. Ju lutemi kyquni si admin.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log("Fetching applications with token:", token.substring(0, 20) + "...");
      
      const [restaurantsRes, couriersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/applications/restaurants`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }),
        axios.get(`${API_BASE_URL}/admin/applications/couriers`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })
      ]);
      
      console.log("Restaurants response:", restaurantsRes.data);
      console.log("Couriers response:", couriersRes.data);
      
      setRestaurantApps(restaurantsRes.data || []);
      setCourierApps(couriersRes.data || []);
      setMessage("");
    } catch (error) {
      console.error("Error fetching applications:", error);
      console.error("Error response:", error.response);
      
      if (error.response?.status === 401) {
        setMessage("❌ Sesioni ka skaduar. Ju lutemi kyquni përsëri si admin.");
      } else if (error.response?.status === 403) {
        setMessage("❌ Nuk keni autorizim për të parë këtë faqe.");
      } else {
        setMessage(`❌ Gabim gjatë ngarkimit: ${error.response?.data?.message || error.message}`);
      }
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
      setMessage(`✅ Aplikimi u miratua!`);
      if (response.data.username && response.data.password) {
        setMessage(prev => `${prev} Kredencialet: ${response.data.username} / ${response.data.password}`);
      }
      fetchApplications();
    } catch (error) {
      setMessage(`❌ Gabim: ${error.response?.data?.message || "Ndodhi një gabim"}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (type, id) => {
    const reason = prompt("Shkruani arsyen e refuzimit:");
    if (!reason) return;
    
    const token = getToken();
    setActionLoading(`${type}-${id}`);
    try {
      await axios.post(`${API_BASE_URL}/admin/applications/${type}/${id}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("❌ Aplikimi u refuzua");
      fetchApplications();
    } catch (error) {
      setMessage("Gabim gjatë refuzimit");
    } finally {
      setActionLoading(null);
    }
  };

  const applications = activeTab === "restaurants" ? restaurantApps : courierApps;
  const pendingCount = applications.filter(a => a.status === "Pending").length;

  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ marginTop: "80px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Duke ngarkuar aplikimet...</p>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📋 Menaxhimi i Aplikimeve</h2>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchApplications}>
          🔄 Rifresko
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
            🍔 Restorantet ({restaurantApps.filter(a => a.status === "Pending").length} pending / {restaurantApps.length} total)
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === "couriers" ? "active" : ""}`}
            onClick={() => setActiveTab("couriers")}>
            🚚 Courierët ({courierApps.filter(a => a.status === "Pending").length} pending / {courierApps.length} total)
          </button>
        </li>
      </ul>

      {applications.length === 0 ? (
        <div className="alert alert-info text-center py-4">
          <i className="bi bi-inbox fs-1"></i>
          <p className="mb-0 mt-2">Nuk ka aplikime për të shfaqur</p>
        </div>
      ) : (
        <div className="row">
          {applications.map((app) => (
            <div className="col-md-6 col-lg-4 mb-4" key={app.id}>
              <div className="card h-100 shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0">
                      {activeTab === "restaurants" ? app.restaurantName : app.fullName}
                    </h5>
                    <span className={`badge ${
                      app.status === "Pending" ? "bg-warning text-dark" : 
                      app.status === "Approved" ? "bg-success" : "bg-danger"
                    }`}>
                      {app.status === "Pending" ? "⏳ Në pritje" : 
                       app.status === "Approved" ? "✅ I miratuar" : "❌ I refuzuar"}
                    </span>
                  </div>
                  
                  <div className="small text-muted mb-3">
                    <div><i className="bi bi-envelope me-2"></i>{app.email}</div>
                    <div><i className="bi bi-telephone me-2"></i>{app.phone}</div>
                    <div><i className="bi bi-calendar me-2"></i>Aplikuar: {new Date(app.appliedAt).toLocaleString()}</div>
                    
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
                        {app.licensePlate && <div><i className="bi bi-card-text me-2"></i>Targa: {app.licensePlate}</div>}
                        <div><i className="bi bi-map me-2"></i>Zona: {app.workingArea}</div>
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
                          <>⏳ Duke procesuar...</>
                        ) : (
                          <>✓ Mirato</>
                        )}
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm" 
                        onClick={() => handleReject(activeTab === "restaurants" ? "restaurant" : "courier", app.id)}
                        disabled={actionLoading === `${activeTab === "restaurants" ? "restaurant" : "courier"}-${app.id}`}>
                        ✗ Refuzo
                      </button>
                    </div>
                  )}
                  
                  {app.adminNotes && (
                    <div className="mt-3 p-2 bg-light rounded small">
                      <strong>📝 Shënim:</strong> {app.adminNotes}
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