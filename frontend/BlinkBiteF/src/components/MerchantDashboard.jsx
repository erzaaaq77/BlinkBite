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
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Submitted",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: "#d4edda",
        color: "#155724",
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Failed to send request",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
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
  console.log("Fetching branches for restaurant ID:", restaurantId);
  try {
    const response = await axios.get(`${API_BASE_URL}/RestaurantAddresses/by-restaurant/${restaurantId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Branches fetched:", response.data);
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
    if (!token) return undefined;
    const intervalId = window.setInterval(() => {
      fetchDashboard({ silent: true });
    }, 25000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchDashboard, token]);

  useEffect(() => {
    if (restaurant?.id) {
      fetchBranches();
    }
  }, [restaurant?.id, token]);

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
  const addressMap = new Map(
    addresses
      .map((address) => {
        const id = Number(address?.id);
        return Number.isFinite(id) ? [id, address] : null;
      })
      .filter(Boolean)
  );

  const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;

  const parseNumericValue = (raw) => {
    if (typeof raw === "number") {
      return Number.isFinite(raw) ? raw : 0;
    }

    if (typeof raw === "string") {
      const cleaned = raw.replace(/[^\d,.-]/g, "").replace(/,/g, ".").trim();
      const parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  };

  const parseCreatedAtMs = (order) => {
    const candidates = [order?.dataPorosis, order?.createdAt, order?.orderDate, order?.date];

    for (const value of candidates) {
      if (!value) continue;

      const timestamp = new Date(value).getTime();
      if (Number.isFinite(timestamp) && timestamp > 0) {
        return timestamp;
      }
    }

    return parseNumericValue(order?.id);
  };

  const normalizedRecentOrders = recentOrders.map((order) => {
    const statusName = getStatusName(order.statusi);
    const createdAtMs = parseCreatedAtMs(order);
    const totalAmount = parseNumericValue(order.shumaTotale ?? order.total ?? order.totalAmount);
    const branchAddressId = Number(
      order?.restaurantAddressId ??
      order?.RestaurantAddressId ??
      order?.branchId ??
      order?.BranchId ??
      order?.addressId ??
      order?.AddressId
    );
    const matchedAddress = Number.isFinite(branchAddressId) ? addressMap.get(branchAddressId) : null;
    const branchLabel =
      matchedAddress?.adresa ||
      matchedAddress?.address ||
      order?.branchAddress ||
      order?.restaurantAddress ||
      "";
    const orderItems = Array.isArray(order.items) ? order.items : [];
    const itemSearchText = orderItems
      .map((item) => item?.name || item?.menuItemName || item?.menuItem?.emertimi || "")
      .join(" ")
      .toLowerCase();
    const addressLabel = String(order.address || order.adresaDorezimit || "").toLowerCase();
    const noteLabel = String(order.note || order.shenimet || "").toLowerCase();
    const customerLabel = String(
      order.customerName || order.customer || order.user?.userName || order.userName || "Customer"
    );

    return {
      ...order,
      statusName,
      statusKey: String(statusName || "unknown").toLowerCase(),
      customerLabel,
      branchAddressId: Number.isFinite(branchAddressId) ? branchAddressId : null,
      branchLabel: String(branchLabel || "").trim(),
      createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : 0,
      totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
      searchableText: [
        String(order.id || ""),
        customerLabel,
        String(statusName || ""),
        String(branchLabel || ""),
        itemSearchText,
        addressLabel,
        noteLabel,
      ]
        .join(" ")
        .toLowerCase(),
    };
  });

  const flowSnapshot = normalizedRecentOrders.reduce(
    (acc, order) => {
      if (order.statusKey === "pending") acc.pending += 1;
      if (["accepted", "preparing", "ready"].includes(order.statusKey)) acc.inProgress += 1;
      if (order.statusKey === "delivered") acc.delivered += 1;
      if (order.statusKey === "cancelled") acc.cancelled += 1;
      return acc;
    },
    { pending: 0, inProgress: 0, delivered: 0, cancelled: 0 }
  );

  const normalizedSearch = orderSearch.trim().toLowerCase();

  const matchesStatusFilter = (order, statusFilter) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "in-progress") {
      return ["accepted", "preparing", "ready"].includes(order.statusKey);
    }
    return order.statusKey === statusFilter;
  };

  const matchesLocationFilter = (order, locationFilter) => {
    if (locationFilter === "all") return true;
    if (locationFilter === "main") {
      return Number(order.branchAddressId) === Number(primaryAddressId);
    }
    if (!locationFilter.startsWith("branch:")) return true;

    const branchId = Number(locationFilter.replace("branch:", ""));
    if (!Number.isFinite(branchId)) return true;

    return Number(order.branchAddressId) === branchId;
  };

  const filteredOrders = normalizedRecentOrders.filter((order) => {
    const passesStatus = matchesStatusFilter(order, orderStatusFilter);
    if (!passesStatus) return false;

    const passesLocation = matchesLocationFilter(order, orderLocationFilter);
    if (!passesLocation) return false;

    if (showActionableOnly && getOrderActions(order.statusName).length === 0) {
      return false;
    }

    if (!normalizedSearch) return true;
    return order.searchableText.includes(normalizedSearch);
  });

  const sortedFilteredOrders = [...filteredOrders].sort((a, b) => {
    if (orderSort === "oldest") {
      const byDate = a.createdAtMs - b.createdAtMs;
      return byDate !== 0 ? byDate : a.totalAmount - b.totalAmount;
    }
    if (orderSort === "highest") {
      const byTotal = b.totalAmount - a.totalAmount;
      return byTotal !== 0 ? byTotal : b.createdAtMs - a.createdAtMs;
    }
    if (orderSort === "lowest") {
      const byTotal = a.totalAmount - b.totalAmount;
      return byTotal !== 0 ? byTotal : b.createdAtMs - a.createdAtMs;
    }
    if (orderSort === "customer") return a.customerLabel.localeCompare(b.customerLabel);
    const byNewest = b.createdAtMs - a.createdAtMs;
    return byNewest !== 0 ? byNewest : b.totalAmount - a.totalAmount;
  });

  const visibleFilteredOrders = sortedFilteredOrders.slice(0, visibleOrdersCount);
  const hasMoreFilteredOrders = sortedFilteredOrders.length > visibleFilteredOrders.length;

  const statusFilterOptions = [
    { value: "all", label: "All statuses" },
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "accepted", label: "Accepted" },
    { value: "preparing", label: "Preparing" },
    { value: "ready", label: "Ready" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "highest", label: "Highest total" },
    { value: "lowest", label: "Lowest total" },
    { value: "customer", label: "Customer A-Z" },
  ];

  const hasActiveFilters =
    orderStatusFilter !== "all" ||
    orderLocationFilter !== "all" ||
    orderSearch.trim().length > 0 ||
    orderSort !== "newest" ||
    showActionableOnly;

  const clearOrderFilters = () => {
    setOrderStatusFilter("all");
    setOrderLocationFilter("all");
    setOrderSearch("");
    setOrderSort("newest");
    setShowActionableOnly(false);
  };

  const locationFilterOptions = [
    { value: "all", label: "All locations" },
    ...(primaryAddressId ? [{ value: "main", label: "Main branch" }] : []),
    ...addresses.map((address) => {
      const id = Number(address?.id);
      const title = address?.adresa || address?.address || `Branch ${id}`;
      const cityZone = [address?.qyteti, address?.zona].filter(Boolean).join(", ");
      const suffix = cityZone ? ` (${cityZone})` : "";
      return {
        value: `branch:${id}`,
        label: `${title}${suffix}`,
      };
    }),
  ];

  return (
    <section className="merchant-dashboard-page">
      <div className="container py-4 py-lg-5">
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

        <div className="merchant-dash-hero mb-4 mb-lg-5">
          <div>
            <p className="merchant-eyebrow mb-2">Merchant Control Center</p>
            <h2 className="merchant-dash-title mb-2">{restaurantName}</h2>
            <p className="merchant-dash-subtitle mb-0">
              Track revenue, monitor live order flow, and keep your restaurant operations in sync.
            </p>
          </div>
        </div>

        <div className="merchant-card mb-4">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            <div className="text-center">
              {restaurant.logo ? (
                <img 
                  src={`http://localhost:5063${restaurant.logo}`}
                  alt="Restaurant Logo" 
                  style={{ 
                    width: "100px", 
                    height: "100px", 
                    objectFit: "cover",
                    borderRadius: "12px",
                    border: "1px solid #ddd"
                  }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div 
                style={{ 
                  width: "100px", 
                  height: "100px", 
                  backgroundColor: "#f0f0f0",
                  borderRadius: "12px",
                  display: restaurant.logo ? "none" : "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed #ccc"
                }}
              >
                <span className="text-muted" style={{ fontSize: "12px" }}>No Logo</span>
              </div>
            </div>
            
            <div>
              <label className={`btn btn-outline-primary btn-sm ${uploadingLogo ? 'disabled' : ''}`}>
                {uploadingLogo ? "Uploading..." : "Change Logo"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleLogoUpload(e.target.files[0]);
                    }
                  }}
                  disabled={uploadingLogo}
                />
              </label>
              {logoMessage && (
                <div className={`mt-2 small ${logoMessage.includes("✅") ? "text-success" : "text-danger"}`}>
                  {logoMessage}
                </div>
              )}
              <p className="small text-muted mt-2 mb-0">
                Allowed formats: JPG, PNG, GIF (max 2MB)
              </p>
            </div>
          </div>
        </div>

        {addresses.length > 0 && (
          <div className="merchant-card mb-4">
            <h5 className="merchant-section-title mb-3">Locations</h5>
            <div className="row g-3">
              {addresses.map((address) => (
                <div className="col-md-6 col-xl-4" key={address.id}>
                  <div className="merchant-info-cell h-100">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <span className="merchant-label">{address.adresa}</span>
                        <p className="merchant-value mb-0 small text-muted">
                          {[address.qyteti, address.zona].filter(Boolean).join(", ") || "Location"}
                        </p>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        {address.isMain && <span className="badge text-bg-warning">Main</span>}
                        {!address.isActive && <span className="badge text-bg-secondary">Inactive</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        window.location.hash = `/merchant/menu/${restaurant.id}?branchId=${encodeURIComponent(String(address.id))}`;
                      }}
                    >
                      Manage menu for this location
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
          <h5 className="merchant-section-title mb-3">Recent Orders</h5>

          {statusActionMessage && (
            <div className={`alert py-2 mb-3 ${statusActionError ? "alert-danger" : "alert-success"}`} role="alert">
              {statusActionMessage}
            </div>
          )}

          <div className="merchant-orders-toolbar mb-3">
            <div className="merchant-orders-filters">
              <div className="merchant-filter-group">
                <label className="form-label mb-1" htmlFor="merchant-order-status">Status</label>
                <select
                  id="merchant-order-status"
                  className="form-select form-select-sm"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  {statusFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="merchant-filter-group">
                <label className="form-label mb-1" htmlFor="merchant-order-location">Location</label>
                <select
                  id="merchant-order-location"
                  className="form-select form-select-sm"
                  value={orderLocationFilter}
                  onChange={(e) => setOrderLocationFilter(e.target.value)}
                >
                  {locationFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="merchant-filter-group merchant-filter-search">
                <label className="form-label mb-1" htmlFor="merchant-order-search">Search</label>
                <input
                  id="merchant-order-search"
                  className="form-control form-control-sm"
                  type="text"
                  placeholder="Order ID or customer"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>

              <div className="merchant-filter-group">
                <label className="form-label mb-1" htmlFor="merchant-order-sort">Sort</label>
                <select
                  id="merchant-order-sort"
                  className="form-select form-select-sm"
                  value={orderSort}
                  onChange={(e) => setOrderSort(e.target.value)}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="merchant-filter-group merchant-filter-inline">
                <label className="form-label mb-1" htmlFor="merchant-actionable-only">Workflow</label>
                <div className="form-check mt-1 mb-0">
                  <input
                    id="merchant-actionable-only"
                    className="form-check-input"
                    type="checkbox"
                    checked={showActionableOnly}
                    onChange={(e) => setShowActionableOnly(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="merchant-actionable-only">
                    Actionable only
                  </label>
                </div>
              </div>
            </div>

            <div className="merchant-orders-meta text-muted small d-flex flex-wrap align-items-center gap-2 justify-content-end">
              <span>
                Showing {visibleFilteredOrders.length} of {sortedFilteredOrders.length} filtered ({normalizedRecentOrders.length} total)
              </span>
              {hasActiveFilters && (
                <button type="button" className="btn btn-sm btn-outline-dark" onClick={clearOrderFilters}>
                  Reset filters
                </button>
              )}
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-6 col-lg-3">
              <button
                type="button"
                className={`merchant-flow-chip merchant-flow-pending ${orderStatusFilter === "pending" ? "active" : ""}`}
                onClick={() => setOrderStatusFilter((current) => (current === "pending" ? "all" : "pending"))}
              >
                <span>Pending</span>
                <strong>{flowSnapshot.pending}</strong>
              </button>
            </div>
            <div className="col-6 col-lg-3">
              <button
                type="button"
                className={`merchant-flow-chip merchant-flow-progress ${orderStatusFilter === "in-progress" ? "active" : ""}`}
                onClick={() => setOrderStatusFilter((current) => (current === "in-progress" ? "all" : "in-progress"))}
              >
                <span>In Progress</span>
                <strong>{flowSnapshot.inProgress}</strong>
              </button>
            </div>
            <div className="col-6 col-lg-3">
              <button
                type="button"
                className={`merchant-flow-chip merchant-flow-delivered ${orderStatusFilter === "delivered" ? "active" : ""}`}
                onClick={() => setOrderStatusFilter((current) => (current === "delivered" ? "all" : "delivered"))}
              >
                <span>Delivered</span>
                <strong>{flowSnapshot.delivered}</strong>
              </button>
            </div>
            <div className="col-6 col-lg-3">
              <button
                type="button"
                className={`merchant-flow-chip merchant-flow-cancelled ${orderStatusFilter === "cancelled" ? "active" : ""}`}
                onClick={() => setOrderStatusFilter((current) => (current === "cancelled" ? "all" : "cancelled"))}
              >
                <span>Cancelled</span>
                <strong>{flowSnapshot.cancelled}</strong>
              </button>
            </div>
          </div>

          {normalizedRecentOrders.length === 0 ? (
            <div className="merchant-inline-state">
              <h6 className="mb-1">No orders yet</h6>
              <p className="text-muted mb-0">New orders will appear here as soon as customers place them.</p>
            </div>
          ) : sortedFilteredOrders.length === 0 ? (
            <div className="merchant-inline-state">
              <h6 className="mb-1">No matching results</h6>
              <p className="text-muted mb-0">Try a different status filter or clear the search text.</p>
            </div>
          ) : (
            <div className="accordion merchant-orders-accordion" id="ordersAccordion">
              {visibleFilteredOrders.map((order) => {
                const actions = getOrderActions(order.statusName);
                const actionInProgress = statusActionOrderId === Number(order.id);

                return (
                  <div className="accordion-item mb-2" key={order.id}>
                    <h2 className="accordion-header">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#collapse-${order.id}`}
                      >
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 w-100 me-3 merchant-order-summary">
                          <span><strong>Order #{order.id}</strong></span>
                          <span className="merchant-customer-name">{order.customerName || "Customer"}</span>
                          <span className="badge text-bg-dark me-2">{formatCurrency(order.shumaTotale)}</span>
                          <span className={`badge ${getStatusBadgeClass(order.statusName)}`}>
                            {order.statusName}
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

                        <div className="merchant-order-actions mt-3">
                          {actions.length === 0 ? (
                            <small className="text-muted">No status actions available for this order.</small>
                          ) : (
                            actions.map((action) => (
                              <button
                                key={`${order.id}-${action.nextStatus}`}
                                type="button"
                                className={action.buttonClass}
                                disabled={actionInProgress}
                                onClick={() => handleStatusUpdate(order, action.nextStatus)}
                              >
                                {actionInProgress ? "Updating..." : action.label}
                              </button>
                            ))
                          )}

                          <button
                            className="btn btn-sm btn-outline-dark"
                            disabled={orderDetailsLoadingId === Number(order.id)}
                            onClick={() => viewOrderDetails(order.id)}
                          >
                            {orderDetailsLoadingId === Number(order.id) ? "Loading..." : "View Full Order Details"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {sortedFilteredOrders.length > 0 && (
            <div className="merchant-orders-pagination mt-3">
              {hasMoreFilteredOrders && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setVisibleOrdersCount((current) => current + MERCHANT_ORDERS_BATCH_SIZE)}
                >
                  Show more ({sortedFilteredOrders.length - visibleFilteredOrders.length} left)
                </button>
              )}

              {visibleOrdersCount > MERCHANT_ORDERS_BATCH_SIZE && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark"
                  onClick={() => setVisibleOrdersCount(MERCHANT_ORDERS_BATCH_SIZE)}
                >
                  Show less
                </button>
              )}
            </div>
          )}

      <div className="mt-4 pt-3 border-top">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="merchant-section-title mb-0">🏪 Restaurant Branches</h5>
        </div>

        {restaurantBranches.length === 0 ? (
          <p className="text-muted small mb-0">No branches added yet.</p>
        ) : (
          <div className="row g-3">
            {restaurantBranches.map((branch) => (
              <div className="col-md-6 col-lg-4" key={branch.id}>
                <div className="border rounded-3 p-3 h-100 bg-white">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="fw-semibold">{branch.adresa || branch.address}</div>
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openEditBranchModal(branch)}
                        title="Request Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => openDeleteBranchModal(branch)}
                        title="Request Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="small text-muted">
                    <div>{branch.qyteti || branch.city}, {branch.zona || branch.zone}</div>
                    <div>Delivery: €{(branch.tarifaDorezimit || branch.deliveryFee || 0).toFixed(2)}</div>
                    <div className="mt-1">
                      <span className={`badge ${branch.isActive ? "bg-success" : "bg-secondary"}`}>
                        {branch.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>

      {showEditModal && selectedBranch && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content merchant-modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Request Branch Edit</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="small text-muted mb-3">Submit a request for admin approval to update this branch.</p>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={requestData.newAddress}
                    onChange={(e) => setRequestData((prev) => ({ ...prev, newAddress: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-control"
                    value={requestData.newCity}
                    onChange={(e) => setRequestData((prev) => ({ ...prev, newCity: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Zone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={requestData.newZone}
                    onChange={(e) => setRequestData((prev) => ({ ...prev, newZone: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Delivery Fee</label>
                  <input
                    type="text"
                    className="form-control"
                    value={requestData.newDeliveryFee}
                    onChange={(e) => setRequestData((prev) => ({ ...prev, newDeliveryFee: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={requestData.reason}
                    onChange={(e) => setRequestData((prev) => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={submitEditRequest}>
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedBranch && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content merchant-modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Request Branch Delete</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">Are you sure you want to request deletion for the branch at <strong>{selectedBranch.adresa || selectedBranch.address}</strong>?</p>
                <p className="small text-muted">This will send a delete request to an administrator for review.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={submitDeleteRequest}>
                  Send Delete Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {showModal && selectedOrder && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
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
    </section>
  );
};

export default MerchantDashboard;