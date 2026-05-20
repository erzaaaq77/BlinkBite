import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

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

const filterItemsByRestaurant = (items, rid) => {
  const targetRestaurantId = toNumberId(rid);
  if (!Array.isArray(items) || !targetRestaurantId) return [];

  return items.filter((item) => {
    const itemRestaurantId = toNumberId(item?.restaurantId ?? item?.RestaurantId);
    return itemRestaurantId === targetRestaurantId;
  });
};

const filterItemsByRestaurantAddress = (items, restaurantAddressId) => {
  const targetAddressId = toNumberId(restaurantAddressId);
  if (!Array.isArray(items) || !targetAddressId) return [];

  return items.filter((item) => {
    const itemAddressId = toNumberId(item?.restaurantAddressId ?? item?.RestaurantAddressId);
    return itemAddressId === targetAddressId;
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
  // DB-only mode: use backend as single source of truth.
  return {};
};

const saveMenuCustomizations = (nextMap) => {
  // No-op by design in DB-only mode.
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

const getItemIngredients = (item) =>
  resolveItemIngredients(item);

const getItemRequestOptions = (item) =>
  resolveItemRequestOptions(item);

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

const MenuManagement = ({ token, restaurantId, restaurantAddressId = null, onBack }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantCategories, setRestaurantCategories] = useState([]);
  const [debugStats, setDebugStats] = useState({
    allItemsCount: 0,
    byCategoryCount: 0,
    byRestaurantCount: 0,
    selectedCount: 0,
    categoriesCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, type: "success", message: "" });
  const [restaurantCustomizationForm, setRestaurantCustomizationForm] = useState({
    globalAddOns: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const toastTimerRef = useRef(null);
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
        const scopedByAddress = filterItemsByRestaurantAddress(allItems, restaurantAddressId);
        const scopedByCategories = scopeItemsByCategory(allItems, categories);
        const scopedItems = scopedByAddress.length > 0
          ? scopedByAddress
          : (scopedByCategories.length > 0 ? scopedByCategories : filterItemsByRestaurant(allItems, restaurantId));

        setDebugStats({
          allItemsCount: allItems.length,
          byAddressCount: scopedByAddress.length,
          byCategoryCount: scopedByCategories.length,
          byRestaurantCount: filterItemsByRestaurant(allItems, restaurantId).length,
          selectedCount: scopedItems.length,
          categoriesCount: categories.length,
        });

        const localOverrides = loadMenuCustomizations();
        setMenuItems(
          scopedItems.map((item) => {
            const itemId = String(item?.id ?? item?.Id ?? "");
            return mergeCustomizationIntoItem(item, localOverrides[itemId]);
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
  }, [restaurantId, restaurantAddressId, token]);

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
        await saveWithPayloadFallback((candidatePayload) =>
          axios.put(
            `${API_BASE_URL}/MenuItems/${editingItemId}`,
            { ...candidatePayload, id: editingItemId },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );
        savedItemId = editingItemId;
        showToast("Menu item updated.", "success");
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

      if (savedItemId) {
        const map = loadMenuCustomizations();
        map[String(savedItemId)] = {
          ingredients: normalizeTextList(formData.perberesit),
          requestOptions: mergeRequestOptionsWithIngredients(formData.perberesit, formData.requestOptions),
        };
        saveMenuCustomizations(map);
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
        const scopedByAddress = filterItemsByRestaurantAddress(allItems, restaurantAddressId);
      const scopedByCategories = scopeItemsByCategory(allItems, categories);
        const scopedItems = scopedByAddress.length > 0
          ? scopedByAddress
          : (scopedByCategories.length > 0 ? scopedByCategories : filterItemsByRestaurant(allItems, restaurantId));
      setDebugStats({
        allItemsCount: allItems.length,
          byAddressCount: scopedByAddress.length,
        byCategoryCount: scopedByCategories.length,
        byRestaurantCount: filterItemsByRestaurant(allItems, restaurantId).length,
        selectedCount: scopedItems.length,
        categoriesCount: categories.length,
      });
      const localOverrides = loadMenuCustomizations();
      setMenuItems(
        scopedItems.map((item) => {
          const itemId = String(item?.id ?? item?.Id ?? "");
          return mergeCustomizationIntoItem(item, localOverrides[itemId]);
        })
      );
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
        setMenuItems(menuItems.filter(item => Number(item.id ?? item.Id) !== Number(id)));

        const map = loadMenuCustomizations();
        delete map[String(id)];
        saveMenuCustomizations(map);

        showToast("Menu item deleted.", "success");
      } catch (error) {
        console.error(error);
        showToast("Failed to delete menu item.", "danger");
      }
    }
  };

  const normalizedMenuItems = Array.isArray(menuItems)
    ? menuItems
    : Array.isArray(menuItems?.items)
      ? menuItems.items
      : [];

  const debugApiHost = getApiHostLabel();
  const debugRestaurantId = toNumberId(restaurantId);
  const itemsWithIngredientsCount = normalizedMenuItems.filter((item) => getItemIngredients(item).length > 0).length;
  const itemsWithRequestOptionsCount = normalizedMenuItems.filter((item) => getItemRequestOptions(item).length > 0).length;
  const debugSampleItems = normalizedMenuItems
    .slice(0, 3)
    .map((item) => {
      const itemId = item?.id ?? item?.Id ?? "?";
      const name = item?.emertimi ?? item?.Emertimi ?? "Item";
      const ingredients = getItemIngredients(item);
      const options = getItemRequestOptions(item);
      return `#${itemId} ${name} [ing=${ingredients.length}, req=${options.length}]`;
    })
    .join(" | ");

  const formatPrice = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
  };

  if (loading) return <div className="text-center py-5">Loading menu...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container py-4">
      {toast.visible && (
        <div className={`app-toast app-toast--${toast.type}`} role="alert" aria-live="polite">
          <div className="app-toast__body">{toast.message}</div>
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setToast((prev) => ({ ...prev, visible: false }))}></button>
        </div>
      )}

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

      <div className="alert alert-secondary py-2 px-3 small" role="status">
        <strong>Debug:</strong> API Host: {debugApiHost} | API Base: {API_BASE_URL} | Restaurant ID: {debugRestaurantId ?? "missing"}
        <br />
        Counts: allItems={debugStats.allItemsCount} | byCategory={debugStats.byCategoryCount} | byRestaurant={debugStats.byRestaurantCount} | selected={debugStats.selectedCount} | categories={debugStats.categoriesCount}
        <br />
        Data: withIngredients={itemsWithIngredientsCount} | withRequestOptions={itemsWithRequestOptionsCount} | sample={debugSampleItems || "no items"}
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h6 className="mb-3">Restaurant-wide paid add-ons (same for all products)</h6>
          <div className="row g-2">
            <div className="col-12">
              <label className="form-label small text-uppercase fw-semibold mb-1">Global paid add-ons</label>
              <textarea
                name="globalAddOns"
                className="form-control"
                rows="2"
                placeholder="e.g. Cheese:1.00; Mayo:0.50"
                value={restaurantCustomizationForm.globalAddOns}
                onChange={handleRestaurantCustomizationInput}
              />
            </div>
          </div>
          <div className="mt-3 d-flex justify-content-end">
            <button type="button" className="btn btn-outline-primary" onClick={handleSaveRestaurantCustomization}>
              Save restaurant options
            </button>
          </div>
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
                <textarea
                  name="perberesit"
                  className="form-control mb-2"
                  placeholder="Ingredients (comma separated), e.g. Bun, Beef, Onion, Cheese"
                  value={formData.perberesit}
                  onChange={handleInputChange}
                />
                <textarea
                  name="requestOptions"
                  className="form-control mb-2"
                  placeholder="Customer request options (comma separated), e.g. No onion, No mayo"
                  value={formData.requestOptions}
                  onChange={handleInputChange}
                />
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