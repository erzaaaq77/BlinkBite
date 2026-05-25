import React, { useState } from "react";
import axios from "axios";

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
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4 p-md-5">
              <h2 className="text-center mb-2">Bëhu pjesë e ekipit tonë</h2>
              <p className="text-center text-muted mb-4">Apliko për të punuar si Courier</p>
              
              {message && (
                <div className={`alert alert-${messageType === "success" ? "success" : "danger"} mb-4`}>
                  {message}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Emri dhe Mbiemri *</label>
                  <input
                    type="text"
                    name="fullName"
                    className="form-control"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
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
                  <label className="form-label">Lloji i Automjetit *</label>
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
                
                <div className="mb-3">
                  <label className="form-label">Targa e Automjetit</label>
                  <input
                    type="text"
                    name="licensePlate"
                    className="form-control"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    placeholder="Shembull: AA 000 AA"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="form-label">Zona e Punës *</label>
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
                
                <button
                  type="submit"
                  className="btn btn-success w-100 py-2"
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

export default CourierApplicationPage;