import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MerchantDashboard.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5063/api").replace(/\/+$/, "");

const MerchantApplicationPage = () => {
  const [formData, setFormData] = useState({
    restaurantName: "",
    restaurantDescription: "",
    email: "",
    phone: "",
    address: "",
    city: "Prishtinë",
    category: "",
  });
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/Category`);
        setCategories(response.data);
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, category: response.data[0].name }));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback categories if API fails
        setCategories([
          { id: 1, name: "Fast Food" },
          { id: 2, name: "Italian" },
          { id: 3, name: "Pizza" },
          { id: 4, name: "Sushi" },
          { id: 5, name: "Traditional" },
          { id: 6, name: "Healthy" },
          { id: 7, name: "Dessert" },
          { id: 8, name: "Seafood" },
          { id: 9, name: "Burgers" },
          { id: 10, name: "Vegan" },
        ]);
        if (categories.length > 0) {
          setFormData(prev => ({ ...prev, category: categories[0]?.name || "Fast Food" }));
        }
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

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
        setMessage("✅ Application submitted successfully! Admin will contact you soon.");
        setFormData({
          restaurantName: "",
          restaurantDescription: "",
          email: "",
          phone: "",
          address: "",
          city: "Prishtinë",
          category: categories[0]?.name || "Fast Food",
        });
      }
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "❌ An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="apply-merchant-bg">
      <div className="apply-merchant-card">
        <div className="apply-merchant-title">Partner with us</div>
        <div className="apply-merchant-subtitle">Register your restaurant on our platform</div>
        {message && (
          <div className={`alert alert-${messageType === "success" ? "success" : "danger"} mb-4`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="apply-merchant-form-grid">
          <div className="mb-3 apply-field apply-span-2">
            <label className="form-label">Restaurant Name *</label>
            <input
              type="text"
              name="restaurantName"
              className="form-control"
              value={formData.restaurantName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3 apply-field apply-span-2">
            <label className="form-label">Restaurant Description</label>
            <textarea
              name="restaurantDescription"
              className="form-control"
              rows="2"
              value={formData.restaurantDescription}
              onChange={handleChange}
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
          <div className="mb-3 apply-field apply-span-2">
            <label className="form-label">Address *</label>
            <input
              type="text"
              name="address"
              className="form-control"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3 apply-field">
            <label className="form-label">City *</label>
            <select
              name="city"
              className="form-select"
              value={formData.city}
              onChange={handleChange}
              required
            >
              <option>Prishtinë</option>
          
            </select>
          </div>
          <div className="mb-4 apply-field">
            <label className="form-label">Category</label>
            <select
              name="category"
              className="form-select"
              value={formData.category}
              onChange={handleChange}
              disabled={loadingCategories}
            >
              {loadingCategories ? (
                <option>Loading categories...</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))
              )}
            </select>
          </div>
          <button
            type="submit"
            className="btn btn-modern-primary w-100 py-2 apply-span-2"
            disabled={submitting || loadingCategories}
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
        <div className="text-center mt-4">
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

export default MerchantApplicationPage;