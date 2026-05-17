import React, { useEffect, useState } from "react";

import axios from "axios";
import "./MerchantDashboard.css";

const API_BASE_URL = "http://localhost:5063/api";

const MerchantDashboard = ({ token }) => {

    const [dashboard,setDashboard]=useState(null);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(()=>{
    const fetchDashboard=async()=>{
        try{
            const response=await axios.get(`${API_BASE_URL}/Dashboard/Merchant`,{
                headers:{Authorization: `Bearer ${token}`}});
                setDashboard(response.data);

    }
    catch(err){
      console.error(err);
        console.error("Failed to load dashboard data");
        setError("Failed to load dashboard data");
    }
    finally{
        setLoading(false);
    }
};

if(token){
    fetchDashboard();
}},[token]);

if(loading){
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
        {/* Back to Home button removed for merchant restriction */}
      </div>
    </section>
  );
  }

  if(!dashboard){
    return (
    <section className="merchant-dashboard-page merchant-dashboard-state">
      <div className="merchant-state-card">
        <h4 className="mb-2">No dashboard data yet</h4>
        <p className="mb-3">There is no merchant data available for this account right now.</p>
        {/* Back to Home button removed for merchant restriction */}
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

  const getStatusColor = (status) => {
    const statusLower = String(status || "").toLowerCase();
    if (statusLower === "pending") return "warning";
    if (statusLower === "preparing") return "info";
    if (statusLower === "ready") return "primary";
    if (statusLower === "delivered") return "success";
    if (statusLower === "cancelled") return "danger";
    return "secondary";
  };

  const getStatusBadgeClass = (status) => {
    const color = getStatusColor(status);
    return `badge bg-${color}`;
  };


  const getStatusName=(statusCode)=>{
    const statusMap={
    1:"Pending",
    2:"Accepted",
    3:"Preparing",
    4:"Ready",
    5:"Delivered",
    6:"Cancelled"
    };
    return statusMap[statusCode] || "Unknown";
    };
  const viewOrderDetails = async (orderId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setSelectedOrder(response.data);
    setShowModal(true);
  } catch (err) {
    console.error(err);
    alert("Could not load order details");
  }
};
   return (
    <section className="merchant-dashboard-page">
      <div className="container py-4 py-lg-5">
        <div className="merchant-dash-topbar mb-4">
          {/* Back to Home button removed for merchant restriction */}
             <button 
              className="btn btn-outline-primary"
              onClick={() => {
                window.location.hash = `/merchant/menu/${restaurant.id}`;
              }}
            >
              <i className="bi bi-grid-3x3-gap-fill me-2"></i>
               Manage Menu
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
  <h5 className="merchant-section-title mb-3">Recent Orders (Last 10)</h5>
  {recentOrders.length === 0 ? (
    <p className="text-muted mb-0">No orders yet.</p>
  ) : (
    <div className="accordion merchant-orders-accordion" id="ordersAccordion">
      {recentOrders.map((order) => (
        <div className="accordion-item mb-2" key={order.id}>
          <h2 className="accordion-header">
            <button 
              className="accordion-button collapsed" 
              type="button" 
              data-bs-toggle="collapse" 
              data-bs-target={`#collapse-${order.id}`}
            >
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 w-100 me-3">
                <span><strong>Order #{order.id}</strong></span>
                <span className="merchant-customer-name">{order.customerName || "Customer"}</span>
                <span className="badge text-bg-dark me-2">{formatCurrency(order.shumaTotale)}</span>
                <span className={`badge ${getStatusBadgeClass(getStatusName(order.statusi))}`}>
                  {getStatusName(order.statusi)}
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
                  <button
                className="btn btn-sm btn-outline-dark mt-2"
                onClick={() => viewOrderDetails(order.id)}
                >
                View Full Order Details
                </button>
              
            </div>
            
          </div>
          
        </div>
        
      ))}
      
    </div>
    
  )}
  
        </div>

      {/* 🔥 MODAL PËR DETAJET E POROSISË */}
      {showModal && selectedOrder && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
