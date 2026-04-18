import React from "react";
import merchantImage from "../assets/Merchant.png";
import courierImage from "../assets/Courier.png";
import communityImage from "../assets/Community.png";

function HomePage({
  categories,
  selectedCategory,
  categoriesSliderRef,
  scrollCategories,
  locationQuery,
  onLocationQueryChange,
  onFindFood,
  findingFood,
  nearbyError,
}) {
  return (
    <div className="home-page-shell">
      <section className="hero">
        <h1>Order your favorite food instantly</h1>
        <p>Fast, simple and modern food delivery</p>
        <div className="hero-search">
          <input
            placeholder="Enter your address..."
            value={locationQuery}
            onChange={(e) => onLocationQueryChange(e.target.value)}
          />
          <button type="button" onClick={onFindFood} disabled={findingFood}>
            {findingFood ? "Finding..." : "Find Food"}
          </button>
        </div>
        {nearbyError && <p className="mt-3 text-warning-emphasis">{nearbyError}</p>}
      </section>

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
            <h4>Become a Merchant - Let&apos;s grow your business together!</h4>
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
          <span>Let&apos;s grow your business together.</span>
          <span>Become a courier and earn on the move.</span>
          <span>Discover. Enjoy. Share BlinkBite.</span>
          <span>Join BlinkBite - where flavor meets speed.</span>
          <span>Let&apos;s grow your business together.</span>
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
  );
}

export default HomePage;
