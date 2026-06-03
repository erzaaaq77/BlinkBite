import axios from "axios";

const API_BASE_URL = "http://localhost:5063/api";

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token") || sessionStorage.getItem("access_token")}`
});

export const reviewService = {
  // Merr vlerësimin për një porosi (nëse ekziston)
  getByOrder: async (orderId) => {
    const res = await axios.get(`${API_BASE_URL}/Reviews/by-order/${orderId}`, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  // Krijo vlerësim të ri
  create: async (reviewData) => {
    const res = await axios.post(`${API_BASE_URL}/Reviews`, reviewData, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  // Përditëso vlerësim
  update: async (id, reviewData) => {
    const res = await axios.put(`${API_BASE_URL}/Reviews/${id}`, reviewData, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  // Fshij vlerësim
  delete: async (id) => {
    const res = await axios.delete(`${API_BASE_URL}/Reviews/${id}`, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  // Merr vlerësimet e restorantit (për Merchant)
  getByRestaurant: async (restaurantId) => {
    const res = await axios.get(`${API_BASE_URL}/Reviews/by-restaurant/${restaurantId}`, {
      headers: getAuthHeader()
    });
    return res.data;
  },

  // Merr statistikat e vlerësimeve për një restorant
  getRatingStats: async (restaurantId) => {
    const res = await axios.get(`${API_BASE_URL}/Reviews/rating/${restaurantId}`, {
      headers: getAuthHeader()
    });
    return res.data;
  }
};