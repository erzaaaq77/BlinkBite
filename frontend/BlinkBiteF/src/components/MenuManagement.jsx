import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// Helper: get query param from URL
function getQueryParam(name) {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '');
  return params.get(name);
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5063/api").replace(/\/+$/, "");
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
const MENU_CUSTOMIZATION_KEY = "blinkbite_menu_customizations_v1";
const RESTAURANT_CUSTOMIZATION_KEY = "blinkbite_restaurant_customizations_v1";

const getApiHostLabel = () => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL;
  }
};

const toNumberId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTextList = (value) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((entry) => String(entry || "").trim())
          .filter(Boolean)
      )
    );
  }

  const source = String(value || "").trim();
  if (!source) return [];

  return Array.from(
    new Set(
      source
          .split(/[\n,;|]/)
          .map((entry) => entry.trim())
          .filter(Boolean)
    )
  );
};

const listToCsv = (value) => normalizeTextList(value).join(", ");

const normalizeAddOns = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (!entry) return null;
        if (typeof entry === "string") {
          const trimmed = entry.trim();
          if (!trimmed) return null;
          return { name: trimmed, extraPrice: 0 };
        }

        const name = String(entry?.name ?? entry?.Name ?? entry?.label ?? entry?.Label ?? "").trim();
        const extraPrice = Number(entry?.extraPrice ?? entry?.ExtraPrice ?? entry?.price ?? entry?.Price ?? 0);
        if (!name) return null;
        return {
          name,
          extraPrice: Number.isFinite(extraPrice) ? Math.max(0, extraPrice) : 0,
        };
      })
      .filter(Boolean);
  }

  const raw = String(value || "").trim();
  if (!raw) return [];

  return raw
    .split(/\n|;/)
    .map((entry) => {
      const part = String(entry || "").trim();
      if (!part) return null;

      const [nameRaw, priceRaw] = part.split(":");
      const name = String(nameRaw || "").trim();
      const parsedPrice = Number(String(priceRaw || "0").replace(",", ".").trim());
      if (!name) return null;

      return {
        name,
        extraPrice: Number.isFinite(parsedPrice) ? Math.max(0, parsedPrice) : 0,
      };
    })
    .filter(Boolean);
};

const addOnsToCsv = (value) =>
  normalizeAddOns(value)
    .map((entry) => `${entry.name}:${Number(entry.extraPrice || 0).toFixed(2)}`)
    .join("; ");

const mergeRequestOptionsWithIngredients = (ingredientsValue, requestOptionsValue) => {
  const manualOptions = normalizeTextList(requestOptionsValue);
  const ingredientOptions = normalizeTextList(ingredientsValue).map((ingredient) => `No ${ingredient}`);

  const merged = [];
  const seen = new Set();

  const pushUnique = (entry) => {
    const normalized = String(entry || "").trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(normalized);
  };

  manualOptions.forEach(pushUnique);
  ingredientOptions.forEach(pushUnique);

  return merged;
};

const loadMenuCustomizations = () => {
  return {};
};

const saveMenuCustomizations = (nextMap) => {
  void nextMap;
};

const loadRestaurantCustomizations = () => {
  try {
    const raw = localStorage.getItem(RESTAURANT_CUSTOMIZATION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.error("Failed to parse restaurant customization overrides", err);
    return {};
  }
};

const saveRestaurantCustomizations = (nextMap) => {
  try {
    localStorage.setItem(RESTAURANT_CUSTOMIZATION_KEY, JSON.stringify(nextMap || {}));
  } catch (err) {
    console.error("Failed to persist restaurant customization overrides", err);
  }
};

const extractListByKeyHints = (source, keyHints = [], depth = 0) => {
  if (!source || depth > 2) return [];

  if (Array.isArray(source)) {
    const primitiveList = normalizeTextList(source);
    if (primitiveList.length > 0) return primitiveList;

    for (const entry of source) {
      const nested = extractListByKeyHints(entry, keyHints, depth + 1);
      if (nested.length > 0) return nested;
    }
    return [];
  }

  if (typeof source !== "object") {
    return normalizeTextList(source);
  }

  const entries = Object.entries(source);

  for (const [key, value] of entries) {
    const normalizedKey = String(key || "").toLowerCase();
    const matched = keyHints.some((hint) => normalizedKey.includes(hint));
    if (!matched) continue;

    const asList = normalizeTextList(value);
    if (asList.length > 0) return asList;

    if (value && typeof value === "object") {
      const nested = extractListByKeyHints(value, keyHints, depth + 1);
      if (nested.length > 0) return nested;
    }
  }

  for (const [, value] of entries) {
    if (!value || typeof value !== "object") continue;
    const nested = extractListByKeyHints(value, keyHints, depth + 1);
    if (nested.length > 0) return nested;
  }

  return [];
};

const resolveItemIngredients = (item) =>
  normalizeTextList(
    item?.perberesit ??
      item?.Perberesit ??
      item?.perberes ??
      item?.Perberes ??
      item?.ingredients ??
      item?.Ingredients
  ).length > 0
    ? normalizeTextList(
        item?.perberesit ??
          item?.Perberesit ??
          item?.perberes ??
          item?.Perberes ??
          item?.ingredients ??
          item?.Ingredients
      )
    : extractListByKeyHints(item, ["perber", "ingred", "component"]);

const resolveItemRequestOptions = (item) =>
  normalizeTextList(
    item?.requestOptions ??
      item?.RequestOptions ??
      item?.customizationOptions ??
      item?.CustomizationOptions ??
      item?.opsionePersonalizimi ??
      item?.OpsionePersonalizimi
  ).length > 0
    ? normalizeTextList(
        item?.requestOptions ??
          item?.RequestOptions ??
          item?.customizationOptions ??
          item?.CustomizationOptions ??
          item?.opsionePersonalizimi ??
          item?.OpsionePersonalizimi
      )
    : extractListByKeyHints(item, ["request", "option", "opsion", "custom"]);

const mergeCustomizationIntoItem = (item, override) => {
  const safeOverride = override && typeof override === "object" ? override : {};

  const ingredientList =
    normalizeTextList(safeOverride.ingredients).length > 0
      ? normalizeTextList(safeOverride.ingredients)
      : resolveItemIngredients(item);

  const requestList =
    normalizeTextList(safeOverride.requestOptions).length > 0
      ? normalizeTextList(safeOverride.requestOptions)
      : resolveItemRequestOptions(item);

  return {
    ...item,
    perberesit: ingredientList,
    Perberesit: ingredientList,
    ingredients: ingredientList,
    requestOptions: requestList,
    RequestOptions: requestList,
    customizationOptions: requestList,
  };
};

const getItemIngredients = (item) => resolveItemIngredients(item);
const getItemRequestOptions = (item) => resolveItemRequestOptions(item);

const getAssetUrlCandidates = (rawValue) => {
  const raw = String(rawValue || "").trim();
  if (!raw) return [];

  const candidates = [];

  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) {
    candidates.push(raw);
    return candidates;
  }

  let cleanPath = raw;
  if (cleanPath.startsWith("/")) {
    cleanPath = cleanPath.substring(1);
  }

  candidates.push(`${API_ORIGIN}/uploads/${cleanPath}`);
  candidates.push(`${API_ORIGIN}/${cleanPath}`);
  
  const fileName = cleanPath.split('/').pop();
  if (fileName !== cleanPath) {
    candidates.push(`${API_ORIGIN}/uploads/menuitems/${fileName}`);
  }

  return [...new Set(candidates)];
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

const MenuManagement = ({ token, restaurantId, restaurantAddressId: propRestaurantAddressId = null, currentUserRole = "", onBack }) => {
  const normalizedRole = String(currentUserRole || "").trim().toLowerCase();
  const isBranchManagerRole = normalizedRole === "branchmanager";
  
  const [restaurantAddressId, setRestaurantAddressId] = useState(() => {
    const fromUrl = getQueryParam('branchId');
    return fromUrl || propRestaurantAddressId || null;
  });

  // Sync branchId with URL on hashchange
  useEffect(() => {
    const syncBranchId = () => {
      const fromUrl = getQueryParam('branchId');
      if (fromUrl && fromUrl !== restaurantAddressId) setRestaurantAddressId(fromUrl);
    };
    window.addEventListener('hashchange', syncBranchId);
    return () => window.removeEventListener('hashchange', syncBranchId);
  }, [restaurantAddressId]);
  
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantCategories, setRestaurantCategories] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, type: "success", message: "" });
  const [restaurantCustomizationForm, setRestaurantCustomizationForm] = useState({
    globalAddOns: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const toastTimerRef = useRef(null);
  const canManageMenuInScope = !isBranchManagerRole || Boolean(restaurantAddressId);
  const [formData, setFormData] = useState({
    emertimi: "",
    pershkrimi: "",
    cmimi: "",
    foto: "",
    disponueshme: true,
    alergjene: "",
    kalori: "",
    perberesit: "",
    requestOptions: "",
    restaurantId: restaurantId,
    categoryId: 1
  });

  useEffect(() => {
    const fetchBranches = async () => {
      if (!token || !restaurantId) {
        setBranchOptions([]);
        return;
      }

      setBranchesLoading(true);
      const endpoint = `${API_BASE_URL}/Dashboard/Merchant`;
      try {
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const rows = Array.isArray(response.data?.addresses)
          ? response.data.addresses
          : [];

        const normalized = rows
          .map((entry) => {
            const id = toNumberId(entry?.id ?? entry?.Id);
            if (!id) return null;
            return {
              id,
              address: String(entry?.adresa ?? entry?.address ?? "").trim(),
              city: String(entry?.qyteti ?? entry?.city ?? "").trim(),
              zone: String(entry?.zona ?? entry?.zone ?? "").trim(),
              isMain: Boolean(entry?.isMain),
            };
          })
          .filter(Boolean);

        setBranchOptions(normalized);
      } catch (err) {
        console.error(err);
        setBranchOptions([]);
      }

      setBranchesLoading(false);
    };

    fetchBranches();
  }, [restaurantId, token]);

  const fetchMenuItems = async () => {
  setLoading(true);
  setError("");
  try {
    // Merr kategoritë
    const categoriesResponse = await axios.get(`${API_BASE_URL}/MenuCategories/by-restaurant/${restaurantId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
    setRestaurantCategories(categories);

    const timestamp = Date.now();
    let url = `${API_BASE_URL}/MenuItems?_t=${timestamp}`;
    
    if (restaurantAddressId) {
      url += `&branchId=${restaurantAddressId}`;
      console.log("Branch Manager mode - branchId:", restaurantAddressId);
    } else {
      url += `&restaurantId=${restaurantId}`;
      console.log("Merchant mode - restaurantId:", restaurantId);
    }

    console.log("Fetching menu from URL:", url);
    
    const response = await axios.get(url, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const allItems = Array.isArray(response.data) ? response.data : [];
    console.log(`Received ${allItems.length} items from backend`);

    setMenuItems(
      allItems.map((item) => {
        return mergeCustomizationIntoItem(item, {});
      })
    );

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

  useEffect(() => {
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

    if (isBranchManagerRole && !restaurantAddressId) {
      setMenuItems([]);
      setError("Branch Manager account must open menu with a valid branch scope.");
      setLoading(false);
      return;
    }

    fetchMenuItems();
  }, [restaurantId, restaurantAddressId, token, isBranchManagerRole]);

  useEffect(() => {
    const map = loadRestaurantCustomizations();
    const current = map[String(restaurantId)] || {};
    setRestaurantCustomizationForm({
      globalAddOns: addOnsToCsv(current?.globalAddOns),
    });
  }, [restaurantId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "perberesit") {
      setFormData((prev) => {
        const nextPerberesit = value;
        const previousIngredientNoOptions = new Set(
          normalizeTextList(prev.perberesit).map((ingredient) => `no ${String(ingredient).trim().toLowerCase()}`)
        );
        const manualRequestOptionsOnly = normalizeTextList(prev.requestOptions).filter(
          (option) => !previousIngredientNoOptions.has(String(option).trim().toLowerCase())
        );
        const mergedRequestOptions = mergeRequestOptionsWithIngredients(nextPerberesit, manualRequestOptionsOnly);
        return {
          ...prev,
          perberesit: nextPerberesit,
          requestOptions: mergedRequestOptions.join(", "),
        };
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const showToast = (message, type = "success") => {
    clearTimeout(toastTimerRef.current);
    setToast({ visible: true, type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2800);
  };

  const handleRestaurantCustomizationInput = (e) => {
    const { name, value } = e.target;
    setRestaurantCustomizationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveRestaurantCustomization = () => {
    const map = loadRestaurantCustomizations();
    map[String(restaurantId)] = {
      globalAddOns: normalizeAddOns(restaurantCustomizationForm.globalAddOns),
    };
    saveRestaurantCustomizations(map);
    showToast("Restaurant customization saved.", "success");
  };

  const handleBranchScopeChange = (event) => {
    const nextBranchId = String(event.target.value || "").trim();
    if (!restaurantId) return;

    if (!nextBranchId) {
      window.location.hash = `/merchant/menu/${restaurantId}`;
      return;
    }

    window.location.hash = `/merchant/menu/${restaurantId}?branchId=${encodeURIComponent(nextBranchId)}`;
  };

  useEffect(() => {
    return () => {
      clearTimeout(toastTimerRef.current);
    };
  }, []);

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        ...(item || {}),
        emertimi: item.emertimi ?? item.Emertimi ?? "",
        pershkrimi: item.pershkrimi ?? item.Pershkrimi ?? "",
        cmimi: item.cmimi ?? item.Cmimi ?? "",
        foto: item.foto ?? item.Foto ?? "",
        disponueshme: item.disponueshme ?? item.Disponueshme ?? true,
        alergjene: item.alergjene ?? item.Alergjene ?? "",
        kalori: item.kalori ?? item.Kalori ?? "",
        perberesit: listToCsv(resolveItemIngredients(item)),
        requestOptions: mergeRequestOptionsWithIngredients(
          resolveItemIngredients(item),
          resolveItemRequestOptions(item)
        ).join(", "),
        restaurantId: restaurantId,
        restaurantAddressId: restaurantAddressId || null,
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
        perberesit: "",
        requestOptions: "",
        restaurantId: restaurantId,
        restaurantAddressId: restaurantAddressId || null,
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
      showToast("Item name is required.", "danger");
      return;
    }

    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      showToast("Price must be greater than 0.", "danger");
      return;
    }

    if (!normalizedCategoryId) {
      showToast("Please select a valid category for this restaurant.", "danger");
      return;
    }

    if (normalizedCalories !== null && !Number.isFinite(normalizedCalories)) {
      showToast("Calories must be a valid number.", "danger");
      return;
    }

    const ingredientsList = normalizeTextList(formData.perberesit);
    const requestOptionsList = mergeRequestOptionsWithIngredients(formData.perberesit, formData.requestOptions);
    const ingredientsCsv = ingredientsList.join(", ");
    const requestOptionsCsv = requestOptionsList.join(", ");

    const payloadBase = {
      emertimi: String(formData.emertimi || "").trim(),
      pershkrimi: String(formData.pershkrimi || "").trim(),
      cmimi: normalizedPrice,
      foto: String(formData.foto || "").trim(),
      disponueshme: Boolean(formData.disponueshme),
      alergjene: String(formData.alergjene || "").trim(),
      kalori: normalizedCalories,
      categoryId: normalizedCategoryId,
      restaurantAddressId: restaurantAddressId || null,
    };

    const payloadString = {
      ...payloadBase,
      perberesit: ingredientsCsv,
      requestOptions: requestOptionsCsv,
      ingredients: ingredientsList,
      requestOptionsList,
      customizationOptions: requestOptionsList,
    };

    const payloadArray = {
      ...payloadBase,
      perberesit: ingredientsList,
      requestOptions: requestOptionsList,
      Perberesit: ingredientsList,
      RequestOptions: requestOptionsList,
      ingredients: ingredientsList,
      Ingredients: ingredientsList,
      customizationOptions: requestOptionsList,
      CustomizationOptions: requestOptionsList,
    };

    const selectedCategory = restaurantCategories.find(
      (category) => Number(category?.id ?? category?.Id) === normalizedCategoryId
    );

    const categoryPayload = selectedCategory
      ? {
        id: selectedCategory?.id ?? selectedCategory?.Id ?? normalizedCategoryId,
        emertimi: selectedCategory?.emertimi ?? selectedCategory?.Emertimi ?? "",
        pershkrimi: selectedCategory?.pershkrimi ?? selectedCategory?.Pershkrimi ?? "",
        renditja: Number(selectedCategory?.renditja ?? selectedCategory?.Renditja ?? 0),
        restaurantId: Number(selectedCategory?.restaurantId ?? selectedCategory?.RestaurantId ?? restaurantId),
      }
      : null;

    if (categoryPayload) {
      payloadString.category = categoryPayload;
      payloadArray.category = categoryPayload;
    }

    const saveWithPayloadFallback = async (requestFactory) => {
      const candidates = [payloadString, payloadArray];
      let lastError = null;

      for (let index = 0; index < candidates.length; index += 1) {
        try {
          return await requestFactory(candidates[index]);
        } catch (err) {
          lastError = err;

          if (index === candidates.length - 1) {
            break;
          }

          const status = err?.response?.status;
          const responseText = JSON.stringify(err?.response?.data || "").toLowerCase();
          const likelyJsonShapeIssue =
            status === 400 &&
            /(json|convert|deserialize|array|string|requestoptions|ingredients|perberesit)/i.test(responseText);

          if (!likelyJsonShapeIssue) {
            break;
          }
        }
      }

      throw lastError;
    };

    try {
      let savedItemId = null;

      if (editingItem) {
        const editingItemId = editingItem.id ?? editingItem.Id;
        if (isBranchManagerRole && restaurantAddressId) {
          await axios.put(
            `${API_BASE_URL}/MenuItemBranch/${editingItemId}/branch/${restaurantAddressId}`,
            {
              cmimi: Number(formData.cmimi),
              disponueshme: Boolean(formData.disponueshme),
              perberesit: formData.perberesit,
              requestOptions: formData.requestOptions
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          savedItemId = editingItemId;
          showToast("Branch menu item updated.", "success");
        } else {
          await saveWithPayloadFallback((candidatePayload) =>
            axios.put(
              `${API_BASE_URL}/MenuItems/${editingItemId}`,
              { ...candidatePayload, id: editingItemId },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          );
          savedItemId = editingItemId;
          showToast("Menu item updated.", "success");
        }
      } else {
        const createResponse = await saveWithPayloadFallback((candidatePayload) =>
          axios.post(
            `${API_BASE_URL}/MenuItems`,
            candidatePayload,
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );
        savedItemId = createResponse?.data?.id ?? createResponse?.data?.Id ?? null;
        showToast("Menu item created.", "success");
      }

      await fetchMenuItems();
      setShowModal(false);
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
      showToast(`Failed to save: ${serverMessage}`, "danger");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await axios.delete(`${API_BASE_URL}/MenuItems/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchMenuItems();
        showToast("Menu item deleted.", "success");
      } catch (error) {
        console.error(error);
        showToast("Failed to delete menu item.", "danger");
      }
    }
  };

  const normalizedMenuItems = Array.isArray(menuItems) ? menuItems : [];
  const debugApiHost = getApiHostLabel();
  const debugRestaurantId = toNumberId(restaurantId);
  const itemsWithIngredientsCount = normalizedMenuItems.filter((item) => getItemIngredients(item).length > 0).length;
  const itemsWithRequestOptionsCount = normalizedMenuItems.filter((item) => getItemRequestOptions(item).length > 0).length;

  const formatPrice = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
  };

  if (loading) return <div className="text-center py-5">Loading menu...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container py-4 merchant-categories-modern" style={{minHeight: '100vh'}}>
      {toast.visible && (
        <div className={`app-toast app-toast--${toast.type}`} role="alert" aria-live="polite">
          <div className="app-toast__body">{toast.message}</div>
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setToast((prev) => ({ ...prev, visible: false }))}></button>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="merchant-categories-header mb-0">🍽️ Manage Menu</h2>
        <div>
          <button className="btn btn-modern-secondary me-2" onClick={onBack}>
            ← Back
          </button>
          <button className="btn btn-modern-primary" onClick={() => openModal()} disabled={!canManageMenuInScope}>
            + Add Item
          </button>
        </div>
      </div>

      <div className="merchant-card mb-4">
        <div className="py-3">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h6 className="mb-1">Menu Scope</h6>
              <p className="small text-muted mb-0">
                {restaurantAddressId ? `Showing menu for branch ID ${restaurantAddressId}.` : "Showing full restaurant menu (all branches)."}
              </p>
            </div>

            {!isBranchManagerRole && (
              <div className="d-flex align-items-center gap-2">
                <label htmlFor="menu-branch-scope" className="small text-muted mb-0">Branch view</label>
                <select id="menu-branch-scope" className="form-select form-select-sm" style={{ minWidth: "220px" }} value={restaurantAddressId ? String(restaurantAddressId) : ""} onChange={handleBranchScopeChange}>
                  <option value="">All branches</option>
                  {branchOptions.map((branch) => {
                    const place = [branch.city, branch.zone].filter(Boolean).join(", ");
                    const label = `${branch.address || `Branch ${branch.id}`}${place ? ` (${place})` : ""}${branch.isMain ? " - Main" : ""}`;
                    return <option key={branch.id} value={String(branch.id)}>{label}</option>;
                  })}
                </select>
              </div>
            )}
          </div>

          {branchesLoading && !isBranchManagerRole && <p className="small text-muted mt-2 mb-0">Loading branch list...</p>}
          {!canManageMenuInScope && <div className="alert alert-warning mt-3 mb-0 py-2">Branch Manager can manage menu only when a branch is selected in URL.</div>}
        </div>
      </div>

      <div className="merchant-card mb-4" style={{background: 'linear-gradient(135deg, #fff 0%, #fdf6e8 100%)', border: '1.5px solid #f7e7c6', boxShadow: '0 2px 8px rgba(181,130,50,0.04)'}}>
        <div>
          <div className="mb-2" style={{fontWeight: 800, color: '#b5761e', fontSize: '1.18rem', letterSpacing: '-0.01em'}}>Global Paid Add-ons</div>
          <div className="mb-3" style={{fontWeight: 600, color: '#b5761e', fontSize: '0.93rem', textTransform: 'uppercase', letterSpacing: '0.07em'}}>Set restaurant-wide paid add-ons</div>
          <div style={{
            background: '#fdf6e8',
            borderRadius: '10px',
            border: '1.5px solid #f7e7c6',
            boxShadow: 'none',
            padding: '14px 18px 8px 18px',
            marginBottom: '18px'
          }}>
            <textarea 
              name="globalAddOns"
              className="form-control addon-textarea"
              rows="3"
              placeholder="e.g. Cheese:1.00; Mayo:0.50"
              style={{
                resize: 'vertical',
                fontSize: '1.05rem',
                background: '#fff',
                border: '1.5px solid #f0e2c6',
                boxShadow: '0 1px 4px rgba(181,130,50,0.04)',
                color: '#222',
                borderRadius: '10px',
                padding: '10px 14px'
              }}
              value={restaurantCustomizationForm.globalAddOns}
              onChange={handleRestaurantCustomizationInput}
            />
          </div>
          <div className="mt-3 d-flex justify-content-end">
            <button type="button" className="btn btn-modern-primary" onClick={handleSaveRestaurantCustomization}>Save restaurant options</button>
          </div>
        </div>
      </div>

      {restaurantCategories.length === 0 && <div className="alert alert-warning">This restaurant has no categories yet. Create a menu category first, then add items.</div>}

      {normalizedMenuItems.length === 0 ? (
        <div className="alert alert-info">No menu items yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table merchant-categories-table">
            <thead>
              <tr><th>Photo</th><th>Name</th><th>Price</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {normalizedMenuItems.map((item) => {
                const imageCandidates = getAssetUrlCandidates(item.foto ?? item.Foto ?? "");
                const firstCandidate = imageCandidates[0] || "";
                return (
                  <tr key={item.id ?? item.Id} style={{ borderBottom: '0.5px solid rgba(240, 165, 0, 0.25)' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ width: "56px", height: "56px", position: "relative" }}>
                        {firstCandidate ? (
                          <>
                            <img
                              src={firstCandidate}
                              alt={item.emertimi ?? item.Emertimi ?? "Menu item"}
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
                    </td>
                    <td style={{ padding: '12px 8px' }}><strong>{item.emertimi ?? item.Emertimi}</strong></td>
                    <td style={{ padding: '12px 8px' }}>€{formatPrice(item.cmimi ?? item.Cmimi)}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${(item.disponueshme ?? item.Disponueshme) ? "bg-success" : "bg-danger"}`}>
                        {(item.disponueshme ?? item.Disponueshme) ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td style={{ width: "140px", padding: '12px 8px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                        <button className="btn btn-modern-outline" onClick={() => openModal(item)} disabled={!canManageMenuInScope}>Edit</button>
                        <button className="btn btn-modern-danger" onClick={() => handleDelete(item.id ?? item.Id)} disabled={!canManageMenuInScope}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal - Rregulluar pa <style> tag dhe me klasa standarde Bootstrap */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{maxWidth: '720px', width: '99vw'}}>
            <div className="modal-content" style={{borderRadius: '18px', boxShadow: '0 8px 32px rgba(60,72,88,0.18)', border: 'none', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', overflowX: 'visible'}}>
              <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem', alignItems: 'center' }}>
                <h5 className="modal-title" style={{ fontWeight: 700, fontSize: '1.35rem', color: '#222' }}>{editingItem ? "Edit Item" : "Add Item"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body" style={{padding: '1.3rem 2.2rem 1.1rem 2.2rem'}}>
                <div style={{display: 'flex', gap: '2.2rem', flexWrap: 'wrap', alignItems: 'flex-start'}}>
                  <div style={{flex: 1.2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem'}}>
                    <input name="emertimi" className="form-control" placeholder="Name" value={formData.emertimi} onChange={handleInputChange} style={{borderRadius: '10px', border: '1.5px solid #e3e7ed', padding: '0.38rem 0.7rem'}} />
                    <textarea name="pershkrimi" className="form-control" placeholder="Description" value={formData.pershkrimi} onChange={handleInputChange} rows={2} style={{borderRadius: '10px', border: '1.5px solid #e3e7ed', padding: '0.38rem 0.7rem'}} />
                    <div style={{display: 'flex', gap: '0.7rem'}}>
                      <input name="cmimi" type="number" className="form-control" placeholder="Price" value={formData.cmimi} onChange={handleInputChange} style={{maxWidth: 120, borderRadius: '10px', border: '1.5px solid #e3e7ed', padding: '0.38rem 0.7rem'}} />
                      <input name="foto" className="form-control" placeholder="Image URL" value={formData.foto} onChange={handleInputChange} style={{borderRadius: '10px', border: '1.5px solid #e3e7ed', padding: '0.38rem 0.7rem'}} />
                    </div>
                    <textarea name="perberesit" className="form-control" placeholder="Ingredients (comma separated), e.g. Bun, Beef, Onion, Cheese" value={formData.perberesit} onChange={handleInputChange} rows={2} style={{borderRadius: '10px', border: '1.5px solid #e3e7ed', padding: '0.38rem 0.7rem'}} />
                    <textarea name="requestOptions" className="form-control" placeholder="Customer request options (comma separated), e.g. No onion, No mayo" value={formData.requestOptions} onChange={handleInputChange} rows={2} style={{borderRadius: '10px', border: '1.5px solid #e3e7ed', padding: '0.38rem 0.7rem'}} />
                  </div>
                  <div style={{flex: 1, minWidth: 220, maxWidth: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '1.1rem'}}>
                    {String(formData.foto || "").trim() && (
                      <img
                        src={getAssetUrlCandidates(formData.foto)[0] || ""}
                        alt="Preview"
                        onError={(event) => applyImageFallbackCandidate(event, getAssetUrlCandidates(formData.foto), "")}
                        data-candidate-index="0"
                        style={{marginBottom: '0.2rem', maxHeight: '180px', width: '100%', borderRadius: '18px', boxShadow: '0 4px 24px 0 rgba(60,72,88,0.13)', objectFit: 'cover'}}
                      />
                    )}
                    <div
                      style={{
                        width: '100%',
                        marginBottom: '0.5rem',
                        padding: '1rem',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '1.5px solid #e3e7ed',
                        boxShadow: '0 1px 8px rgba(60,72,88,0.06)'
                      }}
                    >
                      <div style={{fontWeight: 600, fontSize: '1.02em', color: '#495057', marginBottom: '0.2em'}}>Options</div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1.2em', width: '100%', justifyContent: 'center'}}>
                        <select
                          name="categoryId"
                          className="form-select"
                          value={formData.categoryId}
                          onChange={handleInputChange}
                          style={{
                            width: '140px',
                            minWidth: '120px',
                            borderRadius: '8px',
                            border: '1.5px solid #d0d7de',
                            background: '#fff'
                          }}
                        >
                          {restaurantCategories.length === 0
                            ? <option value="">No categories available</option>
                            : restaurantCategories.map((category) => {
                                const id = category?.id ?? category?.Id;
                                const name = category?.emertimi ?? category?.Emertimi ?? `Category ${id}`;
                                return <option key={id} value={id}>{name}</option>;
                              })}
                        </select>
                        <label style={{display: 'flex', alignItems: 'center', gap: '0.5em', fontWeight: 500, fontSize: '0.97em', color: '#333', userSelect: 'none', letterSpacing: '0.01em'}}>
                          <span style={{marginRight: '0.2em'}}>Available</span>
                          <input type="checkbox" name="disponueshme" checked={formData.disponueshme} onChange={handleInputChange} style={{width: '18px', height: '18px', cursor: 'pointer'}} />
                        </label>
                      </div>
                    </div>
                    <div style={{marginTop: 'auto', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%'}}>
                      <button className="btn btn-modern-outline" onClick={() => setShowModal(false)}>Cancel</button>
                      <button className="btn btn-modern-primary" onClick={handleSave} disabled={restaurantCategories.length === 0 || !canManageMenuInScope}>Save</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;