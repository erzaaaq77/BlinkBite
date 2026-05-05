import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import * as signalR from "@microsoft/signalr";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import logo from "./assets/LogoBB.png";
import locationImage from "./assets/location.png";
import MerchantDashboard from "./components/MerchantDashboard.jsx";
import DriverDashboard from "./components/DriverDashboard";
import OrderTracking from "./components/OrderTracking";

const API_BASE = "http://localhost:5063/api";
const ACCESS_TOKEN_KEY = "access_token";
const NEARBY_COORDS_KEY = "nearby_coords";
const ORDER_CART_KEY = "blinkbite_cart_v1";
const HomePage = lazy(() => import("./components/HomePage.jsx"));
const RestaurantsPage = lazy(() => import("./components/RestaurantsPage.jsx"));
const RestaurantDetailsPage = lazy(() => import("./components/RestaurantDetailsPage.jsx"));
const BranchMenuPage = lazy(() => import("./components/BranchMenuPage.jsx"));

// Helper: image with multi-candidate fallback for Kanban detail modal
function KanbanItemImage({ candidates = [], alt = "" }) {
  const [idx, setIdx] = React.useState(0);
  const src = candidates[idx] || "";
  if (!src) {
    return (
      <div className="kd-item-img kd-item-img-placeholder">
        <i className="bi bi-image"></i>
      </div>
    );
  }
  return (
    <img
      className="kd-item-img"
      src={src}
      alt={alt}
      onError={() => { if (idx < candidates.length - 1) setIdx(i => i + 1); }}
    />
  );
}

function App() {
  const categoriesSliderRef = useRef(null);
  const searchInputRef = useRef(null);
  const menuItemsLookupRef = useRef(new Map());
  const menuItemsLookupPromiseRef = useRef(null);
  const orderHubConnectionRef = useRef(null);
  const subscribedOrderGroupsRef = useRef(new Set());
  const getRouteState = () => {
    const hash = window.location.hash || "#/";

    if (hash.startsWith("#/track/")) {
  const orderId = hash.replace("#/track/", "");
  return {
    page: "trackOrder",
    orderId: orderId,
    category: "",
    restaurantId: null,
    branchId: "",
  };
}
    if (hash.startsWith("#/driver/dashboard")) {
  return {
    page: "driverDashboard",
    category: "",
    restaurantId: null,
    branchId: "",
  };
}
      if (hash.startsWith("#/merchant/dashboard")) {

    return {
      page: "merchantDashboard",
      category: "",
      restaurantId: null,
      branchId: "",
    };
  }


    if (hash.startsWith("#/my-orders")) {
      return {
        page: "myOrders",
        category: "",
        restaurantId: null,
        branchId: "",
      };
    }

    if (hash.startsWith("#/cart")) {
      const queryString = hash.includes("?") ? hash.split("?")[1] : "";
      const params = new URLSearchParams(queryString);
      const restaurantParam = Number(params.get("restaurantId"));
      const branchParam = params.get("branchId") || "";
      return {
        page: "cart",
        category: "",
        restaurantId: Number.isFinite(restaurantParam) ? restaurantParam : null,
        branchId: decodeURIComponent(branchParam),
      };
    }

    if (hash.startsWith("#/restaurant/") && hash.includes("/branch/")) {
      const afterPrefix = hash.replace("#/restaurant/", "");
      const [rawRestaurantId, rawBranchId] = afterPrefix.split("/branch/");
      const parsedId = Number(rawRestaurantId);
      return {
        page: "branchMenu",
        category: "",
        restaurantId: Number.isFinite(parsedId) ? parsedId : null,
        branchId: decodeURIComponent(rawBranchId || ""),
      };
    }

    if (hash.startsWith("#/restaurant/")) {
      const rawRestaurantId = hash.replace("#/restaurant/", "").split("/")[0];
      const parsedId = Number(rawRestaurantId);
      return {
        page: "restaurantDetails",
        category: "",
        restaurantId: Number.isFinite(parsedId) ? parsedId : null,
        branchId: "",
      };
    }

    if (hash.startsWith("#/restaurants/")) {
      const rawCategory = hash.replace("#/restaurants/", "");
      return {
        page: "restaurants",
        category: decodeURIComponent(rawCategory || ""),
        restaurantId: null,
        branchId: "",
      };
    }

    return {
      page: "home",
      category: "",
      restaurantId: null,
      branchId: "",
    };
  };

  const initialRoute = getRouteState();
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialRoute.category);
  const [activeRestaurantId, setActiveRestaurantId] = useState(initialRoute.restaurantId);
  const [activeBranchId, setActiveBranchId] = useState(initialRoute.branchId || "");
  const [page, setPage] = useState(initialRoute.page);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [restaurantDetailsLoading, setRestaurantDetailsLoading] = useState(false);
  const [restaurantDetailsError, setRestaurantDetailsError] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantBranches, setRestaurantBranches] = useState([]);
  const [restaurantMenuItems, setRestaurantMenuItems] = useState([]);
  const [restaurantOffers, setRestaurantOffers] = useState([]);
  const [brandRestaurantCount, setBrandRestaurantCount] = useState(1);
  const [findingFood, setFindingFood] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [nearbyError, setNearbyError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInputUnlocked, setSearchInputUnlocked] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("1");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [myOrders, setMyOrders] = useState([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);
  const [myOrdersError, setMyOrdersError] = useState("");
  const [roleOrders, setRoleOrders] = useState([]);
  const [roleOrdersLoading, setRoleOrdersLoading] = useState(false);
  const [roleOrdersError, setRoleOrdersError] = useState("");
  const [roleActionMessage, setRoleActionMessage] = useState("");
  const [roleToastVisible, setRoleToastVisible] = useState(false);
  const roleToastTimerRef = React.useRef(null);
  const [roleActionOrderId, setRoleActionOrderId] = useState(null);
  const [kanbanDetailOrder, setKanbanDetailOrder] = useState(null);

  // New order notification state
  const [newOrderCount, setNewOrderCount] = useState(0);
  const knownOrderIdsRef = React.useRef(null); // null = not initialized yet
  const pollingIntervalRef = React.useRef(null);

  const getStoredToken = () => localStorage.getItem(ACCESS_TOKEN_KEY) || "";
  const [token, setToken] = useState(getStoredToken());
  const [currentUser, setCurrentUser] = useState(null);

  const [loginMessage, setLoginMessage] = useState("");
  const [signupMessage, setSignupMessage] = useState("");

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState("Customer");

  const [addressCountry, setAddressCountry] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressPostal, setAddressPostal] = useState("");

  const filtered = (restaurants || []).filter(r =>
    (r.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const getRoleFromJwt = () => {
    try {
      const jwt = getStoredToken();
      if (!jwt || !jwt.includes(".")) return "";

      const payloadBase64 = jwt.split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const decoded = decodeURIComponent(
        atob(payloadBase64)
          .split("")
          .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join("")
      );

      const payload = JSON.parse(decoded);

      const directRole = payload?.role ?? payload?.Role;
      if (typeof directRole === "string" && directRole.trim()) return directRole;

      const roleClaim = payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      if (typeof roleClaim === "string" && roleClaim.trim()) return roleClaim;

      const roles = payload?.roles ?? payload?.Roles;
      if (Array.isArray(roles) && roles.length > 0) {
        return String(roles[0] || "");
      }

      return "";
    } catch (err) {
      console.error(err);
      return "";
    }
  };

  const currentUserRole =
    currentUser?.role ??
    currentUser?.Role ??
    (Array.isArray(currentUser?.roles) && currentUser.roles.length > 0 ? currentUser.roles[0] : "") ??
    (Array.isArray(currentUser?.Roles) && currentUser.Roles.length > 0 ? currentUser.Roles[0] : "") ??
    getRoleFromJwt() ??
    "";
  const normalizedCurrentUserRole = String(currentUserRole || "").trim().toLowerCase();
  const isCustomerRole = ["customer", "user"].includes(normalizedCurrentUserRole);
  const isAdminRole = normalizedCurrentUserRole === "admin";
  const isMerchantRole = normalizedCurrentUserRole === "merchant";
  const isCourierRole = normalizedCurrentUserRole === "courier";
  const canManageOperationalOrders = isAdminRole || isMerchantRole || isCourierRole;
  const [merchantRestaurantIdForUi, setMerchantRestaurantIdForUi] = useState("");

  useEffect(() => {
    const tryAssignMerchantRestaurantId = async () => {
      if (!isMerchantRole || !currentUser?.id) return;
      if (
        currentUser?.restaurantId ||
        currentUser?.RestaurantId ||
        currentUser?.merchantRestaurantId ||
        currentUser?.MerchantRestaurantId ||
        currentUser?.branchRestaurantId ||
        currentUser?.BranchRestaurantId
      ) {
        setMerchantRestaurantIdForUi(
          currentUser?.restaurantId ??
          currentUser?.RestaurantId ??
          currentUser?.merchantRestaurantId ??
          currentUser?.MerchantRestaurantId ??
          currentUser?.branchRestaurantId ??
          currentUser?.BranchRestaurantId ??
          ""
        );
        return;
      }
      // Fetch all restaurants and find the one for this merchant
      try {
        const res = await fetch("/api/restaurants");
        if (!res.ok) return;
        const data = await res.json();
        const myRestaurant = (Array.isArray(data) ? data : []).find(r => (r.userId ?? r.UserId) === currentUser.id);
        if (myRestaurant && (myRestaurant.id || myRestaurant.Id)) {
          setMerchantRestaurantIdForUi(myRestaurant.id ?? myRestaurant.Id);
        }
      } catch {}
    };
    tryAssignMerchantRestaurantId();
  }, [isMerchantRole, currentUser]);

  const extractErrorMessage = (payload, fallbackMessage) => {
    if (!payload) return fallbackMessage;

    if (typeof payload === "string") return payload;

    if (Array.isArray(payload)) {
      const described = payload
        .map((item) => item?.description || item?.Description || item?.message || item?.Message)
        .filter(Boolean);
      if (described.length > 0) return described.join(" ");
    }

    if (payload.errors && typeof payload.errors === "object") {
      const messages = Object.values(payload.errors)
        .flat()
        .filter(Boolean);
      if (messages.length > 0) return messages.join(" ");
    }

    if (payload.message) return payload.message;
    if (payload.title) return payload.title;

    return fallbackMessage;
  };

  const persistToken = (nextToken) => {
    if (nextToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, nextToken);
      setToken(nextToken);
      return;
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    setToken("");
  };

  const refreshAccessToken = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        persistToken("");
        return false;
      }

      const data = await res.json();
      if (!data?.token) {
        persistToken("");
        return false;
      }

      persistToken(data.token);
      return true;
    } catch (err) {
      console.error(err);
      persistToken("");
      return false;
    }
  };

  const getUserIdFromJwt = () => {
    try {
      const jwt = getStoredToken();
      if (!jwt || !jwt.includes(".")) return "";

      const payloadBase64 = jwt.split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const padded = payloadBase64 + "=".repeat((4 - (payloadBase64.length % 4)) % 4);
      const payload = JSON.parse(window.atob(padded));

      return (
        payload?.nameid ||
        payload?.sub ||
        payload?.id ||
        payload?.userId ||
        payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
        ""
      );
    } catch (err) {
      console.error(err);
      return "";
    }
  };

  const authenticatedFetch = async (url, options = {}, canRetry = true) => {
    const headers = { ...(options.headers || {}) };
    const currentToken = getStoredToken();
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (res.status === 401 && canRetry && currentToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return authenticatedFetch(url, options, false);
      }
    }

    return res;
  };

  const getAssetUrlCandidates = (pathOrUrl) => {
    if (!pathOrUrl || typeof pathOrUrl !== "string") return [];

    let raw = pathOrUrl.trim();
    if (!raw) return [];

    const apiOrigin = API_BASE.replace(/\/api\/?$/, "");

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      try {
        const parsed = new URL(raw);
        const pathname = String(parsed.pathname || "").replace(/^\/+/, "");
        const candidates = new Set([encodeURI(raw)]);

        if (pathname) {
          if (/^uploads\//i.test(pathname)) {
            candidates.add(encodeURI(`${apiOrigin}/${pathname}`));
          } else {
            candidates.add(encodeURI(`${apiOrigin}/uploads/${pathname}`));
            candidates.add(encodeURI(`${apiOrigin}/${pathname}`));
            candidates.add(encodeURI(`${apiOrigin}/uploads/menuitems/${pathname}`));
          }
        }

        return Array.from(candidates);
      } catch {
        return [encodeURI(raw)];
      }
    }

    raw = raw.replace(/^~\/?/, "");
    raw = raw.replace(/\\+/g, "/");

    const uploadsMatch = raw.match(/(?:^|\/)(uploads\/.*)$/i);
    if (uploadsMatch?.[1]) {
      raw = uploadsMatch[1];
    }

    const cleaned = raw.replace(/^\/+/, "");
    if (!cleaned) return [];

    const candidates = new Set();

    // Prefer uploads-hosted paths first, then root path.
    if (/^uploads\//i.test(cleaned)) {
      candidates.add(encodeURI(`${apiOrigin}/${cleaned}`));
    } else {
      candidates.add(encodeURI(`${apiOrigin}/uploads/${cleaned}`));
      candidates.add(encodeURI(`${apiOrigin}/${cleaned}`));
      candidates.add(encodeURI(`${apiOrigin}/uploads/menuitems/${cleaned}`));
      candidates.add(encodeURI(`${apiOrigin}/menuitems/${cleaned}`));
    }

    if (/^(menuitems|logos|categories|gjiks)\//i.test(cleaned)) {
      candidates.add(encodeURI(`${apiOrigin}/uploads/${cleaned}`));
    }

    return Array.from(candidates);
  };

  const toAbsoluteAssetUrl = (pathOrUrl) => {
    const candidates = getAssetUrlCandidates(pathOrUrl);
    return candidates[0] || "";
  };

  const getFoodFallbackImage = (label = "Food") => {
    const safeLabel = String(label || "Food").trim().slice(0, 18) || "Food";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f7ead2"/><stop offset="100%" stop-color="#e7c98f"/></linearGradient></defs><rect width="140" height="140" rx="16" fill="url(#g)"/><circle cx="70" cy="56" r="22" fill="#fff7e6"/><rect x="34" y="88" width="72" height="18" rx="9" fill="#fff7e6"/><text x="70" y="132" text-anchor="middle" font-size="12" font-family="Segoe UI, Arial, sans-serif" fill="#6f581d">${safeLabel}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const applyImageFallbackCandidate = (event, candidates = [], fallbackSrc = "") => {
    const img = event.currentTarget;
    const currentIndex = Number(img.dataset.candidateIndex || "0");
    const nextIndex = currentIndex + 1;

    if (Array.isArray(candidates) && nextIndex < candidates.length) {
      img.dataset.candidateIndex = String(nextIndex);
      img.src = candidates[nextIndex];
      return;
    }

    img.onerror = null;
    if (fallbackSrc) {
      img.src = fallbackSrc;
    }
  };

  const fetchMenuItemsLookup = async () => {
    if (menuItemsLookupRef.current.size > 0) {
      return menuItemsLookupRef.current;
    }

    if (menuItemsLookupPromiseRef.current) {
      return menuItemsLookupPromiseRef.current;
    }

    menuItemsLookupPromiseRef.current = (async () => {
      try {
        const res = await authenticatedFetch(`${API_BASE}/menuitems`);
        if (!res.ok) {
          return new Map();
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const lookup = new Map();

        list.forEach((item) => {
          const menuItemId = item?.id ?? item?.Id;
          if (menuItemId === undefined || menuItemId === null) return;

          const imageRaw = item?.foto ?? item?.Foto ?? item?.image ?? item?.Image ?? "";
          const imageCandidates = getAssetUrlCandidates(imageRaw);
          const imageUrl = imageCandidates[0] || "";
          const name =
            item?.emertimi ?? item?.Emertimi ?? item?.name ?? item?.Name ?? "Item";

          lookup.set(String(menuItemId), {
            name: String(name || "Item"),
            image: imageUrl,
            imageCandidates,
          });
        });

        menuItemsLookupRef.current = lookup;
        return lookup;
      } catch (err) {
        console.error(err);
        return new Map();
      } finally {
        menuItemsLookupPromiseRef.current = null;
      }
    })();

    return menuItemsLookupPromiseRef.current;
  };

  const loadCartFromStorage = () => {
    try {
      const raw = localStorage.getItem(ORDER_CART_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => {
        const rawImagePath = item?.rawImagePath ?? item?.imagePath ?? item?.image ?? item?.Image ?? "";
        const imageCandidates =
          Array.isArray(item?.imageCandidates) && item.imageCandidates.length > 0
            ? item.imageCandidates
            : getAssetUrlCandidates(rawImagePath);

        return {
          ...item,
          rawImagePath,
          imageCandidates,
          image: item?.image || imageCandidates[0] || "",
        };
      });
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartSubtotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const cartDeliveryFee = Number(restaurantBranches.find((b) => String(b.id) === String(activeBranchId))?.deliveryFee || 0);
  const cartTotal = cartSubtotal + cartDeliveryFee;

  const addToCart = (menuItem, quantity) => {
    if (!menuItem || !activeRestaurantId || !activeBranchId) return;
    const nextQty = Math.max(1, Number(quantity || 1));

    setCartItems((current) => {
      const idx = current.findIndex(
        (entry) =>
          String(entry.menuItemId) === String(menuItem.id) &&
          String(entry.branchId) === String(activeBranchId) &&
          String(entry.restaurantId) === String(activeRestaurantId)
      );

      if (idx >= 0) {
        const updated = [...current];
        updated[idx] = {
          ...updated[idx],
          quantity: Number(updated[idx].quantity || 0) + nextQty,
        };
        return updated;
      }

      return [
        ...current,
        (() => {
          const rawImagePath = menuItem?.rawImagePath ?? menuItem?.foto ?? menuItem?.Foto ?? menuItem?.image ?? menuItem?.Image ?? "";
          const imageCandidates =
            Array.isArray(menuItem?.imageCandidates) && menuItem.imageCandidates.length > 0
              ? menuItem.imageCandidates
              : getAssetUrlCandidates(rawImagePath);

          return {
          menuItemId: menuItem.id,
          name: menuItem.name || "Item",
          price: Number(menuItem.price || 0),
          rawImagePath,
          imageCandidates,
          image: menuItem?.image || imageCandidates[0] || "",
          quantity: nextQty,
          restaurantId: activeRestaurantId,
          restaurantName: selectedRestaurant?.name || "Restaurant",
          branchId: activeBranchId,
          branchAddress: restaurantBranches.find((b) => String(b.id) === String(activeBranchId))?.address || "",
          };
        })(),
      ];
    });

    setOrderMessage("");
  };

  const updateCartItemQuantity = (targetItem, quantity) => {
    const nextQty = Math.max(1, Number(quantity || 1));
    setCartItems((current) =>
      current.map((item) =>
        String(item.menuItemId) === String(targetItem.menuItemId) &&
        String(item.branchId) === String(targetItem.branchId) &&
        String(item.restaurantId) === String(targetItem.restaurantId)
          ? { ...item, quantity: nextQty }
          : item
      )
    );
    setOrderMessage("");
  };

  const removeCartItem = (targetItem) => {
    setCartItems((current) =>
      current.filter(
        (item) =>
          !(
            String(item.menuItemId) === String(targetItem.menuItemId) &&
            String(item.branchId) === String(targetItem.branchId) &&
            String(item.restaurantId) === String(targetItem.restaurantId)
          )
      )
    );
    setOrderMessage("");
  };

  const openCartPage = () => {
    const params = new URLSearchParams();
    if (activeRestaurantId) params.set("restaurantId", String(activeRestaurantId));
    if (activeBranchId) params.set("branchId", String(activeBranchId));
    const query = params.toString();
    window.location.hash = query ? `/cart?${query}` : "/cart";
  };

  const normalizeAddressForBackend = (rawAddress) => {
    const base = String(rawAddress || "").trim();
    if (!base) return "";

    const withoutDiacritics = base
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const allowedOnly = withoutDiacritics
      .replace(/[^a-zA-Z0-9\s,.-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return allowedOnly;
  };

  const ORDER_STATUS_LABELS = {
    1: "Pending",
    2: "Accepted",
    3: "Preparing",
    4: "Ready",
    5: "Delivered",
    6: "Cancelled",
  };

  const PAYMENT_METHOD_LABELS = {
    1: "Cash",
    2: "Credit Card",
    3: "PayPal",
    4: "Online",
  };

  const ORDER_STATUS_CODES = {
    pending: 1,
    accepted: 2,
    preparing: 3,
    ready: 4,
    delivered: 5,
    cancelled: 6,
  };

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

  const getRoleCapabilitiesLabel = () => {
    if (isAdminRole) {
      return "Admin: can monitor all orders and move statuses across all stages.";
    }
    if (isMerchantRole) {
      return "Merchant: can process own orders from Pending to Accepted, Preparing, and Ready.";
    }
    if (isCourierRole) {
      return "Courier: can view Ready orders and complete delivery.";
    }
    if (isCustomerRole || !normalizedCurrentUserRole) {
      return "Customer/User: can place orders and track personal order statuses.";
    }
    return `Role ${currentUserRole}: permissions depend on backend policy.`;
  };

  const getAvailableActionsForOrder = (order) => {
    const currentStatus = normalizeStatusLabel(order?.statusLabel).toLowerCase();
    const actions = [];

    if (isAdminRole || isMerchantRole) {
      if (currentStatus === "pending") {
        actions.push({ nextStatus: "Accepted", buttonClass: "btn btn-sm btn-primary", label: "Accept" });
      }
      if (currentStatus === "accepted") {
        actions.push({ nextStatus: "Preparing", buttonClass: "btn btn-sm btn-warning", label: "Preparing" });
      }
      if (currentStatus === "preparing") {
        actions.push({ nextStatus: "Ready", buttonClass: "btn btn-sm btn-info", label: "Ready" });
      }
    }

    if ((isAdminRole || isCourierRole) && currentStatus === "ready") {
      actions.push({ nextStatus: "Delivered", buttonClass: "btn btn-sm btn-success", label: "Deliver" });
    }

    return actions;
  };

  const getStatusBadgeClass = (statusLabel) => {
    const key = String(statusLabel || "").toLowerCase();
    if (key === "delivered") return "text-bg-success";
    if (key === "cancelled") return "text-bg-danger";
    if (key === "ready") return "text-bg-info";
    if (key === "preparing") return "text-bg-warning";
    if (key === "accepted") return "text-bg-primary";
    return "text-bg-secondary";
  };

  const syncOrderHubGroups = async (connection, orders) => {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    const nextOrderIds = new Set(
      (orders || [])
        .map((order) => Number(order?.id))
        .filter((id) => Number.isFinite(id) && id > 0)
    );

    const currentOrderIds = subscribedOrderGroupsRef.current;

    for (const orderId of nextOrderIds) {
      if (currentOrderIds.has(orderId)) continue;
      try {
        await connection.invoke("JoinOrderGroup", orderId);
        currentOrderIds.add(orderId);
      } catch (err) {
        console.error("Failed to join order group", orderId, err);
      }
    }

    for (const orderId of Array.from(currentOrderIds)) {
      if (nextOrderIds.has(orderId)) continue;
      try {
        await connection.invoke("LeaveOrderGroup", orderId);
      } catch (err) {
        console.error("Failed to leave order group", orderId, err);
      } finally {
        currentOrderIds.delete(orderId);
      }
    }
  };

  const handleSubmitOrder = async () => {
    setOrderMessage("");

    if (!token) {
      setOrderMessage("Please login first to place an order.");
      return;
    }

    if (normalizedCurrentUserRole && normalizedCurrentUserRole !== "customer") {
      setOrderMessage("Only Customer accounts can place orders. Please login with a Customer account.");
      return;
    }

    if (cartItems.length === 0) {
      setOrderMessage("Your cart is empty.");
      return;
    }

    if (!deliveryAddress.trim()) {
      setOrderMessage("Please enter delivery address.");
      return;
    }

    const normalizedDeliveryAddress = normalizeAddressForBackend(deliveryAddress);
    if (normalizedDeliveryAddress.length < 5) {
      setOrderMessage("Please enter a more specific delivery address.");
      return;
    }

    const referenceItem = cartItems[0];
    const sameRestaurant = cartItems.every((item) => String(item.restaurantId) === String(referenceItem.restaurantId));
    if (!sameRestaurant) {
      setOrderMessage("Cart currently supports items from one restaurant only.");
      return;
    }

    const resolvedUserId =
      currentUser?.id ??
      currentUser?.Id ??
      currentUser?.userId ??
      currentUser?.UserId ??
      getUserIdFromJwt() ??
      "";

    const payload = {
      UserId: String(resolvedUserId || ""),
      RestaurantId: Number(referenceItem.restaurantId),
      AdresaDorezimit: normalizedDeliveryAddress,
      TarifaDorezimit: Number(cartDeliveryFee || 0),
      Zbritja: 0,
      MetodaPageses: Number(paymentMethod),
      Shenimet: orderNotes.trim(),
      ShumaTotale: Number(cartTotal.toFixed(2)),
      OrderItems: cartItems.map((item) => ({
        MenuItemId: Number(item.menuItemId),
        Sasia: Number(item.quantity),
        Cmimi: Number(item.price),
        Shenimet: "",
      })),
    };

    setOrderSubmitting(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = null;
      let rawBody = "";
      try {
        rawBody = await res.text();
        if (rawBody) {
          data = JSON.parse(rawBody);
        }
      } catch {
        data = null;
      }

      if (!res.ok) {
        const fallback = `Could not place order right now (HTTP ${res.status}).`;
        console.error("Order submit failed", { status: res.status, data, rawBody });
        setOrderMessage(extractErrorMessage(data, fallback));
        return;
      }

      const createdOrderId = data?.id ?? data?.Id ?? "";
      const addressAdjusted = normalizedDeliveryAddress !== deliveryAddress.trim();
      setOrderMessage(
        `Order placed successfully${createdOrderId ? ` (#${createdOrderId})` : ""}!${addressAdjusted ? " Address was normalized for validation." : ""}`
      );
      clearCart();
      setOrderNotes("");
      if (!addressStreet && !addressCity) {
        setDeliveryAddress("");
      }
    } catch (err) {
      console.error(err);
      setOrderMessage("Could not place order right now.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await authenticatedFetch(`${API_BASE}/restaurants/kategori`);
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      const normalizedCategories = (data || []).map((cat) => {
        if (typeof cat === "string") return cat;

        return {
          id: cat?.id ?? cat?.Id,
          name: cat?.name ?? cat?.Name ?? "Category",
          image: toAbsoluteAssetUrl(cat?.imageUrl ?? cat?.ImageUrl ?? cat?.image ?? cat?.Image ?? ""),
        };
      });

      setCategories(normalizedCategories);
    } catch (err) {
      console.error(err);
      setCategories([
        { name: "Pizza", image: "https://source.unsplash.com/300x200/?pizza" },
        { name: "Burger", image: "https://source.unsplash.com/300x200/?burger" },
      ]);
    }
  };

  const fetchRestaurantsByCategory = async (categoryName) => {
    setRestaurantsLoading(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/restaurants/bykategori/${encodeURIComponent(categoryName)}`);
      if (!res.ok) throw new Error("Failed to load restaurants by category");
      const data = await res.json();

      const normalizedRestaurants = (data || []).map((r) => ({
        id: r?.id ?? r?.Id,
        name: r?.name ?? r?.Name ?? r?.emertimi ?? r?.Emertimi ?? "Restaurant",
        image: toAbsoluteAssetUrl(r?.image ?? r?.Image ?? r?.logo ?? r?.Logo ?? ""),
      }));

      setRestaurants(normalizedRestaurants);
    } catch (err) {
      console.error(err);
      setRestaurants([]);
    } finally {
      setRestaurantsLoading(false);
    }
  };

  const fetchNearbyRestaurants = async (latitude, longitude) => {
    setRestaurantsLoading(true);
    setNearbyError("");
    try {
      const query = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        take: "30",
      });
      const res = await authenticatedFetch(`${API_BASE}/restaurants/nearby?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load nearby restaurants");

      const data = await res.json();
      const normalized = (data || []).map((r) => ({
        id: r?.id ?? r?.Id ?? r?.restaurantId ?? `${r?.name || "restaurant"}-${Math.random().toString(36).slice(2, 8)}`,
        name: r?.name ?? r?.Name ?? "Restaurant",
        image: toAbsoluteAssetUrl(r?.image ?? r?.Image ?? ""),
        distanceKm: Number.isFinite(Number(r?.distanceKm)) ? Number(r.distanceKm) : undefined,
        nearestAddress: r?.nearestAddress ?? r?.NearestAddress ?? "",
        city: r?.city ?? r?.City ?? "",
      }));

      localStorage.setItem(
        NEARBY_COORDS_KEY,
        JSON.stringify({ latitude, longitude, savedAt: Date.now() })
      );

      setSelectedCategory("Nearby");
      setRestaurants(normalized);
      setPage("restaurants");
      if (window.location.hash !== "#/restaurants/Nearby") {
        window.location.hash = "/restaurants/Nearby";
      }
    } catch (err) {
      console.error(err);
      setRestaurants([]);
      setNearbyError("Could not load nearby restaurants right now.");
    } finally {
      setRestaurantsLoading(false);
    }
  };

  const normalizeRestaurant = (r) => ({
    id: r?.id ?? r?.Id,
    name: r?.name ?? r?.Name ?? r?.emertimi ?? r?.Emertimi ?? "Restaurant",
    image: toAbsoluteAssetUrl(r?.image ?? r?.Image ?? r?.logo ?? r?.Logo ?? r?.foto ?? r?.Foto ?? ""),
    imageCandidates: getAssetUrlCandidates(r?.image ?? r?.Image ?? r?.logo ?? r?.Logo ?? r?.foto ?? r?.Foto ?? ""),
    category: r?.category ?? r?.Category ?? r?.kategori ?? r?.Kategori ?? "",
    description: r?.description ?? r?.Description ?? r?.pershkrimi ?? r?.Pershkrimi ?? "",
  });

  const normalizeBranch = (branch, ownerRestaurantId) => ({
    id:
      branch?.id ??
      branch?.Id ??
      `${ownerRestaurantId || branch?.restaurantId || branch?.RestaurantId || "r"}-${branch?.adresa || branch?.Adresa || "branch"}`,
    restaurantId: branch?.restaurantId ?? branch?.RestaurantId ?? ownerRestaurantId ?? null,
    address: branch?.adresa ?? branch?.Adresa ?? branch?.address ?? branch?.Address ?? "",
    city: branch?.qyteti ?? branch?.Qyteti ?? branch?.city ?? branch?.City ?? "",
    zone: branch?.zona ?? branch?.Zona ?? branch?.zone ?? branch?.Zone ?? "",
    isMain: Boolean(branch?.isMain ?? branch?.IsMain),
    isActive: Boolean(branch?.isActive ?? branch?.IsActive ?? true),
    acceptsOrders: Boolean(branch?.acceptsOrders ?? branch?.AcceptsOrders ?? branch?.pranonPorosi ?? branch?.PranonPorosi ?? branch?.isActive ?? branch?.IsActive ?? true),
    deliveryFee: Number.isFinite(Number(branch?.deliveryFee ?? branch?.DeliveryFee ?? branch?.tarifaDorezimit ?? branch?.TarifaDorezimit))
      ? Number(branch?.deliveryFee ?? branch?.DeliveryFee ?? branch?.tarifaDorezimit ?? branch?.TarifaDorezimit)
      : null,
    offersText: branch?.offers ?? branch?.Offers ?? branch?.menuOffers ?? branch?.MenuOffers ?? "",
  });

  const fetchRestaurantBranches = async (restaurantId, restaurantPayload = null) => {
    const embedded = restaurantPayload?.adresat ?? restaurantPayload?.Adresat;
    if (Array.isArray(embedded) && embedded.length > 0) {
      return embedded.map((b) => normalizeBranch(b, restaurantId));
    }

    const branchEndpoints = [
      `${API_BASE}/restaurantaddresses/by-restaurant/${restaurantId}`,
      `${API_BASE}/restaurantaddresses/byrestaurant/${restaurantId}`,
      `${API_BASE}/restaurantaddresses/restaurant/${restaurantId}`,
      `${API_BASE}/restaurantaddresses?restaurantId=${restaurantId}`,
      `${API_BASE}/restaurants/${restaurantId}/addresses`,
    ];

    let bestResult = [];

    for (const endpoint of branchEndpoints) {
      try {
        const res = await authenticatedFetch(endpoint);
        if (!res.ok) continue;

        const data = await res.json();
        if (Array.isArray(data)) {
          const normalized = data.map((b) => normalizeBranch(b, restaurantId));
          if (normalized.length > 0) {
            return normalized;
          }

          if (bestResult.length === 0) {
            bestResult = normalized;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return bestResult;
  };

  const fetchRestaurantMenuItems = async (restaurantId) => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        authenticatedFetch(`${API_BASE}/menucategories/by-restaurant/${restaurantId}`),
        authenticatedFetch(`${API_BASE}/menuitems`),
      ]);

      const categoriesData = categoriesRes.ok ? await categoriesRes.json() : [];
      const itemsData = itemsRes.ok ? await itemsRes.json() : [];

      const normalizedCategories = (Array.isArray(categoriesData) ? categoriesData : []).map((c) => ({
        id: c?.id ?? c?.Id,
        name: c?.emertimi ?? c?.Emertimi ?? c?.name ?? c?.Name ?? "Menu",
        order: c?.renditja ?? c?.Renditja ?? 0,
      }));

      const categoryIds = new Set(normalizedCategories.map((c) => c.id));
      const categoryById = new Map(normalizedCategories.map((c) => [c.id, c]));

      const filteredItems = (Array.isArray(itemsData) ? itemsData : []).filter((item) => {
        if (categoryIds.size === 0) return false;
        const categoryId = item?.categoryId ?? item?.CategoryId;
        return categoryIds.has(categoryId);
      });

      return filteredItems
        .map((item) => {
          const categoryId = item?.categoryId ?? item?.CategoryId;
          const category = categoryById.get(categoryId);
          return {
            id: item?.id ?? item?.Id,
            name: item?.emertimi ?? item?.Emertimi ?? item?.name ?? item?.Name ?? "Item",
            description: item?.pershkrimi ?? item?.Pershkrimi ?? item?.description ?? item?.Description ?? "",
            price: Number(item?.cmimi ?? item?.Cmimi ?? item?.price ?? item?.Price ?? 0),
            image: toAbsoluteAssetUrl(item?.foto ?? item?.Foto ?? item?.image ?? item?.Image ?? ""),
            imageCandidates: getAssetUrlCandidates(item?.foto ?? item?.Foto ?? item?.image ?? item?.Image ?? ""),
            rawImagePath: item?.foto ?? item?.Foto ?? item?.image ?? item?.Image ?? "",
            available: Boolean(item?.disponueshme ?? item?.Disponueshme ?? true),
            calories: item?.kalori ?? item?.Kalori ?? null,
            allergens: item?.alergjene ?? item?.Alergjene ?? "",
            categoryName: category?.name || "Menu",
            categoryOrder: category?.order ?? 0,
          };
        })
        .sort((a, b) => {
          if (a.categoryOrder !== b.categoryOrder) return a.categoryOrder - b.categoryOrder;
          return a.name.localeCompare(b.name);
        });
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const fetchRestaurantOffers = async (restaurantId) => {
    try {
      const endpoints = [
        `${API_BASE}/promotions/active/by-restaurant/${restaurantId}`,
        `${API_BASE}/promotions/by-restaurant/${restaurantId}`,
      ];

      for (const endpoint of endpoints) {
        const res = await authenticatedFetch(endpoint);
        if (!res.ok) continue;

        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map((offer) => ({
            id: offer?.id ?? offer?.Id,
            code: offer?.kodi ?? offer?.Kodi ?? offer?.code ?? offer?.Code ?? "",
            discountPercent: Number(offer?.zbritjaPerqind ?? offer?.ZbritjaPerqind ?? offer?.discountPercent ?? offer?.DiscountPercent ?? 0),
          }));
        }
      }

      return [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const fetchRestaurantDetails = async (restaurantId) => {
    setRestaurantDetailsLoading(true);
    setRestaurantDetailsError("");

    try {
      const res = await authenticatedFetch(`${API_BASE}/restaurants/${restaurantId}`);
      if (!res.ok) throw new Error("Failed to load restaurant details");

      const payload = await res.json();
      const normalizedRestaurant = normalizeRestaurant(payload);

      let restaurantIdsForBrand = [restaurantId];
      try {
        const searchRes = await authenticatedFetch(
          `${API_BASE}/restaurants?search=${encodeURIComponent(normalizedRestaurant.name)}`
        );
        if (searchRes.ok) {
          const candidates = await searchRes.json();
          const normalizeName = (value) => String(value || "").trim().toLowerCase();
          const targetName = normalizeName(normalizedRestaurant.name);
          const sameBrandIds = (Array.isArray(candidates) ? candidates : [])
            .filter((r) => normalizeName(r?.name ?? r?.Name ?? r?.emertimi ?? r?.Emertimi) === targetName)
            .map((r) => Number(r?.id ?? r?.Id))
            .filter((id) => Number.isFinite(id));

          restaurantIdsForBrand = Array.from(new Set([restaurantId, ...sameBrandIds]));
        }
      } catch (err) {
        console.error(err);
      }

      const [allBranchesByRestaurant, menuItems, offers] = await Promise.all([
        Promise.all(
          restaurantIdsForBrand.map((id) =>
            fetchRestaurantBranches(id, id === restaurantId ? payload : null)
          )
        ),
        fetchRestaurantMenuItems(restaurantId),
        fetchRestaurantOffers(restaurantId),
      ]);

      const mergedBranches = allBranchesByRestaurant.flat();
      const branchMap = new Map();
      for (const branch of mergedBranches) {
        const key = `${String(branch.address || "").trim().toLowerCase()}|${String(branch.city || "").trim().toLowerCase()}|${String(branch.zone || "").trim().toLowerCase()}`;
        if (!key.replace(/\|/g, "")) continue;
        if (!branchMap.has(key)) {
          branchMap.set(key, branch);
          continue;
        }

        const existing = branchMap.get(key);
        if (!existing.isMain && branch.isMain) {
          branchMap.set(key, branch);
        }
      }

      const branches = Array.from(branchMap.values()).sort((a, b) => {
        if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return `${a.city} ${a.address}`.localeCompare(`${b.city} ${b.address}`);
      });

      setSelectedRestaurant(normalizedRestaurant);
      setBrandRestaurantCount(restaurantIdsForBrand.length);
      setRestaurantBranches(branches);
      setRestaurantMenuItems(menuItems);
      setRestaurantOffers(offers);

      return {
        restaurant: normalizedRestaurant,
        branches,
        menuItems,
        offers,
      };
    } catch (err) {
      console.error(err);
      setSelectedRestaurant(null);
      setBrandRestaurantCount(1);
      setRestaurantBranches([]);
      setRestaurantMenuItems([]);
      setRestaurantOffers([]);
      setRestaurantDetailsError("Could not load this restaurant right now.");
      return null;
    } finally {
      setRestaurantDetailsLoading(false);
    }
  };

  const handleRestaurantSelect = (restaurant) => {
    const restaurantId = restaurant?.id;
    if (!restaurantId) return;
    window.location.hash = `/restaurant/${restaurantId}`;
  };

  const handleBranchSelect = (restaurantId, branchId) => {
    if (!restaurantId || branchId === undefined || branchId === null || branchId === "") return;
    window.location.hash = `/restaurant/${restaurantId}/branch/${encodeURIComponent(String(branchId))}`;
  };

  const getStoredNearbyCoords = () => {
    try {
      const raw = localStorage.getItem(NEARBY_COORDS_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const latitude = Number(parsed?.latitude);
      const longitude = Number(parsed?.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return { latitude, longitude };
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const resolveLocationCoordinates = async (query) => {
    const trimmed = (query || "").trim();
    if (!trimmed) return null;

    const params = new URLSearchParams({
      q: trimmed,
      format: "jsonv2",
      limit: "1",
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to geocode address");
    }

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      return null;
    }

    const first = results[0];
    const latitude = Number(first?.lat);
    const longitude = Number(first?.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      latitude,
      longitude,
      displayName: first?.display_name || trimmed,
    };
  };

  const handleFindFood = async () => {
    setNearbyError("");

    const queryInput = locationQuery.trim();
    if (queryInput) {
      setFindingFood(true);
      try {
        const resolved = await resolveLocationCoordinates(queryInput);
        if (!resolved) {
          setNearbyError("Address not found. Try a more specific location.");
          return;
        }

        setLocationQuery(resolved.displayName);
        await fetchNearbyRestaurants(resolved.latitude, resolved.longitude);
      } catch (err) {
        console.error(err);
        setNearbyError("Could not locate that address right now.");
      } finally {
        setFindingFood(false);
      }
      return;
    }

    if (!navigator.geolocation) {
      setNearbyError("Geolocation is not supported in this browser.");
      return;
    }

    setFindingFood(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchNearbyRestaurants(latitude, longitude);
        setLocationQuery("Current location");
        setFindingFood(false);
      },
      (geoErr) => {
        console.error(geoErr);
        setFindingFood(false);
        setNearbyError("Please allow location access to find nearby restaurants.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const fetchCurrentUser = async () => {
    if (!token) {
      setCurrentUser(null);
      return null;
    }
    try {
      const res = await authenticatedFetch(`${API_BASE}/auth/me`);
      if (!res.ok) {
        setCurrentUser(null);
        return null;
      }
      const data = await res.json();
      setCurrentUser(data);
      return data;
    } catch (err) {
      console.error(err);
      setCurrentUser(null);
      return null;
    }
  };

  const fetchMyOrders = async () => {
    if (!token) {
      setMyOrders([]);
      setMyOrdersError("Please login to see your orders.");
      return;
    }

    const ensuredUser = currentUser || (await fetchCurrentUser());

    const userId =
      ensuredUser?.id ??
      ensuredUser?.Id ??
      ensuredUser?.userId ??
      ensuredUser?.UserId ??
      getUserIdFromJwt() ??
      "";

    setMyOrdersLoading(true);
    setMyOrdersError("");
    try {
      let data = null;

      const myRes = await authenticatedFetch(`${API_BASE}/orders/my`);
      if (myRes.ok) {
        data = await myRes.json();
      } else {
        if (!userId) {
          const errData = await myRes.json().catch(() => null);
          setMyOrders([]);
          setMyOrdersError(extractErrorMessage(errData, "Could not identify your account."));
          return;
        }

        const fallbackRes = await authenticatedFetch(`${API_BASE}/orders/by-user/${encodeURIComponent(String(userId))}`);
        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => null);
          setMyOrders([]);
          setMyOrdersError(extractErrorMessage(errData, "Could not load your orders."));
          return;
        }
        data = await fallbackRes.json();
      }

      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

      const normalized = list.map((order) => {
        const rawStatus = order?.statusi ?? order?.Statusi ?? "Pending";
        const rawPayment = order?.metodaPageses ?? order?.MetodaPageses ?? "";

        const statusLabel = normalizeStatusLabel(rawStatus);

        const paymentLabel =
          typeof rawPayment === "number"
            ? PAYMENT_METHOD_LABELS[rawPayment] || `Method ${rawPayment}`
            : String(rawPayment || "");

        const items = Array.isArray(order?.orderItems)
          ? order.orderItems
          : Array.isArray(order?.OrderItems)
            ? order.OrderItems
            : [];

        const normalizedItems = items.map((item, index) => {
          const nestedMenuItem = item?.menuItem ?? item?.MenuItem ?? {};
          const menuItemId = item?.menuItemId ?? item?.MenuItemId ?? nestedMenuItem?.id ?? nestedMenuItem?.Id ?? null;

          const itemName =
            item?.menuItemName ??
            item?.MenuItemName ??
            item?.itemName ??
            item?.ItemName ??
            item?.name ??
            item?.Name ??
            nestedMenuItem?.name ??
            nestedMenuItem?.Name ??
            nestedMenuItem?.emertimi ??
            nestedMenuItem?.Emertimi ??
            `Item ${index + 1}`;

          const itemImage = toAbsoluteAssetUrl(
            item?.menuItemImage ??
              item?.MenuItemImage ??
              item?.image ??
              item?.Image ??
              item?.foto ??
              item?.Foto ??
              nestedMenuItem?.image ??
              nestedMenuItem?.Image ??
              nestedMenuItem?.foto ??
              nestedMenuItem?.Foto ??
              ""
          );
          const rawImagePath =
            item?.menuItemImage ??
            item?.MenuItemImage ??
            item?.image ??
            item?.Image ??
            item?.foto ??
            item?.Foto ??
            nestedMenuItem?.image ??
            nestedMenuItem?.Image ??
            nestedMenuItem?.foto ??
            nestedMenuItem?.Foto ??
            "";
          const imageCandidates = getAssetUrlCandidates(rawImagePath);

          return {
            id: item?.id ?? item?.Id ?? item?.menuItemId ?? item?.MenuItemId ?? index,
            menuItemId,
            name: String(itemName || "Item"),
            rawImagePath,
            imageCandidates,
            image: itemImage || imageCandidates[0] || "",
            quantity: Number(item?.sasia ?? item?.Sasia ?? item?.quantity ?? item?.Quantity ?? 1),
          };
        });

        const totalItemsCount = normalizedItems.reduce(
          (sum, item) => sum + Math.max(1, Number(item.quantity || 1)),
          0
        );

        return {
          id: order?.id ?? order?.Id,
          statusLabel,
          paymentLabel,
          total: Number(order?.shumaTotale ?? order?.ShumaTotale ?? 0),
          deliveryFee: Number(order?.tarifaDorezimit ?? order?.TarifaDorezimit ?? 0),
          address: order?.adresaDorezimit ?? order?.AdresaDorezimit ?? "",
          note: order?.shenimet ?? order?.Shenimet ?? "",
          createdAt: order?.dataPorosis ?? order?.DataPorosis ?? "",
          restaurantName:
            order?.restaurant?.name ??
            order?.restaurant?.Name ??
            order?.restaurant?.emertimi ??
            order?.restaurant?.Emertimi ??
            "Restaurant",
          itemsCount: totalItemsCount,
          items: normalizedItems,
        };
      });

      const hasItemsMissingDetails = normalized.some((order) =>
        (order.items || []).some(
          (item) => item?.menuItemId && (!item.image || !item.name || /^Item\s\d+$/i.test(String(item.name || "")))
        )
      );

      if (!hasItemsMissingDetails) {
        setMyOrders(normalized);
        return;
      }

      const menuLookup = await fetchMenuItemsLookup();
      const enrichedOrders = normalized.map((order) => ({
        ...order,
        items: (order.items || []).map((item) => {
          const menuMatch = item?.menuItemId ? menuLookup.get(String(item.menuItemId)) : null;
          return {
            ...item,
            name: item.name && !/^Item\s\d+$/i.test(String(item.name)) ? item.name : menuMatch?.name || item.name,
            imageCandidates:
              Array.isArray(item?.imageCandidates) && item.imageCandidates.length > 0
                ? item.imageCandidates
                : menuMatch?.imageCandidates || getAssetUrlCandidates(item?.rawImagePath || item?.image || ""),
            image: item.image || menuMatch?.image || "",
          };
        }),
      }));

      setMyOrders(enrichedOrders);
    } catch (err) {
      console.error(err);
      setMyOrders([]);
      setMyOrdersError("Could not load your orders.");
    } finally {
      setMyOrdersLoading(false);
    }
  };

  const fetchOperationalOrders = async () => {
    if (!token) {
      setRoleOrders([]);
      setRoleOrdersError("Please login to manage operational orders.");
      return;
    }

    if (!canManageOperationalOrders) {
      setRoleOrders([]);
      setRoleOrdersError("This role cannot manage operational orders.");
      return;
    }

    setRoleOrdersLoading(true);
    setRoleOrdersError("");
    setRoleActionMessage("");

    try {
      const resolvedMerchantRestaurantId =
        currentUser?.restaurantId ??
        currentUser?.RestaurantId ??
        currentUser?.merchantRestaurantId ??
        currentUser?.MerchantRestaurantId ??
        currentUser?.branchRestaurantId ??
        currentUser?.BranchRestaurantId ??
        null;

      const merchantRestaurantId = Number(resolvedMerchantRestaurantId);
      const merchantRestaurantEndpoints = Number.isFinite(merchantRestaurantId) && merchantRestaurantId > 0
        ? [
            `${API_BASE}/orders/by-restaurant/${merchantRestaurantId}`,
            `${API_BASE}/orders/restaurant/${merchantRestaurantId}`,
            `${API_BASE}/orders?restaurantId=${merchantRestaurantId}`,
          ]
        : [];

      const endpoints = isCourierRole
        ? [
            `${API_BASE}/orders/ready`,
            `${API_BASE}/orders/status/ready`,
            `${API_BASE}/orders?status=ready`,
            `${API_BASE}/orders/courier`,
            `${API_BASE}/orders/available-for-courier`,
            `${API_BASE}/orders/all`,
            `${API_BASE}/orders`,
          ]
        : isMerchantRole
          ? [
              ...merchantRestaurantEndpoints,
              `${API_BASE}/orders/merchant`,
              `${API_BASE}/orders/for-merchant`,
              `${API_BASE}/orders/my-restaurant`,
              `${API_BASE}/orders/pending`,
              `${API_BASE}/orders/in-progress`,
              `${API_BASE}/orders/my`,
              `${API_BASE}/orders/all`,
              `${API_BASE}/orders`,
            ]
          : [
              `${API_BASE}/orders/pending`,
              `${API_BASE}/orders/in-progress`,
              `${API_BASE}/orders/all`,
              `${API_BASE}/orders`,
              `${API_BASE}/orders/admin`,
            ];

      let list = [];
      let loaded = false;
      const failedEndpoints = [];

      for (const endpoint of endpoints) {
        const res = await authenticatedFetch(endpoint);
        if (!res.ok) {
          failedEndpoints.push(`${endpoint} (HTTP ${res.status})`);
          continue;
        }

        const data = await res.json().catch(() => null);
        const candidate = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        loaded = true;

        if (candidate.length > 0 || endpoint === endpoints[endpoints.length - 1]) {
          list = candidate;
          break;
        }
      }

      if (!loaded) {
        setRoleOrders([]);
        setRoleOrdersError(
          failedEndpoints.length > 0
            ? `Could not load operational orders for this role. Tried endpoints: ${failedEndpoints.join(" | ")}`
            : "Could not load operational orders for this role."
        );
        return;
      }

      const normalized = list.map((order) => {
        const rawStatus = order?.statusi ?? order?.Statusi ?? "Pending";
        const rawPayment = order?.metodaPageses ?? order?.MetodaPageses ?? "";
        const statusLabel = normalizeStatusLabel(rawStatus);

        const paymentLabel =
          typeof rawPayment === "number"
            ? PAYMENT_METHOD_LABELS[rawPayment] || `Method ${rawPayment}`
            : String(rawPayment || "");

        const items = Array.isArray(order?.orderItems)
          ? order.orderItems
          : Array.isArray(order?.OrderItems)
            ? order.OrderItems
            : [];

        const normalizedItems = items.map((item, index) => {
          const nestedMenuItem = item?.menuItem ?? item?.MenuItem ?? {};
          const menuItemId = item?.menuItemId ?? item?.MenuItemId ?? nestedMenuItem?.id ?? nestedMenuItem?.Id ?? null;
          const rawImagePath =
            item?.menuItemImage ?? item?.MenuItemImage ??
            item?.image ?? item?.Image ??
            item?.foto ?? item?.Foto ??
            nestedMenuItem?.image ?? nestedMenuItem?.Image ??
            nestedMenuItem?.foto ?? nestedMenuItem?.Foto ?? "";
          return {
            id: item?.id ?? item?.Id ?? menuItemId ?? index,
            menuItemId,
            name:
              item?.menuItemName ?? item?.MenuItemName ??
              item?.itemName ?? item?.ItemName ??
              item?.name ?? item?.Name ??
              nestedMenuItem?.name ?? nestedMenuItem?.Name ??
              nestedMenuItem?.emertimi ?? nestedMenuItem?.Emertimi ??
              `Item ${index + 1}`,
            rawImagePath,
            image: toAbsoluteAssetUrl(rawImagePath),
            imageCandidates: getAssetUrlCandidates(rawImagePath),
            price: Number(
              item?.cmimi ?? item?.Cmimi ?? item?.price ?? item?.Price ??
              item?.unitPrice ?? item?.UnitPrice ?? item?.cmimiNjesi ?? item?.CmimiNjesi ?? 0
            ),
            quantity: Number(item?.sasia ?? item?.Sasia ?? item?.quantity ?? item?.Quantity ?? 1),
          };
        });

        const totalItemsCount = normalizedItems.reduce(
          (sum, item) => sum + Math.max(1, Number(item.quantity || 1)),
          0
        );

        return {
          id: order?.id ?? order?.Id,
          statusLabel,
          paymentLabel,
          total: Number(order?.shumaTotale ?? order?.ShumaTotale ?? 0),
          deliveryFee: Number(order?.tarifaDorezimit ?? order?.TarifaDorezimit ?? 0),
          address: order?.adresaDorezimit ?? order?.AdresaDorezimit ?? "",
          note: order?.shenimet ?? order?.Shenimet ?? "",
          createdAt: order?.dataPorosis ?? order?.DataPorosis ?? "",
          restaurantName:
            order?.restaurant?.name ??
            order?.restaurant?.Name ??
            order?.restaurant?.emertimi ??
            order?.restaurant?.Emertimi ??
            "Restaurant",
          customerName:
            order?.user?.name ?? order?.user?.Name ??
            order?.user?.userName ?? order?.user?.UserName ??
            order?.user?.emri ?? order?.user?.Emri ??
            order?.userName ?? order?.UserName ??
            order?.customerName ?? order?.CustomerName ?? "",
          itemsCount: totalItemsCount,
          items: normalizedItems,
        };
      });

      const filteredByRole = normalized.filter((order) => {
        const statusKey = String(order?.statusLabel || "").toLowerCase();
        if (isCourierRole) {
          return ["ready", "delivered"].includes(statusKey);
        }
        return true;
      });

      // Enrich items with images from menu lookup when backend doesn't include them
      const needsEnrichment = filteredByRole.some((order) =>
        (order.items || []).some((item) => item?.menuItemId && !item.image)
      );

      if (needsEnrichment) {
        const menuLookup = await fetchMenuItemsLookup();
        const enriched = filteredByRole.map((order) => ({
          ...order,
          items: (order.items || []).map((item) => {
            if (item.image) return item;
            const match = item?.menuItemId ? menuLookup.get(String(item.menuItemId)) : null;
            return {
              ...item,
              name: item.name && !/^Item\s\d+$/i.test(item.name) ? item.name : match?.name || item.name,
              image: match?.image || item.image || "",
              imageCandidates:
                match?.imageCandidates?.length > 0
                  ? match.imageCandidates
                  : getAssetUrlCandidates(item.rawImagePath || ""),
            };
          }),
        }));
        setRoleOrders(enriched);
      } else {
        setRoleOrders(filteredByRole);
      }
    } catch (err) {
      console.error(err);
      setRoleOrders([]);
      setRoleOrdersError("Could not load operational orders.");
    } finally {
      setRoleOrdersLoading(false);
    }
  };

  const handleRoleOrderStatusUpdate = async (order, nextStatus) => {
    const orderId = Number(order?.id);
    if (!Number.isFinite(orderId) || !nextStatus) return;

    const normalizedNextStatus = normalizeStatusLabel(nextStatus);
    const statusCode = ORDER_STATUS_CODES[String(normalizedNextStatus).toLowerCase()] || null;

    setRoleActionOrderId(orderId);
    setRoleActionMessage("");

    const payloadVariants = [
      { status: normalizedNextStatus },
      { Status: normalizedNextStatus },
      { newStatus: normalizedNextStatus },
      { NewStatus: normalizedNextStatus },
      ...(statusCode ? [{ status: statusCode }, { Status: statusCode }, { statusi: statusCode }, { Statusi: statusCode }] : []),
      ...(statusCode ? [{ status: normalizedNextStatus, statusCode }] : []),
    ];

    const requestCandidates = [
      { method: "PUT", url: `${API_BASE}/orders/${orderId}/status` },
      { method: "PATCH", url: `${API_BASE}/orders/${orderId}/status` },
      { method: "POST", url: `${API_BASE}/orders/${orderId}/status` },
      { method: "PUT", url: `${API_BASE}/orders/${orderId}/update-status` },
      { method: "PATCH", url: `${API_BASE}/orders/${orderId}/update-status` },
      { method: "POST", url: `${API_BASE}/orders/${orderId}/update-status` },
      { method: "PUT", url: `${API_BASE}/orders/update-status/${orderId}` },
      { method: "PATCH", url: `${API_BASE}/orders/update-status/${orderId}` },
      { method: "POST", url: `${API_BASE}/orders/update-status/${orderId}` },
    ];

    try {
      let updated = false;

      for (const candidate of requestCandidates) {
        for (const payload of payloadVariants) {
          const res = await authenticatedFetch(candidate.url, {
            method: candidate.method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            updated = true;
            break;
          }

          if (![400, 404, 405].includes(res.status)) {
            const errPayload = await res.json().catch(() => null);
            setRoleActionMessage(extractErrorMessage(errPayload, `Failed to update order (HTTP ${res.status}).`));
            setRoleActionOrderId(null);
            return;
          }
        }

        if (updated) break;
      }

      if (!updated) {
        setRoleActionMessage("Order status endpoint not found. Check backend route for status update.");
        return;
      }

      setRoleActionMessage(`Order #${orderId} moved to ${normalizedNextStatus}.`);
      setRoleToastVisible(true);
      clearTimeout(roleToastTimerRef.current);
      roleToastTimerRef.current = setTimeout(() => setRoleToastVisible(false), 3500);
      setRoleOrders((current) =>
        current.map((entry) =>
          Number(entry?.id) === orderId
            ? {
                ...entry,
                statusLabel: normalizedNextStatus,
              }
            : entry
        )
      );
    } catch (err) {
      console.error(err);
      setRoleActionMessage("Could not update order status right now.");
      setRoleToastVisible(true);
      clearTimeout(roleToastTimerRef.current);
      roleToastTimerRef.current = setTimeout(() => setRoleToastVisible(false), 4000);
    } finally {
      setRoleActionOrderId(null);
    }
  };

  const handleSignup = async () => {
    setSignupMessage("");
    const normalizedUsername = signupUsername.trim();
    const normalizedEmail = signupEmail.trim();

    if (!normalizedUsername || !normalizedEmail || !signupPassword) {
      setSignupMessage("Please fill all signup fields.");
      return;
    }

    if (signupPassword.length < 6) {
      setSignupMessage("Password should be at least 6 characters.");
      return;
    }

    const normalizedRole = ["Customer", "Merchant", "Courier", "Admin"].includes(signupRole) ? signupRole : "Customer";

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: normalizedUsername,
          email: normalizedEmail,
          password: signupPassword,
          role: normalizedRole,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSignupMessage(extractErrorMessage(data, "Signup failed"));
        return;
      }
      setSignupMessage("Signup successful! You can now login.");
      setTimeout(() => {
        closeModal("#signupModal");
        setSignupMessage("");
        setSignupUsername("");
        setSignupEmail("");
        setSignupPassword("");
        setSignupRole("Customer");
      }, 1500);
    } catch (err) {
      console.error(err);
      setSignupMessage("Signup error. Please try again.");
    }
  };

  const handleLogin = async () => {
    setLoginMessage("");
    const normalizedCredential = loginUsername.trim();

    if (!normalizedCredential || !loginPassword) {
      setLoginMessage("Please enter username/email and password.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: normalizedCredential,
          password: loginPassword,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setLoginMessage(extractErrorMessage(data, "Login failed. Check your credentials."));
        return;
      }
      if (data.token) {
        persistToken(data.token);
        setLoginMessage("Login successful! Welcome back");
        await fetchCurrentUser();
        setTimeout(async () => {
          closeModal("#loginModal");
          setLoginMessage("");
          setLoginUsername("");
          setLoginPassword("");
          await fetchCategories();
          if (selectedCategory) {
            await fetchRestaurantsByCategory(selectedCategory);
          }
        }, 1000);
      } else {
        setLoginMessage("Login successful (no token returned)");
        closeModal("#loginModal");
        await fetchCurrentUser();
      }
    } catch (err) {
      console.error(err);
      setLoginMessage("Login error. Please try again.");
    }
  };

  const handleLogout = async () => {
    persistToken("");
    setCurrentUser(null);
    setLoginUsername("");
    setLoginPassword("");
    setLoginMessage("");
    setSignupMessage("");
    setSignupRole("Customer");
    clearCart();
    setCartCount(0);
    setOrderMessage("");
    setSearch("");
    setSelectedCategory("");
    setRestaurants([]);
    setSelectedRestaurant(null);
    setRestaurantBranches([]);
    setRestaurantMenuItems([]);
    setRestaurantOffers([]);
    setRestaurantDetailsError("");
    setPage("home");
    window.location.hash = "/";

    try {
      await fetch(`${API_BASE}/auth/revoke`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAddress = async () => {
    try {
      const res = await authenticatedFetch(`${API_BASE}/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Country: addressCountry,
          City: addressCity,
          Adresa: addressStreet,
          PostalCode: addressPostal,
        }),
      });
      if (!res.ok) throw new Error("Failed to save address");
      closeModal("#locationModal");
      setAddressCountry("");
      setAddressCity("");
      setAddressStreet("");
      setAddressPostal("");
    } catch (err) {
      console.error(err);
      alert("Could not save address. Make sure you are logged in.");
    }
  };

  const closeModal = (selector) => {
    const resetModalUiState = () => {
      document.body.classList.remove("modal-open");
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("padding-right");
      document.querySelectorAll(".modal-backdrop").forEach((backdrop) => backdrop.remove());
    };

    const el = document.querySelector(selector);
    if (!el) {
      resetModalUiState();
      return;
    }

    const modalInstance = window.bootstrap?.Modal.getInstance(el);
    if (modalInstance) {
      modalInstance.hide();
      window.setTimeout(resetModalUiState, 200);
    } else {
      el.classList.remove("show");
      el.style.display = "none";
      resetModalUiState();
    }
  };

  const scrollCategories = (direction) => {
    const slider = categoriesSliderRef.current;
    if (!slider) return;
    const scrollAmount = 320;
    slider.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    fetchCategories();
    if (token) fetchCurrentUser();
  }, [token]);

  useEffect(() => {
    const stored = loadCartFromStorage();
    setCartItems(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem(ORDER_CART_KEY, JSON.stringify(cartItems));
    const totalQty = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    setCartCount(totalQty);
  }, [cartItems]);

  useEffect(() => {
    const hydrateCartItemsFromMenu = async () => {
      const hasMissingImage = cartItems.some((item) => item?.menuItemId && !item?.image);
      if (!hasMissingImage) return;

      const menuLookup = await fetchMenuItemsLookup();
      if (!menuLookup.size) return;

      setCartItems((current) => {
        let changed = false;
        const next = current.map((item) => {
          if (item?.image || !item?.menuItemId) return item;
          const menuMatch = menuLookup.get(String(item.menuItemId));
          if (!menuMatch?.image) return item;
          changed = true;

          return {
            ...item,
            name: item?.name || menuMatch.name,
            imageCandidates:
              Array.isArray(item?.imageCandidates) && item.imageCandidates.length > 0
                ? item.imageCandidates
                : menuMatch.imageCandidates || [],
            image: menuMatch.image,
          };
        });

        return changed ? next : current;
      });
    };

    hydrateCartItemsFromMenu();
  }, [cartItems]);

  useEffect(() => {
    if (deliveryAddress) return;
    const combinedAddress = [addressStreet, addressCity, addressCountry].filter(Boolean).join(", ");
    if (combinedAddress) {
      setDeliveryAddress(combinedAddress);
    }
  }, [addressStreet, addressCity, addressCountry, deliveryAddress]);

  useEffect(() => {
    const scrubAutofilledEmail = () => {
      const el = searchInputRef.current;
      if (!el) return;
      const candidate = (el.value || "").trim();
      const looksLikeEmail = /\S+@\S+\.\S+/.test(candidate);
      if (looksLikeEmail) {
        setSearch("");
        el.value = "";
      }
    };

    const timer = window.setTimeout(scrubAutofilledEmail, 250);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const syncRouteFromHash = async () => {
      const route = getRouteState();
      setPage(route.page);
      setActiveRestaurantId(route.restaurantId);
      setActiveBranchId(route.branchId || "");

      if (route.page === "myOrders") {
        if (canManageOperationalOrders) {
          setNewOrderCount(0);
          knownOrderIdsRef.current = null; // reset so next poll re-baselines
          await fetchOperationalOrders();
        } else {
          await fetchMyOrders();
        }
        return;
      }

      if (route.page === "branchMenu") {
        if (route.restaurantId && route.branchId) {
          const data = await fetchRestaurantDetails(route.restaurantId);
          if (data) {
            const matchedBranch = data.branches.find((branch) => String(branch.id) === String(route.branchId));
            if (!matchedBranch && data.branches.length > 0) {
              setActiveBranchId(String(data.branches[0].id));
            }
          }
          return;
        }

        window.location.hash = "/";
        return;
      }

      if (route.page === "cart") {
        if (route.restaurantId) {
          await fetchRestaurantDetails(route.restaurantId);
        }
        return;
      }

      if (route.page === "restaurantDetails") {
        if (route.restaurantId) {
          await fetchRestaurantDetails(route.restaurantId);
          return;
        }

        window.location.hash = "/";
        return;
      }

      if (route.page === "restaurants" && route.category) {
        setSelectedCategory(route.category);
        setSelectedRestaurant(null);
        setBrandRestaurantCount(1);
        setRestaurantBranches([]);
        setRestaurantMenuItems([]);
        setRestaurantOffers([]);
        setRestaurantDetailsError("");
        if (route.category.toLowerCase() === "nearby") {
          const coords = getStoredNearbyCoords();
          if (coords) {
            await fetchNearbyRestaurants(coords.latitude, coords.longitude);
          } else {
            setRestaurants([]);
            setNearbyError("Use Find Food to load nearby restaurants.");
          }
          return;
        }
        await fetchRestaurantsByCategory(route.category);
      } else {
        setSelectedCategory("");
        setNearbyError("");
        setRestaurants([]);
        setSelectedRestaurant(null);
        setBrandRestaurantCount(1);
        setRestaurantBranches([]);
        setRestaurantMenuItems([]);
        setRestaurantOffers([]);
        setRestaurantDetailsError("");
      }
    };

    syncRouteFromHash();
    window.addEventListener("hashchange", syncRouteFromHash);

    return () => {
      window.removeEventListener("hashchange", syncRouteFromHash);
    };
  }, [token, normalizedCurrentUserRole]);

  useEffect(() => {
    const shouldUseRealtime = page === "myOrders" && Boolean(token);
    if (!shouldUseRealtime) {
      const existing = orderHubConnectionRef.current;
      orderHubConnectionRef.current = null;
      subscribedOrderGroupsRef.current = new Set();

      if (existing) {
        existing.stop().catch((err) => console.error("Failed to stop order hub connection", err));
      }
      return undefined;
    }

    let isDisposed = false;

    const setupRealtimeConnection = async () => {
      if (orderHubConnectionRef.current) {
        await syncOrderHubGroups(orderHubConnectionRef.current, myOrders);
        return;
      }

      const apiOrigin = API_BASE.replace(/\/api\/?$/, "");
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${apiOrigin}/orderHub`, {
          accessTokenFactory: () => getStoredToken(),
          withCredentials: true,
        })
        .withAutomaticReconnect()
        .build();

      connection.on("OrderStatusUpdated", (payload) => {
        const payloadOrderId = Number(payload?.OrderId ?? payload?.orderId);
        const nextStatus = normalizeStatusLabel(payload?.NewStatus ?? payload?.newStatus);

        if (!Number.isFinite(payloadOrderId) || !nextStatus) {
          return;
        }

        setMyOrders((current) =>
          current.map((order) =>
            Number(order?.id) === payloadOrderId
              ? {
                  ...order,
                  statusLabel: String(nextStatus),
                }
              : order
          )
        );

        setRoleOrders((current) =>
          current.map((order) =>
            Number(order?.id) === payloadOrderId
              ? {
                  ...order,
                  statusLabel: String(nextStatus),
                }
              : order
          )
        );
      });

      connection.onreconnected(async () => {
        if (isDisposed) return;
        subscribedOrderGroupsRef.current = new Set();
        await syncOrderHubGroups(connection, myOrders);
      });

      try {
        await connection.start();
        if (isDisposed) {
          await connection.stop();
          return;
        }

        orderHubConnectionRef.current = connection;
        await syncOrderHubGroups(connection, myOrders);
      } catch (err) {
        console.error("Failed to connect order hub", err);
      }
    };

    setupRealtimeConnection();

    return () => {
      isDisposed = true;
    };
  }, [page, token]);

  useEffect(() => {
    if (page !== "myOrders" || !token) return;

    const connection = orderHubConnectionRef.current;
    if (!connection) return;

    syncOrderHubGroups(connection, myOrders);
  }, [myOrders, page, token]);

  // ── MERCHANT POLLING: detect new Pending orders ──
  const audioCtxRef = React.useRef(null);
  const pageRef = React.useRef(page);
  React.useEffect(() => { pageRef.current = page; }, [page]);

  // Ensure AudioContext exists and is running. Must be called inside a user-gesture handler.
  const ensureAudioCtx = React.useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) { return null; }
    }
    return audioCtxRef.current;
  }, []);

  const doBeeps = React.useCallback((ctx) => {
    // Urgent alarm — rising tone bursts, long and attention-grabbing
    const beep = (freq, startSec, dur, vol = 0.7) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth"; // harsh buzzy alarm tone
      osc.frequency.value = freq;
      const t = ctx.currentTime + startSec;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.015);
      gain.gain.setValueAtTime(vol, t + dur - 0.015);
      gain.gain.linearRampToValueAtTime(0, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    };
    // Pattern: fast rising bursts x5, pause, x5 again
    // Burst 1
    beep(900,  0.00, 0.12);
    beep(1100, 0.15, 0.12);
    beep(900,  0.30, 0.12);
    beep(1100, 0.45, 0.12);
    beep(900,  0.60, 0.12);
    beep(1100, 0.75, 0.12);
    // pause 0.3s
    // Burst 2 — louder
    beep(950,  1.10, 0.13, 0.8);
    beep(1150, 1.26, 0.13, 0.8);
    beep(950,  1.42, 0.13, 0.8);
    beep(1150, 1.58, 0.13, 0.8);
    beep(950,  1.74, 0.13, 0.8);
    beep(1150, 1.90, 0.13, 0.8);
    // pause 0.3s
    // Burst 3 — highest
    beep(1000, 2.25, 0.14, 0.85);
    beep(1250, 2.42, 0.14, 0.85);
    beep(1000, 2.59, 0.14, 0.85);
    beep(1250, 2.76, 0.14, 0.85);
    beep(1000, 2.93, 0.14, 0.85);
    beep(1250, 3.10, 0.18, 0.85);
  }, []);

  // Called from polling (outside user gesture) — resumes ctx then plays
  const playNewOrderSound = React.useCallback(async () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return; // no user gesture yet, skip
    try {
      if (ctx.state !== "running") await ctx.resume();
      doBeeps(ctx);
    } catch (_) {}
  }, [doBeeps]);

  // Called directly from button click — guaranteed to work
  const playTestSound = React.useCallback(() => {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    // If suspended, resume() returns a promise but we can still schedule
    // because the resume happens synchronously from the gesture context
    if (ctx.state === "suspended") {
      ctx.resume().then(() => doBeeps(ctx)).catch(() => {});
    } else {
      doBeeps(ctx);
    }
  }, [ensureAudioCtx, doBeeps]);

  useEffect(() => {
    if (!isMerchantRole || !token) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      knownOrderIdsRef.current = null;
      setNewOrderCount(0);
      return;
    }

    const poll = async () => {
      try {
        const resolvedId =
          currentUser?.restaurantId ?? currentUser?.RestaurantId ??
          currentUser?.merchantRestaurantId ?? currentUser?.MerchantRestaurantId ?? null;
        const rid = Number(resolvedId);
        const ridEndpoints = Number.isFinite(rid) && rid > 0
          ? [`${API_BASE}/orders/by-restaurant/${rid}`, `${API_BASE}/orders/restaurant/${rid}`]
          : [];
        // Same fallback chain as fetchOperationalOrders so we always find data
        const endpoints = [
          ...ridEndpoints,
          `${API_BASE}/orders/merchant`,
          `${API_BASE}/orders/for-merchant`,
          `${API_BASE}/orders/my-restaurant`,
          `${API_BASE}/orders/my`,
          `${API_BASE}/orders`,
        ];

        let orders = [];
        for (const ep of endpoints) {
          const res = await authenticatedFetch(ep);
          if (!res.ok) continue;
          const data = await res.json().catch(() => null);
          const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
          if (list.length > 0 || ep === endpoints[endpoints.length - 1]) { orders = list; break; }
        }

        const pendingIds = new Set(
          orders
            .filter(o => normalizeStatusLabel(o?.statusi ?? o?.Statusi ?? "").toLowerCase() === "pending")
            .map(o => String(o?.id ?? o?.Id))
        );

        if (knownOrderIdsRef.current === null) {
          // First load — just record, no notification
          knownOrderIdsRef.current = pendingIds;
          return;
        }

        const brandNew = [...pendingIds].filter(id => !knownOrderIdsRef.current.has(id));
        if (brandNew.length > 0) {
          knownOrderIdsRef.current = new Set([...knownOrderIdsRef.current, ...pendingIds]);
          setNewOrderCount(c => c + brandNew.length);
          playNewOrderSound();
          setRoleActionMessage(`🔔 ${brandNew.length} new order${brandNew.length > 1 ? "s" : ""} arrived!`);
          setRoleToastVisible(true);
          clearTimeout(roleToastTimerRef.current);
          roleToastTimerRef.current = setTimeout(() => setRoleToastVisible(false), 5000);
          // Always refresh the board — use pageRef to avoid stale closure
          fetchOperationalOrders();
        } else {
          // keep known set in sync with any resolved orders
          knownOrderIdsRef.current = new Set([...knownOrderIdsRef.current, ...pendingIds]);
          // Also silently refresh board every poll if on myOrders
          if (pageRef.current === "myOrders") {
            fetchOperationalOrders();
          }
        }
      } catch (_) {}
    };

    // Run once immediately, then every 5s
    poll();
    pollingIntervalRef.current = setInterval(poll, 5000);

    return () => {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    };
  }, [isMerchantRole, token, currentUser, page]);

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar fixed-top custom-navbar">
        <div className="container-fluid px-4 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <img src={logo} width="40" alt="logo" />
            <span className="ms-2 fw-bold">BlinkBite</span>
          </div>

          <div className="search-box d-none d-md-block">
            <input
              ref={searchInputRef}
              type="search"
              name="restaurant-search"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-lpignore="true"
              readOnly={!searchInputUnlocked}
              placeholder="Search restaurants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchInputUnlocked(true)}
              onPointerDown={() => setSearchInputUnlocked(true)}
            />
          </div>

          <div className="d-flex align-items-center gap-2">
            {token && isMerchantRole && (
           <button
           className="btn btn-outline-info"
            onClick={() => {
           window.location.hash = "/merchant/dashboard";
             }}
    >
                   Merchant Dashboard
             </button>
              )}
           
             {token && isCourierRole && (
    <button
      className="btn btn-outline-info"
      onClick={() => {
        window.location.hash = "/driver/dashboard";
      }}
    >
      🚚 Driver Dashboard
    </button>
  )}
            <button

            
              className="btn btn-light"
              data-bs-toggle="modal"
              data-bs-target="#locationModal"
            >
              📍 Prishtina
            </button>

            <div className="dropdown">
              <button className="btn btn-light dropdown-toggle" data-bs-toggle="dropdown">
                Partners
              </button>
              <ul className="dropdown-menu shadow p-2">
                <li>
                  <a className="dropdown-item" href="/couriers">
                    🚴 For Couriers
                    <p className="small text-muted mb-0">Earn delivering orders</p>
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/merchants">
                    🍔 For Merchants
                    <p className="small text-muted mb-0">Grow your business</p>
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/companies">
                    🏢 For Companies
                    <p className="small text-muted mb-0">Office solutions</p>
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/blinkbite-drive">
                    🚚 BlinkBite Drive
                    <p className="small text-muted mb-0">Delivery service</p>
                  </a>
                </li>
              </ul>
            </div>

            <button className="btn position-relative" onClick={openCartPage}>
              <i className="bi bi-cart3 fs-5"></i>
              <span className="cart-badge">{cartCount || 0}</span>
            </button>

            {token ? (
              <>
                <button
                  className="btn btn-outline-primary nav-orders-btn"
                  onClick={() => {
                    setNewOrderCount(0);
                    window.location.hash = "/my-orders";
                  }}
                >
                  {canManageOperationalOrders ? "Orders Dashboard" : "My Orders"}
                  {newOrderCount > 0 && (
                    <span className="nav-new-order-badge">{newOrderCount}</span>
                  )}
                </button>
                {/* ✅ Username i rregulluar */}
                <div className="me-2">
                  <span className="small text-muted">Hi, {currentUser?.userName || "User"}</span>
                  {currentUserRole && (
                    <div>
                      <span className="badge text-bg-light border">{currentUserRole}</span>
                    </div>
                  )}
                </div>
                <button className="btn btn-outline-danger" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#loginModal">
                  Login
                </button>
                <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#signupModal">
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* LOCATION MODAL */}
      <div className="modal fade" id="locationModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 shadow">
            <div className="modal-header">
              <h5 className="modal-title">Add New Address</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label>Country</label>
                  <input type="text" className="form-control" placeholder="Enter country" value={addressCountry} onChange={(e) => setAddressCountry(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label>City</label>
                  <input type="text" className="form-control" placeholder="Enter city" value={addressCity} onChange={(e) => setAddressCity(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label>Street & Number</label>
                  <input type="text" className="form-control" placeholder="Street name and number" value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label>Postal Code</label>
                  <input type="text" className="form-control" placeholder="Postal code" value={addressPostal} onChange={(e) => setAddressPostal(e.target.value)} />
                </div>
                <img src={locationImage} alt="Location" className="img-fluid rounded mt-3" />
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-success" onClick={handleSaveAddress}>Save Address</button>
            </div>
          </div>
        </div>
      </div>

      {/* LOGIN MODAL */}
      <div className="modal fade" id="loginModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content p-3 rounded-4 shadow">
            <div className="modal-header">
              <h5 className="modal-title">Login</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              {/* ✅ Tani përdor loginMessage */}
              {loginMessage && (
                <div className={`alert ${loginMessage.includes("successful") ? "alert-success" : "alert-danger"}`}>
                  {loginMessage}
                </div>
              )}
              <input
                type="text"
                name="login-credential"
                autoComplete="username"
                className="form-control mb-3"
                placeholder="Username or Email"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />
              <input
                type="password"
                name="login-password"
                autoComplete="current-password"
                className="form-control mb-3"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button className="btn btn-primary" onClick={handleLogin}>Login</button>
            </div>
          </div>
        </div>
      </div>

      {/* SIGNUP MODAL */}
      <div className="modal fade" id="signupModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content p-3 rounded-4 shadow">
            <div className="modal-header">
              <h5 className="modal-title">Sign Up</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              {/* ✅ Tani përdor signupMessage */}
              {signupMessage && (
                <div className={`alert ${signupMessage.includes("successful") ? "alert-success" : "alert-danger"}`}>
                  {signupMessage}
                </div>
              )}
              <input
                type="text"
                name="signup-username"
                autoComplete="username"
                className="form-control mb-3"
                placeholder="Username"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
              />
              <input
                type="email"
                name="signup-email"
                autoComplete="email"
                className="form-control mb-3"
                placeholder="Email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
              />
              <input
                type="password"
                name="signup-password"
                autoComplete="new-password"
                className="form-control mb-3"
                placeholder="Password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
              />
              <select
                className="form-select mb-2"
                value={signupRole}
                onChange={(e) => setSignupRole(e.target.value)}
              >
                <option value="Customer">Customer</option>
                <option value="Merchant">Merchant</option>
                <option value="Courier">Courier</option>
                <option value="Admin">Admin</option>
              </select>
              <p className="small text-muted mb-0">Choose role during signup to test role-based APIs directly from browser.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button className="btn btn-success" onClick={handleSignup}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>


      <Suspense fallback={<div className="text-center py-5">Loading page...</div>}>
        {page === "home" && (
          <HomePage
            categories={categories}
            selectedCategory={selectedCategory}
            categoriesSliderRef={categoriesSliderRef}
            scrollCategories={scrollCategories}
            locationQuery={locationQuery}
            onLocationQueryChange={setLocationQuery}
            onFindFood={handleFindFood}
            findingFood={findingFood}
            nearbyError={nearbyError}
          />
        )}
         {page === "merchantDashboard" && (
        <MerchantDashboard 
          token={token} 
          onBack={() => {
            window.location.hash = "/";
          }}
        />
      )}

      {page === "trackOrder" && (
  <OrderTracking 
    orderId={route.orderId} 
    token={token} 
  />
)}
        {page === "restaurants" && (
          <RestaurantsPage
            selectedCategory={selectedCategory}
            restaurantsLoading={restaurantsLoading}
            filtered={filtered}
            nearbyError={nearbyError}
            locationQuery={locationQuery}
            onRestaurantSelect={handleRestaurantSelect}
          />
        )}

        {page === "myOrders" && (
          <section className="container cart-page pb-5">
            <div className="mb-4 restaurants-back-wrap d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  if (selectedCategory) {
                    window.location.hash = `/restaurants/${encodeURIComponent(selectedCategory)}`;
                    return;
                  }
                  window.location.hash = "/";
                }}
              >
                <i className="bi bi-arrow-left me-2"></i>Back
              </button>
            </div>

            <h2 className="mb-2">{canManageOperationalOrders ? "Orders Dashboard" : "My Orders"}</h2>
            <p className="small text-muted mb-3">{getRoleCapabilitiesLabel()}</p>
            {isMerchantRole && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary mb-3"
                onClick={playTestSound}
                style={{ fontSize: "0.78rem" }}
              >
                <i className="bi bi-volume-up me-1"></i>Test Sound
              </button>
            )}

            {!canManageOperationalOrders && myOrdersError && <div className="alert alert-warning">{myOrdersError}</div>}
            {canManageOperationalOrders && roleOrdersError && <div className="alert alert-warning">{roleOrdersError}</div>}


            {canManageOperationalOrders ? (
              roleOrdersLoading ? (
                <div className="text-muted">Loading operational orders...</div>
              ) : roleOrders.length === 0 ? (
                <div className="restaurant-menu">
                  <p className="text-muted mb-0">No operational orders found for this role.</p>
                  {isMerchantRole && (
                    <div className="small text-muted mt-2">
                      <div>
                        Merchant debug: RestaurantId on your account is {merchantRestaurantIdForUi ? String(merchantRestaurantIdForUi) : "not assigned"}.
                      </div>
                      <div>
                        To test merchant flow, place an order as Customer in the same restaurant/branch assigned to this Merchant account.
                      </div>
                    </div>
                  )}
                  {isCourierRole && (
                    <p className="small text-muted mt-2 mb-0">
                      Courier sees orders when they reach Ready status.
                    </p>
                  )}
                </div>
              ) : isMerchantRole ? (
                /* ── MERCHANT KANBAN BOARD ── */
                <div className="kanban-board">
                  {[
                    { key: "pending",   label: "New",       statuses: ["pending"],   color: "#f59e0b", icon: "bi-clock" },
                    { key: "accepted",  label: "Accepted",  statuses: ["accepted"],  color: "#8b5cf6", icon: "bi-check-circle" },
                    { key: "preparing", label: "Preparing", statuses: ["preparing"], color: "#3b82f6", icon: "bi-fire" },
                    { key: "ready",     label: "Ready",     statuses: ["ready"],     color: "#10b981", icon: "bi-bag-check" },
                  ].map((col) => {
                    const colOrders = roleOrders.filter(o =>
                      col.statuses.includes(normalizeStatusLabel(o.statusLabel).toLowerCase())
                    );
                    return (
                      <div className="kanban-col" key={col.key}>
                        <div className="kanban-col-header" style={{ borderColor: col.color }}>
                          <i className={`bi ${col.icon}`} style={{ color: col.color }}></i>
                          <span>{col.label}</span>
                          <span className="kanban-col-count" style={{ background: col.color }}>{colOrders.length}</span>
                        </div>
                        <div className="kanban-col-body">
                          {colOrders.length === 0 ? (
                            <div className="kanban-empty">No orders</div>
                          ) : colOrders.map((order) => {
                            const actions = getAvailableActionsForOrder(order);
                            return (
                              <div
                                className="kanban-card"
                                key={order.id}
                                onClick={() => setKanbanDetailOrder(order)}
                                style={{ cursor: "pointer" }}
                              >
                                <div className="kanban-card-top">
                                  <span className="kanban-order-id">#{order.id}</span>
                                  <span className="kanban-amount">€{Number(order.total || 0).toFixed(2)}</span>
                                </div>
                                {order.customerName && (
                                  <p className="kanban-customer-name"><i className="bi bi-person me-1"></i>{order.customerName}</p>
                                )}
                                <p className="kanban-restaurant">{order.restaurantName}</p>
                                <div className="kanban-meta">
                                  <span><i className="bi bi-bag me-1"></i>{order.itemsCount} items</span>
                                  <span><i className="bi bi-geo-alt me-1"></i>{(order.address || "-").split(",")[0]}</span>
                                </div>
                                <div className="kanban-meta mt-1">
                                  <span><i className="bi bi-clock me-1"></i>{order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "-"}</span>
                                  <span><i className="bi bi-cash me-1"></i>{order.paymentLabel || "-"}</span>
                                </div>
                                {actions.length > 0 && (
                                  <div className="kanban-actions" onClick={e => e.stopPropagation()}>
                                    {actions.map((action) => (
                                      <button
                                        key={`${order.id}-${action.nextStatus}`}
                                        type="button"
                                        className="kanban-action-btn"
                                        style={{ background: col.color }}
                                        disabled={Number(roleActionOrderId) === Number(order.id)}
                                        onClick={() => handleRoleOrderStatusUpdate(order, action.nextStatus)}
                                      >
                                        {Number(roleActionOrderId) === Number(order.id) ? (
                                          <><i className="bi bi-hourglass-split me-1"></i>Updating...</>
                                        ) : (
                                          <><i className="bi bi-arrow-right-circle me-1"></i>{action.label}</>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {roleOrders.map((order) => {
                    const actions = getAvailableActionsForOrder(order);

                    return (
                      <div className="restaurant-menu" key={order.id}>
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                          <div>
                            <h5 className="mb-1">Order #{order.id}</h5>
                            <p className="text-muted small mb-0">{order.restaurantName}</p>
                          </div>
                          <span className={`badge ${getStatusBadgeClass(order.statusLabel)}`}>{order.statusLabel}</span>
                        </div>

                        <div className="row g-2 small">
                          <div className="col-md-4">
                            <strong>Total:</strong> EUR {Number(order.total || 0).toFixed(2)}
                          </div>
                          <div className="col-md-4">
                            <strong>Items:</strong> {order.itemsCount}
                          </div>
                          <div className="col-md-4">
                            <strong>Date:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
                          </div>
                        </div>

                        <div className="row g-2 small mt-1">
                          <div className="col-md-8">
                            <strong>Address:</strong> {order.address || "-"}
                          </div>
                          <div className="col-md-4">
                            <strong>Payment:</strong> {order.paymentLabel || "-"}
                          </div>
                        </div>

                        {actions.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2 mt-3">
                            {actions.map((action) => (
                              <button
                                key={`${order.id}-${action.nextStatus}`}
                                type="button"
                                className={action.buttonClass}
                                disabled={Number(roleActionOrderId) === Number(order.id)}
                                onClick={() => handleRoleOrderStatusUpdate(order, action.nextStatus)}
                              >
                                {Number(roleActionOrderId) === Number(order.id) ? "Updating..." : action.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="small text-muted mt-3 mb-0">No available status action for this role at current state.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : myOrdersLoading ? (
              <div className="text-muted">Loading your orders...</div>
            ) : myOrders.length === 0 ? (
              <div className="restaurant-menu">
                <p className="text-muted mb-0">You have no orders yet.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {myOrders.map((order) => (
                  <div className="restaurant-menu" key={order.id}>
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                      <div>
                        <h5 className="mb-1">Order #{order.id}</h5>
                        <p className="text-muted small mb-0">{order.restaurantName}</p>
                      </div>
                      <span className={`badge ${getStatusBadgeClass(order.statusLabel)}`}>{order.statusLabel}</span>
                    </div>

                    <div className="row g-2 small">
                      <div className="col-md-4">
                        <strong>Total:</strong> EUR {Number(order.total || 0).toFixed(2)}
                      </div>
                      <div className="col-md-4">
                        <strong>Delivery Fee:</strong> EUR {Number(order.deliveryFee || 0).toFixed(2)}
                      </div>
                      <div className="col-md-4">
                        <strong>Items:</strong> {order.itemsCount}
                      </div>
                    </div>

                    <div className="row g-2 small mt-1">
                      <div className="col-md-6">
                        <strong>Address:</strong> {order.address || "-"}
                      </div>
                      <div className="col-md-3">
                        <strong>Payment:</strong> {order.paymentLabel || "-"}
                      </div>
                      <div className="col-md-3">
                        <strong>Date:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
                      </div>
                    </div>

                    {order.note && (
                      <p className="small text-muted mt-2 mb-0">
                        <strong>Note:</strong> {order.note}
                      </p>
                    )}

                    {Array.isArray(order.items) && order.items.length > 0 && (
                      <div className="order-items-preview mt-3">
                        {order.items.map((item) => (
                          <div className="order-item-chip" key={`${order.id}-${item.id}-${item.name}`}>
                            <img
                              className="order-item-chip-image"
                              src={item.image || item?.imageCandidates?.[0] || getFoodFallbackImage(item.name)}
                              alt={item.name}
                              data-candidate-index="0"
                              onError={(event) => {
                                applyImageFallbackCandidate(event, item?.imageCandidates, getFoodFallbackImage(item.name));
                              }}
                            />
                            <div className="order-item-chip-copy">
                              <span className="order-item-chip-name">{item.name}</span>
                              {Number(item.quantity || 1) > 1 && (
                                <span className="small text-muted">x{Number(item.quantity)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── ROLE ACTION TOAST ── */}
        {roleActionMessage && (
          <div className={`role-toast ${roleToastVisible ? "role-toast--in" : "role-toast--out"} ${roleActionMessage.toLowerCase().includes("moved") ? "role-toast--success" : "role-toast--error"}`}>
            <i className={`bi ${roleActionMessage.toLowerCase().includes("moved") ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`}></i>
            {roleActionMessage}
          </div>
        )}

        {/* ── KANBAN ORDER DETAIL MODAL ── */}
        {kanbanDetailOrder && (
          <div className="kd-overlay" onClick={() => setKanbanDetailOrder(null)}>
            <div className="kd-modal" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="kd-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <span className="kd-order-id">Order #{kanbanDetailOrder.id}</span>
                  <span className={`badge ${getStatusBadgeClass(kanbanDetailOrder.statusLabel)}`}>{kanbanDetailOrder.statusLabel}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  <span className="kd-total">€{Number(kanbanDetailOrder.total || 0).toFixed(2)}</span>
                  <button className="kd-close" onClick={() => setKanbanDetailOrder(null)}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>

              {/* Customer & info */}
              <div className="kd-info-row">
                <div className="kd-info-cell">
                  <i className="bi bi-person-circle"></i>
                  <div>
                    <div className="kd-info-label">Customer</div>
                    <div className="kd-info-value">{kanbanDetailOrder.customerName || "—"}</div>
                  </div>
                </div>
                <div className="kd-info-cell">
                  <i className="bi bi-geo-alt"></i>
                  <div>
                    <div className="kd-info-label">Address</div>
                    <div className="kd-info-value">{kanbanDetailOrder.address || "—"}</div>
                  </div>
                </div>
                <div className="kd-info-cell">
                  <i className="bi bi-credit-card"></i>
                  <div>
                    <div className="kd-info-label">Payment</div>
                    <div className="kd-info-value">{kanbanDetailOrder.paymentLabel || "—"}</div>
                  </div>
                </div>
                <div className="kd-info-cell">
                  <i className="bi bi-clock"></i>
                  <div>
                    <div className="kd-info-label">Ordered at</div>
                    <div className="kd-info-value">{kanbanDetailOrder.createdAt ? new Date(kanbanDetailOrder.createdAt).toLocaleString() : "—"}</div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="kd-items-title">Order Items</div>
              <div className="kd-items">
                {(kanbanDetailOrder.items || []).length === 0 ? (
                  <p className="text-muted small">No items available.</p>
                ) : (kanbanDetailOrder.items || []).map((item, idx) => (
                  <div className="kd-item" key={item.id ?? idx}>
                    <KanbanItemImage
                      candidates={item.imageCandidates || (item.image ? [item.image] : [])}
                      alt={item.name}
                    />
                    <div className="kd-item-info">
                      <div className="kd-item-name">{item.name}</div>
                      <div className="kd-item-sub">
                        <span>x{Number(item.quantity || 1)}</span>
                        {item.price > 0 && <span>€{(item.price * Number(item.quantity || 1)).toFixed(2)}</span>}
                      </div>
                    </div>
                    {item.price > 0 && (
                      <div className="kd-item-price">€{item.price.toFixed(2)}<span className="kd-item-unit">/ ea</span></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer totals */}
              <div className="kd-footer">
                {kanbanDetailOrder.deliveryFee > 0 && (
                  <div className="kd-footer-row">
                    <span>Delivery fee</span>
                    <span>€{Number(kanbanDetailOrder.deliveryFee).toFixed(2)}</span>
                  </div>
                )}
                <div className="kd-footer-row kd-footer-total">
                  <span>Total</span>
                  <span>€{Number(kanbanDetailOrder.total || 0).toFixed(2)}</span>
                </div>
                {kanbanDetailOrder.note && (
                  <div className="kd-note"><i className="bi bi-chat-left-text me-1"></i>{kanbanDetailOrder.note}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {page === "restaurantDetails" && (
          <RestaurantDetailsPage
            restaurant={selectedRestaurant}
            branches={restaurantBranches}
            menuItems={restaurantMenuItems}
            brandRestaurantCount={brandRestaurantCount}
            loading={restaurantDetailsLoading}
            error={restaurantDetailsError}
            onSelectBranch={(branch) => handleBranchSelect(activeRestaurantId, branch?.id)}
            onBack={() => {
              if (selectedCategory) {
                window.location.hash = `/restaurants/${encodeURIComponent(selectedCategory)}`;
                return;
              }

              window.location.hash = "/";
            }}
            restaurantId={activeRestaurantId}
          />
        )}

        {page === "branchMenu" && (
          <BranchMenuPage
            restaurant={selectedRestaurant}
            branch={restaurantBranches.find((b) => String(b.id) === String(activeBranchId)) || null}
            menuItems={restaurantMenuItems}
            offers={restaurantOffers}
            loading={restaurantDetailsLoading}
            error={restaurantDetailsError}
            onAddToCart={addToCart}
            onOpenCart={openCartPage}
            cartCount={cartCount}
            onBackToBranches={() => {
              if (activeRestaurantId) {
                window.location.hash = `/restaurant/${activeRestaurantId}`;
                return;
              }

              window.location.hash = "/";
            }}
            onBackHome={() => {
              if (selectedCategory) {
                window.location.hash = `/restaurants/${encodeURIComponent(selectedCategory)}`;
                return;
              }

              window.location.hash = "/";
            }}
          />
        )}

        {page === "cart" && (
          <section className="container cart-page pb-5">
            <div className="mb-4 restaurants-back-wrap d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  if (activeRestaurantId && activeBranchId) {
                    window.location.hash = `/restaurant/${activeRestaurantId}/branch/${encodeURIComponent(activeBranchId)}`;
                    return;
                  }
                  if (activeRestaurantId) {
                    window.location.hash = `/restaurant/${activeRestaurantId}`;
                    return;
                  }
                  window.location.hash = "/";
                }}
              >
                <i className="bi bi-arrow-left me-2"></i>Back
              </button>
            </div>

            <h2 className="mb-3">Your Order</h2>

            {orderMessage && (
              <div className={`alert ${orderMessage.toLowerCase().includes("success") ? "alert-success" : "alert-warning"}`}>
                {orderMessage}
              </div>
            )}

            <div className="row g-4">
              <div className="col-lg-8">
                <div className="restaurant-menu">
                  <h5 className="mb-3">Cart Items ({cartCount})</h5>
                  {cartItems.length === 0 ? (
                    <p className="text-muted mb-0">Cart is empty. Add products from the menu.</p>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {cartItems.map((item) => (
                        <div className="menu-item-card" key={`${item.menuItemId}-${item.branchId}`}>
                          <div className="d-flex justify-content-between align-items-start gap-3">
                            <div className="d-flex align-items-start gap-3 cart-item-main">
                              <img
                                className="cart-item-image"
                                src={item.image || item?.imageCandidates?.[0] || getFoodFallbackImage(item.name)}
                                alt={item.name || "Cart item"}
                                data-candidate-index="0"
                                onError={(event) => {
                                  applyImageFallbackCandidate(event, item?.imageCandidates, getFoodFallbackImage(item.name));
                                }}
                              />
                              <div>
                                <h6 className="mb-1">{item.name}</h6>
                                <p className="small text-muted mb-1">{item.restaurantName}</p>
                                {item.branchAddress && <p className="small text-muted mb-2">{item.branchAddress}</p>}
                                <div className="small fw-semibold">EUR {Number(item.price || 0).toFixed(2)}</div>
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => updateCartItemQuantity(item, Number(item.quantity || 1) - 1)}
                              >
                                -
                              </button>
                              <span className="fw-semibold">{item.quantity}</span>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => updateCartItemQuantity(item, Number(item.quantity || 1) + 1)}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => removeCartItem(item)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-lg-4">
                <div className="restaurant-menu cart-summary-sticky">
                  <h5 className="mb-3">Checkout</h5>

                  <div className="mb-3">
                    <label className="form-label">Delivery Address</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Street, city, country"
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="1">Cash</option>
                      <option value="2">Credit Card</option>
                      <option value="3">PayPal</option>
                      <option value="4">Online</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Order Notes (optional)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="No onion, extra spicy..."
                    ></textarea>
                  </div>

                  <div className="d-flex justify-content-between mb-1 small">
                    <span>Subtotal</span>
                    <strong>EUR {cartSubtotal.toFixed(2)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span>Delivery</span>
                    <strong>EUR {cartDeliveryFee.toFixed(2)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="fw-semibold">Total</span>
                    <strong>EUR {cartTotal.toFixed(2)}</strong>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary w-100"
                    disabled={orderSubmitting || cartItems.length === 0 || (normalizedCurrentUserRole && normalizedCurrentUserRole !== "customer")}
                    onClick={handleSubmitOrder}
                  >
                    {orderSubmitting ? "Placing order..." : "Place Order"}
                  </button>
                  {normalizedCurrentUserRole && normalizedCurrentUserRole !== "customer" && (
                    <p className="small text-muted mt-2 mb-0">Place Order is available only for Customer accounts.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
          {page === "driverDashboard" && (
    <DriverDashboard 
      token={token} 
      onBack={() => { window.location.hash = "/"; }}
    />
  )}
      </Suspense>
    </>
  );
}

export default App;