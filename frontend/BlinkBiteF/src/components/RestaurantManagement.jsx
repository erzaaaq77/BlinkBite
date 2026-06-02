import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

const API_BASE_URL = "http://localhost:5063/api";

const toNumberId = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
};

const normalizeRestaurantStatus = (statusValue) => {
  if (typeof statusValue === "number" && Number.isFinite(statusValue)) {
    return statusValue;
  }
  const normalized = String(statusValue || "Active").trim().toLowerCase();
  if (normalized === "inactive") return 0;
  if (normalized === "pending") return 2;
  return 1;
};

const getRestaurantStatusLabel = (statusValue) => {
  const normalized = normalizeRestaurantStatus(statusValue);
  if (normalized === 2) return "Pending";
  if (normalized === 0) return "Inactive";
  return "Active";
};

const RestaurantManagement = ({ token, onBack }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    emertimi: "",
    pershkrimi: "",
    telefoni: "",
    email: "",
    kategori: "",
    categoryId: null,
    statusi: "Active"
  });

  useEffect(() => {
    fetchRestaurants();
    fetchCategories();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Restaurants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRestaurants(response.data);
    } catch (err) {
      toast.error("Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Category`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const getErrorMessage = (err) => {
    const data = err?.response?.data;
    if (!data) return err?.message || "Failed to save restaurant";
    if (typeof data === "string") return data;
    if (data.title || data.detail) {
      return `${data.title ? data.title + ": " : ""}${data.detail || data.message || "An error occurred"}`;
    }
    if (data.message) return data.message;
    try {
      return JSON.stringify(data);
    } catch {
      return "Failed to save restaurant";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "statusi") {
      setFormData({ ...formData, statusi: value });
      return;
    }
    if (name === "categoryId") {
      const categoryId = toNumberId(value);
      const selectedCategory = categories.find((cat) => (cat.id ?? cat.Id) === categoryId);
      setFormData({
        ...formData,
        categoryId,
        kategori: selectedCategory?.emertimi || selectedCategory?.name || selectedCategory?.kategori || formData.kategori || ""
      });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const openModal = (restaurant = null) => {
    if (restaurant) {
      setEditingRestaurant(restaurant);
      setFormData({
        emertimi: restaurant.emertimi,
        pershkrimi: restaurant.pershkrimi || "",
        telefoni: restaurant.telefoni || "",
        email: restaurant.email || "",
        kategori: restaurant.kategori || restaurant.kategoria || "",
        categoryId: toNumberId(restaurant.categoryId ?? restaurant.CategoryId) ?? null,
        statusi: getRestaurantStatusLabel(restaurant.statusi ?? restaurant.Statusi ?? restaurant.status)
      });
    } else {
      setEditingRestaurant(null);
      setFormData({
        emertimi: "",
        pershkrimi: "",
        telefoni: "",
        email: "",
        kategori: "",
        categoryId: null,
        statusi: "Active"
      });
    }
    setShowModal(true);
  };

  const handleSave = async (event) => {
    event?.preventDefault();
    if (!formData.emertimi.trim()) {
      toast.error("Restaurant name is required");
      return;
    }

    const statusLabel = String(formData.statusi || "Active");
    const payload = {
      emertimi: formData.emertimi,
      Emertimi: formData.emertimi,
      pershkrimi: formData.pershkrimi,
      Pershkrimi: formData.pershkrimi,
      telefoni: formData.telefoni,
      Telefoni: formData.telefoni,
      email: formData.email,
      Email: formData.email,
      kategori: formData.kategori,
      Kategoria: formData.kategoria,
      categoryId: toNumberId(formData.categoryId),
      CategoryId: toNumberId(formData.categoryId),
      status: statusLabel,
      Status: statusLabel
    };

    if (payload.categoryId === null) {
      toast.error("Please select a valid category.");
      return;
    }

    console.debug("Restaurant save payload", payload);

    try {
      if (editingRestaurant) {
        await axios.put(`${API_BASE_URL}/Restaurants/${editingRestaurant.id}`, {
          ...payload,
          id: editingRestaurant.id,
          Id: editingRestaurant.id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Restaurant updated successfully");
      } else {
        await axios.post(`${API_BASE_URL}/Restaurants`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Restaurant created successfully");
      }
      setShowModal(false);
      fetchRestaurants();
    } catch (err) {
      console.error("Save restaurant error", err);
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (restaurant) => {
    const result = await Swal.fire({
      title: `Delete "${restaurant.emertimi}"?`,
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/Restaurants/${restaurant.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Restaurant deleted successfully");
      fetchRestaurants();
    } catch (err) {
      toast.error(err.response?.data || "Failed to delete restaurant");
    }
  };

  const getStatusBadge = (status) => {
    const normalized = normalizeRestaurantStatus(status);
    if (normalized === 1) return <span className="badge bg-success">Active</span>;
    if (normalized === 2) return <span className="badge bg-warning">Pending</span>;
    return <span className="badge bg-secondary">Inactive</span>;
  };

  if (loading) return <div className="text-center py-5">Loading restaurants...</div>;

  return (
    <div className="container py-4 content-offset">
      <Toaster position="top-right" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🏪 Restaurant Management</h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <button className="btn btn-primary" onClick={() => openModal()}>
            + Add Restaurant
          </button>
        </div>
      </div>

      {restaurants.length === 0 ? (
        <div className="alert alert-info">No restaurants yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td><strong>{r.emertimi}</strong></td>
                  <td>{r.telefoni || "-"}</td>
                  <td>{r.email || "-"}</td>
                  <td>{r.kategori || r.kategoria || "-"}</td>
                  <td>{getStatusBadge(r.statusi ?? r.Statusi ?? r.status)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openModal(r)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>{editingRestaurant ? "Edit Restaurant" : "Add Restaurant"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Restaurant Name *</label>
                  <input type="text" name="emertimi" className="form-control" value={formData.emertimi} onChange={handleInputChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea name="pershkrimi" className="form-control" rows="2" value={formData.pershkrimi} onChange={handleInputChange} />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input type="text" name="telefoni" className="form-control" value={formData.telefoni} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" name="email" className="form-control" value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Category</label>
                    <select name="categoryId" className="form-select" value={formData.categoryId ?? ""} onChange={handleInputChange}>
                      <option value="">Select a category</option>
                      {categories.map((category) => {
                        const categoryId = category.id ?? category.Id;
                        return (
                          <option key={categoryId} value={categoryId}>
                            {category.emertimi || category.name || category.kategori || category.Kategoria || `Category ${categoryId}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Status</label>
                    <select name="statusi" className="form-select" value={formData.statusi} onChange={handleInputChange}>
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantManagement;