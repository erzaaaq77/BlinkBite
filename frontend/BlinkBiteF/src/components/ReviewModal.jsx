import React, { useState, useEffect } from "react";
import { reviewService } from "../services/reviewService";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const ReviewModal = ({ orderId, restaurantId, onClose, onReviewChanged }) => {
  const [existingReview, setExistingReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const getReviewField = (review, ...keys) => {
    if (!review) return undefined;
    for (const key of keys) {
      const value = review?.[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return undefined;
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const review = await reviewService.getByOrder(orderId);
        const reviewId = getReviewField(review, "id", "Id", "reviewId", "ReviewId");
        if (review && reviewId) {
          setExistingReview(review);
          setRating(Number(getReviewField(review, "vlersimi", "Vlersimi", "vleresimi", "rating", "Rating", "score")) || 0);
          setComment(getReviewField(review, "komenti", "Komenti", "koment", "Koment", "comment", "Comment", "description", "note", "message") || "");
        }
      } catch (err) {
        // Nëse nuk ka vlerësim, injorojmë
        if (err.response?.status !== 404) console.error(err);
      }
    };
    fetch();
  }, [orderId]);

  const getErrorMessage = (err, fallback) => {
    const data = err?.response?.data;
    if (typeof data === "string") return data;
    if (data?.errors) {
      if (Array.isArray(data.errors)) return data.errors.join(" ");
      if (typeof data.errors === "object") {
        return Object.values(data.errors)
          .flat()
          .filter(Boolean)
          .join(" ");
      }
    }
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.title === "string") return data.title;
    if (err?.message) return err.message;
    if (data && typeof data === "object") return JSON.stringify(data);
    return fallback;
  };

  const getStoredToken = () => {
    return (
      sessionStorage.getItem("access_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      ""
    );
  };

  const getUserIdFromJwt = () => {
    try {
      const jwt = getStoredToken();
      if (!jwt || !jwt.includes(".")) return "";
      const payloadBase64 = jwt.split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const padded = payloadBase64 + "=".repeat((4 - (payloadBase64.length % 4)) % 4);
      const payload = JSON.parse(window.atob(padded));
      return (
        payload?.nameid ||
        payload?.sub ||
        payload?.id ||
        payload?.userId ||
        payload?.UserId ||
        payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
        ""
      );
    } catch (err) {
      console.error("Failed to parse JWT for user ID", err);
      return "";
    }
  };

  const handleSubmit = async () => {
    if (!orderId || !restaurantId) {
      toast.error("Cannot submit review: missing order or restaurant information.");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setLoading(true);
    try {
      const jwtUserId = getUserIdFromJwt();
      const payload = {
        orderId: Number(orderId),
        restaurantId: Number(restaurantId),
        OrderId: Number(orderId),
        RestaurantId: Number(restaurantId),
        userId: jwtUserId || undefined,
        UserId: jwtUserId || undefined,
        vlersimi: rating,
        Vlersimi: rating,
        vleresimi: rating,
        rating: rating,
        Rating: rating,
        komenti: comment,
        Komenti: comment,
        koment: comment,
        comment: comment,
        Comment: comment
      };
      if (existingReview) {
        await reviewService.update(existingReview.id, payload);
        toast.success("Review updated successfully");
      } else {
        await reviewService.create(payload);
        toast.success("Review submitted successfully");
      }
      if (onReviewChanged) onReviewChanged();
      if (onClose) onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save review"));
      console.error("Review submit failed:", err?.response?.data ?? err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete review?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33"
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await reviewService.delete(existingReview.id);
      toast.success("Review deleted");
      if (onReviewChanged) onReviewChanged();
      onClose();
    } catch (err) {
      toast.error("Failed to delete review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5>{existingReview ? "Edit Your Review" : "Leave a Review"}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Rating (1-5)</label>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`btn p-1 fs-3 ${star <= rating ? "text-warning" : "text-secondary"}`}
                    onClick={() => setRating(star)}
                    style={{ background: "none", border: "none" }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Comment (optional, max 300 characters)</label>
              <textarea
                className="form-control"
                rows="4"
                maxLength="300"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
              />
            </div>
          </div>
          <div className="modal-footer">
            {existingReview && (
              <button type="button" className="btn btn-danger me-auto" onClick={handleDelete} disabled={loading}>
                Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : existingReview ? "Update" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;