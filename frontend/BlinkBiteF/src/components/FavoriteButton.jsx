import React, { useState, useEffect } from 'react';
import { favoriteService } from '../services/FavoriteService';

const FavoriteButton = ({ type, id, size = 'medium' }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavoriteStatus();
  }, [type, id]);

  const checkFavoriteStatus = async () => {
    try {
      let result;
      if (type === 'restaurant') {
        result = await favoriteService.checkRestaurantFavorite(id);
      } else {
        result = await favoriteService.checkMenuItemFavorite(id);
      }
      setIsFavorite(result);
    } catch (error) {
      console.error('Error while checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    setLoading(true);
    try {
      if (isFavorite) {
        if (type === 'restaurant') {
          await favoriteService.removeRestaurantFavorite(id);
        } else {
          await favoriteService.removeMenuItemFavorite(id);
        }
      } else {
        if (type === 'restaurant') {
          await favoriteService.addRestaurantFavorite(id);
        } else {
          await favoriteService.addMenuItemFavorite(id);
        }
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error while toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClass = size === 'small' ? 'w-5 h-5' : 'w-6 h-6';

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className="focus:outline-none transition-transform hover:scale-110"
    >
      {isFavorite ? (
        <svg 
          className={`${sizeClass} text-yellow-500 fill-current`}
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      ) : (
        <svg 
          className={`${sizeClass} text-gray-400 hover:text-yellow-500`}
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      )}
    </button>
  );
};

export default FavoriteButton;