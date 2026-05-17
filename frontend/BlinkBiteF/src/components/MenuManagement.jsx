import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5063/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const toNumberId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const filterItemsByRestaurant = (items, rid) => {
  const targetRestaurantId = toNumberId(rid);
  if (!Array.isArray(items) || !targetRestaurantId) return [];

  return items.filter((item) => {
    const itemRestaurantId = toNumberId(item?.restaurantId ?? item?.RestaurantId);
    return itemRestaurantId === targetRestaurantId;
  });
};

const scopeItemsByCategory = (items, categories) => {
  if (!Array.isArray(items) || !Array.isArray(categories)) return [];

  const allowedCategoryIds = new Set(
    categories
      .map((category) => toNumberId(category?.id ?? category?.Id))
      .filter((id) => Number.isFinite(id))
  );

  return items.filter((item) => {
    const categoryId = toNumberId(item?.categoryId ?? item?.CategoryId);
    return categoryId ? allowedCategoryIds.has(categoryId) : false;
  });
};

const getAssetUrlCandidates = (rawValue) => {
  const raw = String(rawValue || "").trim();
  if (!raw) return [];

  const normalized = raw.replace(/\\/g, "/");
  const withoutDotSlash = normalized.replace(/^\.\//, "");
  const withoutLeadingSlash = withoutDotSlash.replace(/^\/+/, "");

  const candidates = [];
  const pushCandidate = (value) => {
    if (!value) return;
    if (!candidates.includes(value)) candidates.push(value);
  };

  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) {
    pushCandidate(raw);
    return candidates;
  }

  pushCandidate(normalized);
  pushCandidate(`/${withoutLeadingSlash}`);
  pushCandidate(`${API_ORIGIN}/${withoutLeadingSlash}`);
  pushCandidate(`${API_ORIGIN}/uploads/${withoutLeadingSlash}`);
  pushCandidate(`${API_ORIGIN}/images/${withoutLeadingSlash}`);

  return candidates;
};

const applyImageFallbackCandidate = (event, candidates, finalFallback = "") => {
  const target = event.currentTarget;
  const currentIndex = Number(target.dataset.candidateIndex || 0);
  const nextIndex = currentIndex + 1;

  if (nextIndex < candidates.length) {
    target.dataset.candidateIndex = String(nextIndex);
    target.src = candidates[nextIndex];
    return;
  }

  if (finalFallback && target.src !== finalFallback) {
    target.src = finalFallback;
    return;
  }

  target.style.display = "none";
  const placeholder = target.nextElementSibling;
  if (placeholder) {
    placeholder.style.display = "inline-flex";
  }
};

const MenuManagement = ({ token, restaurantId, onBack }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantCategories, setRestaurantCategories] = useState([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      setError("");
      try {
        const categoriesResponse = await axios.get(`${API_BASE_URL}/MenuCategories/by-restaurant/${restaurantId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
        setRestaurantCategories(categories);

        const response = await axios.get(`${API_BASE_URL}/MenuItems`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const allItems = Array.isArray(response.data) ? response.data : [];
        const scopedByCategories = scopeItemsByCategory(allItems, categories);
        setMenuItems(scopedByCategories.length > 0 ? scopedByCategories : filterItemsByRestaurant(allItems, restaurantId));

        if (categories.length > 0) {
          const firstCategoryId = categories[0]?.id ?? categories[0]?.Id;
          setFormData((prev) => ({
            ...prev,
            categoryId: prev.categoryId || firstCategoryId || 1,
          }));
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load menu items");
      } finally {
        setLoading(false);
      }
    };

    if (!token) {
      setMenuItems([]);
      setError("You need to be logged in as merchant to manage menu.");
      setLoading(false);
      return;
    }

    if (!restaurantId) {
      setMenuItems([]);
      setError("Restaurant not found for this merchant account.");
      setLoading(false);
      return;
    }

    fetchMenuItems();
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
        emertimi: item.emertimi ?? item.Emertimi ?? "",
        pershkrimi: item.pershkrimi ?? item.Pershkrimi ?? "",
        cmimi: item.cmimi ?? item.Cmimi ?? "",
        foto: item.foto ?? item.Foto ?? "",
        disponueshme: item.disponueshme ?? item.Disponueshme ?? true,
        alergjene: item.alergjene ?? item.Alergjene ?? "",
        kalori: item.kalori ?? item.Kalori ?? "",
        restaurantId: restaurantId,
        categoryId: item.categoryId ?? item.CategoryId ?? 1
      });
    } else {
      const defaultCategoryId = restaurantCategories[0]?.id ?? restaurantCategories[0]?.Id ?? "";
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
        categoryId: defaultCategoryId
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const normalizedCategoryId = toNumberId(formData.categoryId);
    const normalizedPrice = Number(formData.cmimi);
    const normalizedCalories = String(formData.kalori || "").trim() === "" ? null : Number(formData.kalori);

    if (!String(formData.emertimi || "").trim()) {
      alert("Item name is required.");
      return;
    }

    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      alert("Price must be greater than 0.");
      return;
    }

    if (!normalizedCategoryId) {
      alert("Please select a valid category for this restaurant.");
      return;
    }

    if (normalizedCalories !== null && !Number.isFinite(normalizedCalories)) {
      alert("Calories must be a valid number.");
      return;
    }

    const payload = {
      emertimi: String(formData.emertimi || "").trim(),
      pershkrimi: String(formData.pershkrimi || "").trim(),
      cmimi: normalizedPrice,
      foto: String(formData.foto || "").trim(),
      disponueshme: Boolean(formData.disponueshme),
      alergjene: String(formData.alergjene || "").trim(),
      kalori: normalizedCalories,
      categoryId: normalizedCategoryId,
    };

    const selectedCategory = restaurantCategories.find(
      (category) => Number(category?.id ?? category?.Id) === normalizedCategoryId
    );

    if (selectedCategory) {
      payload.category = {
        id: selectedCategory?.id ?? selectedCategory?.Id ?? normalizedCategoryId,
        emertimi: selectedCategory?.emertimi ?? selectedCategory?.Emertimi ?? "",
        pershkrimi: selectedCategory?.pershkrimi ?? selectedCategory?.Pershkrimi ?? "",
        renditja: Number(selectedCategory?.renditja ?? selectedCategory?.Renditja ?? 0),
        restaurantId: Number(selectedCategory?.restaurantId ?? selectedCategory?.RestaurantId ?? restaurantId),
      };
    }

    try {
      if (editingItem) {
        const editingItemId = editingItem.id ?? editingItem.Id;
        await axios.put(
          `${API_BASE_URL}/MenuItems/${editingItemId}`,
          { ...payload, id: editingItemId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Menu item updated");
      } else {
        await axios.post(
          `${API_BASE_URL}/MenuItems`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Menu item created");
      }
      setShowModal(false);
      // Refresh
      const categoriesResponse = await axios.get(`${API_BASE_URL}/MenuCategories/by-restaurant/${restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
      setRestaurantCategories(categories);

      const response = await axios.get(`${API_BASE_URL}/MenuItems`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allItems = Array.isArray(response.data) ? response.data : [];
      const scopedByCategories = scopeItemsByCategory(allItems, categories);
      setMenuItems(scopedByCategories.length > 0 ? scopedByCategories : filterItemsByRestaurant(allItems, restaurantId));
    } catch (error) {
      console.error(error);
      const validationErrors = error?.response?.data?.errors
        ? Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(" ") : String(messages)}`)
            .join(" | ")
        : "";

      const serverMessage =
        validationErrors ||
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.message ||
        "Failed to save";
      alert(`Failed to save: ${serverMessage}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await axios.delete(`${API_BASE_URL}/MenuItems/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMenuItems(menuItems.filter(item => Number(item.id ?? item.Id) !== Number(id)));
        alert("Deleted");
      } catch (error) {
        console.error(error);
        alert("Failed to delete");
      }
    }
  };

  const normalizedMenuItems = Array.isArray(menuItems)
    ? menuItems
    : Array.isArray(menuItems?.items)
      ? menuItems.items
      : [];

  const formatPrice = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
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

      {restaurantCategories.length === 0 && (
        <div className="alert alert-warning">
          This restaurant has no categories yet. Create a menu category first, then add items.
        </div>
      )}

      {normalizedMenuItems.length === 0 ? (
        <div className="alert alert-info">No menu items yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr><th>Photo</th><th>Name</th><th>Price</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {normalizedMenuItems.map((item) => (
                <tr key={item.id ?? item.Id}>
                  <td>
                    {(() => {
                      const rawImagePath = item?.foto ?? item?.Foto ?? "";
                      const imageCandidates = getAssetUrlCandidates(rawImagePath);
                      const firstCandidate = imageCandidates[0] || "";
                      return (
                        <div style={{ width: "56px", height: "56px", position: "relative" }}>
                          {firstCandidate ? (
                            <>
                              <img
                                src={firstCandidate}
                                alt={item?.emertimi ?? item?.Emertimi ?? "Menu item"}
                                data-candidate-index="0"
                                onError={(event) => applyImageFallbackCandidate(event, imageCandidates, "")}
                                style={{
                                  width: "56px",
                                  height: "56px",
                                  objectFit: "cover",
                                  borderRadius: "10px",
                                  border: "1px solid #dfe3e8",
                                }}
                              />
                              <span
                                style={{
                                  display: "none",
                                  width: "56px",
                                  height: "56px",
                                  borderRadius: "10px",
                                  border: "1px dashed #c8d0d8",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.68rem",
                                  color: "#7b8794",
                                  textAlign: "center",
                                  lineHeight: "1.1",
                                }}
                              >
                                No image
                              </span>
                            </>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                width: "56px",
                                height: "56px",
                                borderRadius: "10px",
                                border: "1px dashed #c8d0d8",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.68rem",
                                color: "#7b8794",
                                textAlign: "center",
                                lineHeight: "1.1",
                              }}
                            >
                              No image
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td><strong>{item.emertimi ?? item.Emertimi}</strong></td>
                  <td>€{formatPrice(item.cmimi ?? item.Cmimi)}</td>
                  <td>
                    <span className={`badge ${(item.disponueshme ?? item.Disponueshme) ? "bg-success" : "bg-danger"}`}>
                      {(item.disponueshme ?? item.Disponueshme) ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openModal(item)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id ?? item.Id)}>Delete</button>
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
                {String(formData.foto || "").trim() && (
                  <div className="mb-2">
                    <img
                      src={getAssetUrlCandidates(formData.foto)[0] || ""}
                      alt="Preview"
                      onError={(event) => applyImageFallbackCandidate(event, getAssetUrlCandidates(formData.foto), "")}
                      data-candidate-index="0"
                      style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "10px", border: "1px solid #dfe3e8" }}
                    />
                  </div>
                )}
                <select name="categoryId" className="form-select mb-2" value={formData.categoryId} onChange={handleInputChange}>
                  {restaurantCategories.length === 0 ? (
                    <option value="">No categories available</option>
                  ) : (
                    restaurantCategories.map((category) => {
                      const id = category?.id ?? category?.Id;
                      const name = category?.emertimi ?? category?.Emertimi ?? `Category ${id}`;
                      return (
                        <option key={id} value={id}>{name}</option>
                      );
                    })
                  )}
                </select>
                <div className="form-check">
                  <input type="checkbox" name="disponueshme" className="form-check-input" checked={formData.disponueshme} onChange={handleInputChange} />
                  <label className="form-check-label">Available</label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={restaurantCategories.length === 0}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;