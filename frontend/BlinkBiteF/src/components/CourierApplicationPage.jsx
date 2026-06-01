import React, { useState } from "react";
import axios from "axios";
import "./MerchantDashboard.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5063/api").replace(/\/+$/, "");

const CourierApplicationPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    vehicleType: "Car",
    licensePlate: "",
    workingArea: "Qendër",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    
    try {
      const response = await axios.post(`${API_BASE_URL}/applications/courier`, formData);
      if (response.status === 200 || response.status === 201) {
        setMessageType("success");
        setMessage("Aplikimi u dërgua me sukses! Admini do t'ju kontaktojë së shpejti.");
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          vehicleType: "Car",
          licensePlate: "",
          workingArea: "Qendër",
        });
      }
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Ndodhi një gabim. Ju lutemi provoni përsëri.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="apply-courier-bg">
      <div className="apply-courier-card">
        <h2 className="apply-courier-title">Join our courier team</h2>
        <p className="apply-courier-subtitle">Apply to work as a courier</p>

        {message && (
          <div className={`alert alert-${messageType === "success" ? "success" : "danger"} mb-3`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="apply-courier-form-grid">
          <div className="mb-3 apply-field apply-span-2">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="fullName"
              className="form-control"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3 apply-field">
            <label className="form-label">Email *</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3 apply-field">
            <label className="form-label">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              className="form-control"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3 apply-field">
            <label className="form-label">Vehicle Type *</label>
            <select
              name="vehicleType"
              className="form-select"
              value={formData.vehicleType}
              onChange={handleChange}
              required
            >
              <option>Car</option>
              <option>Motorcycle</option>
              <option>Scooter</option>
              <option>Bicycle</option>
            </select>
          </div>

          <div className="mb-3 apply-field">
            <label className="form-label">Working Area *</label>
            <select
              name="workingArea"
              className="form-select"
              value={formData.workingArea}
              onChange={handleChange}
              required
            >
              <option>Qendër</option>
              <option>Arbëri</option>
              <option>Bregu i Diellit</option>
              <option>Veternik</option>
              <option>Çagllavicë</option>
              <option>Pejton</option>
              <option>Lakrishtë</option>
              <option>Qafa</option>
              <option>Emshir</option>
              <option>Bill Clinton</option>
              <option>M9 Fushë Kosovë</option>
              <option>Bulevardi Nënë Tereza</option>
              <option>Kolovicë</option>
            </select>
          </div>

          <div className="mb-3 apply-field apply-span-2">
            <label className="form-label">License Plate</label>
            <input
              type="text"
              name="licensePlate"
              className="form-control"
              value={formData.licensePlate}
              onChange={handleChange}
              placeholder="Example: AA 000 AA"
            />
          </div>

          <button
            type="submit"
            className="btn btn-modern-primary w-100 py-2 apply-span-2"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>

        <div className="text-center mt-3">
          <button
            className="btn btn-link text-decoration-none"
            onClick={() => { window.location.hash = "/"; }}
          >
            ← Back to home page
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourierApplicationPage;