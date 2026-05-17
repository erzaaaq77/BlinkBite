import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import * as signalR from "@microsoft/signalr";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import logo from "./assets/LogoBB.webp";
import locationImage from "./assets/location.webp";
import MenuManagement from "./components/MenuManagement";
const MerchantDashboard = lazy(() => import("./components/MerchantDashboard.jsx"));
const DriverDashboard = lazy(() => import("./components/DriverDashboard"));
const OrderTracking = lazy(() => import("./components/OrderTracking"));



const API_BASE = "http://localhost:5063/api";
const ACCESS_TOKEN_KEY = "access_token";
const NEARBY_COORDS_KEY = "nearby_coords";
const DELIVERY_GEO_CACHE_KEY = "blinkbite_geo_cache_v1";
const ORDER_CART_KEY = "blinkbite_cart_v1";
const MENU_CUSTOMIZATION_KEY = "blinkbite_menu_customizations_v1";
const RESTAURANT_CUSTOMIZATION_KEY = "blinkbite_restaurant_customizations_v1";
const ORDERS_LIST_BATCH_SIZE = 10;
const MY_ORDERS_BATCH_SIZE = 3;
const CART_ITEM_QUICK_REQUESTS = [
  "No onion",
  "No mayo",
  "No ketchup",
  "No spicy",
  "Extra spicy",
  "No cheese",
];
const DELIVERY_FEE_MODE = "distance_tiered";
const DELIVERY_FEE_MODELS = {
  branch_fixed: {
    label: "Branch fixed fee",
  },
  distance_tiered: {
    label: "Distance tiers",
    tiers: [
      { maxKm: 2, fee: 1.0 },
      { maxKm: 5, fee: 2.0 },
      { maxKm: 8, fee: 3.0 },
      { maxKm: 12, fee: 4.5 },
      { maxKm: Infinity, fee: 6.0 },
    ],
  },
  distance_tiered_free_over_20: {
    label: "Distance tiers + free delivery over EUR 20",
    freeOverSubtotal: 20,
    tiers: [
      { maxKm: 2, fee: 1.0 },
      { maxKm: 5, fee: 2.0 },
      { maxKm: 8, fee: 3.0 },
      { maxKm: 12, fee: 4.5 },
      { maxKm: Infinity, fee: 6.0 },
    ],
  },
};

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const calculateDistanceKm = (fromLat, fromLng, toLat, toLng) => {
  const lat1 = toFiniteNumber(fromLat);
  const lon1 = toFiniteNumber(fromLng);
  const lat2 = toFiniteNumber(toLat);
  const lon2 = toFiniteNumber(toLng);

  if ([lat1, lon1, lat2, lon2].some((entry) => entry === null)) return null;

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const findDeliveryTier = (distanceKm, tiers = []) => {
  if (!Number.isFinite(distanceKm)) return null;
  return tiers.find((tier) => distanceKm <= Number(tier.maxKm)) || tiers[tiers.length - 1] || null;
};

const resolveDeliveryPricing = ({ mode, subtotal, baseFee, distanceKm }) => {
  const safeBaseFee = Number.isFinite(Number(baseFee)) ? Math.max(0, Number(baseFee)) : 0;
  const model = DELIVERY_FEE_MODELS[mode] || DELIVERY_FEE_MODELS.branch_fixed;

  if (!model.tiers || !Number.isFinite(distanceKm)) {
    return {
      fee: safeBaseFee,
      modeLabel: model.label,
      usedDistanceKm: null,
      ruleLabel: "Fixed by branch",
    };
  }

  if (Number.isFinite(Number(model.freeOverSubtotal)) && Number(subtotal || 0) >= Number(model.freeOverSubtotal)) {
    return {
      fee: 0,
      modeLabel: model.label,
      usedDistanceKm: distanceKm,
      ruleLabel: `Free over EUR ${Number(model.freeOverSubtotal).toFixed(2)}`,
    };
  }

  const tier = findDeliveryTier(distanceKm, model.tiers);
  if (!tier) {
    return {
      fee: safeBaseFee,
      modeLabel: model.label,
      usedDistanceKm: distanceKm,
      ruleLabel: "Fallback branch fee",
    };
  }

  const upperBoundLabel = Number.isFinite(Number(tier.maxKm)) ? `${Number(tier.maxKm)} km` : "over max range";
  return {
    fee: Math.max(0, Number(tier.fee || 0)),
    modeLabel: model.label,
    usedDistanceKm: distanceKm,
    ruleLabel: `Tier up to ${upperBoundLabel}`,
  };
};
const HomePage = lazy(() => import("./components/HomePage.jsx"));
const RestaurantsPage = lazy(() => import("./components/RestaurantsPage.jsx"));
const RestaurantDetailsPage = lazy(() => import("./components/RestaurantDetailsPage.jsx"));
const BranchMenuPage = lazy(() => import("./components/BranchMenuPage.jsx"));

// Helper: image with multi-candidate fallback for Kanban detail modal
function KanbanItemImage({ candidates = [], alt = "" }) {
  const [idx, setIdx] = React.useState(0);
  const src = candidates[idx] || "";
  if (!src) {
    return <div className="kd-item-img kd-item-img-placeholder"><i className="bi bi-image"></i></div>;
  }
  return <img className="kd-item-img" src={src} alt={alt} onError={() => { if (idx < candidates.length - 1) setIdx(i => i + 1); }} />;
}

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: String(error?.message || "Unexpected render error"),
    };
  }

  componentDidCatch(error) {
    console.error("Page render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="container py-5">
          <div className="alert alert-danger d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span>Manage Menu failed to render: {this.state.message}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => {
                window.location.hash = "/merchant/dashboard";
              }}
            >
              Back to Merchant Dashboard
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
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

    if (hash.startsWith("#/merchant/menu/")) {
  const restaurantId = hash.replace("#/merchant/menu/", "");
  return {
    page: "merchantMenu",
    restaurantId: restaurantId,
  };
}
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
  const [trackOrderId, setTrackOrderId] = useState(initialRoute.orderId || "");
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
  const [resolvedDeliveryCoords, setResolvedDeliveryCoords] = useState(null);
  const [resolvedBranchCoords, setResolvedBranchCoords] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("1");
  const [paymentCardHolder, setPaymentCardHolder] = useState("");
  const [paymentCardNumber, setPaymentCardNumber] = useState("");
  const [paymentCardExpiry, setPaymentCardExpiry] = useState("");
  const [paymentCardCvc, setPaymentCardCvc] = useState("");
  const [paymentOnlineAccount, setPaymentOnlineAccount] = useState("");
  const [paymentVerified, setPaymentVerified] = useState(true);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [myOrders, setMyOrders] = useState([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);
  const [myOrdersError, setMyOrdersError] = useState("");
  const [roleOrders, setRoleOrders] = useState([]);
  const [roleOrdersLoading, setRoleOrdersLoading] = useState(false);
  const [roleOrdersError, setRoleOrdersError] = useState("");
  const [myOrdersVisibleCount, setMyOrdersVisibleCount] = useState(MY_ORDERS_BATCH_SIZE);
  const [roleOrdersVisibleCount, setRoleOrdersVisibleCount] = useState(ORDERS_LIST_BATCH_SIZE);
  const [roleActionMessage, setRoleActionMessage] = useState("");
  const [roleToastVisible, setRoleToastVisible] = useState(false);
  const roleToastTimerRef = React.useRef(null);
  const [roleActionOrderId, setRoleActionOrderId] = useState(null);
  const [kanbanDetailOrder, setKanbanDetailOrder] = useState(null);
  const [myOrderItemPreview, setMyOrderItemPreview] = useState(null);
  const [cartItemEditor, setCartItemEditor] = useState(null);

  // New order notification state
  const [newOrderCount, setNewOrderCount] = useState(0);
  const knownOrderIdsRef = React.useRef(null); // null = not initialized yet
  const pollingIntervalRef = React.useRef(null);

  const getStoredToken = () => {
    try {
      const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      if (sessionToken) return sessionToken;

      // One-time migration from legacy localStorage token to per-tab session storage.
      const legacyToken = localStorage.getItem(ACCESS_TOKEN_KEY) || "";
      if (legacyToken) {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, legacyToken);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        return legacyToken;
      }
    } catch (err) {
      console.error("Token storage read failed", err);
    }

    return "";
  };
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

  const isOnlinePaymentMethod = ["2", "3", "4"].includes(String(paymentMethod || ""));

  const getPaymentMethodLabel = (value) => {
    const key = String(value || "");
    if (key === "1") return "Cash";
    if (key === "2") return "Credit Card";
    if (key === "3") return "PayPal";
    if (key === "4") return "Online";
    return "Unknown";
  };
  const normalizedCurrentUserRole = String(currentUserRole || "").trim().toLowerCase();
  const isCustomerRole = ["customer", "user"].includes(normalizedCurrentUserRole);
  const isAdminRole = normalizedCurrentUserRole === "admin";
  const isMerchantRole = normalizedCurrentUserRole === "merchant";
  const isCourierRole = normalizedCurrentUserRole === "courier";
  const canManageOperationalOrders = isAdminRole || isMerchantRole || isCourierRole;
  const [merchantRestaurantIdForUi, setMerchantRestaurantIdForUi] = useState("");

  useEffect(() => {
    if (page !== "myOrders") return;
    setMyOrdersVisibleCount(MY_ORDERS_BATCH_SIZE);
    setRoleOrdersVisibleCount(ORDERS_LIST_BATCH_SIZE);
  }, [page, normalizedCurrentUserRole]);

  useEffect(() => {
    if (roleOrdersVisibleCount > roleOrders.length && roleOrders.length > 0) {
      setRoleOrdersVisibleCount(Math.max(ORDERS_LIST_BATCH_SIZE, roleOrders.length));
    }
  }, [roleOrders.length, roleOrdersVisibleCount]);

  useEffect(() => {
    if (myOrdersVisibleCount > myOrders.length && myOrders.length > 0) {
      setMyOrdersVisibleCount(Math.max(MY_ORDERS_BATCH_SIZE, myOrders.length));
    }
  }, [myOrders.length, myOrdersVisibleCount]);

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
      } catch (error) {
        console.error(error);
      }
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
      sessionStorage.setItem(ACCESS_TOKEN_KEY, nextToken);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      setToken(nextToken);
      return;
    }

    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
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

  const normalizeTextList = (value) => {
    if (Array.isArray(value)) {
      return Array.from(
        new Set(
          value
            .map((entry) => String(entry || "").trim())
            .filter(Boolean)
        )
      );
    }

    const source = String(value || "").trim();
    if (!source) return [];

    return Array.from(
      new Set(
        source
          .split(/[\n,;|]/)
          .map((entry) => entry.trim())
          .filter(Boolean)
      )
    );
  };

  const normalizeAddOns = (value) => {
    if (Array.isArray(value)) {
      return value
        .map((entry) => {
          if (!entry) return null;
          if (typeof entry === "string") {
            const name = entry.trim();
            if (!name) return null;
            return { name, extraPrice: 0 };
          }

          const name = String(entry?.name ?? entry?.Name ?? entry?.label ?? entry?.Label ?? "").trim();
          const extraPrice = Number(entry?.extraPrice ?? entry?.ExtraPrice ?? entry?.price ?? entry?.Price ?? 0);
          if (!name) return null;

          return {
            name,
            extraPrice: Number.isFinite(extraPrice) ? Math.max(0, extraPrice) : 0,
          };
        })
        .filter(Boolean);
    }

    const source = String(value || "").trim();
    if (!source) return [];

    return source
      .split(/\n|;/)
      .map((entry) => {
        const piece = String(entry || "").trim();
        if (!piece) return null;

        const [nameRaw, priceRaw] = piece.split(":");
        const name = String(nameRaw || "").trim();
        const parsedPrice = Number(String(priceRaw || "0").replace(",", ".").trim());
        if (!name) return null;

        return {
          name,
          extraPrice: Number.isFinite(parsedPrice) ? Math.max(0, parsedPrice) : 0,
        };
      })
      .filter(Boolean);
  };

  const loadMenuCustomizationOverrides = () => {
    try {
      // DB-only mode: menu ingredient/request fields must come from backend API.
      return {};
    } catch (err) {
      console.error("Failed to load DB-only menu customizations", err);
      return {};
    }
  };

  const loadRestaurantCustomizationOverrides = () => {
    try {
      const raw = localStorage.getItem(RESTAURANT_CUSTOMIZATION_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      console.error("Failed to parse restaurant customizations", err);
      return {};
    }
  };

  const mergeUniqueAddOns = (...sources) => {
    const map = new Map();

    sources.forEach((source) => {
      normalizeAddOns(source).forEach((entry) => {
        const key = String(entry?.name || "").trim().toLowerCase();
        if (!key) return;
        map.set(key, {
          name: String(entry.name).trim(),
          extraPrice: Number(entry.extraPrice || 0),
        });
      });
    });

    return Array.from(map.values());
  };

  const getRestaurantCustomizationFor = (restaurantId, overrideMap = null) => {
    const map = overrideMap || loadRestaurantCustomizationOverrides();
    const current = map[String(restaurantId)] || {};

    return {
      globalAddOns: normalizeAddOns(current?.globalAddOns),
    };
  };

  const inferItemQuickRequests = (item) => {
    const directOptions = normalizeTextList(
      item?.requestOptions ??
      item?.RequestOptions ??
      item?.opsionePersonalizimi ??
      item?.OpsionePersonalizimi ??
      item?.customizationOptions ??
      item?.CustomizationOptions
    );
    if (directOptions.length > 0) return directOptions;

    const ingredientList = normalizeTextList(
      item?.ingredients ??
      item?.Ingredients ??
      item?.perberesit ??
      item?.Perberesit ??
      item?.perberes ??
      item?.Perberes
    );

    if (ingredientList.length > 0) {
      return ingredientList.slice(0, 8).map((ingredient) => `No ${ingredient}`);
    }

    const name = String(item?.name || "").toLowerCase();
    const category = String(item?.categoryName || "").toLowerCase();

    if (name.includes("pizza") || category.includes("pizza")) {
      return ["No cheese", "No olives", "No mushrooms", "No spicy"];
    }

    if (name.includes("salad") || category.includes("salad")) {
      return ["No dressing", "No onion", "No tomato"];
    }

    if (name.includes("burger") || name.includes("whopper") || name.includes("sandwich")) {
      return ["No onion", "No mayo", "No ketchup", "No cheese", "No pickles"];
    }

    if (name.includes("chicken") || category.includes("chicken")) {
      return ["No mayo", "No spicy", "Extra spicy"];
    }

    return CART_ITEM_QUICK_REQUESTS;
  };

  const deriveIngredientsFromNoOptions = (requestOptions) => {
    const options = normalizeTextList(requestOptions);
    return Array.from(
      new Set(
        options
          .map((entry) => {
            const raw = String(entry || "").trim();
            if (!/^no\s+/i.test(raw)) return "";
            return raw.replace(/^no\s+/i, "").trim();
          })
          .filter(Boolean)
      )
    );
  };

  const sanitizeQuickRequestOptions = (requestOptions, ingredientSource = []) => {
    const options = normalizeTextList(requestOptions);
    if (options.length === 0) return [];

    const ingredients = normalizeTextList(ingredientSource).map((entry) => String(entry).trim().toLowerCase());
    if (ingredients.length === 0) return options;

    return options.filter((option) => {
      const normalizedOption = String(option || "").trim();
      const noMatch = normalizedOption.match(/^no\s+(.+)$/i);
      if (!noMatch) return true;

      const candidate = String(noMatch[1] || "").trim().toLowerCase();
      if (!candidate) return false;

      if (ingredients.some((ingredient) => ingredient === candidate)) {
        return true;
      }

      const isPrefixNoise = ingredients.some((ingredient) => ingredient.startsWith(candidate));
      return !isPrefixNoise;
    });
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
        const customizationOverrides = loadMenuCustomizationOverrides();
        const restaurantCustomizationOverrides = loadRestaurantCustomizationOverrides();

        list.forEach((item) => {
          const menuItemId = item?.id ?? item?.Id;
          if (menuItemId === undefined || menuItemId === null) return;
          const itemOverride = customizationOverrides[String(menuItemId)] || {};
          const itemRestaurantId = item?.restaurantId ?? item?.RestaurantId;
          const restaurantCustomization = getRestaurantCustomizationFor(itemRestaurantId, restaurantCustomizationOverrides);

          const imageRaw = item?.foto ?? item?.Foto ?? item?.image ?? item?.Image ?? "";
          const imageCandidates = getAssetUrlCandidates(imageRaw);
          const imageUrl = imageCandidates[0] || "";
          const name =
            item?.emertimi ?? item?.Emertimi ?? item?.name ?? item?.Name ?? "Item";
          const sourceIngredients = normalizeTextList(
            itemOverride?.ingredients ??
            item?.ingredients ??
            item?.Ingredients ??
            item?.perberesit ??
            item?.Perberesit ??
            item?.perberes ??
            item?.Perberes
          );
          const directRequestOptions = normalizeTextList(
            itemOverride?.requestOptions ??
            item?.requestOptions ??
            item?.RequestOptions ??
            item?.opsionePersonalizimi ??
            item?.OpsionePersonalizimi ??
            item?.customizationOptions ??
            item?.CustomizationOptions
          );
          const ingredients =
            sourceIngredients.length > 0
              ? sourceIngredients
              : deriveIngredientsFromNoOptions(directRequestOptions);
          const cleanDirectRequestOptions = sanitizeQuickRequestOptions(directRequestOptions, ingredients);

          const categoryName =
            item?.categoryName ?? item?.CategoryName ?? item?.kategoria ?? item?.Kategoria ?? "";

          const quickRequestOptions =
            cleanDirectRequestOptions.length > 0
              ? cleanDirectRequestOptions
              : inferItemQuickRequests({
                  name,
                  categoryName,
                  ingredients,
                });

          const addOns = mergeUniqueAddOns(
            restaurantCustomization.globalAddOns,
            item?.addOns,
            item?.AddOns,
            item?.extras,
            item?.Extras
          );

          lookup.set(String(menuItemId), {
            name: String(name || "Item"),
            description: String(
              item?.pershkrimi ?? item?.Pershkrimi ?? item?.description ?? item?.Description ?? ""
            ),
            image: imageUrl,
            imageCandidates,
            ingredients,
            quickRequestOptions,
            addOns,
            restaurantId: itemRestaurantId,
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
          ingredients: normalizeTextList(item?.ingredients),
          quickRequestOptions: sanitizeQuickRequestOptions(item?.quickRequestOptions, item?.ingredients),
          availableAddOns: normalizeAddOns(item?.availableAddOns ?? item?.addOns ?? item?.AddOns),
          selectedAddOns: normalizeAddOns(item?.selectedAddOns),
          selectedRemovedIngredients: normalizeTextList(item?.selectedRemovedIngredients),
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

  const getCartItemAddOnsUnitTotal = (item) =>
    normalizeAddOns(item?.selectedAddOns).reduce((sum, addOn) => sum + Number(addOn.extraPrice || 0), 0);

  const getCartItemUnitPrice = (item) => Number(item?.price || 0) + getCartItemAddOnsUnitTotal(item);

  const activeBranch = restaurantBranches.find((b) => String(b.id) === String(activeBranchId)) || null;
  const branchBaseDeliveryFee = Number(activeBranch?.deliveryFee || 0);

  const storedNearbyCoords = (() => {
    try {
      const raw = localStorage.getItem(NEARBY_COORDS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const latitude = toFiniteNumber(parsed?.latitude);
      const longitude = toFiniteNumber(parsed?.longitude);
      if (latitude === null || longitude === null) return null;
      return { latitude, longitude };
    } catch {
      return null;
    }
  })();

  const effectiveCustomerCoords =
    (resolvedDeliveryCoords && Number.isFinite(Number(resolvedDeliveryCoords.latitude)) && Number.isFinite(Number(resolvedDeliveryCoords.longitude)))
      ? resolvedDeliveryCoords
      : storedNearbyCoords;

  const effectiveBranchCoords =
    (Number.isFinite(Number(activeBranch?.latitude)) && Number.isFinite(Number(activeBranch?.longitude)))
      ? { latitude: Number(activeBranch?.latitude), longitude: Number(activeBranch?.longitude) }
      : resolvedBranchCoords;

  const branchDistanceKm = calculateDistanceKm(
    effectiveCustomerCoords?.latitude,
    effectiveCustomerCoords?.longitude,
    effectiveBranchCoords?.latitude,
    effectiveBranchCoords?.longitude
  );

  const cartSubtotal = cartItems.reduce((sum, item) => sum + getCartItemUnitPrice(item) * Number(item.quantity || 0), 0);
  const deliveryPricing = resolveDeliveryPricing({
    mode: DELIVERY_FEE_MODE,
    subtotal: cartSubtotal,
    baseFee: branchBaseDeliveryFee,
    distanceKm: branchDistanceKm,
  });
  const cartDeliveryFee = Number(deliveryPricing.fee || 0);
  const cartTotal = cartSubtotal + cartDeliveryFee;

  const isSameCartLine = (item, targetItem) => {
    if (item?.cartLineId && targetItem?.cartLineId) {
      return String(item.cartLineId) === String(targetItem.cartLineId);
    }

    return (
      String(item.menuItemId) === String(targetItem.menuItemId) &&
      String(item.branchId) === String(targetItem.branchId) &&
      String(item.restaurantId) === String(targetItem.restaurantId)
    );
  };

  const getCustomizationSignature = ({ removedIngredients = [], selectedAddOns = [] } = {}) =>
    JSON.stringify({
      removedIngredients: normalizeTextList(removedIngredients)
        .map((entry) => String(entry).trim().toLowerCase())
        .sort(),
      selectedAddOns: normalizeAddOns(selectedAddOns)
        .map((entry) => ({
          name: String(entry?.name || "").trim().toLowerCase(),
          extraPrice: Number(entry?.extraPrice || 0),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    });

  const addToCart = (menuItem, quantity, customizations = null) => {
    if (!menuItem || !activeRestaurantId || !activeBranchId) return;
    const nextQty = Math.max(1, Number(quantity || 1));
    const removedIngredients = normalizeTextList(customizations?.removedIngredients);
    const selectedAddOns = normalizeAddOns(customizations?.selectedAddOns);
    const customizationSignature = getCustomizationSignature({
      removedIngredients,
      selectedAddOns,
    });

    setCartItems((current) => {
      const idx = current.findIndex(
        (entry) =>
          String(entry.menuItemId) === String(menuItem.id) &&
          String(entry.branchId) === String(activeBranchId) &&
          String(entry.restaurantId) === String(activeRestaurantId) &&
          String(entry.customizationSignature || "") === customizationSignature
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
          cartLineId: `${menuItem.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          customizationSignature,
          menuItemId: menuItem.id,
          name: menuItem.name || "Item",
          price: Number(menuItem.price || 0),
          rawImagePath,
          imageCandidates,
          image: menuItem?.image || imageCandidates[0] || "",
          quantity: nextQty,
          selectedRequests: [],
          ingredients:
            Array.isArray(menuItem?.ingredients) && menuItem.ingredients.length > 0
              ? menuItem.ingredients
              : [],
          selectedRemovedIngredients: removedIngredients,
          quickRequestOptions:
            Array.isArray(menuItem?.quickRequestOptions) && menuItem.quickRequestOptions.length > 0
              ? menuItem.quickRequestOptions
              : inferItemQuickRequests(menuItem),
          availableAddOns: normalizeAddOns(menuItem?.addOns ?? menuItem?.AddOns),
          selectedAddOns,
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
      current.map((item) => (isSameCartLine(item, targetItem) ? { ...item, quantity: nextQty } : item))
    );
    setOrderMessage("");
  };

  const removeCartItem = (targetItem) => {
    setCartItems((current) =>
      current.filter((item) => !isSameCartLine(item, targetItem))
    );
    setOrderMessage("");
  };

  const openCartItemEditor = (item) => {
    if (!item) return;

    setCartItemEditor({
      targetItem: item,
      selectedRequests: Array.isArray(item?.selectedRequests) ? item.selectedRequests : [],
      selectedRemovedIngredients: normalizeTextList(item?.selectedRemovedIngredients),
      selectedAddOns: normalizeAddOns(item?.selectedAddOns),
    });
  };

  const saveCartItemEditorChanges = () => {
    if (!cartItemEditor?.targetItem) {
      setCartItemEditor(null);
      return;
    }

    const nextRequests = Array.isArray(cartItemEditor.selectedRequests)
      ? cartItemEditor.selectedRequests.filter(Boolean)
      : [];
    const nextRemovedIngredients = normalizeTextList(cartItemEditor.selectedRemovedIngredients);
    const nextSelectedAddOns = normalizeAddOns(cartItemEditor.selectedAddOns);
    const nextSignature = getCustomizationSignature({
      removedIngredients: nextRemovedIngredients,
      selectedAddOns: nextSelectedAddOns,
    });

    setCartItems((current) => {
      const updated = current.map((item) =>
        isSameCartLine(item, cartItemEditor.targetItem)
          ? {
              ...item,
              selectedRequests: nextRequests,
              selectedRemovedIngredients: nextRemovedIngredients,
              selectedAddOns: nextSelectedAddOns,
              customizationSignature: nextSignature,
            }
          : item
      );

      const targetIndex = updated.findIndex((item) => isSameCartLine(item, cartItemEditor.targetItem));
      if (targetIndex < 0) return current;

      const editedItem = updated[targetIndex];
      const mergeIndex = updated.findIndex(
        (item, index) =>
          index !== targetIndex &&
          String(item.menuItemId) === String(editedItem.menuItemId) &&
          String(item.branchId) === String(editedItem.branchId) &&
          String(item.restaurantId) === String(editedItem.restaurantId) &&
          String(item.customizationSignature || "") === String(editedItem.customizationSignature || "")
      );

      if (mergeIndex < 0) return updated;

      const merged = [...updated];
      merged[mergeIndex] = {
        ...merged[mergeIndex],
        quantity: Number(merged[mergeIndex].quantity || 0) + Number(editedItem.quantity || 0),
      };
      merged.splice(targetIndex, 1);
      return merged;
    });

    setCartItemEditor(null);
    setOrderMessage("");
  };

  const toggleCartItemQuickRequest = (targetItem, request) => {
    setCartItems((current) =>
      current.map((item) => {
        const isTarget =
          isSameCartLine(item, targetItem);

        if (!isTarget) return item;

        const currentRequests = Array.isArray(item.selectedRequests) ? item.selectedRequests : [];
        const alreadySelected = currentRequests.includes(request);

        return {
          ...item,
          selectedRequests: alreadySelected
            ? currentRequests.filter((entry) => entry !== request)
            : [...currentRequests, request],
        };
      })
    );
    setOrderMessage("");
  };

  const toggleCartItemAddOn = (targetItem, addOn) => {
    const addOnName = String(addOn?.name || "").trim();
    if (!addOnName) return;

    setCartItems((current) =>
      current.map((item) => {
        const isTarget =
          isSameCartLine(item, targetItem);

        if (!isTarget) return item;

        const currentAddOns = normalizeAddOns(item.selectedAddOns);
        const alreadySelected = currentAddOns.some((entry) => String(entry.name) === addOnName);

        return {
          ...item,
          selectedAddOns: alreadySelected
            ? currentAddOns.filter((entry) => String(entry.name) !== addOnName)
            : [...currentAddOns, { name: addOnName, extraPrice: Number(addOn.extraPrice || 0) }],
        };
      })
    );

    setOrderMessage("");
  };

  const toggleCartItemRemovedIngredient = (targetItem, ingredient) => {
    const ingredientName = String(ingredient || "").trim();
    if (!ingredientName) return;

    setCartItems((current) =>
      current.map((item) => {
        if (!isSameCartLine(item, targetItem)) return item;

        const removed = normalizeTextList(item?.selectedRemovedIngredients);
        const isRemoved = removed.some(
          (entry) => String(entry || "").trim().toLowerCase() === ingredientName.toLowerCase()
        );

        return {
          ...item,
          selectedRemovedIngredients: isRemoved
            ? removed.filter((entry) => String(entry || "").trim().toLowerCase() !== ingredientName.toLowerCase())
            : [...removed, ingredientName],
        };
      })
    );

    setOrderMessage("");
  };

  const composeCartItemNote = (item) => {
    const picked = Array.isArray(item?.selectedRequests) ? item.selectedRequests.filter(Boolean) : [];
    const pickedAddOns = normalizeAddOns(item?.selectedAddOns);
    const removedIngredients = normalizeTextList(item?.selectedRemovedIngredients);

    const noteParts = [];
    if (picked.length > 0) {
      noteParts.push(picked.join(", "));
    }

    if (pickedAddOns.length > 0) {
      noteParts.push(
        `Add-ons: ${pickedAddOns
          .map((entry) => `${entry.name} (+${Number(entry.extraPrice || 0).toFixed(2)} EUR)`)
          .join(", ")}`
      );
    }

    if (removedIngredients.length > 0) {
      noteParts.push(`Remove: ${removedIngredients.join(", ")}`);
    }

    return noteParts.join(". ");
  };

  const parseOrderItemNote = (rawNote) => {
    const note = String(rawNote || "").trim();
    if (!note) return { removedIngredients: [], addedAddOns: [] };

    const parts = note
      .split(/\.(?:\s+|$)/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    const removedIngredients = [];
    const addedAddOns = [];

    parts.forEach((part) => {
      if (/^remove\s*:/i.test(part)) {
        const value = part.replace(/^remove\s*:/i, "").trim();
        normalizeTextList(value).forEach((entry) => {
          if (!removedIngredients.includes(entry)) {
            removedIngredients.push(entry);
          }
        });
        return;
      }

      if (/^add-ons\s*:/i.test(part)) {
        const value = part.replace(/^add-ons\s*:/i, "").trim();
        value
          .split(/\s*,\s*/)
          .map((entry) => String(entry || "").trim())
          .filter(Boolean)
          .forEach((entry) => {
            const cleaned = entry.replace(/\s*\(\+[^)]*\)\s*$/i, "").trim();
            if (cleaned && !addedAddOns.includes(cleaned)) {
              addedAddOns.push(cleaned);
            }
          });
      }
    });

    return { removedIngredients, addedAddOns };
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
    setPaymentError("");

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

    if (isOnlinePaymentMethod && !paymentVerified) {
      setPaymentError("Please complete payment confirmation before placing the order.");
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

    const paymentMeta =
      isOnlinePaymentMethod && paymentReference
        ? `[Payment confirmed: ${getPaymentMethodLabel(paymentMethod)} ${paymentReference}]`
        : "";

    const payload = {
      UserId: String(resolvedUserId || ""),
      RestaurantId: Number(referenceItem.restaurantId),
      AdresaDorezimit: normalizedDeliveryAddress,
      TarifaDorezimit: Number(cartDeliveryFee || 0),
      Zbritja: 0,
      MetodaPageses: Number(paymentMethod),
      Shenimet: [orderNotes.trim(), paymentMeta].filter(Boolean).join(" | "),
      ShumaTotale: Number(cartTotal.toFixed(2)),
      OrderItems: cartItems.map((item) => ({
        MenuItemId: Number(item.menuItemId),
        Sasia: Number(item.quantity),
        Cmimi: Number(getCartItemUnitPrice(item).toFixed(2)),
        Shenimet: composeCartItemNote(item),
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
      setPaymentCardHolder("");
      setPaymentCardNumber("");
      setPaymentCardExpiry("");
      setPaymentCardCvc("");
      setPaymentOnlineAccount("");
      setPaymentReference("");
      setPaymentError("");
      setPaymentMethod("1");
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
    latitude: toFiniteNumber(branch?.latitude ?? branch?.Latitude ?? branch?.lat ?? branch?.Lat),
    longitude: toFiniteNumber(branch?.longitude ?? branch?.Longitude ?? branch?.lng ?? branch?.Lng ?? branch?.lon ?? branch?.Lon),
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

      const customizationOverrides = loadMenuCustomizationOverrides();
      const restaurantCustomizationOverrides = loadRestaurantCustomizationOverrides();
      const restaurantCustomization = getRestaurantCustomizationFor(restaurantId, restaurantCustomizationOverrides);

      return filteredItems
        .map((item) => {
          const categoryId = item?.categoryId ?? item?.CategoryId;
          const category = categoryById.get(categoryId);
          const itemId = item?.id ?? item?.Id;
          const itemOverride = customizationOverrides[String(itemId)] || {};
          const name = item?.emertimi ?? item?.Emertimi ?? item?.name ?? item?.Name ?? "Item";
          const categoryName = category?.name || "Menu";
          const sourceIngredients = normalizeTextList(
            itemOverride?.ingredients ??
            item?.ingredients ??
            item?.Ingredients ??
            item?.perberesit ??
            item?.Perberesit ??
            item?.perberes ??
            item?.Perberes
          );
          const directRequestOptions = normalizeTextList(
            itemOverride?.requestOptions ??
            item?.requestOptions ??
            item?.RequestOptions ??
            item?.opsionePersonalizimi ??
            item?.OpsionePersonalizimi ??
            item?.customizationOptions ??
            item?.CustomizationOptions
          );
          const ingredients =
            sourceIngredients.length > 0
              ? sourceIngredients
              : deriveIngredientsFromNoOptions(directRequestOptions);
          const cleanDirectRequestOptions = sanitizeQuickRequestOptions(directRequestOptions, ingredients);
          const quickRequestOptions =
            cleanDirectRequestOptions.length > 0
              ? cleanDirectRequestOptions
              : inferItemQuickRequests({
                  name,
                  categoryName,
                  ingredients,
                });

          const addOns = mergeUniqueAddOns(
            restaurantCustomization.globalAddOns,
            item?.addOns,
            item?.AddOns,
            item?.extras,
            item?.Extras
          );

          return {
            id: item?.id ?? item?.Id,
            name,
            description: item?.pershkrimi ?? item?.Pershkrimi ?? item?.description ?? item?.Description ?? "",
            price: Number(item?.cmimi ?? item?.Cmimi ?? item?.price ?? item?.Price ?? 0),
            image: toAbsoluteAssetUrl(item?.foto ?? item?.Foto ?? item?.image ?? item?.Image ?? ""),
            imageCandidates: getAssetUrlCandidates(item?.foto ?? item?.Foto ?? item?.image ?? item?.Image ?? ""),
            rawImagePath: item?.foto ?? item?.Foto ?? item?.image ?? item?.Image ?? "",
            available: Boolean(item?.disponueshme ?? item?.Disponueshme ?? true),
            calories: item?.kalori ?? item?.Kalori ?? null,
            allergens: item?.alergjene ?? item?.Alergjene ?? "",
            ingredients,
            quickRequestOptions,
            addOns,
            categoryName,
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

  const getGeoCache = () => {
    try {
      const raw = localStorage.getItem(DELIVERY_GEO_CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  const getCachedCoords = (cacheKey) => {
    if (!cacheKey) return null;
    const cache = getGeoCache();
    const entry = cache[cacheKey];
    const latitude = toFiniteNumber(entry?.latitude);
    const longitude = toFiniteNumber(entry?.longitude);
    if (latitude === null || longitude === null) return null;
    return { latitude, longitude };
  };

  const setCachedCoords = (cacheKey, coords) => {
    if (!cacheKey || !coords) return;
    const latitude = toFiniteNumber(coords?.latitude);
    const longitude = toFiniteNumber(coords?.longitude);
    if (latitude === null || longitude === null) return;

    try {
      const cache = getGeoCache();
      cache[cacheKey] = {
        latitude,
        longitude,
        updatedAt: Date.now(),
      };
      localStorage.setItem(DELIVERY_GEO_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore cache write errors; runtime flow should still continue.
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const normalized = normalizeAddressForBackend(deliveryAddress || "");

    if (normalized.length < 5) {
      setResolvedDeliveryCoords(null);
      return undefined;
    }

    const cacheKey = `delivery:${normalized.toLowerCase()}`;
    const cached = getCachedCoords(cacheKey);
    if (cached) {
      setResolvedDeliveryCoords(cached);
      return undefined;
    }

    const timerId = window.setTimeout(async () => {
      try {
        const resolved = await resolveLocationCoordinates(normalized);
        if (!resolved || isCancelled) return;

        const coords = {
          latitude: Number(resolved.latitude),
          longitude: Number(resolved.longitude),
        };
        setResolvedDeliveryCoords(coords);
        setCachedCoords(cacheKey, coords);
      } catch {
        if (!isCancelled) {
          setResolvedDeliveryCoords(null);
        }
      }
    }, 450);

    return () => {
      isCancelled = true;
      window.clearTimeout(timerId);
    };
  }, [deliveryAddress]);

  useEffect(() => {
    let isCancelled = false;

    if (!activeBranch) {
      setResolvedBranchCoords(null);
      return undefined;
    }

    if (Number.isFinite(Number(activeBranch?.latitude)) && Number.isFinite(Number(activeBranch?.longitude))) {
      setResolvedBranchCoords({
        latitude: Number(activeBranch.latitude),
        longitude: Number(activeBranch.longitude),
      });
      return undefined;
    }

    const branchAddressQuery = [activeBranch?.address, activeBranch?.city, activeBranch?.zone]
      .filter(Boolean)
      .join(", ")
      .trim();

    if (!branchAddressQuery) {
      setResolvedBranchCoords(null);
      return undefined;
    }

    const cacheKey = `branch:${String(activeBranch?.id || branchAddressQuery).toLowerCase()}`;
    const cached = getCachedCoords(cacheKey);
    if (cached) {
      setResolvedBranchCoords(cached);
      return undefined;
    }

    const timerId = window.setTimeout(async () => {
      try {
        const resolved = await resolveLocationCoordinates(branchAddressQuery);
        if (!resolved || isCancelled) return;

        const coords = {
          latitude: Number(resolved.latitude),
          longitude: Number(resolved.longitude),
        };
        setResolvedBranchCoords(coords);
        setCachedCoords(cacheKey, coords);
      } catch {
        if (!isCancelled) {
          setResolvedBranchCoords(null);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(timerId);
    };
  }, [activeBranch]);

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
            description: String(
              item?.pershkrimi ??
                item?.Pershkrimi ??
                item?.description ??
                item?.Description ??
                nestedMenuItem?.pershkrimi ??
                nestedMenuItem?.Pershkrimi ??
                nestedMenuItem?.description ??
                nestedMenuItem?.Description ??
                ""
            ),
            ingredients: normalizeTextList(
              item?.perberesit ??
                item?.Perberesit ??
                item?.ingredients ??
                item?.Ingredients ??
                nestedMenuItem?.perberesit ??
                nestedMenuItem?.Perberesit ??
                nestedMenuItem?.ingredients ??
                nestedMenuItem?.Ingredients
            ),
            rawImagePath,
            imageCandidates,
            image: itemImage || imageCandidates[0] || "",
            quantity: Number(item?.sasia ?? item?.Sasia ?? item?.quantity ?? item?.Quantity ?? 1),
            price: Number(item?.cmimi ?? item?.Cmimi ?? item?.price ?? item?.Price ?? 0),
            note: String(item?.shenimet ?? item?.Shenimet ?? ""),
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
            description: item.description || menuMatch?.description || "",
            ingredients:
              Array.isArray(item?.ingredients) && item.ingredients.length > 0
                ? item.ingredients
                : normalizeTextList(menuMatch?.ingredients),
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
            //  `${API_BASE}/orders/merchant`,
              //`${API_BASE}/orders/for-merchant`,
              //`${API_BASE}/orders/my-restaurant`,
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

    const explicitTransitionCandidates = [];
    if (normalizedNextStatus === "Accepted") {
      explicitTransitionCandidates.push({ method: "POST", url: `${API_BASE}/orders/${orderId}/accept`, payload: JSON.stringify("") });
    }
    if (normalizedNextStatus === "Preparing") {
      explicitTransitionCandidates.push({ method: "POST", url: `${API_BASE}/orders/${orderId}/prepare`, payload: JSON.stringify("") });
    }
    if (normalizedNextStatus === "Ready") {
      explicitTransitionCandidates.push({ method: "POST", url: `${API_BASE}/orders/${orderId}/ready`, payload: JSON.stringify("") });
    }
    if (normalizedNextStatus === "Delivered") {
      explicitTransitionCandidates.push({ method: "POST", url: `${API_BASE}/orders/${orderId}/deliver`, payload: JSON.stringify("") });
    }

    const genericCandidates = [
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

    const requestCandidates = [...explicitTransitionCandidates, ...genericCandidates];

    try {
      let updated = false;

      for (const candidate of requestCandidates) {
        const candidatePayloads = candidate.payload
          ? [candidate.payload]
          : payloadVariants.map((p) => JSON.stringify(p));

        for (const payloadBody of candidatePayloads) {
          const res = await authenticatedFetch(candidate.url, {
            method: candidate.method,
            headers: { "Content-Type": "application/json" },
            body: payloadBody,
          });

          if (res.ok) {
            updated = true;
            break;
          }

          if ([401, 403].includes(res.status)) {
            const errPayload = await res.json().catch(() => null);
            setRoleActionMessage(extractErrorMessage(errPayload, `Failed to update order (HTTP ${res.status}).`));
            setRoleActionOrderId(null);
            return;
          }

          // For other failure codes (400/404/405/415/500/etc), try the next candidate.
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
    import("bootstrap/dist/js/bootstrap.bundle.min.js").catch((error) => {
      console.error("Failed to load bootstrap JS bundle", error);
    });
  }, []);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchCategories();
    if (token) fetchCurrentUser();
  }, [token]);
  /* eslint-enable react-hooks/exhaustive-deps */

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const stored = loadCartFromStorage();
    setCartItems(stored);
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    localStorage.setItem(ORDER_CART_KEY, JSON.stringify(cartItems));
    const totalQty = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    setCartCount(totalQty);
  }, [cartItems]);

  useEffect(() => {
    const isCash = String(paymentMethod) === "1";
    setPaymentVerified(isCash);
    setPaymentReference("");
    setPaymentError("");
  }, [paymentMethod]);

  useEffect(() => {
    if (!isOnlinePaymentMethod) return;
    // Any cart total change invalidates a previous online verification.
    setPaymentVerified(false);
    setPaymentReference("");
  }, [cartTotal, isOnlinePaymentMethod]);

  useEffect(() => {
    if (!cartItemEditor) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setCartItemEditor(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cartItemEditor]);

  const handleConfirmPayment = async () => {
    if (!isOnlinePaymentMethod) {
      setPaymentVerified(true);
      setPaymentError("");
      return;
    }

    setPaymentError("");
    const method = String(paymentMethod);

    if (method === "2") {
      const holder = String(paymentCardHolder || "").trim();
      const numberDigits = String(paymentCardNumber || "").replace(/\D/g, "");
      const expiry = String(paymentCardExpiry || "").trim();
      const cvcDigits = String(paymentCardCvc || "").replace(/\D/g, "");

      if (holder.length < 3) {
        setPaymentError("Card holder name is required.");
        return;
      }

      if (numberDigits.length < 13 || numberDigits.length > 19) {
        setPaymentError("Card number is invalid.");
        return;
      }

      const expiryMatch = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
      if (!expiryMatch) {
        setPaymentError("Expiry must be in MM/YY format.");
        return;
      }

      const month = Number(expiryMatch[1]);
      const year = Number(`20${expiryMatch[2]}`);
      const expiryDate = new Date(year, month, 0, 23, 59, 59);
      if (expiryDate.getTime() < Date.now()) {
        setPaymentError("Card has expired.");
        return;
      }

      if (cvcDigits.length < 3 || cvcDigits.length > 4) {
        setPaymentError("CVC is invalid.");
        return;
      }
    }

    if (method === "3") {
      const paypalEmail = String(paymentOnlineAccount || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
        setPaymentError("Enter a valid PayPal email.");
        return;
      }
    }

    if (method === "4") {
      const onlineId = String(paymentOnlineAccount || "").trim();
      if (onlineId.length < 4) {
        setPaymentError("Enter online payment account/reference.");
        return;
      }
    }

    setPaymentProcessing(true);
    try {
      const reference = `BB-${Date.now().toString().slice(-8)}`;
      setPaymentReference(reference);
      setPaymentVerified(true);
      setOrderMessage(`Payment confirmed (${getPaymentMethodLabel(paymentMethod)} - ${reference}).`);
    } finally {
      setPaymentProcessing(false);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const hydrateCartItemsFromMenu = async () => {
      const needsHydration = cartItems.some((item) => {
        if (!item?.menuItemId) return false;
        const missingImage = !item?.image;
        const missingQuickRequests = !Array.isArray(item?.quickRequestOptions) || item.quickRequestOptions.length === 0;
        const missingIngredients = !Array.isArray(item?.ingredients);
        return missingImage || missingQuickRequests || missingIngredients;
      });
      if (!needsHydration) return;

      const menuLookup = await fetchMenuItemsLookup();
      if (!menuLookup.size) return;

      setCartItems((current) => {
        let changed = false;
        const next = current.map((item) => {
          if (!item?.menuItemId) return item;
          const menuMatch = menuLookup.get(String(item.menuItemId));
          if (!menuMatch) return item;

          const nextItem = {
            ...item,
            name: item?.name || menuMatch.name,
            imageCandidates:
              Array.isArray(item?.imageCandidates) && item.imageCandidates.length > 0
                ? item.imageCandidates
                : menuMatch.imageCandidates || [],
            image: item?.image || menuMatch.image,
            ingredients:
              Array.isArray(item?.ingredients)
                ? item.ingredients
                : (menuMatch.ingredients || []),
            selectedRemovedIngredients: normalizeTextList(item?.selectedRemovedIngredients),
            quickRequestOptions:
              Array.isArray(item?.quickRequestOptions) && item.quickRequestOptions.length > 0
                ? item.quickRequestOptions
                : (menuMatch.quickRequestOptions || CART_ITEM_QUICK_REQUESTS),
            availableAddOns:
              Array.isArray(item?.availableAddOns) && item.availableAddOns.length > 0
                ? normalizeAddOns(item.availableAddOns)
                : normalizeAddOns(menuMatch.addOns || []),
            selectedAddOns: normalizeAddOns(item?.selectedAddOns),
          };

          const serializedBefore = JSON.stringify(item);
          const serializedAfter = JSON.stringify(nextItem);
          if (serializedBefore !== serializedAfter) {
            changed = true;
          }

          return nextItem;
        });

        return changed ? next : current;
      });
    };

    hydrateCartItemsFromMenu();
  }, [cartItems]);
  /* eslint-enable react-hooks/exhaustive-deps */

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

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const syncRouteFromHash = async () => {
      const route = getRouteState();

      // Restrict merchant role strictly to merchant dashboard/menu/orders dashboard
      if (isMerchantRole) {
        // Allowed: merchantDashboard, merchantMenu, myOrders (Orders Dashboard)
        if (
          route.page !== "merchantDashboard" &&
          route.page !== "merchantMenu" &&
          route.page !== "myOrders"
        ) {
          window.location.hash = "/merchant/dashboard";
          setPage("merchantDashboard");
          setActiveRestaurantId(null);
          setActiveBranchId("");
          setTrackOrderId("");
          return;
        }
      }

      // Courier should use Driver Dashboard, not Orders Dashboard (/my-orders)
      if (isCourierRole && route.page === "myOrders") {
        window.location.hash = "/driver/dashboard";
        setPage("driverDashboard");
        setActiveRestaurantId(null);
        setActiveBranchId("");
        setTrackOrderId("");
        return;
      }

      setPage(route.page);
      setActiveRestaurantId(route.restaurantId);
      setActiveBranchId(route.branchId || "");
      setTrackOrderId(route.orderId || "");

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
  }, [token, normalizedCurrentUserRole, isMerchantRole]);
  /* eslint-enable react-hooks/exhaustive-deps */

  /* eslint-disable react-hooks/exhaustive-deps */
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
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (page !== "myOrders" || !token) return;

    const connection = orderHubConnectionRef.current;
    if (!connection) return;

    syncOrderHubGroups(connection, myOrders);
  }, [myOrders, page, token]);

  // ── MERCHANT POLLING: detect new Pending orders ──
  const audioCtxRef = React.useRef(null);
  const audioUnlockedRef = React.useRef(false);
  const pendingBeepRef = React.useRef(false);
  const pageRef = React.useRef(page);
  React.useEffect(() => { pageRef.current = page; }, [page]);

  // Ensure AudioContext exists and is running. Must be called inside a user-gesture handler.
  const ensureAudioCtx = React.useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.error(error);
        return null;
      }
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
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    try {
      if (ctx.state !== "running") await ctx.resume();
      if (ctx.state === "running") {
        audioUnlockedRef.current = true;
        doBeeps(ctx);
        pendingBeepRef.current = false;
      } else {
        pendingBeepRef.current = true;
      }
    } catch (error) {
      console.error(error);
      pendingBeepRef.current = true;
    }
  }, [ensureAudioCtx, doBeeps]);

  // Called directly from button click — guaranteed to work
  const playTestSound = React.useCallback(() => {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    // If suspended, resume() returns a promise but we can still schedule
    // because the resume happens synchronously from the gesture context
    if (ctx.state === "suspended") {
      ctx.resume().then(() => {
        audioUnlockedRef.current = true;
        doBeeps(ctx);
      }).catch(() => {});
    } else {
      audioUnlockedRef.current = true;
      doBeeps(ctx);
    }
  }, [ensureAudioCtx, doBeeps]);

  // Prime/unlock audio from any normal click path (login/nav) so alerts can play later
  const primeAudioFromGesture = React.useCallback(() => {
    const ctx = ensureAudioCtx();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().then(() => {
        if (ctx.state === "running") {
          audioUnlockedRef.current = true;
          if (pendingBeepRef.current) {
            doBeeps(ctx);
            pendingBeepRef.current = false;
          }
        }
      }).catch(() => {});
      return;
    }

    if (ctx.state === "running") {
      audioUnlockedRef.current = true;
      if (pendingBeepRef.current) {
        doBeeps(ctx);
        pendingBeepRef.current = false;
      }
    }
  }, [ensureAudioCtx, doBeeps]);

  useEffect(() => {
    if (!isMerchantRole || !token || audioUnlockedRef.current) return undefined;

    const unlockAudio = async () => {
      const ctx = ensureAudioCtx();
      if (!ctx) return;

      try {
        if (ctx.state !== "running") {
          await ctx.resume();
        }

        if (ctx.state === "running") {
          audioUnlockedRef.current = true;

          if (pendingBeepRef.current) {
            doBeeps(ctx);
            pendingBeepRef.current = false;
          }

          window.removeEventListener("pointerdown", unlockAudio);
          window.removeEventListener("keydown", unlockAudio);
          window.removeEventListener("touchstart", unlockAudio);
        }
      } catch (error) {
        console.error(error);
      }
    };

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, [isMerchantRole, token, ensureAudioCtx, doBeeps]);

  /* eslint-disable react-hooks/exhaustive-deps */
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
       //   `${API_BASE}/orders/merchant`,
         // `${API_BASE}/orders/for-merchant`,
         // `${API_BASE}/orders/my-restaurant`,
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
      } catch (error) {
        console.error(error);
      }
    };

    // Run once immediately, then every 5s
    poll();
    pollingIntervalRef.current = setInterval(poll, 5000);

    return () => {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    };
  }, [isMerchantRole, token, currentUser, page]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const visibleRoleOrders = roleOrders.slice(0, roleOrdersVisibleCount);
  const hasMoreRoleOrders = roleOrders.length > visibleRoleOrders.length;
  const visibleMyOrders = myOrders.slice(0, myOrdersVisibleCount);
  const hasMoreMyOrders = myOrders.length > visibleMyOrders.length;

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
           primeAudioFromGesture();
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
                {!isCourierRole && (
                  <button
                    className="btn btn-outline-primary nav-orders-btn"
                    onClick={() => {
                      primeAudioFromGesture();
                      setNewOrderCount(0);
                      window.location.hash = "/my-orders";
                    }}
                  >
                    {canManageOperationalOrders ? "Orders Dashboard" : "My Orders"}
                    {newOrderCount > 0 && (
                      <span className="nav-new-order-badge">{newOrderCount}</span>
                    )}
                  </button>
                )}
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
              <button
                className="btn btn-primary"
                onClick={() => {
                  primeAudioFromGesture();
                  handleLogin();
                }}
              >
                Login
              </button>
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
            onBack={() => { window.location.hash = "/"; }}
          />
        )}
        {page === "driverDashboard" && (
          <DriverDashboard token={token} onBack={() => { window.location.hash = "/"; }} />
        )}
        {page === "merchantMenu" && (
          <section className="container py-4" style={{ marginTop: "96px" }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <h2 className="mb-0">Manage Menu</h2>
              <div className="small text-muted">
                Restaurant ID: {activeRestaurantId ? String(activeRestaurantId) : "not detected"}
              </div>
            </div>

            <PageErrorBoundary>
              <MenuManagement
                key={String(activeRestaurantId || "none")}
                token={token}
                restaurantId={Number(activeRestaurantId) || null}
                onBack={() => { window.location.hash = "/merchant/dashboard"; }}
              />
            </PageErrorBoundary>
          </section>
        )}
        {page === "trackOrder" && (
          <OrderTracking orderId={trackOrderId} token={token} />
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

            <div className="orders-page-hero mb-3">
              <h2 className="mb-1">{canManageOperationalOrders ? "Orders Dashboard" : "My Orders"}</h2>
              <p className="small text-muted mb-0">{getRoleCapabilitiesLabel()}</p>
            </div>
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
                  {visibleRoleOrders.map((order) => {
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

                  {roleOrders.length > 0 && (
                    <div className="orders-pagination-bar">
                      {hasMoreRoleOrders && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setRoleOrdersVisibleCount((current) => current + ORDERS_LIST_BATCH_SIZE)}
                        >
                          Show more ({roleOrders.length - visibleRoleOrders.length} left)
                        </button>
                      )}

                      {roleOrdersVisibleCount > ORDERS_LIST_BATCH_SIZE && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-dark"
                          onClick={() => setRoleOrdersVisibleCount(ORDERS_LIST_BATCH_SIZE)}
                        >
                          Show less
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            ) : myOrdersLoading ? (
              <div className="text-muted">Loading your orders...</div>
            ) : myOrders.length === 0 ? (
              <div className="restaurant-menu orders-empty-state">
                <p className="text-muted mb-0">You have no orders yet.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                <p className="small text-muted mb-0">
                  Showing {visibleMyOrders.length} of {myOrders.length} orders
                </p>

                {visibleMyOrders.map((order) => (
                  <article className="restaurant-menu order-card-v2" key={order.id}>
                    <div className="order-card-v2-head">
                      <div>
                        <h5 className="mb-1 order-card-v2-id">Order #{order.id}</h5>
                        <p className="text-muted small mb-0 order-card-v2-restaurant">{order.restaurantName}</p>
                      </div>
                      <span className={`badge order-card-v2-status ${getStatusBadgeClass(order.statusLabel)}`}>{order.statusLabel}</span>
                    </div>

                    <div className="order-card-v2-metrics">
                      <div className="order-metric-chip">
                        <span className="order-metric-label">Total</span>
                        <strong>EUR {Number(order.total || 0).toFixed(2)}</strong>
                      </div>
                      <div className="order-metric-chip">
                        <span className="order-metric-label">Delivery Fee</span>
                        <strong>EUR {Number(order.deliveryFee || 0).toFixed(2)}</strong>
                      </div>
                      <div className="order-metric-chip">
                        <span className="order-metric-label">Items</span>
                        <strong>{order.itemsCount}</strong>
                      </div>
                    </div>

                    <div className="order-card-v2-details">
                      <div>
                        <span className="order-detail-label">Address</span>
                        <p className="mb-0">{order.address || "-"}</p>
                      </div>
                      <div>
                        <span className="order-detail-label">Payment</span>
                        <p className="mb-0">{order.paymentLabel || "-"}</p>
                      </div>
                      <div>
                        <span className="order-detail-label">Date</span>
                        <p className="mb-0">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</p>
                      </div>
                    </div>

                    {order.note && (
                      <p className="small text-muted mt-3 mb-0"><strong>Note:</strong> {order.note}</p>
                    )}

                    <div className="mt-3 d-flex gap-2 order-card-v2-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => { window.location.hash = `/track/${order.id}`; }}
                      >
                        <i className="bi bi-geo-alt me-1"></i>Track Order
                      </button>
                    </div>

                    {Array.isArray(order.items) && order.items.length > 0 && (
                      <div className="order-items-preview mt-3">
                        {order.items.map((item) => (
                          <div
                            className="order-item-chip"
                            key={`${order.id}-${item.id}-${item.name}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setMyOrderItemPreview({
                                ...item,
                                orderId: order.id,
                              });
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setMyOrderItemPreview({
                                  ...item,
                                  orderId: order.id,
                                });
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          >
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
                  </article>
                ))}

                {myOrders.length > 0 && (
                  <div className="orders-pagination-bar">
                    {hasMoreMyOrders && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setMyOrdersVisibleCount((current) => current + MY_ORDERS_BATCH_SIZE)}
                      >
                        Show more ({myOrders.length - visibleMyOrders.length} left)
                      </button>
                    )}

                    {myOrdersVisibleCount > MY_ORDERS_BATCH_SIZE && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => setMyOrdersVisibleCount(MY_ORDERS_BATCH_SIZE)}
                      >
                        Show less
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {myOrderItemPreview && (
          <div className="kd-overlay" onClick={() => setMyOrderItemPreview(null)}>
            <div className="kd-modal" onClick={(event) => event.stopPropagation()}>
              <div className="kd-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <span className="kd-order-id">Order #{myOrderItemPreview.orderId || "-"}</span>
                </div>
                <button className="kd-close" onClick={() => setMyOrderItemPreview(null)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="kd-items-title">{myOrderItemPreview.name || "Item"}</div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 220px) 1fr", gap: "14px" }}>
                <img
                  src={
                    myOrderItemPreview.image ||
                    myOrderItemPreview?.imageCandidates?.[0] ||
                    getFoodFallbackImage(myOrderItemPreview.name)
                  }
                  alt={myOrderItemPreview.name || "Item"}
                  data-candidate-index="0"
                  onError={(event) => {
                    applyImageFallbackCandidate(
                      event,
                      myOrderItemPreview?.imageCandidates,
                      getFoodFallbackImage(myOrderItemPreview.name)
                    );
                  }}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                />

                <div>
                  {myOrderItemPreview.description && (
                    <p className="small text-muted mb-2">{myOrderItemPreview.description}</p>
                  )}

                  {Array.isArray(myOrderItemPreview.ingredients) && myOrderItemPreview.ingredients.length > 0 && (
                    <p className="small mb-2">
                      <strong>Ingredients:</strong> {myOrderItemPreview.ingredients.join(", ")}
                    </p>
                  )}

                  {(() => {
                    const parsed = parseOrderItemNote(myOrderItemPreview.note);
                    return (
                      <>
                        {parsed.removedIngredients.length > 0 && (
                          <p className="small mb-2">
                            <strong>Removed:</strong> {parsed.removedIngredients.join(", ")}
                          </p>
                        )}

                        {parsed.addedAddOns.length > 0 && (
                          <p className="small mb-2">
                            <strong>Added extras:</strong> {parsed.addedAddOns.join(", ")}
                          </p>
                        )}
                      </>
                    );
                  })()}

                  <p className="small mb-0">
                    <strong>Qty:</strong> {Number(myOrderItemPreview.quantity || 1)}
                    {Number(myOrderItemPreview.price || 0) > 0 && (
                      <>
                        {" "}
                        <strong className="ms-2">Price:</strong> EUR {Number(myOrderItemPreview.price || 0).toFixed(2)}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {cartItemEditor?.targetItem && (
          <div className="kd-overlay" onClick={() => setCartItemEditor(null)}>
            <div className="kd-modal cart-edit-modal" onClick={(event) => event.stopPropagation()}>
              <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
                <div>
                  <h5 className="mb-1">Edit Item</h5>
                  <p className="small text-muted mb-0">{cartItemEditor.targetItem.name || "Item"}</p>
                </div>
                <button className="kd-close" onClick={() => setCartItemEditor(null)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="cart-edit-section mb-3">
                <label className="cart-item-note-label mb-2">Quick requests</label>
                <div className="cart-item-quick-requests">
                  {(sanitizeQuickRequestOptions(
                    cartItemEditor.targetItem?.quickRequestOptions,
                    cartItemEditor.targetItem?.ingredients
                  ) || [])
                    .filter((request) => !/^no\s+/i.test(String(request || "").trim()))
                    .map((request) => {
                      const selected = Array.isArray(cartItemEditor.selectedRequests) &&
                        cartItemEditor.selectedRequests.includes(request);

                      return (
                        <button
                          key={`${cartItemEditor.targetItem?.cartLineId || cartItemEditor.targetItem?.menuItemId}-edit-request-${request}`}
                          type="button"
                          className={`btn btn-sm cart-request-chip ${selected ? "cart-request-chip-active" : ""}`}
                          onClick={() => {
                            setCartItemEditor((current) => {
                              if (!current) return current;
                              const currentRequests = Array.isArray(current.selectedRequests) ? current.selectedRequests : [];
                              const alreadySelected = currentRequests.includes(request);
                              return {
                                ...current,
                                selectedRequests: alreadySelected
                                  ? currentRequests.filter((entry) => entry !== request)
                                  : [...currentRequests, request],
                              };
                            });
                          }}
                        >
                          {request}
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="cart-edit-section mb-3">
                <label className="cart-item-note-label mb-2">Remove ingredients</label>
                {Array.isArray(cartItemEditor.targetItem?.ingredients) && cartItemEditor.targetItem.ingredients.length > 0 ? (
                  <div className="cart-item-remove-options">
                    {cartItemEditor.targetItem.ingredients.map((ingredient) => {
                      const active = normalizeTextList(cartItemEditor.selectedRemovedIngredients).some(
                        (entry) => String(entry || "").trim().toLowerCase() === String(ingredient || "").trim().toLowerCase()
                      );

                      return (
                        <button
                          key={`${cartItemEditor.targetItem?.cartLineId || cartItemEditor.targetItem?.menuItemId}-edit-remove-${ingredient}`}
                          type="button"
                          className={`btn btn-sm cart-remove-ingredient-chip ${active ? "cart-remove-ingredient-chip-active" : ""}`}
                          onClick={() => {
                            const ingredientName = String(ingredient || "").trim();
                            if (!ingredientName) return;

                            setCartItemEditor((current) => {
                              if (!current) return current;
                              const removed = normalizeTextList(current.selectedRemovedIngredients);
                              const exists = removed.some(
                                (entry) => String(entry || "").trim().toLowerCase() === ingredientName.toLowerCase()
                              );

                              return {
                                ...current,
                                selectedRemovedIngredients: exists
                                  ? removed.filter(
                                      (entry) => String(entry || "").trim().toLowerCase() !== ingredientName.toLowerCase()
                                    )
                                  : [...removed, ingredientName],
                              };
                            });
                          }}
                        >
                          {active ? `Undo ${ingredient}` : `No ${ingredient}`}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="small text-muted mb-0">No ingredients configured for this item.</p>
                )}
              </div>

              <div className="cart-edit-section mb-4">
                <label className="cart-item-note-label mb-2">Extras</label>
                {normalizeAddOns(cartItemEditor.targetItem?.availableAddOns).length > 0 ? (
                  <div className="cart-item-addons">
                    {normalizeAddOns(cartItemEditor.targetItem.availableAddOns).map((addOn) => {
                      const name = String(addOn?.name || "").trim();
                      const active = normalizeAddOns(cartItemEditor.selectedAddOns).some(
                        (entry) => String(entry?.name || "").trim().toLowerCase() === name.toLowerCase()
                      );

                      return (
                        <button
                          key={`${cartItemEditor.targetItem?.cartLineId || cartItemEditor.targetItem?.menuItemId}-edit-addon-${name}`}
                          type="button"
                          className={`btn btn-sm cart-addon-chip ${active ? "cart-addon-chip-active" : ""}`}
                          onClick={() => {
                            setCartItemEditor((current) => {
                              if (!current) return current;

                              const currentAddOns = normalizeAddOns(current.selectedAddOns);
                              const alreadySelected = currentAddOns.some(
                                (entry) => String(entry?.name || "").trim().toLowerCase() === name.toLowerCase()
                              );

                              return {
                                ...current,
                                selectedAddOns: alreadySelected
                                  ? currentAddOns.filter(
                                      (entry) => String(entry?.name || "").trim().toLowerCase() !== name.toLowerCase()
                                    )
                                  : [...currentAddOns, { name, extraPrice: Number(addOn?.extraPrice || 0) }],
                              };
                            });
                          }}
                        >
                          + {name} ({Number(addOn?.extraPrice || 0).toFixed(2)} EUR)
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="small text-muted mb-0">No extras available for this item.</p>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setCartItemEditor(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={saveCartItemEditorChanges}>
                  Save changes
                </button>
              </div>
            </div>
          </div>
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
          <section className="container cart-page cart-shell pb-5">
            <div className="mb-4 restaurants-back-wrap d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-outline-secondary cart-back-btn"
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

            <div className="cart-hero mb-3">
              <h2 className="mb-1">Your Order</h2>
              <p className="mb-0 text-muted small">Review items, confirm address, and place your order in seconds.</p>
            </div>

            {orderMessage && (
              <div className={`alert ${orderMessage.toLowerCase().includes("success") ? "alert-success" : "alert-warning"}`}>
                {orderMessage}
              </div>
            )}

            <div className="row g-4">
              <div className="col-lg-8">
                <div className="restaurant-menu cart-main-card">
                  <h5 className="mb-3">Cart Items ({cartCount})</h5>
                  {cartItems.length === 0 ? (
                    <div className="cart-empty-state">
                      <div className="cart-empty-icon">
                        <i className="bi bi-bag"></i>
                      </div>
                      <div>
                        <h6 className="mb-1">Cart is empty</h6>
                        <p className="text-muted mb-0">Add products from the menu to start your order.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3 cart-items-list">
                      {cartItems.map((item, index) => (
                        <div className="menu-item-card cart-item-row-card" key={item.cartLineId || `${item.menuItemId}-${item.branchId}-${index}`}>
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
                                <h6 className="mb-1 fw-bold">{item.name}</h6>
                                <p className="small text-muted mb-1">{item.restaurantName}</p>
                                {item.branchAddress && <p className="small text-muted mb-2">{item.branchAddress}</p>}
                                <div className="small fw-semibold">EUR {Number(getCartItemUnitPrice(item) || 0).toFixed(2)}</div>
                                {normalizeAddOns(item?.selectedAddOns).length > 0 && (
                                  <p className="cart-item-price-breakdown mb-0">
                                    Base {Number(item.price || 0).toFixed(2)} + Extras {getCartItemAddOnsUnitTotal(item).toFixed(2)}
                                  </p>
                                )}

                                <div className="cart-item-note-wrap mt-2">
                                  <label className="cart-item-note-label">
                                    Item request
                                  </label>

                                  {Array.isArray(item.ingredients) && item.ingredients.length > 0 && (
                                    <p className="cart-item-ingredients mb-2">
                                      Ingredients: {item.ingredients.join(", ")}
                                    </p>
                                  )}

                                  {normalizeTextList(item?.selectedRemovedIngredients).length > 0 && (
                                    <div className="cart-item-remove-options mb-2">
                                      {normalizeTextList(item?.selectedRemovedIngredients).map((ingredient) => {
                                        return (
                                          <button
                                            key={`${item.cartLineId || item.menuItemId}-${ingredient}`}
                                            type="button"
                                            className="btn btn-sm cart-remove-ingredient-chip cart-remove-ingredient-chip-active"
                                            onClick={() => toggleCartItemRemovedIngredient(item, ingredient)}
                                          >
                                            {`Undo ${ingredient}`}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}

                                  <div className="cart-item-quick-requests mb-2">
                                    {(sanitizeQuickRequestOptions(item?.quickRequestOptions, item?.ingredients) || [])
                                      .filter((request) => !/^no\s+/i.test(String(request || "").trim()))
                                      .map((request) => {
                                      const selected = Array.isArray(item.selectedRequests) && item.selectedRequests.includes(request);
                                      return (
                                        <button
                                          key={`${item.menuItemId}-${item.branchId}-${request}`}
                                          type="button"
                                          className={`btn btn-sm cart-request-chip ${selected ? "cart-request-chip-active" : ""}`}
                                          onClick={() => toggleCartItemQuickRequest(item, request)}
                                        >
                                          {request}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {normalizeAddOns(item?.selectedAddOns).length > 0 && (
                                    <div className="cart-item-addons mb-2">
                                      {normalizeAddOns(item.selectedAddOns).map((addOn) => {
                                        return (
                                          <button
                                            key={`${item.menuItemId}-${item.branchId}-addon-${addOn.name}`}
                                            type="button"
                                            className="btn btn-sm cart-addon-chip cart-addon-chip-active"
                                            onClick={() => toggleCartItemAddOn(item, addOn)}
                                          >
                                            + {addOn.name} ({Number(addOn.extraPrice || 0).toFixed(2)} EUR)
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}

                                </div>
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-2 cart-qty-controls">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm cart-qty-btn"
                                onClick={() => updateCartItemQuantity(item, Number(item.quantity || 1) - 1)}
                              >
                                -
                              </button>
                              <span className="fw-semibold cart-qty-value">{item.quantity}</span>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm cart-qty-btn"
                                onClick={() => updateCartItemQuantity(item, Number(item.quantity || 1) + 1)}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm cart-remove-btn"
                                onClick={() => removeCartItem(item)}
                              >
                                Remove
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-dark btn-sm cart-edit-btn"
                                onClick={() => openCartItemEditor(item)}
                              >
                                Edit
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
                <div className="restaurant-menu cart-summary-sticky cart-checkout-card">
                  <h5 className="mb-2">Checkout</h5>

                  <div className="checkout-fields-grid">
                    <div className="checkout-field">
                      <label className="form-label checkout-label">Delivery Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Street, city, country"
                      ></textarea>
                    </div>

                    <div className="checkout-field">
                      <label className="form-label checkout-label">Payment Method</label>
                      <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        <option value="1">Cash</option>
                        <option value="2">Credit Card</option>
                        <option value="3">PayPal</option>
                        <option value="4">Online</option>
                      </select>
                    </div>
                  </div>

                  <div className="checkout-payment-panel mb-2">
                    <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                      <span className="checkout-label mb-0">Payment Verification</span>
                      <span className={`badge ${paymentVerified ? "text-bg-success" : "text-bg-secondary"}`}>
                        {paymentVerified ? "Confirmed" : "Pending"}
                      </span>
                    </div>

                    {String(paymentMethod) === "2" && (
                      <div className="checkout-payment-fields">
                        <input
                          className="form-control"
                          type="text"
                          placeholder="Card holder name"
                          value={paymentCardHolder}
                          onChange={(e) => setPaymentCardHolder(e.target.value)}
                        />
                        <input
                          className="form-control"
                          type="text"
                          placeholder="Card number"
                          value={paymentCardNumber}
                          onChange={(e) => setPaymentCardNumber(e.target.value)}
                        />
                        <div className="checkout-payment-fields-inline">
                          <input
                            className="form-control"
                            type="text"
                            placeholder="MM/YY"
                            value={paymentCardExpiry}
                            onChange={(e) => setPaymentCardExpiry(e.target.value)}
                          />
                          <input
                            className="form-control"
                            type="password"
                            placeholder="CVC"
                            value={paymentCardCvc}
                            onChange={(e) => setPaymentCardCvc(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {String(paymentMethod) === "3" && (
                      <div className="checkout-payment-fields">
                        <input
                          className="form-control"
                          type="email"
                          placeholder="PayPal email"
                          value={paymentOnlineAccount}
                          onChange={(e) => setPaymentOnlineAccount(e.target.value)}
                        />
                      </div>
                    )}

                    {String(paymentMethod) === "4" && (
                      <div className="checkout-payment-fields">
                        <input
                          className="form-control"
                          type="text"
                          placeholder="Online payment account/reference"
                          value={paymentOnlineAccount}
                          onChange={(e) => setPaymentOnlineAccount(e.target.value)}
                        />
                      </div>
                    )}

                    {paymentError && <div className="small text-danger mt-2">{paymentError}</div>}
                    {paymentReference && (
                      <div className="small text-success mt-2">
                        Reference: {paymentReference}
                      </div>
                    )}

                    {isOnlinePaymentMethod && (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm mt-2"
                        onClick={handleConfirmPayment}
                        disabled={paymentProcessing}
                      >
                        {paymentProcessing ? "Processing..." : paymentVerified ? "Reconfirm Payment" : "Pay now"}
                      </button>
                    )}

                    {!isOnlinePaymentMethod && (
                      <p className="small text-muted mb-0 mt-1">Cash on delivery selected.</p>
                    )}
                  </div>

                  <div className="checkout-field mb-2">
                    <label className="form-label checkout-label">Order Notes (optional)</label>
                    <textarea
                      className="form-control"
                      rows="1"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="No onion, extra spicy..."
                    ></textarea>
                  </div>

                  <div className="d-flex justify-content-between mb-1 small cart-summary-row">
                    <span>Subtotal</span>
                    <strong>EUR {cartSubtotal.toFixed(2)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small cart-summary-row">
                    <span>Delivery</span>
                    <strong>EUR {cartDeliveryFee.toFixed(2)}</strong>
                  </div>
                  <div className="cart-fee-explainer mb-2">
                    <div className="small cart-fee-mode">
                      <strong>Fee model:</strong> {deliveryPricing.modeLabel}
                    </div>
                    <div className="small text-muted">
                      <strong>Rule:</strong> {deliveryPricing.ruleLabel}
                      {Number.isFinite(Number(deliveryPricing.usedDistanceKm)) && (
                        <>
                          {" | "}
                          <strong>Distance:</strong> {Number(deliveryPricing.usedDistanceKm).toFixed(2)} km
                        </>
                      )}
                    </div>
                    {Array.isArray(DELIVERY_FEE_MODELS[DELIVERY_FEE_MODE]?.tiers) && (
                      <div className="small text-muted mt-1">
                        Tiers: {DELIVERY_FEE_MODELS[DELIVERY_FEE_MODE].tiers
                          .map((tier) => {
                            const maxKm = Number(tier.maxKm);
                            const label = Number.isFinite(maxKm) ? `0-${maxKm}km` : `>${DELIVERY_FEE_MODELS[DELIVERY_FEE_MODE].tiers[DELIVERY_FEE_MODELS[DELIVERY_FEE_MODE].tiers.length - 2]?.maxKm || 0}km`;
                            return `${label}: EUR ${Number(tier.fee || 0).toFixed(2)}`;
                          })
                          .join(" | ")}
                      </div>
                    )}
                  </div>
                  <div className="d-flex justify-content-between mb-3 cart-summary-total">
                    <span className="fw-semibold">Total</span>
                    <strong>EUR {cartTotal.toFixed(2)}</strong>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary w-100 cart-place-order-btn"
                    disabled={
                      orderSubmitting ||
                      cartItems.length === 0 ||
                      (normalizedCurrentUserRole && normalizedCurrentUserRole !== "customer") ||
                      (isOnlinePaymentMethod && !paymentVerified)
                    }
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

        {![
          "home",
          "merchantDashboard",
          "driverDashboard",
          "merchantMenu",
          "trackOrder",
          "restaurants",
          "myOrders",
          "restaurantDetails",
          "branchMenu",
          "cart",
        ].includes(page) && (
          <section className="container py-5">
            <div className="alert alert-warning d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span>Unknown page state: {String(page || "empty")}. Redirecting options are available below.</span>
              <div className="d-flex gap-2">
                {isMerchantRole ? (
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => { window.location.hash = "/merchant/dashboard"; }}>
                    Go to Merchant Dashboard
                  </button>
                ) : (
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => { window.location.hash = "/"; }}>
                    Go to Home
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </Suspense>
    </>
  );
}

export default App;