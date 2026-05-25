import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5063/api").replace(/\/+$/, "");

const MerchantApplicationPage = () => {
  const [formData, setFormData] = useState({
    restaurantName: "",
    restaurantDescription: "",
    email: "",
    phone: "",
    address: "",
    city: "Prishtinë",
    category: "Fast Food",
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
      const response = await axios.post(`${API_BASE_URL}/applications/restaurant`, formData);
      if (response.status === 200 || response.status === 201) {
        setMessageType("success");
        setMessage("Aplikimi u dërgua me sukses! Admini do t'ju kontaktojë së shpejti.");
        setFormData({
          restaurantName: "",
          restaurantDescription: "",
          email: "",
          phone: "",
          address: "",
          city: "Prishtinë",
          category: "Fast Food",
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
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4 p-md-5">
              <h2 className="text-center mb-2">Bashkëpunoni me ne</h2>
              <p className="text-center text-muted mb-4">Regjistroni restorantin tuaj në platformë</p>
              
              {message && (
                <div className={`alert alert-${messageType === "success" ? "success" : "danger"} mb-4`}>
                  {message}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Emri i Restorantit *</label>
                  <input
                    type="text"
                    name="restaurantName"
                    className="form-control"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Përshkrimi i Restorantit</label>
                  <textarea
                    name="restaurantDescription"
                    className="form-control"
                    rows="3"
                    value={formData.restaurantDescription}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-3">
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
                
                <div className="mb-3">
                  <label className="form-label">Numri i Telefonit *</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Adresa *</label>
                  <input
                    type="text"
                    name="address"
                    className="form-control"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Qyteti *</label>
                  <select
                    name="city"
                    className="form-select"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  >
                    <option>Prishtinë</option>
                    <option>Prizren</option>
                    <option>Pejë</option>
                    <option>Gjakovë</option>
                    <option>Ferizaj</option>
                    <option>Gjilan</option>
                    <option>Mitrovicë</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="form-label">Kategoria</label>
                  <select
                    name="category"
                    className="form-select"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option>Fast Food</option>
                    <option>Italian</option>
                    <option>Pizza</option>
                    <option>Sushi</option>
                    <option>Traditional</option>
                    <option>Healthy</option>
                    <option>Dessert</option>
                    <option>Seafood</option>
                    <option>Burgers</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2"
                  disabled={submitting}
                >
                  {submitting ? "Duke dërguar..." : "Dërgo Aplikimin"}
                </button>
              </form>
              
              <div className="text-center mt-4">
                <button
                  className="btn btn-link text-decoration-none"
                  onClick={() => { window.location.hash = "/"; }}
                >
                  ← Kthehu në faqen kryesore
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantApplicationPage;