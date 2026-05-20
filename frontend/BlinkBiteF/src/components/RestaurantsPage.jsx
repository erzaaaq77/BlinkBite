import React from "react";
import FavoriteButton from './FavoriteButton';
function RestaurantsPage({ selectedCategory, restaurantsLoading, filtered, nearbyError, locationQuery, onRestaurantSelect }) {
  const isNearby = (selectedCategory || "").toLowerCase() === "nearby";

  return (
    <div className="restaurants-page-shell">
      <section className="container pb-5 restaurants-page">
        <h2 className="text-center mb-3 restaurants-title">{selectedCategory ? `Restaurants - ${selectedCategory}` : "Restaurants"}</h2>
        {isNearby && locationQuery && (
          <p className="text-center text-muted mb-3">Showing results around: {locationQuery}</p>
        )}

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
        ) : isNearby && nearbyError ? (
          <p className="text-center text-muted">{nearbyError}</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted">
            {isNearby
              ? "No nearby restaurants found around your current location."
              : "No restaurants found for this category."}
          </p>
        ) : (
          <div className="row g-4">
            {filtered.map((r) => (
              <div className="col-md-3 col-6" key={r.id}>
                <div
                  className="restaurant-card  position-relative"
                  onClick={() => onRestaurantSelect?.(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRestaurantSelect?.(r);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${r.name}`}
                >
    <div className="position-absolute top-0 end-0 p-2" style={{ zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
      <FavoriteButton type="restaurant" id={r.id} size="medium" />
    </div>
                  <img src={r.image || `https://source.unsplash.com/300x200/?${r.name}`} alt={r.name} />
                  <div className="p-2">
                    <h6>{r.name}</h6>
                    <p className="text-muted small">⭐ 4.5 • 30 min • FREE</p>
                    {typeof r.distanceKm === "number" && (
                      <p className="text-muted small mb-1">📍 {r.distanceKm.toFixed(2)} km away</p>
                    )}
                    {r.nearestAddress && (
                      <p className="text-muted small mb-0">{r.nearestAddress}</p>
                    )}
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
  );
}

export default RestaurantsPage;
