import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

const API_BASE_URL = "http://localhost:5063/api";

const PromotionManagement = ({ token, restaurantId, onBack }) => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState({
    kodi: "",
    zbritjaPerqind: "",
    zbritjaMax: "",
    dataFillimit: "",
    dataPerfundimit: "",
    restaurantId: restaurantId
  });

  const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    if (typeof data === "string") return data;
    if (data?.errors) {
      if (Array.isArray(data.errors)) return data.errors.join(" ");
      if (typeof data.errors === "object") {
        return Object.values(data.errors)
          .flat()
          .filter(Boolean)
          .join(" ");
      }
    }
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.title === "string") return data.title;
    if (error?.message) return error.message;
    if (data && typeof data === "object") return JSON.stringify(data);
    return fallback || "An error occurred";
  };

  useEffect(() => {
    if (restaurantId) {
      fetchPromotions();
    }
  }, [restaurantId]);

  const fetchPromotions = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/Promotions/by-restaurant/${restaurantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPromotions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      toast.error("Failed to load promotions");
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openModal = (promotion = null) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        kodi: promotion.kodi,
        zbritjaPerqind: promotion.zbritjaPerqind,
        zbritjaMax: promotion.zbritjaMax || "",
        dataFillimit: promotion.dataFillimit.split("T")[0],
        dataPerfundimit: promotion.dataPerfundimit.split("T")[0],
        restaurantId: restaurantId,
         statusi: promotion.statusi
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        kodi: "",
        zbritjaPerqind: "",
        zbritjaMax: "",
        dataFillimit: "",
        dataPerfundimit: "",
        restaurantId: restaurantId,
        statusi: 1
      });
    }
    setShowModal(true);
  };

 const handleSave = async () => {
  // Validimi i kodit
  if (!formData.kodi.trim()) {
    toast.error("Promotion code is required");
    return;
  }

  // Validimi i zbritjes
  const discount = parseFloat(formData.zbritjaPerqind);
  if (isNaN(discount) || discount < 1 || discount > 100) {
    toast.error("Discount must be between 1 and 100");
    return;
  }

  // Validimi i datave
  if (!formData.dataFillimit || !formData.dataPerfundimit) {
    toast.error("Start and end dates are required");
    return;
  }
  if (new Date(formData.dataFillimit) >= new Date(formData.dataPerfundimit)) {
    toast.error("End date must be after start date");
    return;
  }

  // Ndërto payload-in e pastër (pa `statusi`, pa fusha të tepërta)
  const payload = {
    kodi: formData.kodi,
    zbritjaPerqind: discount,
    zbritjaMax: formData.zbritjaMax ? parseFloat(formData.zbritjaMax) : null,
    dataFillimit: formData.dataFillimit,
    dataPerfundimit: formData.dataPerfundimit,
    restaurantId: Number(restaurantId) // Sigurohu që është numër
  };

  // Nëse është edit, shto vetëm ID-në (pa status)
  if (editingPromotion) {
    payload.id = editingPromotion.id;
  }

  try {
    if (editingPromotion) {
      await axios.put(`${API_BASE_URL}/Promotions/${editingPromotion.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Promotion updated successfully");
    } else {
      await axios.post(`${API_BASE_URL}/Promotions`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Promotion created successfully");
    }
    setShowModal(false);
    fetchPromotions();
  } catch (err) {
    console.error("Save error:", err.response?.data);
    toast.error(err.response?.data || "Failed to save promotion");
  }
};

  const handleDelete = async (promotion) => {
    const result = await Swal.fire({
      title: `Delete promotion "${promotion.kodi}"?`,
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/Promotions/${promotion.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Promotion deleted successfully");
      fetchPromotions();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete promotion"));
    }
  };

  const toggleStatus = async (promotion) => {
    const newStatus = promotion.statusi === 1 ? 0 : 1;
    try {
      await axios.patch(
        `${API_BASE_URL}/Promotions/${promotion.id}/status`,
        newStatus,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Promotion ${newStatus === 1 ? "activated" : "deactivated"}`);
      fetchPromotions();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status) => {
    if (status === 1) return <span className="badge bg-success">Active</span>;
    if (status === 2) return <span className="badge bg-danger">Expired</span>;
    return <span className="badge bg-secondary">Inactive</span>;
  };

  if (loading) return <div className="text-center py-5">Loading promotions...</div>;

  return (
    <div className="container py-4" style={{ marginTop: "80px" }}>
      <Toaster position="top-right" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🎟️ Promotion Management</h2>
        <div>
          <button type="button" className="btn btn-outline-secondary me-2" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <button type="button" className="btn btn-primary" onClick={() => openModal()}>
            + Add Promotion
          </button>
        </div>
      </div>

      {promotions.length === 0 ? (
        <div className="alert alert-info">No promotions yet. Click "Add Promotion" to create one.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Max Discount</th>
                <th>Valid From</th>
                <th>Valid To</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.kodi}</strong></td>
                  <td>{p.zbritjaPerqind}%</td>
                  <td>{p.zbritjaMax ? `€${p.zbritjaMax}` : "-"}</td>
                  <td>{new Date(p.dataFillimit).toLocaleDateString()}</td>
                  <td>{new Date(p.dataPerfundimit).toLocaleDateString()}</td>
                  <td>{getStatusBadge(p.statusi)}</td>
                  <td>
                    <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => openModal(p)}>Edit</button>
                    <button type="button" className="btn btn-sm btn-outline-warning me-1" onClick={() => toggleStatus(p)}>
                      {p.statusi === 1 ? "Deactivate" : "Activate"}
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p)}>Delete</button>
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
                <h5>{editingPromotion ? "Edit Promotion" : "Add Promotion"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Promotion Code *</label>
                  <input type="text" name="kodi" className="form-control" placeholder="e.g., SUMMER20" value={formData.kodi} onChange={handleInputChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Discount (%) *</label>
                  <input type="number" name="zbritjaPerqind" className="form-control" placeholder="10" min="1" max="100" value={formData.zbritjaPerqind} onChange={handleInputChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Max Discount (€) - Optional</label>
                  <input type="number" name="zbritjaMax" className="form-control" placeholder="e.g., 10" step="0.01" value={formData.zbritjaMax} onChange={handleInputChange} />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Start Date *</label>
                    <input type="date" name="dataFillimit" className="form-control" value={formData.dataFillimit} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">End Date *</label>
                    <input type="date" name="dataPerfundimit" className="form-control" value={formData.dataPerfundimit} onChange={handleInputChange} />
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

export default PromotionManagement;