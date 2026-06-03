import axios from "axios";

const API_BASE_URL = "http://localhost:5063/api";

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token") || sessionStorage.getItem("access_token")}`
});

const reviewControllerCandidates = ["Reviews", "Review", "reviews", "review"];

const requestReviewApi = async ({ method, route, data, config = {} }) => {
  let lastError = null;

  for (const controller of reviewControllerCandidates) {
    try {
      const url = `${API_BASE_URL}/${controller}${route}`;
      const response = await axios({
        method,
        url,
        data,
        headers: getAuthHeader(),
        ...config,
      });
      return response.data;
    } catch (err) {
      lastError = err;
      if (!err.response || err.response.status !== 404) {
        throw err;
      }
    }
  }

  throw lastError;
};

export const reviewService = {
  // Merr vlerësimin për një porosi (nëse ekziston)
  getByOrder: async (orderId) => {
    return await requestReviewApi({ method: "get", route: `/by-order/${orderId}` });
  },

  // Krijo vlerësim të ri
  create: async (reviewData) => {
    return await requestReviewApi({ method: "post", route: "", data: reviewData });
  },

  // Përditëso vlerësim
  update: async (id, reviewData) => {
    return await requestReviewApi({ method: "put", route: `/${id}`, data: reviewData });
  },

  // Fshij vlerësim
  delete: async (id) => {
    return await requestReviewApi({ method: "delete", route: `/${id}` });
  },

  // Merr vlerësimet e restorantit (për Merchant)
  getByRestaurant: async (restaurantId) => {
    return await requestReviewApi({ method: "get", route: `/by-restaurant/${restaurantId}` });
  },

  // Merr statistikat e vlerësimeve për një restorant
  getRatingStats: async (restaurantId) => {
    return await requestReviewApi({ method: "get", route: `/rating/${restaurantId}` });
  }
};