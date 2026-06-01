import React from "react";

const PartnerCompaniesPage = () => {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: "60vh", textAlign: "center", padding: "3rem 1rem", paddingTop: "10rem" }}
    >
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🏢</div>
      <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Coming Soon</h2>
      <p className="text-muted mb-4" style={{ maxWidth: 420 }}>
        Corporate solutions are on their way.<br />
        Stay tuned — we will notify you when the business portal goes live!
      </p>
      <button
        className="btn btn-link text-decoration-none"
        onClick={() => { window.location.hash = "/"; }}
      >
        ← Back to home page
      </button>
    </div>
  );
};

export default PartnerCompaniesPage;
