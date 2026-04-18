import React, { useEffect, useState } from "react";

function BranchMenuPage({
  restaurant,
  branch,
  menuItems,
  offers,
  loading,
  error,
  onBackToBranches,
  onBackHome,
}) {
  const displayRestaurantName = restaurant?.name || "Restaurant";
  const hasBranch = Boolean(branch);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const filterMenuForBranch = (items, selectedBranch) => {
    if (!Array.isArray(items)) return [];
    if (!selectedBranch) return [];

    const hasBranchSpecificItems = items.some((item) => {
      const directBranchId = item?.branchId ?? item?.BranchId ?? null;
      const branchIds = Array.isArray(item?.branchIds) ? item.branchIds : Array.isArray(item?.BranchIds) ? item.BranchIds : [];
      return String(directBranchId) === String(selectedBranch.id) || branchIds.some((id) => String(id) === String(selectedBranch.id));
    });

    if (!hasBranchSpecificItems) {
      return items;
    }

    return items.filter((item) => {
      const directBranchId = item?.branchId ?? item?.BranchId ?? null;
      const branchIds = Array.isArray(item?.branchIds) ? item.branchIds : Array.isArray(item?.BranchIds) ? item.BranchIds : [];
      return String(directBranchId) === String(selectedBranch.id) || branchIds.some((id) => String(id) === String(selectedBranch.id));
    });
  };

  const selectedMenuItems = filterMenuForBranch(menuItems || [], branch);

  const groupedMenu = selectedMenuItems.reduce((acc, item) => {
    const key = item?.categoryName || "Menu";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const promoList = (offers || []).filter((offer) => offer?.code || offer?.discountPercent);

  useEffect(() => {
    if (!selectedItem) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedItem(null);
        setSelectedQuantity(1);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedItem]);

  const openProductPopup = (item) => {
    setSelectedItem(item);
    setSelectedQuantity(1);
  };

  const closeProductPopup = () => {
    setSelectedItem(null);
    setSelectedQuantity(1);
  };

  const productTotal = selectedItem ? Number(selectedItem.price || 0) * selectedQuantity : 0;

  const tryNextImageCandidate = (event, candidates = [], finalFallback = "") => {
    const img = event.currentTarget;
    const currentIndex = Number(img.dataset.candidateIndex || "0");
    const nextIndex = currentIndex + 1;

    if (Array.isArray(candidates) && nextIndex < candidates.length) {
      img.dataset.candidateIndex = String(nextIndex);
      img.src = candidates[nextIndex];
      return;
    }

    if (finalFallback) {
      img.onerror = null;
      img.src = finalFallback;
    }
  };

  return (
    <div className="restaurants-page-shell">
      <section className="container pb-5 restaurant-details-page">
        <div className="mb-4 restaurants-back-wrap d-flex gap-2 flex-wrap">
          <button type="button" className="btn btn-outline-secondary" onClick={onBackToBranches}>
            <i className="bi bi-arrow-left me-2"></i>Back to locations
          </button>
          <button type="button" className="btn btn-light" onClick={onBackHome}>
            Back to restaurants
          </button>
        </div>

        {loading ? (
          <p className="text-center text-muted">Loading branch details...</p>
        ) : error ? (
          <p className="text-center text-muted">{error}</p>
        ) : !hasBranch ? (
          <p className="text-center text-muted">This location could not be found.</p>
        ) : (
          <>
            <section className="restaurant-summary-card mb-4">
              <div className="restaurant-summary-media">
                <img
                  className="branch-hero-image"
                  src={restaurant?.image || restaurant?.imageCandidates?.[0] || `https://source.unsplash.com/900x300/?restaurant,${encodeURIComponent(displayRestaurantName)}`}
                  alt={displayRestaurantName}
                  data-candidate-index="0"
                  onError={(e) =>
                    tryNextImageCandidate(
                      e,
                      restaurant?.imageCandidates,
                      `https://source.unsplash.com/900x300/?restaurant,logo,${encodeURIComponent(displayRestaurantName)}`
                    )
                  }
                />
              </div>
              <div className="restaurant-summary-content">
                <h2 className="mb-2">{displayRestaurantName}</h2>
                <p className="mb-2">
                  <i className="bi bi-geo-alt me-2"></i>
                  {branch.address || "Address not specified"}
                </p>
                <p className="text-muted mb-2">{[branch.city, branch.zone].filter(Boolean).join(", ") || "City not specified"}</p>
                <div className="d-flex gap-2 flex-wrap">
                  {branch.isMain && <span className="badge text-bg-warning">Main location</span>}
                  {!branch.isActive && <span className="badge text-bg-secondary">Inactive</span>}
                  {branch.deliveryFee !== null && <span className="badge text-bg-light">Delivery fee: EUR {branch.deliveryFee.toFixed(2)}</span>}
                  {!branch.acceptsOrders && <span className="badge text-bg-danger">Ordering disabled</span>}
                  {branch.offersText && <span className="badge text-bg-success">{branch.offersText}</span>}
                </div>
              </div>
            </section>

            {promoList.length > 0 && (
              <section className="restaurant-menu mb-4">
                <h4 className="mb-3">Menu Offers</h4>
                <div className="d-flex flex-wrap gap-2">
                  {promoList.map((offer) => (
                    <span className="badge text-bg-success" key={offer.id || offer.code}>
                      {offer.code ? `${offer.code} ` : ""}
                      {offer.discountPercent > 0 ? `-${offer.discountPercent}%` : "Offer"}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="restaurant-menu">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Menu</h4>
                <button type="button" className="btn btn-primary" disabled={!branch.acceptsOrders || !branch.isActive}>
                  {!branch.isActive || !branch.acceptsOrders ? "Ordering unavailable" : "Start Order"}
                </button>
              </div>

              {selectedMenuItems.length === 0 ? (
                <p className="text-muted">No products found for this location.</p>
              ) : (
                Object.keys(groupedMenu).map((categoryName) => (
                  <div className="mb-4" key={categoryName}>
                    <h5 className="menu-category-title">{categoryName}</h5>
                    <div className="row g-3">
                      {groupedMenu[categoryName].map((item) => (
                        <div className="col-md-6" key={item.id}>
                          <div
                            className="menu-item-card h-100 menu-item-clickable"
                            role="button"
                            tabIndex={0}
                            onClick={() => openProductPopup(item)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openProductPopup(item);
                              }
                            }}
                            aria-label={`Open ${item.name}`}
                          >
                            <div className="d-flex justify-content-between align-items-start gap-3">
                              <div className="menu-item-copy">
                                <h6 className="menu-item-title mb-1">{item.name}</h6>
                                {item.description && <p className="menu-item-desc mb-2">{item.description}</p>}
                                <div className="menu-item-meta d-flex gap-2 flex-wrap">
                                  {!item.available && <span className="badge text-bg-secondary">Unavailable</span>}
                                  {item.calories && <span className="menu-kcal-pill">{item.calories} kcal</span>}
                                  {item.allergens && (
                                    <details
                                      className="menu-allergen-dropdown"
                                      onClick={(event) => event.stopPropagation()}
                                      onKeyDown={(event) => event.stopPropagation()}
                                    >
                                      <summary>Allergens</summary>
                                      <div className="menu-allergen-content">{item.allergens}</div>
                                    </details>
                                  )}
                                </div>
                              </div>
                              {item.image && (
                                <div className="menu-item-thumb-wrap">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="menu-item-image menu-item-thumb"
                                    data-candidate-index="0"
                                    onError={(e) =>
                                      tryNextImageCandidate(
                                        e,
                                        item?.imageCandidates,
                                        `https://source.unsplash.com/160x160/?food,${encodeURIComponent(item.name || "menu-item")}`
                                      )
                                    }
                                  />
                                </div>
                              )}
                            </div>
                            <div className="menu-item-price mt-3">EUR {Number(item.price || 0).toFixed(2)}</div>
                            <p className="menu-item-hint mt-2 mb-0">Click to customize quantity</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </section>

            {selectedItem && (
              <div className="product-quickview-backdrop" onClick={closeProductPopup}>
                <div
                  className="product-quickview-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${selectedItem.name} details`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className="btn-close product-quickview-close"
                    aria-label="Close"
                    onClick={closeProductPopup}
                  ></button>

                  <div className="product-quickview-content">
                    <div className="product-quickview-media">
                      <img
                        src={selectedItem.image || selectedItem.imageCandidates?.[0] || `https://source.unsplash.com/700x500/?food,${encodeURIComponent(selectedItem.name || "menu-item")}`}
                        alt={selectedItem.name}
                        data-candidate-index="0"
                        onError={(e) =>
                          tryNextImageCandidate(
                            e,
                            selectedItem?.imageCandidates,
                            `https://source.unsplash.com/700x500/?food,${encodeURIComponent(selectedItem.name || "menu-item")}`
                          )
                        }
                      />
                    </div>

                    <div className="product-quickview-info">
                      <h4 className="mb-2">{selectedItem.name}</h4>
                      {selectedItem.description && <p className="text-muted mb-3">{selectedItem.description}</p>}

                      <div className="d-flex gap-2 flex-wrap mb-3">
                        {!selectedItem.available && <span className="badge text-bg-secondary">Unavailable</span>}
                        {selectedItem.calories && <span className="badge text-bg-light">{selectedItem.calories} kcal</span>}
                        {selectedItem.allergens && <span className="badge text-bg-light">Allergens: {selectedItem.allergens}</span>}
                      </div>

                      <div className="product-quickview-price mb-3">EUR {Number(selectedItem.price || 0).toFixed(2)}</div>

                      <div className="product-quickview-qty mb-3">
                        <span className="small text-muted">Quantity</span>
                        <div className="product-quickview-qty-controls">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setSelectedQuantity((current) => Math.max(1, current - 1))}
                          >
                            -
                          </button>
                          <span>{selectedQuantity}</span>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setSelectedQuantity((current) => current + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary product-quickview-order-btn"
                        disabled={!selectedItem.available || !branch?.isActive || !branch?.acceptsOrders}
                      >
                        {!selectedItem.available || !branch?.isActive || !branch?.acceptsOrders
                          ? "Ordering unavailable"
                          : `Add to order - EUR ${productTotal.toFixed(2)}`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

export default BranchMenuPage;
