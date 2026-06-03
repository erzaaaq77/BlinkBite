import React from "react";

const PartnerDrivePage = () => {
  return (
    <div className="partners-page">
      {/* Hero */}
      <section className="partners-hero partners-hero--drive">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="partners-badge">BlinkBite Drive</span>
              <h1 className="partners-hero-title">Fast delivery, <span className="partners-accent">anywhere in the city</span></h1>
              <p className="partners-hero-sub">
                BlinkBite Drive is our own logistics network. We handle the delivery so restaurants can focus on cooking and customers get their food fast.
              </p>
              <div className="d-flex gap-3 flex-wrap mt-4">
                <button className="btn partners-btn-primary" onClick={() => window.location.hash = "/"}>
                  Order now &rarr;
                </button>
                <a href="#drive-how" className="btn partners-btn-outline">How it works</a>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div className="partners-hero-icon">🚚</div>
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
                <div className="partners-stat-value">30min</div>
                <div className="partners-stat-label">Average delivery</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="partners-stat">
                <div className="partners-stat-value">Prishtinë</div>
                <div className="partners-stat-label">Active city</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="partners-stat">
                <div className="partners-stat-value">Live</div>
                <div className="partners-stat-label">Order tracking</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="partners-stat">
                <div className="partners-stat-value">7 days</div>
                <div className="partners-stat-label">Week coverage</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="partners-section" id="drive-how">
        <div className="container">
          <h2 className="partners-section-title text-center mb-5">How BlinkBite Drive works</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="partners-step">
                <div className="partners-step-num">1</div>
                <h5>You place an order</h5>
                <p className="text-muted">Choose your restaurant and items. BlinkBite Drive routes your order to the nearest available courier.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="partners-step">
                <div className="partners-step-num">2</div>
                <h5>Courier picks up</h5>
                <p className="text-muted">A nearby BlinkBite courier picks up your order from the restaurant as soon as it's ready.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="partners-step">
                <div className="partners-step-num">3</div>
                <h5>Delivered to your door</h5>
                <p className="text-muted">Track your delivery in real time and receive your order right at your address.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="partners-section partners-section--alt">
        <div className="container">
          <h2 className="partners-section-title text-center mb-5">What makes BlinkBite Drive different</h2>
          <div className="row g-3">
            {[
              { icon: "📍", title: "Live tracking", desc: "Watch your order move in real time from the restaurant to your door." },
              { icon: "🌦️", title: "All weather", desc: "Our courier fleet operates in all weather conditions so you're never left hungry." },
              { icon: "❄️", title: "Thermal bags", desc: "Every order is delivered in insulated bags to keep food at the right temperature." },
              { icon: "🔔", title: "Delivery notifications", desc: "Get notified when your courier picks up and when they're arriving." },
              { icon: "⚡", title: "Express slots", desc: "Book express delivery slots for guaranteed faster-than-average arrival times." },
              { icon: "🛡️", title: "Order protection", desc: "If something goes wrong with your delivery, we make it right. Always." },
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

      {/* Coverage */}
      <section className="partners-section">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <h2 className="partners-section-title">Coverage areas</h2>
              <p className="text-muted mb-4">BlinkBite Drive operates in Prishtina, with more cities coming soon.</p>
              <div className="row g-2">
                {["Prishtinë"].map((city) => (
                  <div className="col-6" key={city}>
                    <div className="d-flex align-items-center gap-2 partners-city-item">
                      <i className="bi bi-geo-alt-fill text-warning"></i>
                      <span>{city}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-6">
              <div className="partners-cta-card text-center">
                <div style={{ fontSize: "3rem" }}>🚀</div>
                <h4 className="mt-2 mb-2">Ready to order?</h4>
                <p className="text-muted mb-4">Browse restaurants near you and get your first order delivered by BlinkBite Drive.</p>
                <button 
  className="btn btn-primary mt-3" 
  onClick={() => { window.location.hash = "/restaurants/Nearby"; }}
>
  Browse Restaurants
</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PartnerDrivePage;
