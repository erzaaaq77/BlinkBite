import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "https://localhost:5063/api";

const MenuManagement = ({ token, restaurantId, onBack }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    emertimi: "",
    pershkrimi: "",
    cmimi: "",
    foto: "",
    disponueshme: true,
    alergjene: "",
    kalori: "",
    restaurantId: restaurantId,
    categoryId: 1
  });

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/MenuItems/restaurant/${restaurantId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMenuItems(response.data);
      } catch (err) {
        setError("Failed to load menu items");
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchMenuItems();
    }
  }, [restaurantId, token]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        emertimi: item.emertimi,
        pershkrimi: item.pershkrimi || "",
        cmimi: item.cmimi,
        foto: item.foto || "",
        disponueshme: item.disponueshme,
        alergjene: item.alergjene || "",
        kalori: item.kalori || "",
        restaurantId: restaurantId,
        categoryId: item.categoryId || 1
      });
    } else {
      setEditingItem(null);
      setFormData({
        emertimi: "",
        pershkrimi: "",
        cmimi: "",
        foto: "",
        disponueshme: true,
        alergjene: "",
        kalori: "",
        restaurantId: restaurantId,
        categoryId: 1
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        await axios.put(
          `${API_BASE_URL}/MenuItems/${editingItem.id}`,
          { ...formData, id: editingItem.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Menu item updated");
      } else {
        await axios.post(
          `${API_BASE_URL}/MenuItems`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Menu item created");
      }
      setShowModal(false);
      // Refresh
      const response = await axios.get(
        `${API_BASE_URL}/MenuItems/restaurant/${restaurantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMenuItems(response.data);
    } catch (err) {
      alert("Failed to save");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await axios.delete(`${API_BASE_URL}/MenuItems/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMenuItems(menuItems.filter(item => item.id !== id));
        alert("Deleted");
      } catch (err) {
        alert("Failed to delete");
      }
    }
  };

  if (loading) return <div className="text-center py-5">Loading menu...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🍽️ Manage Menu</h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={onBack}>
            ← Back
          </button>
          <button className="btn btn-primary" onClick={() => openModal()}>
            + Add Item
          </button>
        </div>
      </div>

      {menuItems.length === 0 ? (
        <div className="alert alert-info">No menu items yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr><th>Name</th><th>Price</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {menuItems.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.emertimi}</strong></td>
                  <td>€{item.cmimi?.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${item.disponueshme ? "bg-success" : "bg-danger"}`}>
                      {item.disponueshme ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openModal(item)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>Delete</button>
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
                <h5>{editingItem ? "Edit Item" : "Add Item"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <input name="emertimi" className="form-control mb-2" placeholder="Name" value={formData.emertimi} onChange={handleInputChange} />
                <textarea name="pershkrimi" className="form-control mb-2" placeholder="Description" value={formData.pershkrimi} onChange={handleInputChange} />
                <input name="cmimi" type="number" className="form-control mb-2" placeholder="Price" value={formData.cmimi} onChange={handleInputChange} />
                <input name="foto" className="form-control mb-2" placeholder="Image URL" value={formData.foto} onChange={handleInputChange} />
                <div className="form-check">
                  <input type="checkbox" name="disponueshme" className="form-check-input" checked={formData.disponueshme} onChange={handleInputChange} />
                  <label className="form-check-label">Available</label>
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

export default MenuManagement;