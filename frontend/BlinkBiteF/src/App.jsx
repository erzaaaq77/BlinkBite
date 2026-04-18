import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import logo from "./assets/LogoBB.png";
import locationImage from "./assets/location.png";

const API_BASE = "http://localhost:5063/api";
const ACCESS_TOKEN_KEY = "access_token";
const NEARBY_COORDS_KEY = "nearby_coords";
const HomePage = lazy(() => import("./components/HomePage.jsx"));
const RestaurantsPage = lazy(() => import("./components/RestaurantsPage.jsx"));
const RestaurantDetailsPage = lazy(() => import("./components/RestaurantDetailsPage.jsx"));
const BranchMenuPage = lazy(() => import("./components/BranchMenuPage.jsx"));

function App() {
  const categoriesSliderRef = useRef(null);
  const searchInputRef = useRef(null);
  const getRouteState = () => {
    const hash = window.location.hash || "#/";
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

  const [addressCountry, setAddressCountry] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressPostal, setAddressPostal] = useState("");

  const filtered = (restaurants || []).filter(r =>
    (r.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const extractErrorMessage = (payload, fallbackMessage) => {
    if (!payload) return fallbackMessage;

    if (typeof payload === "string") return payload;

    if (Array.isArray(payload)) {
      const described = payload
        .map((item) => item?.description || item?.Description || item?.message || item?.Message)
        .filter(Boolean);
      if (described.length > 0) return described.join(" ");
    }

    if (payload.message) return payload.message;
    if (payload.title) return payload.title;

    if (payload.errors && typeof payload.errors === "object") {
      const messages = Object.values(payload.errors)
        .flat()
        .filter(Boolean);
      if (messages.length > 0) return messages.join(" ");
    }

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

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return [encodeURI(raw)];
    }

    raw = raw.replace(/^~\/?/, "");
    raw = raw.replace(/\\+/g, "/");

    const uploadsMatch = raw.match(/(?:^|\/)(uploads\/.*)$/i);
    if (uploadsMatch?.[1]) {
      raw = uploadsMatch[1];
    }

    const cleaned = raw.replace(/^\/+/, "");
    if (!cleaned) return [];

    const apiOrigin = API_BASE.replace(/\/api\/?$/, "");
    const candidates = new Set();

    candidates.add(encodeURI(`${apiOrigin}/${cleaned}`));
    candidates.add(encodeURI(`${apiOrigin}/uploads/${cleaned}`));

    if (/^(menuitems|logos|categories)\//i.test(cleaned)) {
      candidates.add(encodeURI(`${apiOrigin}/uploads/${cleaned}`));
    }

    return Array.from(candidates);
  };

  const toAbsoluteAssetUrl = (pathOrUrl) => {
    const candidates = getAssetUrlCandidates(pathOrUrl);
    return candidates[0] || "";
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
      return;
    }
    try {
      const res = await authenticatedFetch(`${API_BASE}/auth/me`);
      if (!res.ok) {
        setCurrentUser(null);
        return;
      }
      const data = await res.json();
      setCurrentUser(data);
    } catch (err) {
      console.error(err);
      setCurrentUser(null);
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

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: normalizedUsername,
          email: normalizedEmail,
          password: signupPassword,
          role: "Customer",
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
        setLoginMessage("Login successful! Welcome back 👋");
        setTimeout(async () => {
          closeModal("#loginModal");
          setLoginMessage("");
          setLoginUsername("");
          setLoginPassword("");
          await fetchCurrentUser();
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
    // Do UI reset immediately so logout feels instant.
    persistToken("");
    setCurrentUser(null);
    setLoginUsername("");
    setLoginPassword("");
    setLoginMessage("");
    setSignupMessage("");
    setCartCount(0);
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
      // Bootstrap hide animation can leave stale body styles in edge cases.
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
  }, [token]);

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

            <button className="btn position-relative">
              <i className="bi bi-cart3 fs-5"></i>
              <span className="cart-badge">{cartCount || 0}</span>
            </button>

            {token ? (
              <>
                {/* ✅ Username i rregulluar */}
                <div className="me-2">
                  <span className="small text-muted">Hi, {currentUser?.userName || "User"}</span>
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
      </Suspense>
    </>
  );
}

export default App;