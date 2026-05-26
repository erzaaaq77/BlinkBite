import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import toast, { Toaster } from "react-hot-toast";

const API_BASE_URL = "http://localhost:5063/api";

const CategoryManagement = ({ token, onBack }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: ""
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Category`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        imageUrl: category.imageUrl || ""
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", imageUrl: "" });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        await axios.put(
          `${API_BASE_URL}/Category/${editingCategory.id}`,
          { ...formData, id: editingCategory.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Category updated");
      } else {
        await axios.post(
          `${API_BASE_URL}/Category`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Category created");
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data || "Failed to save category");
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `Delete category "${name}"?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
      showClass: { popup: "swal2-show swal2-animate" },
      hideClass: { popup: "swal2-hide swal2-animate" }
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Deleting...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      await axios.delete(`${API_BASE_URL}/Category/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: `Category "${name}" has been deleted.`,
        timer: 1400,
        showConfirmButton: false
      });
      fetchCategories();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err.response?.data || "Failed to delete category"
      });
    }
  };

  if (loading) return <div className="text-center py-5">Loading categories...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container py-4">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          success: {
            style: { background: "#28a745", color: "#ffffff" }
          },
          error: {
            style: { background: "#dc3545", color: "#ffffff" }
          }
        }}
      />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🏷️ Category Management</h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <button className="btn btn-primary" onClick={() => openModal()}>
            + Add Category
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="alert alert-info">No categories yet. Click "Add Category" to create one.</div>
      ) : (
        <div className="row">
          {categories.map((cat) => (
            <div className="col-md-3 mb-3" key={cat.id}>
              <div className="card h-100 text-center">
                <div className="card-body">
                  {cat.imageUrl ? (
                    <img 
                      src={cat.imageUrl} 
                      alt={cat.name} 
                      style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f0f0f0", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      🏷️
                    </div>
                  )}
                  <h5 className="mt-3">{cat.name}</h5>
                  <div className="mt-3">
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => openModal(cat)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(cat.id, cat.name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>{editingCategory ? "Edit Category" : "Add Category"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="e.g., Pizza, Burger, Sushi, Italian"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Image URL</label>
                  <input
                    type="text"
                    name="imageUrl"
                    className="form-control"
                    placeholder="https://example.com/category.jpg"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;