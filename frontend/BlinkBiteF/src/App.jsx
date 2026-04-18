import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import logo from "./assets/LogoBB.png";
import locationImage from "./assets/location.png";

const API_BASE = "http://localhost:5063/api";
const ACCESS_TOKEN_KEY = "access_token";
const HomePage = lazy(() => import("./components/HomePage.jsx"));
const RestaurantsPage = lazy(() => import("./components/RestaurantsPage.jsx"));

function App() {
  const categoriesSliderRef = useRef(null);
  const getRouteState = () => {
    const hash = window.location.hash || "#/";
    if (hash.startsWith("#/restaurants/")) {
      const rawCategory = hash.replace("#/restaurants/", "");
      return {
        page: "restaurants",
        category: decodeURIComponent(rawCategory || ""),
      };
    }

    return {
      page: "home",
      category: "",
    };
  };

  const initialRoute = getRouteState();

  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialRoute.category);
  const [page, setPage] = useState(initialRoute.page);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [findingFood, setFindingFood] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [search, setSearch] = useState("");
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

  const toAbsoluteAssetUrl = (pathOrUrl) => {
    if (!pathOrUrl || typeof pathOrUrl !== "string") return "";
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;

    const apiOrigin = API_BASE.replace(/\/api\/?$/, "");
    const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
    return `${apiOrigin}${normalizedPath}`;
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
        id: r?.id,
        name: r?.name || "Restaurant",
        image: toAbsoluteAssetUrl(r?.image || ""),
        distanceKm: typeof r?.distanceKm === "number" ? r.distanceKm : Number(r?.distanceKm),
        nearestAddress: r?.nearestAddress || "",
        city: r?.city || "",
      }));

      setSelectedCategory("Nearby");
      setRestaurants(normalized);
      setPage("restaurants");
      window.location.hash = "/restaurants/Nearby";
    } catch (err) {
      console.error(err);
      setRestaurants([]);
      alert("Could not load nearby restaurants right now.");
    } finally {
      setRestaurantsLoading(false);
    }
  };

  const handleFindFood = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser.");
      return;
    }

    setFindingFood(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchNearbyRestaurants(latitude, longitude);
        setFindingFood(false);
      },
      (geoErr) => {
        console.error(geoErr);
        setFindingFood(false);
        alert("Please allow location access to find nearby restaurants.");
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
    const syncRouteFromHash = async () => {
      const route = getRouteState();
      setPage(route.page);

      if (route.page === "restaurants" && route.category) {
        setSelectedCategory(route.category);
        if (route.category.toLowerCase() === "nearby") {
          return;
        }
        await fetchRestaurantsByCategory(route.category);
      } else {
        setSelectedCategory("");
        setRestaurants([]);
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
              type="text"
              autoComplete="off"
              placeholder="Search restaurants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                className="form-control mb-3"
                placeholder="Username or Email"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />
              <input
                type="password"
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
                className="form-control mb-3"
                placeholder="Username"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
              />
              <input
                type="email"
                className="form-control mb-3"
                placeholder="Email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
              />
              <input
                type="password"
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
          />
        )}

        {page === "restaurants" && (
          <RestaurantsPage
            selectedCategory={selectedCategory}
            restaurantsLoading={restaurantsLoading}
            filtered={filtered}
          />
        )}
      </Suspense>
    </>
  );
}

export default App;