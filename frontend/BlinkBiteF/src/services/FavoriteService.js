import api from './api';

export const favoriteService = {
  getFavorites: async () => {
    const response = await api.get('/favorites');
    return response.data;
  },

  addRestaurantFavorite: async (restaurantId) => {
    const response = await api.post(`/favorites/restaurant/${restaurantId}`);
    return response.data;
  },

  removeRestaurantFavorite: async (restaurantId) => {
    const response = await api.delete(`/favorites/restaurant/${restaurantId}`);
    return response.data;
  },

  addMenuItemFavorite: async (menuItemId) => {
    const response = await api.post(`/favorites/menuitem/${menuItemId}`);
    return response.data;
  },

  removeMenuItemFavorite: async (menuItemId) => {
    const response = await api.delete(`/favorites/menuitem/${menuItemId}`);
    return response.data;
  },

  checkRestaurantFavorite: async (restaurantId) => {
    const response = await api.get(`/favorites/check/restaurant/${restaurantId}`);
    return response.data;
  },

  checkMenuItemFavorite: async (menuItemId) => {
    const response = await api.get(`/favorites/check/menuitem/${menuItemId}`);
    return response.data;
  }
};