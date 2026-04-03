import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import logo from './assets/LogoBB.png';
import locationImage from './assets/location.png'; 

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setRestaurants([
      { id: 1, name: 'Burger King', image: 'https://source.unsplash.com/300x200/?burger' },
      { id: 2, name: 'Pizza House', image: 'https://source.unsplash.com/300x200/?pizza' },
      { id: 3, name: 'Sushi Bar', image: 'https://source.unsplash.com/300x200/?sushi' },
      { id: 4, name: 'Pasta City', image: 'https://source.unsplash.com/300x200/?pasta' },
      { id: 5, name: 'Grill Master', image: 'https://source.unsplash.com/300x200/?meat' },
    ]);
  }, []);

  const categories = [
    { name: 'Pizza', image: 'https://source.unsplash.com/300x200/?pizza' },
    { name: 'Burger', image: 'https://source.unsplash.com/300x200/?burger' },
    { name: 'Sushi', image: 'https://source.unsplash.com/300x200/?sushi' },
    { name: 'Pasta', image: 'https://source.unsplash.com/300x200/?pasta' },
    { name: 'Meat', image: 'https://source.unsplash.com/300x200/?meat' },
    { name: 'Salad', image: 'https://source.unsplash.com/300x200/?salad' },
  ];

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar fixed-top custom-navbar">
        <div className="container-fluid px-4 d-flex justify-content-between align-items-center">

          {/* LEFT */}
          <div className="d-flex align-items-center">
            <img src={logo} width="40" alt="logo"/>
            <span className="ms-2 fw-bold">BlinkBite</span>
          </div>

          {/* CENTER SEARCH */}
          <div className="search-box d-none d-md-block">
            <input
              type="text"
              placeholder="Search restaurants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* RIGHT */}
          <div className="d-flex align-items-center gap-2">

            {/* LOCATION */}
            <button 
              className="btn btn-light" 
              data-bs-toggle="modal" 
              data-bs-target="#locationModal"
            >
              📍 Prishtina
            </button>

            {/* PARTNERS */}
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

            {/* CART */}
            <button className="btn position-relative">
              <i className="bi bi-cart3 fs-5"></i>
              <span className="cart-badge">{cartCount || 0}</span>
            </button>

            <button className="btn btn-outline-primary">Login</button>
            <button className="btn btn-primary">Sign up</button>
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
                  <input type="text" className="form-control" placeholder="Enter country"/>
                </div>
                <div className="mb-3">
                  <label>City</label>
                  <input type="text" className="form-control" placeholder="Enter city"/>
                </div>
                <div className="mb-3">
                  <label>Street & Number</label>
                  <input type="text" className="form-control" placeholder="Street name and number"/>
                </div>
                <div className="mb-3">
                  <label>Postal Code</label>
                  <input type="text" className="form-control" placeholder="Postal code"/>
                </div>
                <img src={locationImage} alt="Location" className="img-fluid rounded mt-3"/>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-success">Save Address</button>
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
      <section className="container py-5 text-center">
        <h2>Categories</h2>
        <div className="row g-3 mt-3">
          {categories.map(cat => (
            <div className="col-md-3 col-6" key={cat.name}>
              <div
                className="category-card"
                style={{
                  backgroundImage: `url(${cat.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <span>{cat.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RESTAURANTS */}
      <section className="container pb-5">
        <h2 className="text-center mb-4">Restaurants</h2>

        <div className="row g-4">
          {filtered.map(r => (
            <div className="col-md-3 col-6" key={r.id}>
              <div className="restaurant-card">
                <img src={r.image} alt={r.name} />
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