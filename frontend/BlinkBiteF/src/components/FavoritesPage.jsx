import React from "react";
import FavoriteButton from "./FavoriteButton";

function FavoritesPage({ restaurants = [], loading, error, onRestaurantSelect, onRestaurantUnfavorite }) {
  return (
    <div className="restaurants-page-shell">
      <section className="container pb-5 restaurants-page">
        <h2 className="text-center mb-3 restaurants-title">My Favorites</h2>

        <div className="mb-4 restaurants-back-wrap d-flex gap-2 flex-wrap">
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

        {loading ? (
          <p className="text-center text-muted">Loading your favorites...</p>
        ) : error ? (
          <div className="alert alert-warning text-center">{error}</div>
        ) : restaurants.length === 0 ? (
          <div className="text-center text-muted">
            <p className="mb-2">You do not have favorite restaurants yet.</p>
            <p className="mb-0">Tap the star on any restaurant card to add it here.</p>
          </div>
        ) : (
          <div className="row g-4">
            {restaurants.map((restaurant) => (
              <div className="col-md-3 col-6" key={restaurant.id}>
                <div
                  className="restaurant-card position-relative"
                  onClick={() => onRestaurantSelect?.(restaurant)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRestaurantSelect?.(restaurant);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${restaurant.name}`}
                >
                  <div
                    className="position-absolute top-0 end-0 p-2"
                    style={{ zIndex: 10 }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <FavoriteButton
                      type="restaurant"
                      id={restaurant.id}
                      size="medium"
                      onToggleComplete={(nextFavorite) => {
                        if (!nextFavorite) {
                          onRestaurantUnfavorite?.(restaurant.id);
                        }
                      }}
                    />
                  </div>
                  <img
                    src={restaurant.image || `https://source.unsplash.com/300x200/?${encodeURIComponent(restaurant.name || "restaurant")}`}
                    alt={restaurant.name}
                  />
                  <div className="p-2">
                    <h6>{restaurant.name}</h6>
                    <p className="text-muted small mb-0">Saved in your favorites</p>
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

export default FavoritesPage;
