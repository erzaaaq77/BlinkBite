import React, { useEffect, useState } from "react";

import axios from "axios";

const API_BASE_URL = "http://localhost:5063/api";

const MerchantDashboard = ({token,onBack}) =>{

    const [dashboard,setDashboard]=useState(null);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState("");
    const [orders,setOrders]=useState([]);
    const [ordersLoading,setOrdersLoading]=useState(true);
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
        console.error("Failed to load dashboard data");
        setError("Failed to load dashboard data");
    }
    finally{
        setLoading(false);
    }
};

const fetchOrders=async() =>{
try{
    const response = await axios.get(`${API_BASE_URL}/orders/merchant`,{
        headers : {Authorization: `Bearer ${token}`}});
        setOrders(Array.isArray(response.data)? response.data: []);
    }
    catch(err){
        console.error("Failed to load orders data");
        setError("Failed to load orders data");
    }
    finally{
        setOrdersLoading(false);
    }
};

if(token){
    fetchDashboard();
    //fetchOrders();
}},[token]);

if(loading){
   return (
    <div className="container py-5 text-center">
      <div className="alert alert-info">
        <h4>Debug Info:</h4>
        <p>Token: {token ? "Present (first 20 chars: " + token.substring(0, 20) + "...)" : "❌ Missing"}</p>
        <p>Loading state: true</p>
        <p>Waiting for API response...</p>
      </div>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3">Loading merchant dashboard...</p>
    </div>
  );
}

if (error) {
    return (
    <div className="container py-5">
      <div className="alert alert-danger">
        <h4>Error Occurred</h4>
        <p>Error message: {error}</p>
        <p>Token present: {token ? "Yes" : "No"}</p>
        <p>API URL: {API_BASE_URL}/Dashboard/Merchant</p>
      </div>
      <button className="btn btn-outline-secondary" onClick={onBack}>
        ← Back to Home
      </button>
    </div>
  );
  }

  if(!dashboard){
    return (
    <div className="container py-5">
      <div className="alert alert-warning">
        <h4> No Dashboard Data</h4>
        <p>Token: {token ? " Present" : " Missing"}</p>
        <p>Dashboard is null or undefined</p>
        <p>API URL: {API_BASE_URL}/Dashboard/Merchant</p>
        <button 
          className="btn btn-primary mt-3"
          onClick={async () => {
            const res = await fetch(`${API_BASE_URL}/Dashboard/Merchant`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const text = await res.text();
            alert("API Response: " + text.substring(0, 500));
          }}
        >
          Test API Manually
        </button>
      </div>
      <button className="btn btn-outline-secondary" onClick={onBack}>
        ← Back to Home
      </button>
    </div>
  );
  }
  const restaurant = dashboard?.restaurant || {};
  const stats = dashboard?.orders || {};
  const revenue = dashboard?.revenue || {};
  const recentOrders = dashboard?.recentOrders || [];
  const reviews = dashboard?.reviews || {};

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
    alert("Could not load order details");
  }
};
   return (
    <section className="container py-4">
      {/* Back button */}
      <div className="mb-4">
        <button className="btn btn-outline-secondary" onClick={onBack}>
          <i className="bi bi-arrow-left me-2"></i>Back to Home
        </button>
      </div>

       <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🏪 Merchant Dashboard</h2>
        <div className="text-end">
          <span className="badge bg-success fs-6 p-2">
            {restaurant.statusi || "Active"}
          </span>
        </div>
      </div>
       <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="restaurant-menu p-4">
            <h5 className="mb-3">📋 Restaurant Information</h5>
            <p><strong>Name:</strong> {restaurant.emertimi || restaurant.name || "-"}</p>
            <p><strong>Rating:</strong> ⭐ {restaurant.rating || "0"} / 5</p>
            <p><strong>Total Reviews:</strong> {reviews.total || 0}</p>
            <p><strong>Average Rating:</strong> ⭐ {(reviews.average || restaurant.rating || 0).toFixed(1)}</p>
          </div>
        </div>

         <div className="col-md-6">
          <div className="restaurant-menu p-4">
            <h5 className="mb-3">💰 Revenue Summary</h5>
            <table className="table table-sm">
              <tbody>
                <tr>
                  <td><strong>Today:</strong></td>
                  <td className="text-end">€{(revenue.today || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td><strong>This Week:</strong></td>
                  <td className="text-end">€{(revenue.thisWeek || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td><strong>This Month:</strong></td>
                  <td className="text-end">€{(revenue.thisMonth || 0).toFixed(2)}</td>
                </tr>
                <tr className="table-active">
                  <td><strong>Total:</strong></td>
                  <td className="text-end"><strong>€{(revenue.total || 0).toFixed(2)}</strong></td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>     

     <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="restaurant-menu p-4">
            <h5 className="mb-3">📦 Order Statistics</h5>
            <div className="row text-center">
              <div className="col-3">
                <div className="p-3 bg-light rounded">
                  <h3 className="mb-0">{stats.total || 0}</h3>
                  <small className="text-muted">Total Orders</small>
                </div>
              </div>
              <div className="col-3">
                <div className="p-3 bg-warning bg-opacity-10 rounded">
                  <h3 className="mb-0">{stats.pending || 0}</h3>
                  <small className="text-muted">Pending</small>
                </div>
              </div>
              <div className="col-3">

                <div className="p-3 bg-info bg-opacity-10 rounded">
                  <h3 className="mb-0">{stats.preparing || 0}</h3>
                  <small className="text-muted">Preparing</small>
                </div>
              </div>
              <div className="col-3">
                <div className="p-3 bg-success bg-opacity-10 rounded">
                  <h3 className="mb-0">{stats.delivered || 0}</h3>
                  <small className="text-muted">Delivered</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
  <h5 className="mb-3">📋 Recent Orders (Last 10)</h5>
  {recentOrders.length === 0 ? (
    <p className="text-muted">No orders yet.</p>
  ) : (
    <div className="accordion" id="ordersAccordion">
      {recentOrders.map((order, index) => (
        <div className="accordion-item mb-2" key={order.id}>
          <h2 className="accordion-header">
            <button 
              className="accordion-button collapsed" 
              type="button" 
              data-bs-toggle="collapse" 
              data-bs-target={`#collapse-${order.id}`}
            >
              <div className="d-flex justify-content-between w-100 me-3">
                <span><strong>Order #{order.id}</strong></span>
                <span className="mx-3">{order.customerName || "Customer"}</span>
                <span className="badge bg-primary me-2">€{order.shumaTotale?.toFixed(2)}</span>
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
                <table className="table table-sm">
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
                      <td><strong>€{order.shumaTotale?.toFixed(2)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
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
                className="btn btn-sm btn-outline-primary mt-2"
                onClick={() => viewOrderDetails(order.id)}
                >
                📋 View Full Order Details
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
            <div className="modal-content">
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
                <table className="table table-sm table-bordered">
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
                      <td><strong>€{selectedOrder.shumaTotale?.toFixed(2)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
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
    </section>
    
    );
    

};

export default MerchantDashboard;
