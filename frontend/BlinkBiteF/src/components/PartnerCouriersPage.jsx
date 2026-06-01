import React from "react";

const PartnerCouriersPage = ({ onApply }) => {
  return (
    <div className="partners-page">
      {/* Hero */}
      <section className="partners-hero partners-hero--courier">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="partners-badge">Become a Courier</span>
              <h1 className="partners-hero-title">Earn money on <span className="partners-accent">your schedule</span></h1>
              <p className="partners-hero-sub">
                Join BlinkBite's courier network and start earning today. Deliver orders in your city, choose your own hours, and get paid fast.
              </p>
              <div className="d-flex gap-3 flex-wrap mt-4">
                <button className="btn partners-btn-primary" onClick={onApply}>
                  Apply Now &rarr;
                </button>
                <a href="#how-it-works" className="btn partners-btn-outline">How it works</a>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div className="partners-hero-icon">🚴</div>
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
                <div className="partners-stat-value">€8–15</div>
                <div className="partners-stat-label">Avg. per hour</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="partners-stat">
                <div className="partners-stat-value">24h</div>
                <div className="partners-stat-label">Weekly payouts</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="partners-stat">
                <div className="partners-stat-value">100%</div>
                <div className="partners-stat-label">Keep your tips</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="partners-stat">
                <div className="partners-stat-value">Free</div>
                <div className="partners-stat-label">To join</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="partners-section" id="how-it-works">
        <div className="container">
          <h2 className="partners-section-title text-center mb-5">How it works</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="partners-step">
                <div className="partners-step-num">1</div>
                <h5>Apply online</h5>
                <p className="text-muted">Fill out a short application form with your details and vehicle type. Takes less than 5 minutes.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="partners-step">
                <div className="partners-step-num">2</div>
                <h5>Get approved</h5>
                <p className="text-muted">Our team reviews your application and activates your courier account within 48 hours.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="partners-step">
                <div className="partners-step-num">3</div>
                <h5>Start earning</h5>
                <p className="text-muted">Go online whenever you want and start accepting delivery orders in your area.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="partners-section partners-section--alt">
        <div className="container">
          <h2 className="partners-section-title text-center mb-5">Why deliver with BlinkBite?</h2>
          <div className="row g-3">
            {[
              { icon: "⏰", title: "Flexible hours", desc: "Work whenever you want — morning, evening, weekends. You set your own schedule." },
              { icon: "💰", title: "Competitive pay", desc: "Base delivery fee plus tips, all paid directly to you weekly." },
              { icon: "📍", title: "Work your area", desc: "Deliver in your neighborhood. No long-distance routes required." },
              { icon: "🏍️", title: "Any vehicle", desc: "Bike, scooter, motorcycle or car — all are welcome on our platform." },
              { icon: "📱", title: "Simple app", desc: "Easy-to-use driver app shows you orders, routes, and earnings in real time." },
              { icon: "🤝", title: "Support 24/7", desc: "Our courier support team is always available to help you on the road." },
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

      {/* Requirements */}
      <section className="partners-section">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-5">
              <h2 className="partners-section-title">Requirements</h2>
              <p className="text-muted mb-4">We keep it simple. You just need the basics to get started.</p>
              <ul className="partners-req-list">
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>Age 18 or older</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>Valid ID or passport</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>Smartphone with internet access</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>Bicycle, scooter or car</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i>Bank account for payouts</li>
              </ul>
            </div>
            <div className="col-lg-7">
              <div className="partners-cta-card">
                <h4 className="mb-2">Ready to start earning?</h4>
                <p className="text-muted mb-4">Apply now and get approved within 48 hours. Start delivering as soon as this week.</p>
                <button className="btn partners-btn-primary w-100" onClick={onApply}>
                  Apply as a Courier
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PartnerCouriersPage;
