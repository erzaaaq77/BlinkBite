import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import logo from "./assets/LogoBB.png";
import locationImage from "./assets/location.png";

const API_BASE = "http://localhost:5063/api";

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);

  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [currentUser, setCurrentUser] = useState(null);
  const [authMessage, setAuthMessage] = useState("");

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

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/restaurants/kategori`, { headers: authHeaders() });

      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
      setCategories([
        { name: "Pizza", image: "https://source.unsplash.com/300x200/?pizza" },
        { name: "Burger", image: "https://source.unsplash.com/300x200/?burger" },
      ]);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const res = await fetch(`${API_BASE}/restaurants`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load restaurants");
      const data = await res.json();
      setRestaurants(data);
    } catch (err) {
      console.error(err);
      setRestaurants([
        { id: 1, name: "Burger King", image: "https://source.unsplash.com/300x200/?burger" },
        { id: 2, name: "Pizza House", image: "https://source.unsplash.com/300x200/?pizza" },
        { id: 3, name: "Sushi Bar", image: "https://source.unsplash.com/300x200/?sushi" },
      ]);
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
    setAuthMessage("");
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
        setAuthMessage(data?.title || JSON.stringify(data) || "Signup failed");
        return;
      }
      setAuthMessage("Signup successful. You can now login.");
      closeModal("#signupModal");
      setLoginUsername(signupUsername || signupEmail);
      setLoginPassword("");
      setSignupUsername("");
      setSignupEmail("");
      setSignupPassword("");
    } catch (err) {
      console.error(err);
      setAuthMessage("Signup error");
    }
  };

  const handleLogin = async () => {
    setAuthMessage("");
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
        setAuthMessage(data?.message || "Login failed");
        return;
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setAuthMessage("Login successful");
        closeModal("#loginModal");
        setLoginPassword("");
        await fetchCurrentUser();
        await fetchCategories();
        await fetchRestaurants();
      } else {
        setAuthMessage("Login successful (no token returned)");
        closeModal("#loginModal");
        await fetchCurrentUser();
      }
    } catch (err) {
      console.error(err);
      setAuthMessage("Login error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setCurrentUser(null);
    setAuthMessage("Logged out");
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

  useEffect(() => {
    fetchRestaurants();
    fetchCategories();
    if (token) fetchCurrentUser();
  }, []);

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
                <div className="me-2">
                  <span className="small text-muted">Hi, {currentUser?.userName || currentUser?.userName || "User"}</span>
                </div>
                <button className="btn btn-outline-secondary" onClick={handleLogout}>
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
              {authMessage && <div className="alert alert-info">{authMessage}</div>}
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
              {authMessage && <div className="alert alert-info">{authMessage}</div>}
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
  <div className="categories-row">
    {categories.length === 0 ? (
      <p>Loading categories...</p>
    ) : (
      categories.map((cat, index) => (
        <div
          key={index}
          className="category-card"
          style={{
            flex: "1",
            backgroundImage: `url(https://source.unsplash.com/300x200/?${cat})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          onClick={() => {
            console.log("Clicked category:", cat);
          }}
        >
          <span>{cat}</span>
        </div>
      ))
    )}
  </div>
</section>



      {/* RESTAURANTS */}
      <section className="container pb-5">
        <h2 className="text-center mb-4">Restaurants</h2>

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
      </section>
    </>
  );
}

export default App;
