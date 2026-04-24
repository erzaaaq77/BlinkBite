import React, { useEffect, useState } from "react";

import axios from "axios";

const API_BASE_URL = "https://localhost:5063/api"; // 5053 porta per backend

const MerchantDashboard = ({token,onBack}) =>{

    const [dashboard,setDashboard]=useState(null);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState("");
    const [orders,setOrders]=useState([]);
    const [ordersLoading,setOrdersLoading]=useState(true);

    useEffect(()=>{
    const fetchDashboard=async()=>{
        try{
            const response=await axios.get(`${API_BASE_URL}/merchant/dashboard`,{
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
    fetchOrders();
}},[token]);

if(loading){
    return (
  <div className="container py-5 text-center">
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
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-outline-secondary" onClick={onBack}>
          <i className="bi bi-arrow-left me-2"></i>Back
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

       <div className="restaurant-menu p-4">
        <h5 className="mb-3">📋 Recent Orders (Last 10)</h5>
        {recentOrders.length === 0 ? (
          <p className="text-muted">No orders yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>

            </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customerName || "-"}</td>
                    <td>€{(order.shumaTotale || 0).toFixed(2)}</td>
                    <td>
                      <span className={getStatusBadgeClass(order.statusi)}>
                        {order.statusi}
                      </span>
                    </td>
                    <td>{new Date(order.dataPorosis).toLocaleString()}</td>
                    <td>
                        <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => window.location.hash = `/order/${order.id}`}
                      >
                        View
                      </button>
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
export default MerchantDashboard;
