import React from "react";

function RestaurantDetailsPage({
  restaurant,
  branches,
  brandRestaurantCount,
  loading,
  error,
  onBack,
  onSelectBranch,
  restaurantId,
}) {
  const displayName = restaurant?.name || (restaurantId ? `Restaurant #${restaurantId}` : "Restaurant");
  const hasBranches = Array.isArray(branches) && branches.length > 0;

  return (
    <div className="restaurants-page-shell">
      <section className="container pb-5 restaurant-details-page">
        <div className="mb-4 restaurants-back-wrap">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onBack}
          >
            <i className="bi bi-arrow-left me-2"></i>Back
          </button>
        </div>

        <h2 className="mb-4">{displayName}</h2>

        {loading ? (
          <p className="text-center text-muted">Loading restaurant details...</p>
        ) : error ? (
          <p className="text-center text-muted">{error}</p>
        ) : (
          <>
            <section className="restaurant-branches mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Choose a Location</h4>
                <span className="badge text-bg-light">{branches?.length || 0}</span>
              </div>
              {brandRestaurantCount > 1 && (
                <p className="text-muted small mb-3">
                  Showing merged locations across {brandRestaurantCount} restaurants with the same name.
                </p>
              )}

              {!hasBranches ? (
                <p className="text-muted mb-0">No extra branch points found for this restaurant.</p>
              ) : (
                <div className="row g-4">
                  {branches.map((branch) => (
                    <div className="col-md-4 col-6" key={branch.id}>
                      <div
                        className="restaurant-card branch-restaurant-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectBranch?.(branch)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelectBranch?.(branch);
                          }
                        }}
                        aria-label={`Open ${displayName} at ${branch.address || branch.city || "location"}`}
                      >
                        <img
                          src={restaurant?.image || `https://source.unsplash.com/400x300/?pizza,restaurant,${encodeURIComponent(displayName)}`}
                          alt={`${displayName} ${branch.city || "location"}`}
                        />
                        <div className="p-2">
                          <h6 className="mb-1">{displayName}</h6>
                          <p className="text-muted small mb-1">
                            <i className="bi bi-geo-alt me-1"></i>
                            {branch.address || "Address not specified"}
                          </p>
                          <p className="text-muted small mb-2">
                            {[branch.city, branch.zone].filter(Boolean).join(", ") || "City not specified"}
                          </p>
                          <div className="d-flex gap-2 flex-wrap">
                            {branch.isMain && <span className="badge text-bg-warning">Main</span>}
                            {!branch.isActive && <span className="badge text-bg-secondary">Inactive</span>}
                            {branch.deliveryFee !== null && (
                              <span className="badge text-bg-light">Fee: EUR {branch.deliveryFee.toFixed(2)}</span>
                            )}
                            {!branch.acceptsOrders && <span className="badge text-bg-danger">No orders</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
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
              <p className="mb-0 small">Support and Help Center</p>
            </div>
            <div className="col-md-4">
              <h6 className="mb-2">Contact</h6>
              <p className="mb-1 small">Prishtina, Kosovo</p>
              <p className="mb-1 small">support@blinkbite.com</p>
              <p className="mb-0 small">+383 49 000 000</p>
            </div>
          </div>
          <div className="pt-3 mt-3 border-top text-center small">
            Copyright {new Date().getFullYear()} BlinkBite. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default RestaurantDetailsPage;
