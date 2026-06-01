import React, { useState } from "react";

const PartnerCompaniesPage = () => {
  const [form, setForm] = useState({ company: "", name: "", email: "", employees: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.company || !form.email) return;
    setSubmitted(true);
  };

  return (
    <div className="partners-page">
      {/* Hero */}
      <section className="partners-hero partners-hero--company">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="partners-badge">Corporate Solutions</span>
              <h1 className="partners-hero-title">Feed your <span className="partners-accent">team, every day</span></h1>
              <p className="partners-hero-sub">
                BlinkBite for Companies gives your employees easy access to office meals, catered lunches, and group ordering — all on one company account.
              </p>
              <div className="d-flex gap-3 flex-wrap mt-4">
                <a href="#company-form" className="btn partners-btn-primary">Get in touch &rarr;</a>
                <a href="#company-features" className="btn partners-btn-outline">See features</a>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div className="partners-hero-icon">🏢</div>
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
                <div className="partners-stat-value">50+</div>
                <div className="partners-stat-label">Partner restaurants</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="partners-stat">
                <div className="partners-stat-value">Monthly</div>
                <div className="partners-stat-label">Invoicing available</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="partners-stat">
                <div className="partners-stat-value">Unlimited</div>
                <div className="partners-stat-label">Team members</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="partners-stat">
                <div className="partners-stat-value">24/7</div>
                <div className="partners-stat-label">Dedicated support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="partners-section" id="company-features">
        <div className="container">
          <h2 className="partners-section-title text-center mb-5">Built for businesses</h2>
          <div className="row g-3">
            {[
              { icon: "🧾", title: "Monthly invoicing", desc: "Get a consolidated monthly invoice for all team orders — no individual receipts needed." },
              { icon: "👥", title: "Group ordering", desc: "Let your team order together for meetings, events, or daily lunches from one shared basket." },
              { icon: "💳", title: "Company budget control", desc: "Set daily or weekly meal budgets per employee. Keep costs predictable." },
              { icon: "📊", title: "Spending reports", desc: "Download detailed reports of what your team ordered and when." },
              { icon: "🚀", title: "Priority delivery", desc: "Corporate accounts get priority slot booking for scheduled office deliveries." },
              { icon: "🎯", title: "Curated menus", desc: "We recommend restaurants perfect for office orders — healthy, fast, and reliable." },
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

      {/* Contact form */}
      <section className="partners-section partners-section--alt" id="company-form">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <div className="partners-cta-card">
                <h4 className="mb-1 text-center">Contact our business team</h4>
                <p className="text-muted small text-center mb-4">We'll set up a custom plan for your company within 24 hours.</p>

                {submitted ? (
                  <div className="alert alert-success text-center">
                    <strong>Thank you!</strong> We'll be in touch within 24 hours.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold">Company name *</label>
                        <input className="form-control" required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Acme Corp" />
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold">Your name</label>
                        <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold">Business email *</label>
                        <input className="form-control" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold">Number of employees</label>
                        <select className="form-select" value={form.employees} onChange={e => setForm({ ...form, employees: e.target.value })}>
                          <option value="">Select range</option>
                          <option>1–10</option>
                          <option>11–50</option>
                          <option>51–200</option>
                          <option>200+</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold">Message (optional)</label>
                        <textarea className="form-control" rows="3" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your needs..." />
                      </div>
                      <div className="col-12">
                        <button type="submit" className="btn partners-btn-primary w-100">Send Request</button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PartnerCompaniesPage;
