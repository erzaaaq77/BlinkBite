import React, { useState, useEffect } from "react";
import { reviewService } from "../services/reviewService";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const ReviewModal = ({ orderId, restaurantId, onClose, onReviewChanged }) => {
  const [existingReview, setExistingReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const review = await reviewService.getByOrder(orderId);
        if (review && review.id) {
          setExistingReview(review);
          setRating(review.vlersimi);
          setComment(review.komenti);
        }
      } catch (err) {
        // Nëse nuk ka vlerësim, injorojmë
        if (err.response?.status !== 404) console.error(err);
      }
    };
    fetch();
  }, [orderId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        orderId: Number(orderId),
        restaurantId: Number(restaurantId),
        vlersimi: rating,
        komenti: comment,
        userId: "" // do të merret nga token-i në backend
      };
      if (existingReview) {
        await reviewService.update(existingReview.id, payload);
        toast.success("Review updated successfully");
      } else {
        await reviewService.create(payload);
        toast.success("Review submitted successfully");
      }
      if (onReviewChanged) onReviewChanged();
      onClose();
    } catch (err) {
      toast.error(err.response?.data || "Failed to save review");
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
              <button className="btn btn-danger me-auto" onClick={handleDelete} disabled={loading}>
                Delete
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : existingReview ? "Update" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;