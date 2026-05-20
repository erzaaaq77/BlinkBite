import React, { useState, useEffect, useCallback } from 'react';
import { favoriteService } from '../services/FavoriteService';

const toFavoriteBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0' || normalized === '') return false;
  }

  if (value && typeof value === 'object') {
    const candidates = [
      value.isFavorite,
      value.favorite,
      value.favourited,
      value.IsFavorite,
      value.Favorite,
      value.data,
      value.result,
    ];

    for (const candidate of candidates) {
      if (candidate !== undefined) {
        return toFavoriteBoolean(candidate);
      }
    }
  }

  return Boolean(value);
};

const FavoriteButton = ({ type, id, size = 'medium', onToggleComplete }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isPopping, setIsPopping] = useState(false);

  const checkFavoriteStatus = useCallback(async () => {
    try {
      let result;
      if (type === 'restaurant') {
        result = await favoriteService.checkRestaurantFavorite(id);
      } else {
        result = await favoriteService.checkMenuItemFavorite(id);
      }
      setIsFavorite(toFavoriteBoolean(result));
    } catch (error) {
      console.error('Error while checking favorite status:', error);
    }
  }, [type, id]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  useEffect(() => {
    if (!isPopping) return undefined;
    const timerId = window.setTimeout(() => setIsPopping(false), 180);
    return () => window.clearTimeout(timerId);
  }, [isPopping]);

  const iconSize = size === 'small' ? 20 : 24;

  const toggleFavorite = async () => {
    if (loading) return;

    const previousFavorite = Boolean(isFavorite);
    const nextFavorite = !previousFavorite;

    // Optimistic UI so the color changes immediately on click.
    setIsFavorite(nextFavorite);
    if (nextFavorite) {
      setIsPopping(true);
    }

    setLoading(true);
    try {
      if (nextFavorite) {
        if (type === 'restaurant') {
          await favoriteService.addRestaurantFavorite(id);
        } else {
          await favoriteService.addMenuItemFavorite(id);
        }
      } else {
        if (type === 'restaurant') {
          await favoriteService.removeRestaurantFavorite(id);
        } else {
          await favoriteService.removeMenuItemFavorite(id);
        }
      }

      onToggleComplete?.(nextFavorite);
    } catch (error) {
      // Revert only if backend operation fails.
      setIsFavorite(previousFavorite);
      console.error('Error while toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite();
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      disabled={loading}
      type="button"
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      className="btn p-0 border-0 bg-transparent d-inline-flex align-items-center justify-content-center"
      style={{
        lineHeight: 1,
        width: iconSize,
        height: iconSize,
        cursor: loading ? 'default' : 'pointer',
        transform: isPressed ? 'scale(0.88)' : 'scale(1)',
        transition: 'transform 120ms ease',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isPopping ? 'scale(1.18)' : 'scale(1)',
          transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <i
          className={isFavorite ? 'bi bi-star-fill' : 'bi bi-star'}
          style={{
            fontSize: `${iconSize}px`,
            color: isFavorite ? '#f4b400' : '#7b7b7b',
            lineHeight: 1,
            transition: 'color 140ms ease',
          }}
          aria-hidden="true"
        ></i>
      </span>
    </button>
  );
};

export default FavoriteButton;