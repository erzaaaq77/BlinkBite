import React from "react";

const PartnerMerchantsPage = ({ onApply }) => {
  return (
    <div className="partners-page">
      {/* Hero */}
      <section className="partners-hero partners-hero--merchant">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="partners-badge">For Restaurants</span>
              <h1 className="partners-hero-title">Grow your restaurant with <span className="partners-accent">BlinkBite</span></h1>
              <p className="partners-hero-sub">
                Reach thousands of hungry customers in your city. List your restaurant on BlinkBite and start receiving online orders today.
              </p>
              <div className="d-flex gap-3 flex-wrap mt-4">
                <button className="btn partners-btn-primary" onClick={onApply}>
                  List Your Restaurant &rarr;
                </button>
                <button className="btn partners-btn-outline" onClick={() => document.getElementById('merchant-how')?.scrollIntoView({ behavior: 'smooth' })}>Learn more</button>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div className="partners-hero-icon">🍔</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="partners-stats">
        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-6 col-md-3">
              <div className="partners-stat">
                <div className="partners-stat-value">10k+</div>
                <div className="partners-stat-label">Active customers</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="partners-stat">
                <div className="partners-stat-value">30min</div>
                <div className="partners-stat-label">Avg. delivery time</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="partners-stat">
                <div className="partners-stat-value">5+</div>
                <div className="partners-stat-label">Cities covered</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="partners-stat">
                <div className="partners-stat-value">Free</div>
                <div className="partners-stat-label">To list</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="partners-section" id="merchant-how">
        <div className="container">
          <h2 className="partners-section-title text-center mb-5">How it works</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="partners-step">
                <div className="partners-step-num">1</div>
                <h5>Submit your application</h5>
                <p className="text-muted">Tell us about your restaurant — name, address, category, and contact details.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="partners-step">
                <div className="partners-step-num">2</div>
                <h5>We set you up</h5>
                <p className="text-muted">Our team activates your merchant account and helps you upload your menu and photos.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="partners-step">
                <div className="partners-step-num">3</div>
                <h5>Receive orders</h5>
                <p className="text-muted">Start getting orders through your merchant dashboard. Manage everything in one place.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="partners-section partners-section--alt">
        <div className="container">
          <h2 className="partners-section-title text-center mb-5">Why partner with us?</h2>
          <div className="row g-3">
            {[
              { icon: "📊", title: "Real-time dashboard", desc: "Track orders, revenue, and customer reviews from your merchant dashboard." },
              { icon: "🌍", title: "Wider reach", desc: "Get discovered by thousands of new customers across your city instantly." },
              { icon: "📋", title: "Manage your menu", desc: "Add, edit, and update your menu items and prices anytime, from any device." },
              { icon: "🏢", title: "Multiple branches", desc: "Run multiple locations from a single merchant account with per-branch control." },
              { icon: "⭐", title: "Customer reviews", desc: "Build your reputation with genuine customer ratings and reviews." },
              { icon: "📦", title: "Order tracking", desc: "Customers can track their orders in real time, reducing calls to your kitchen." },
            ].map((b) => (
              <div className="col-sm-6 col-lg-4" key={b.title}>
                <div className="partners-benefit-card">
                  <span className="partners-benefit-icon">{b.icon}</span>
                  <div>
                    <h6 className="mb-1">{b.title}</h6>
                    <p className="text-muted small mb-0">{b.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="partners-section">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-5">
              <h2 className="partners-section-title">What you need to join</h2>
              <ul className="partners-req-list mt-3">
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>A registered food business</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>Valid business address</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>Contact email and phone</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>Your menu ready to upload</li>
              </ul>
            </div>
            <div className="col-lg-7">
              <div className="partners-cta-card">
                <h4 className="mb-2">Ready to grow your business?</h4>
                <p className="text-muted mb-4">Join hundreds of restaurants already on BlinkBite. Application takes under 5 minutes.</p>
                <button className="btn partners-btn-primary w-100" onClick={onApply}>
                  Apply as a Merchant
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="text-center py-4">
        <button
          className="btn btn-link text-decoration-none"
          onClick={() => { window.location.hash = "/"; }}
        >
          ← Back to home page
        </button>
      </div>
    </div>
  );
};

export default PartnerMerchantsPage;
