import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import logo from "./assets/LogoBB.png";
import locationImage from "./assets/location.png";
import merchantImage from "./assets/Merchant.png";
import courierImage from "./assets/Courier.png";
import communityImage from "./assets/Community.png";

const API_BASE = "http://localhost:5063/api";

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
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);

  const [token, setToken] = useState(localStorage.getItem("token") || "");
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

  const authHeaders = () => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
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
      const res = await fetch(`${API_BASE}/restaurants/kategori`, { headers: authHeaders() });
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
      const res = await fetch(`${API_BASE}/restaurants/bykategori/${encodeURIComponent(categoryName)}`, {
        headers: authHeaders(),
      });
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

  const fetchCurrentUser = async () => {
    if (!token) {
      setCurrentUser(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: authHeaders(),
      });
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
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: signupUsername,
          email: signupEmail,
          password: signupPassword,
          role: "Customer",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSignupMessage(data?.title || JSON.stringify(data) || "Signup failed");
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
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginMessage(data?.message || "Login failed. Check your credentials.");
        return;
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setCurrentUser(null);
    setLoginUsername("");
    setLoginPassword("");
    setLoginMessage("");
    setSignupMessage("");
    setCartCount(0);
  };

  const handleSaveAddress = async () => {
    try {
      const res = await fetch(`${API_BASE}/addresses`, {
        method: "POST",
        headers: authHeaders(),
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
    const el = document.querySelector(selector);
    if (!el) return;
    const modalInstance = window.bootstrap?.Modal.getInstance(el);
    if (modalInstance) modalInstance.hide();
    else {
      el.classList.remove("show");
      el.style.display = "none";
      document.body.classList.remove("modal-open");
      const backdrop = document.querySelector(".modal-backdrop");
      if (backdrop) backdrop.remove();
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
  }, []);

  useEffect(() => {
    const syncRouteFromHash = async () => {
      const route = getRouteState();
      setPage(route.page);

      if (route.page === "restaurants" && route.category) {
        setSelectedCategory(route.category);
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

      {page === "home" && (
        <div className="home-page-shell">
          {/* HERO */}
          <section className="hero">
            <h1>Order your favorite food instantly</h1>
            <p>Fast, simple and modern food delivery</p>
            <div className="hero-search">
              <input placeholder="Enter your address..." />
              <button>Find Food</button>
            </div>
          </section>

          {/* CATEGORIES */}
          <section className="container py-5 text-center categories">
            <h2 className="text-center mb-3">Categories</h2>
            <div className="categories-slider-wrap">
              <button
                type="button"
                className="slider-arrow slider-arrow-left"
                onClick={() => scrollCategories("left")}
                aria-label="Scroll categories left"
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              <div className="categories-row" ref={categoriesSliderRef}>
                {categories.length === 0 ? (
                  <p>Loading categories...</p>
                ) : (
                  categories.map((cat, index) => {
                    const catName = typeof cat === "string" ? cat : cat?.name || "Category";
                    const catImage =
                      typeof cat === "object" && cat?.image
                        ? cat.image
                        : `https://source.unsplash.com/300x200/?${encodeURIComponent(catName)}`;

                    return (
                      <div
                        key={typeof cat === "object" ? cat?.id || catName || index : catName || index}
                        className={`category-card ${selectedCategory === catName ? "active-category" : ""}`}
                        style={{
                          flex: "1",
                          backgroundImage: `url(${catImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                        onClick={() => {
                          window.location.hash = `/restaurants/${encodeURIComponent(catName)}`;
                        }}
                      >
                        <span>{catName}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                className="slider-arrow slider-arrow-right"
                onClick={() => scrollCategories("right")}
                aria-label="Scroll categories right"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </section>

          <section className="join-columns-section">
            <h2 className="partners-growth-title">Grow with BlinkBite</h2>

            <div className="feature-panel merchant-panel">
              <img
                src={merchantImage}
                alt="Restaurant team preparing meals for delivery"
              />
              <div className="feature-panel-content">
                <h4>Become a Merchant - Let's grow your business together!</h4>
                <ul className="feature-points">
                  <li>Add your menu to BlinkBite and enjoy more orders with fast delivery support.</li>
                  <li>Reach more customers and increase visibility across your city.</li>
                  <li>Get clear insights on popular menu items and order trends.</li>
                </ul>
                <button type="button" className="btn btn-outline-dark">Join Us</button>
              </div>
            </div>

            <div className="feature-panel courier-panel reverse-panel">
              <img
                src={courierImage}
                alt="BlinkBite courier delivering an order"
              />
              <div className="feature-panel-content">
                <h4>Earn flexibly as a courier</h4>
                <ul className="feature-points">
                  <li>Choose your schedule and deliver when it works for you.</li>
                  <li>Increase your income with each completed delivery.</li>
                  <li>Move through the city with easy, reliable task flow.</li>
                </ul>
                <button type="button" className="btn btn-outline-dark">Join Us</button>
              </div>
            </div>

            <div className="feature-panel community-panel">
              <img
                src={communityImage}
                alt="Friends sharing food together"
              />
              <div className="feature-panel-content">
                <h4>Build a stronger local community</h4>
                <ul className="feature-points">
                  <li>Connect people with local restaurants they love.</li>
                  <li>Support neighborhood businesses with every order.</li>
                  <li>Create shared moments through food, speed, and convenience.</li>
                </ul>
                <button type="button" className="btn btn-outline-dark">Join Us</button>
              </div>
            </div>
          </section>

          <section className="slogan-carousel-section" aria-label="BlinkBite slogans">
            <div className="slogan-carousel-track">
              <span>Let's grow your business together.</span>
              <span>Become a courier and earn on the move.</span>
              <span>Discover. Enjoy. Share BlinkBite.</span>
              <span>Join BlinkBite - where flavor meets speed.</span>
              <span>Let's grow your business together.</span>
              <span>Become a courier and earn on the move.</span>
              <span>Discover. Enjoy. Share BlinkBite.</span>
              <span>Join BlinkBite - where flavor meets speed.</span>
            </div>
          </section>

          <footer className="restaurants-footer mt-auto">
            <div className="container py-4">
              <div className="row g-3 align-items-start text-start">
                <div className="col-md-4">
                  <h6 className="mb-2">BlinkBite</h6>
                  <p className="mb-0 small">Fast, simple and modern food delivery platform for your daily cravings and favorite local restaurants.</p>
                </div>
                <div className="col-md-4">
                  <h6 className="mb-2">Quick Links</h6>
                  <p className="mb-1 small">Categories</p>
                  <p className="mb-1 small">Top Restaurants</p>
                  <p className="mb-0 small">Support & Help Center</p>
                </div>
                <div className="col-md-4">
                  <h6 className="mb-2">Contact</h6>
                  <p className="mb-1 small">Prishtina, Kosovo</p>
                  <p className="mb-1 small">support@blinkbite.com</p>
                  <p className="mb-0 small">+383 49 000 000</p>
                </div>
              </div>
              <div className="pt-3 mt-3 border-top text-center small">
                © {new Date().getFullYear()} BlinkBite. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* RESTAURANTS */}
      {page === "restaurants" && (
        <div className="restaurants-page-shell">
          <section className="container pb-5 restaurants-page">
            <h2 className="text-center mb-3 restaurants-title">{selectedCategory ? `Restaurants - ${selectedCategory}` : "Restaurants"}</h2>

            <div className="mb-4 restaurants-back-wrap">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  window.location.hash = "/";
                }}
              >
                <i className="bi bi-arrow-left me-2"></i>Back to categories
              </button>
            </div>

            {!selectedCategory ? (
              <p className="text-center text-muted">Choose a category to load restaurants.</p>
            ) : restaurantsLoading ? (
              <p className="text-center text-muted">Loading restaurants...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted">No restaurants found for this category.</p>
            ) : (
              <div className="row g-4">
                {filtered.map((r) => (
                  <div className="col-md-3 col-6" key={r.id}>
                    <div className="restaurant-card">
                      <img src={r.image || `https://source.unsplash.com/300x200/?${r.name}`} alt={r.name} />
                      <div className="p-2">
                        <h6>{r.name}</h6>
                        <p className="text-muted small">⭐ 4.5 • 30 min • FREE</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <footer className="restaurants-footer mt-auto">
            <div className="container py-4">
              <div className="row g-3 align-items-start text-start">
                <div className="col-md-4">
                  <h6 className="mb-2">BlinkBite</h6>
                  <p className="mb-0 small">Fast, simple and modern food delivery platform for your daily cravings and favorite local restaurants.</p>
                </div>
                <div className="col-md-4">
                  <h6 className="mb-2">Quick Links</h6>
                  <p className="mb-1 small">Categories</p>
                  <p className="mb-1 small">Top Restaurants</p>
                  <p className="mb-0 small">Support & Help Center</p>
                </div>
                <div className="col-md-4">
                  <h6 className="mb-2">Contact</h6>
                  <p className="mb-1 small">Prishtina, Kosovo</p>
                  <p className="mb-1 small">support@blinkbite.com</p>
                  <p className="mb-0 small">+383 49 000 000</p>
                </div>
              </div>
              <div className="pt-3 mt-3 border-top text-center small">
                © {new Date().getFullYear()} BlinkBite. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}

export default App;