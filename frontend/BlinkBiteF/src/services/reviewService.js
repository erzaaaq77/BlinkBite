import axios from "axios";

const API_BASE_URL = "http://localhost:5063/api";

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token") || sessionStorage.getItem("access_token")}`
});

export const reviewService = {
  // Merr vlerësimin për një porosi (nëse ekziston)
  getByOrder: async (orderId) => {
    const response = await axios.get(`${API_BASE_URL}/Reviews/by-order/${orderId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Krijo vlerësim të ri
  create: async (reviewData) => {
    const response = await axios.post(`${API_BASE_URL}/Reviews`, reviewData, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Përditëso vlerësim
  update: async (id, reviewData) => {
    const response = await axios.put(`${API_BASE_URL}/Reviews/${id}`, reviewData, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Fshij vlerësim
  delete: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/Reviews/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Merr vlerësimet e restorantit (për Merchant)
  getByRestaurant: async (restaurantId) => {
    const response = await axios.get(`${API_BASE_URL}/Reviews/by-restaurant/${restaurantId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Merr statistikat e vlerësimeve për një restorant
  getRatingStats: async (restaurantId) => {
    const response = await axios.get(`${API_BASE_URL}/Reviews/rating/${restaurantId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};