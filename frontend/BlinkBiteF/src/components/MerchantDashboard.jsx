import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import "./MerchantDashboard.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5063/api").replace(/\/+$/, "");

const ORDER_STATUS_LABELS = {
  1: "Pending",
  2: "Accepted",
  3: "Preparing",
  4: "Ready",
  5: "Delivered",
  6: "Cancelled",
};

const ORDER_STATUS_CODES = {
  pending: 1,
  accepted: 2,
  preparing: 3,
  ready: 4,
  delivered: 5,
  cancelled: 6,
};

const MERCHANT_ORDERS_BATCH_SIZE = 8;

const MerchantDashboard = ({ token, currentUserRole = "" }) => {
  const normalizedRole = String(currentUserRole || "").trim().toLowerCase();
  const isBranchManagerRole = normalizedRole === "branchmanager";
  const [restaurantBranches, setRestaurantBranches] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({
    emertimi: "",
    pershkrimi: "",
    renditja: 0
  });
  const [requestData, setRequestData] = useState({
    branchId: null,
    newAddress: "",
    newCity: "",
    newZone: "",
    newDeliveryFee: "",
    reason: ""
  });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderLocationFilter, setOrderLocationFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSort, setOrderSort] = useState("newest");
  const [showActionableOnly, setShowActionableOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusActionOrderId, setStatusActionOrderId] = useState(null);
  const [statusActionMessage, setStatusActionMessage] = useState("");
  const [statusActionError, setStatusActionError] = useState(false);
  const [orderDetailsLoadingId, setOrderDetailsLoadingId] = useState(null);
  const [visibleOrdersCount, setVisibleOrdersCount] = useState(MERCHANT_ORDERS_BATCH_SIZE);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoMessage, setLogoMessage] = useState("");
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [addingBranch, setAddingBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({
    address: "",
    city: "Prishtinë",
    zone: "",
    deliveryFee: 0,
    createManager: false,
    managerName: "",
    managerEmail: ""
  });
  
  const restaurant = dashboard?.restaurant || {};

  const normalizeStatusLabel = (statusValue) => {
    if (typeof statusValue === "number") {
      return ORDER_STATUS_LABELS[statusValue] || `Status ${statusValue}`;
    }
    const normalized = String(statusValue || "Pending").trim().toLowerCase();
    if (normalized === "accepted") return "Accepted";
    if (normalized === "preparing") return "Preparing";
    if (normalized === "ready") return "Ready";
    if (normalized === "delivered") return "Delivered";
    if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
    if (normalized === "pending") return "Pending";
    return String(statusValue || "Pending");
  };

  const fetchDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) {
        setDashboard(null);
        setLoading(false);
        setError("Your session has expired. Please sign in again.");
        return;
      }

      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/Dashboard/Merchant`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboard(response.data || null);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  const fetchCategories = async () => {
    if (!restaurant?.id) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/MenuCategories/by-restaurant/${restaurant.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.emertimi.trim()) {
      alert("Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        await axios.put(`${API_BASE_URL}/MenuCategories/${editingCategory.id}`, {
          ...editingCategory,
          emertimi: categoryForm.emertimi,
          pershkrimi: categoryForm.pershkrimi,
          renditja: categoryForm.renditja,
          restaurantId: restaurant.id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Category updated successfully");
      } else {
        await axios.post(`${API_BASE_URL}/MenuCategories`, {
          emertimi: categoryForm.emertimi,
          pershkrimi: categoryForm.pershkrimi,
          renditja: categoryForm.renditja,
          restaurantId: restaurant.id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Category created successfully");
      }
      
      setShowAddCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ emertimi: "", pershkrimi: "", renditja: 0 });
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save category");
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Are you sure you want to delete category "${category.emertimi}"? Items in this category will also be deleted.`)) {
      return;
    }
    
    try {
      await axios.delete(`${API_BASE_URL}/MenuCategories/${category.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to delete category");
    }
  };

  const handleAddBranch = async () => {
    if (!newBranch.address.trim()) {
      alert("Please enter branch address");
      return;
    }
    
    setAddingBranch(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/Branch/create`, {
        address: newBranch.address,
        city: newBranch.city,
        zone: newBranch.zone,
        deliveryFee: newBranch.deliveryFee,
        createBranchManager: newBranch.createManager,
        managerName: newBranch.managerName,
        managerEmail: newBranch.managerEmail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(response.data.message);
      setShowAddBranchModal(false);
      setNewBranch({
        address: "", city: "Prishtinë", zone: "", deliveryFee: 0,
        createManager: false, managerName: "", managerEmail: ""
      });
      fetchDashboard();
      fetchBranches();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to add branch");
    } finally {
      setAddingBranch(false);
    }
  };

  const submitEditRequest = async () => {
    try {
      await axios.post(`${API_BASE_URL}/BranchRequest/request-edit`, {
        branchId: requestData.branchId,
        newAddress: requestData.newAddress,
        newCity: requestData.newCity,
        newZone: requestData.newZone,
        newDeliveryFee: parseFloat(requestData.newDeliveryFee),
        reason: requestData.reason,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowEditModal(false);
      setSelectedBranch(null);
      setRequestData({
        branchId: null,
        newAddress: "",
        newCity: "",
        newZone: "",
        newDeliveryFee: "",
        reason: ""
      });
      toast.success("Edit request submitted for admin approval");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send request");
    }
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setLogoMessage("❌ Please select an image (JPG, PNG, GIF)");
      setTimeout(() => setLogoMessage(""), 3000);
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setLogoMessage("❌ Logo must be smaller than 2MB");
      setTimeout(() => setLogoMessage(""), 3000);
      return;
    }
    
    setUploadingLogo(true);
    setLogoMessage("");
    
    const formData = new FormData();
    formData.append("logo", file);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/Dashboard/Merchant/upload-logo?restaurantId=${dashboard?.restaurant?.id}`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          } 
        }
      );
      setLogoMessage("✅ Logo uploaded successfully!");
      setTimeout(() => setLogoMessage(""), 3000);
      fetchDashboard({ silent: true });
    } catch (error) {
      console.error(error);
      setLogoMessage(error.response?.data?.message || "❌ Error uploading logo");
      setTimeout(() => setLogoMessage(""), 3000);
    } finally {
      setUploadingLogo(false);
    }
  };

  const fetchBranches = async () => {
    const restaurantId = dashboard?.restaurant?.id;
    if (!restaurantId) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/RestaurantAddresses/by-restaurant/${restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRestaurantBranches(response.data);
    } catch (err) {
      console.error("Failed to fetch branches", err);
    }
  };

  const openEditBranchModal = (branch) => {
    setSelectedBranch(branch);
    setRequestData({
      branchId: branch.id ?? branch.Id ?? null,
      newAddress: branch.adresa || branch.address || "",
      newCity: branch.qyteti || branch.city || "",
      newZone: branch.zona || branch.zone || "",
      newDeliveryFee: String(branch.tarifaDorezimit ?? branch.deliveryFee ?? ""),
      reason: ""
    });
    setShowEditModal(true);
  };

  const openDeleteBranchModal = (branch) => {
    setSelectedBranch(branch);
    setShowDeleteModal(true);
  };

  const submitDeleteRequest = async () => {
    if (!selectedBranch) {
      toast.error("No branch selected for deletion request.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/BranchRequest/request-delete`, {
        branchId: selectedBranch.id ?? selectedBranch.Id,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Delete request sent to admin for approval.");
      setShowDeleteModal(false);
      setSelectedBranch(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send delete request.");
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (restaurant?.id) {
      fetchCategories();
      fetchBranches();
    }
  }, [restaurant?.id, token]);

  useEffect(() => {
    if (!token) return undefined;
    const intervalId = window.setInterval(() => {
      fetchDashboard({ silent: true });
    }, 25000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchDashboard, token]);

  useEffect(() => {
    setVisibleOrdersCount(MERCHANT_ORDERS_BATCH_SIZE);
  }, [orderStatusFilter, orderLocationFilter, orderSearch, orderSort, showActionableOnly]);

  const getStatusColor = (status) => {
    const statusLower = String(status || "").toLowerCase();
    if (statusLower === "pending") return "warning";
    if (statusLower === "preparing") return "info";
    if (statusLower === "ready") return "primary";
    if (statusLower === "delivered") return "success";
    if (statusLower === "cancelled") return "danger";
    if (statusLower === "accepted") return "secondary";
    return "secondary";
  };

  const getStatusBadgeClass = (status) => {
    const color = getStatusColor(status);
    return `bg-${color}`;
  };

  const getStatusName = (statusCode) => {
    return ORDER_STATUS_LABELS[statusCode] || "Unknown";
  };

  const getOrderActions = (statusName) => {
    const key = String(statusName || "").toLowerCase();
    if (key === "pending") {
      return [{ nextStatus: "Accepted", buttonClass: "btn btn-sm btn-primary", label: "Accept" }];
    }
    if (key === "accepted") {
      return [{ nextStatus: "Preparing", buttonClass: "btn btn-sm btn-warning", label: "Start Preparing" }];
    }
    if (key === "preparing") {
      return [{ nextStatus: "Ready", buttonClass: "btn btn-sm btn-success", label: "Mark Ready" }];
    }
    return [];
  };

  const handleStatusUpdate = async (order, nextStatus) => {
    const orderId = Number(order?.id);
    if (!Number.isFinite(orderId) || !nextStatus) return;

    const normalizedNextStatus = normalizeStatusLabel(nextStatus);
    const statusCode = ORDER_STATUS_CODES[String(normalizedNextStatus).toLowerCase()] || null;

    setStatusActionOrderId(orderId);
    setStatusActionMessage("");
    setStatusActionError(false);

    const payloadVariants = [
      { status: normalizedNextStatus },
      { Status: normalizedNextStatus },
      { newStatus: normalizedNextStatus },
      { NewStatus: normalizedNextStatus },
      ...(statusCode ? [{ status: statusCode }, { Status: statusCode }, { statusi: statusCode }, { Statusi: statusCode }] : []),
      ...(statusCode ? [{ status: normalizedNextStatus, statusCode }] : []),
    ];

    const explicitTransitionCandidates = [];
    if (normalizedNextStatus === "Accepted") {
      explicitTransitionCandidates.push({ method: "post", url: `${API_BASE_URL}/orders/${orderId}/accept`, payload: "" });
    }
    if (normalizedNextStatus === "Preparing") {
      explicitTransitionCandidates.push({ method: "post", url: `${API_BASE_URL}/orders/${orderId}/prepare`, payload: "" });
    }
    if (normalizedNextStatus === "Ready") {
      explicitTransitionCandidates.push({ method: "post", url: `${API_BASE_URL}/orders/${orderId}/ready`, payload: "" });
    }

    const genericCandidates = [
      { method: "put", url: `${API_BASE_URL}/orders/${orderId}/status` },
      { method: "patch", url: `${API_BASE_URL}/orders/${orderId}/status` },
      { method: "post", url: `${API_BASE_URL}/orders/${orderId}/status` },
      { method: "put", url: `${API_BASE_URL}/orders/${orderId}/update-status` },
      { method: "patch", url: `${API_BASE_URL}/orders/${orderId}/update-status` },
      { method: "post", url: `${API_BASE_URL}/orders/${orderId}/update-status` },
      { method: "put", url: `${API_BASE_URL}/orders/update-status/${orderId}` },
      { method: "patch", url: `${API_BASE_URL}/orders/update-status/${orderId}` },
      { method: "post", url: `${API_BASE_URL}/orders/update-status/${orderId}` },
    ];

    const requestCandidates = [...explicitTransitionCandidates, ...genericCandidates];

    try {
      let updated = false;

      for (const candidate of requestCandidates) {
        const candidatePayloads = candidate.payload !== undefined ? [candidate.payload] : payloadVariants;

        for (const payload of candidatePayloads) {
          const config = {
            method: candidate.method,
            url: candidate.url,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            data: payload,
          };

          try {
            const response = await axios(config);
            if (response.status >= 200 && response.status < 300) {
              updated = true;
              break;
            }
          } catch (requestErr) {
            const status = requestErr?.response?.status;
            if (status === 401 || status === 403) {
              setStatusActionError(true);
              setStatusActionMessage("You are not authorized to change this order status.");
              setStatusActionOrderId(null);
              return;
            }
          }
        }

        if (updated) break;
      }

      if (!updated) {
        setStatusActionError(true);
        setStatusActionMessage("Order status endpoint was not found. Please check backend routes.");
        return;
      }

      setStatusActionError(false);
      setStatusActionMessage(`Order #${orderId} moved to ${normalizedNextStatus}.`);
      await fetchDashboard({ silent: true });
    } catch (err) {
      console.error(err);
      setStatusActionError(true);
      setStatusActionMessage("Could not update order status right now.");
    } finally {
      setStatusActionOrderId(null);
    }
  };

  const viewOrderDetails = async (orderId) => {
    setOrderDetailsLoadingId(orderId);
    try {
      const response = await axios.get(`${API_BASE_URL}/Orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder(response.data);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      setStatusActionError(true);
      setStatusActionMessage("Could not load order details.");
    } finally {
      setOrderDetailsLoadingId(null);
    }
  };

  if (loading) {
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
          <button type="button" className="btn btn-outline-dark" onClick={() => fetchDashboard()}>
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="merchant-dashboard-page merchant-dashboard-state">
        <div className="merchant-state-card">
          <h4 className="mb-2">No dashboard data yet</h4>
          <p className="mb-3">There is no merchant data available for this account right now.</p>
          <button type="button" className="btn btn-outline-dark" onClick={() => fetchDashboard()}>
            Refresh dashboard
          </button>
        </div>
      </section>
    );
  }

  const addresses = Array.isArray(dashboard?.addresses) ? dashboard.addresses : [];
  const primaryAddressId = dashboard?.primaryAddressId ?? addresses.find((entry) => entry?.isMain)?.id ?? addresses[0]?.id ?? null;
  const stats = dashboard?.orders || {};
  const revenue = dashboard?.revenue || {};
  const recentOrders = dashboard?.recentOrders || [];
  const reviews = dashboard?.reviews || {};
  const restaurantName = restaurant.emertimi || restaurant.name || "Restaurant";

  const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;

  return (
    <section className="merchant-dashboard-page">
      <div className="container py-4 py-lg-5">
        {/* Top Bar */}
        <div className="merchant-dash-topbar mb-4">
          <button
            className="btn btn-outline-primary"
            onClick={() => {
              const suffix = isBranchManagerRole && primaryAddressId
                ? `?branchId=${encodeURIComponent(String(primaryAddressId))}`
                : "";
              window.location.hash = `/merchant/menu/${restaurant.id}${suffix}`;
            }}
          >
            <i className="bi bi-grid-3x3-gap-fill me-2"></i>
            {isBranchManagerRole ? "Manage Menu" : "Manage Menu (All Branches)"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary merchant-refresh-btn"
            disabled={refreshing}
            onClick={() => fetchDashboard({ silent: true })}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <div className="merchant-status-chip">
            <span className="merchant-status-dot"></span>
            {restaurant.statusi || "Active"}
          </div>
        </div>

        {/* Hero Section */}
        <div className="merchant-dash-hero mb-4 mb-lg-5">
          <div>
            <p className="merchant-eyebrow mb-2">Merchant Control Center</p>
            <h2 className="merchant-dash-title mb-2">{restaurantName}</h2>
            <p className="merchant-dash-subtitle mb-0">
              Track revenue, monitor live order flow, and keep your restaurant operations in sync.
            </p>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="merchant-card mb-4">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            <div className="text-center">
              {restaurant.logo ? (
                <img 
                  src={`http://localhost:5063${restaurant.logo}`}
                  alt="Restaurant Logo" 
                  style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "12px", border: "1px solid #ddd" }} 
                />
              ) : (
                <div style={{ width: "100px", height: "100px", backgroundColor: "#f0f0f0", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #ccc" }}>
                  <span className="text-muted" style={{ fontSize: "12px" }}>No Logo</span>
                </div>
              )}
            </div>
            <div>
              <label className={`btn btn-outline-primary btn-sm ${uploadingLogo ? 'disabled' : ''}`}>
                {uploadingLogo ? "Uploading..." : "Change Logo"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) handleLogoUpload(e.target.files[0]); }} disabled={uploadingLogo} />
              </label>
              {logoMessage && <div className={`mt-2 small ${logoMessage.includes("✅") ? "text-success" : "text-danger"}`}>{logoMessage}</div>}
              <p className="small text-muted mt-2 mb-0">Allowed formats: JPG, PNG, GIF (max 2MB)</p>
            </div>
          </div>
        </div>

        {/* Growth Indicator */}
        <div className="merchant-card mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">Monthly Growth</h5>
              <small className="text-muted">Compared to previous month</small>
            </div>
            <div className={`text-center ${dashboard?.revenue?.growthPercentage >= 0 ? 'text-success' : 'text-danger'}`}>
              <h2 className="mb-0">
                {dashboard?.revenue?.growthPercentage >= 0 ? '↑' : '↓'} 
                {Math.abs(dashboard?.revenue?.growthPercentage || 0).toFixed(1)}%
              </h2>
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        {dashboard?.revenueTrend && dashboard.revenueTrend.length > 0 && (
          <div className="merchant-card mb-4">
            <h5 className="merchant-section-title mb-3">📈 Revenue Trend (Last 7 Days)</h5>
            <div className="revenue-trend">
              {dashboard.revenueTrend.map((day, idx) => {
                const maxRevenue = Math.max(...dashboard.revenueTrend.map(d => d.revenue), 1);
                return (
                  <div key={idx} className="trend-bar-container">
                    <div className="trend-bar" style={{ height: `${Math.min(100, (day.revenue / maxRevenue) * 100)}%` }}>
                      <span className="trend-value">€{day.revenue.toFixed(0)}</span>
                    </div>
                    <span className="trend-label">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Products Section */}
        <div className="merchant-card mb-4">
          <h5 className="merchant-section-title mb-3">🏆 Top Selling Products</h5>
          {isBranchManagerRole ? (
            <div className="row">
              {dashboard?.branchTopProducts?.map((product, idx) => (
                <div className="col-md-4 mb-3" key={product.menuItemId}>
                  <div className="card h-100 text-center p-3">
                    <div className="display-4 mb-2">🏆</div>
                    <h6 className="mb-1">{product.name}</h6>
                    <p className="text-muted small mb-0">Sold: {product.totalQuantity} items</p>
                    <p className="text-success fw-bold">€{product.totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {(!dashboard?.branchTopProducts || dashboard.branchTopProducts.length === 0) && (
                <p className="text-muted">No sales data available yet.</p>
              )}
            </div>
          ) : (
            <div className="accordion" id="topProductsAccordion">
              {dashboard?.allBranchesTopProducts && Object.entries(dashboard.allBranchesTopProducts).map(([branchId, products], idx) => {
                const branchName = addresses.find(a => a.id == branchId)?.adresa || `Branch ${branchId}`;
                return (
                  <div className="accordion-item" key={branchId}>
                    <h2 className="accordion-header">
                      <button className={`accordion-button ${idx !== 0 ? 'collapsed' : ''}`} type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${branchId}`}>
                        {branchName}
                      </button>
                    </h2>
                    <div id={`collapse-${branchId}`} className={`accordion-collapse collapse ${idx === 0 ? 'show' : ''}`}>
                      <div className="accordion-body">
                        <div className="row">
                          {products?.map((product) => (
                            <div className="col-md-4 mb-2" key={product.menuItemId}>
                              <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                                <span>{product.name}</span>
                                <div className="text-end">
                                  <small className="text-muted d-block">{product.totalQuantity} sold</small>
                                  <strong className="text-success">€{product.totalRevenue.toFixed(2)}</strong>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Branch Comparison (Only for Main Merchant) */}
        {!isBranchManagerRole && dashboard?.branchComparison && (
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="merchant-card text-center bg-success text-white">
                <h6>🏆 Best Performing Branch</h6>
                <h4>{dashboard.branchComparison.bestBranch?.branchName}</h4>
                <p className="mb-0">€{dashboard.branchComparison.bestBranch?.revenue?.toFixed(2)} revenue</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="merchant-card text-center bg-warning">
                <h6>📉 Needs Improvement</h6>
                <h4>{dashboard.branchComparison.worstBranch?.branchName}</h4>
                <p className="mb-0">€{dashboard.branchComparison.worstBranch?.revenue?.toFixed(2)} revenue</p>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant Snapshot */}
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
                <div className="merchant-revenue-row"><span>Today</span><strong>{formatCurrency(revenue.today)}</strong></div>
                <div className="merchant-revenue-row"><span>This Week</span><strong>{formatCurrency(revenue.thisWeek)}</strong></div>
                <div className="merchant-revenue-row"><span>This Month</span><strong>{formatCurrency(revenue.thisMonth)}</strong></div>
                <div className="merchant-revenue-row merchant-revenue-total"><span>Total</span><strong>{formatCurrency(revenue.total)}</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Management - Only for Main Merchant */}
        {!isBranchManagerRole && (
          <div className="merchant-card mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="merchant-section-title mb-0">📂 Menu Categories</h5>
              <button className="btn btn-sm btn-primary" onClick={() => { setEditingCategory(null); setCategoryForm({ emertimi: "", pershkrimi: "", renditja: categories.length + 1 }); setShowAddCategoryModal(true); }}>
                + Add Category
              </button>
            </div>
            {categories.length === 0 ? (
              <p className="text-muted">No categories yet. Create your first category to start adding menu items.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead><tr><th>Order</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
                  <tbody>
                    {categories.sort((a,b) => a.renditja - b.renditja).map((cat) => (
                      <tr key={cat.id}>
                        <td style={{ width: "80px" }}>{cat.renditja}</td>
                        <td><strong>{cat.emertimi}</strong></td>
                        <td>{cat.pershkrimi || "-"}</td>
                        <td style={{ width: "120px" }}>
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => { setEditingCategory(cat); setCategoryForm({ emertimi: cat.emertimi, pershkrimi: cat.pershkrimi || "", renditja: cat.renditja }); setShowAddCategoryModal(true); }}>Edit</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCategory(cat)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-3">
              <button className="btn btn-outline-primary" onClick={() => { window.location.hash = `/merchant/menu/${restaurant.id}`; }}>🍽️ Manage Menu Items</button>
            </div>
          </div>
        )}

        {/* Branches Section */}
        {addresses.length > 0 && (
          <div className="merchant-card mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="merchant-section-title mb-0">🏪 Locations</h5>
              {!isBranchManagerRole && (
                <button className="btn btn-sm btn-primary" onClick={() => setShowAddBranchModal(true)}>+ Add Branch</button>
              )}
            </div>
            <div className="row g-3">
              {addresses.map((address) => (
                <div className="col-md-6 col-xl-4" key={address.id}>
                  <div className="merchant-info-cell h-100">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <span className="merchant-label">{address.adresa}</span>
                        <p className="merchant-value mb-0 small text-muted">{[address.qyteti, address.zona].filter(Boolean).join(", ") || "Location"}</p>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        {address.isMain && <span className="badge text-bg-warning">Main</span>}
                        {!address.isActive && <span className="badge text-bg-secondary">Inactive</span>}
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-primary flex-grow-1" onClick={() => { window.location.hash = `/merchant/menu/${restaurant.id}?branchId=${encodeURIComponent(String(address.id))}`; }}>Manage menu</button>
                      {!isBranchManagerRole && (
                        <>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => openEditBranchModal(address)} title="Request Edit">✏️</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => openDeleteBranchModal(address)} title="Request Delete">🗑️</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Performance */}
        <div className="merchant-card mb-4">
          <h5 className="merchant-section-title mb-3">Order Performance</h5>
          <div className="row g-3">
            <div className="col-6 col-md-3"><div className="merchant-stat-item merchant-stat-total"><p className="merchant-stat-value">{stats.total || 0}</p><small>Total Orders</small></div></div>
            <div className="col-6 col-md-3"><div className="merchant-stat-item merchant-stat-pending"><p className="merchant-stat-value">{stats.pending || 0}</p><small>Pending</small></div></div>
            <div className="col-6 col-md-3"><div className="merchant-stat-item merchant-stat-accepted"><p className="merchant-stat-value">{stats.accepted || 0}</p><small>Accepted</small></div></div>
            <div className="col-6 col-md-3"><div className="merchant-stat-item merchant-stat-preparing"><p className="merchant-stat-value">{stats.preparing || 0}</p><small>Preparing</small></div></div>
            <div className="col-6 col-md-3"><div className="merchant-stat-item merchant-stat-ready"><p className="merchant-stat-value">{stats.ready || 0}</p><small>Ready</small></div></div>
            <div className="col-6 col-md-3"><div className="merchant-stat-item merchant-stat-delivered"><p className="merchant-stat-value">{stats.delivered || 0}</p><small>Delivered</small></div></div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="merchant-card merchant-orders-card p-4">
          <h5 className="merchant-section-title mb-3">Recent Orders</h5>
          {statusActionMessage && (<div className={`alert py-2 mb-3 ${statusActionError ? "alert-danger" : "alert-success"}`}>{statusActionMessage}</div>)}
          {recentOrders.length === 0 ? (<p className="text-muted">No orders yet.</p>) : (
            <div className="accordion" id="ordersAccordion">
              {recentOrders.slice(0, 5).map((order) => (
                <div className="accordion-item mb-2" key={order.id}>
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${order.id}`}>
                      <div className="d-flex justify-content-between align-items-center w-100 me-3">
                        <span><strong>Order #{order.id}</strong></span>
                        <span className="badge bg-secondary">{getStatusName(order.statusi)}</span>
                        <span><strong>{formatCurrency(order.shumaTotale)}</strong></span>
                      </div>
                    </button>
                  </h2>
                  <div id={`collapse-${order.id}`} className="accordion-collapse collapse">
                    <div className="accordion-body">
                      <p><strong>Customer:</strong> {order.customerName}</p>
                      <p><strong>Date:</strong> {new Date(order.dataPorosis).toLocaleString()}</p>
                      <p><strong>Branch:</strong> {order.branchName}</p>
                      <div className="merchant-order-actions mt-3">
                        <button className="btn btn-sm btn-outline-dark" onClick={() => viewOrderDetails(order.id)}>View Details</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddBranchModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content"><div className="modal-header"><h5>Add New Branch</h5><button className="btn-close" onClick={() => setShowAddBranchModal(false)}></button></div>
          <div className="modal-body">
            <input type="text" className="form-control mb-2" placeholder="Address" value={newBranch.address} onChange={(e) => setNewBranch({...newBranch, address: e.target.value})} />
            <select className="form-select mb-2" value={newBranch.city} onChange={(e) => setNewBranch({...newBranch, city: e.target.value})}><option>Prishtinë</option><option>Prizren</option><option>Pejë</option><option>Gjakovë</option><option>Ferizaj</option><option>Gjilan</option><option>Mitrovicë</option></select>
            <input type="text" className="form-control mb-2" placeholder="Zone" value={newBranch.zone} onChange={(e) => setNewBranch({...newBranch, zone: e.target.value})} />
            <input type="number" className="form-control mb-2" placeholder="Delivery Fee" value={newBranch.deliveryFee} onChange={(e) => setNewBranch({...newBranch, deliveryFee: parseFloat(e.target.value)})} />
            <div className="form-check mb-2"><input type="checkbox" className="form-check-input" checked={newBranch.createManager} onChange={(e) => setNewBranch({...newBranch, createManager: e.target.checked})} /><label>Create Branch Manager account</label></div>
            {newBranch.createManager && (<><input type="text" className="form-control mb-2" placeholder="Manager Name" value={newBranch.managerName} onChange={(e) => setNewBranch({...newBranch, managerName: e.target.value})} /><input type="email" className="form-control mb-2" placeholder="Manager Email" value={newBranch.managerEmail} onChange={(e) => setNewBranch({...newBranch, managerEmail: e.target.value})} /></>)}
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowAddBranchModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAddBranch} disabled={addingBranch}>{addingBranch ? "Creating..." : "Create Branch"}</button></div></div></div>
        </div>
      )}

      {showAddCategoryModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content"><div className="modal-header"><h5>{editingCategory ? "Edit Category" : "Add Category"}</h5><button className="btn-close" onClick={() => setShowAddCategoryModal(false)}></button></div>
          <div className="modal-body">
            <input type="text" className="form-control mb-2" placeholder="Category Name" value={categoryForm.emertimi} onChange={(e) => setCategoryForm({...categoryForm, emertimi: e.target.value})} />
            <textarea className="form-control mb-2" placeholder="Description" rows="2" value={categoryForm.pershkrimi} onChange={(e) => setCategoryForm({...categoryForm, pershkrimi: e.target.value})} />
            <input type="number" className="form-control mb-2" placeholder="Display Order" value={categoryForm.renditja} onChange={(e) => setCategoryForm({...categoryForm, renditja: parseInt(e.target.value) || 0})} />
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowAddCategoryModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSaveCategory}>Save Category</button></div></div></div>
        </div>
      )}

      {showEditModal && selectedBranch && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content"><div className="modal-header"><h5>Request Branch Edit</h5><button className="btn-close" onClick={() => setShowEditModal(false)}></button></div>
          <div className="modal-body">
            <input type="text" className="form-control mb-2" placeholder="Address" value={requestData.newAddress} onChange={(e) => setRequestData({...requestData, newAddress: e.target.value})} />
            <input type="text" className="form-control mb-2" placeholder="City" value={requestData.newCity} onChange={(e) => setRequestData({...requestData, newCity: e.target.value})} />
            <input type="text" className="form-control mb-2" placeholder="Zone" value={requestData.newZone} onChange={(e) => setRequestData({...requestData, newZone: e.target.value})} />
            <input type="text" className="form-control mb-2" placeholder="Delivery Fee" value={requestData.newDeliveryFee} onChange={(e) => setRequestData({...requestData, newDeliveryFee: e.target.value})} />
            <textarea className="form-control mb-2" placeholder="Reason" rows="3" value={requestData.reason} onChange={(e) => setRequestData({...requestData, reason: e.target.value})} />
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button><button className="btn btn-primary" onClick={submitEditRequest}>Send Request</button></div></div></div>
        </div>
      )}

      {showDeleteModal && selectedBranch && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content"><div className="modal-header"><h5>Request Branch Delete</h5><button className="btn-close" onClick={() => setShowDeleteModal(false)}></button></div>
          <div className="modal-body"><p>Are you sure you want to request deletion for branch <strong>{selectedBranch.adresa || selectedBranch.address}</strong>?</p><p className="small text-muted">This will send a delete request to admin for review.</p></div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button><button className="btn btn-danger" onClick={submitDeleteRequest}>Send Delete Request</button></div></div></div>
        </div>
      )}

      {showModal && selectedOrder && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg"><div className="modal-content"><div className="modal-header"><h5>Order #{selectedOrder.id} Details</h5><button className="btn-close" onClick={() => setShowModal(false)}></button></div>
          <div className="modal-body">
            <p><strong>Customer:</strong> {selectedOrder.user?.userName}</p><p><strong>Date:</strong> {new Date(selectedOrder.dataPorosis).toLocaleString()}</p>
            <p><strong>Status:</strong> {getStatusName(selectedOrder.statusi)}</p><p><strong>Delivery Address:</strong> {selectedOrder.adresaDorezimit}</p>
            {selectedOrder.shenimet && <p><strong>Notes:</strong> {selectedOrder.shenimet}</p>}
            <h6>Items:</h6>
            <table className="table table-sm"><tbody>
              {selectedOrder.orderItems?.map((item, idx) => (<tr key={idx}><td>{item.menuItem?.emertimi}</td><td>x{item.sasia}</td><td>€{(item.cmimi * item.sasia).toFixed(2)}</td></tr>))}
            </tbody></table>
            <h5>Total: {formatCurrency(selectedOrder.shumaTotale)}</h5>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button></div></div></div>
        </div>
      )}
    </section>
  );
};

export default MerchantDashboard;