import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { reviewService } from "../services/reviewService";

const normalizeReviewPayload = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.reviews)) return payload.reviews;
  if (Array.isArray(payload.Items)) return payload.Items;
  return [];
};

const getReviewRating = (review) => {
  return Number(
    review?.vlersimi ?? review?.Vlersimi ?? review?.rating ?? review?.Rating ?? review?.score ?? 0
  );
};

const getReviewComment = (review) => {
  return (
    review?.Komenti ??
    review?.komenti ??
    review?.Komenti ??
    review?.koment ??
    review?.Koment ??
    review?.comment ??
    review?.comments ??
    review?.description ??
    review?.note ??
    review?.message ??
    review?.shqip ??
    "No comment provided"
  );
};

const getReviewerName = (review) => {
  return (
    review?.customerName ??
    review?.CustomerName ??
    review?.userName ??
    review?.UserName ??
    review?.name ??
    review?.Name ??
    (review?.customer && (review.customer.name || review.customer.Name)) ??
    "Anonymous"
  );
};

const formatReviewDate = (review) => {
  const timestamp = review?.createdAt ?? review?.CreatedAt ?? review?.date ?? review?.Date ?? review?.createdOn ?? review?.CreatedOn;
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
};

const ReviewList = ({ restaurantId, canViewReviews, canDeleteReviews = false, title = "Customer Reviews" }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!restaurantId) {
      setReviews([]);
      setError("");
      setLoading(false);
      return;
    }

    if (!canViewReviews) {
      setReviews([]);
      setError("");
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await reviewService.getByRestaurant(restaurantId);
        if (cancelled) return;
        setReviews(normalizeReviewPayload(data));
      } catch (err) {
        console.error("Failed to load reviews", err);
        if (!cancelled) {
          setError("Unable to load reviews at this time.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      cancelled = true;
    };
  }, [restaurantId, canViewReviews]);

  const handleDeleteReview = async (review) => {
    const reviewId = review?.id ?? review?.Id ?? review?.reviewId ?? review?.ReviewId;
    if (!reviewId) return;

    const result = await Swal.fire({
      title: "Delete review?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      confirmButtonColor: "#d33"
    });

    if (!result.isConfirmed) return;

    setDeletingReviewId(reviewId);
    try {
      await reviewService.delete(reviewId);
      toast.success("Review deleted successfully");
      setReviews((current) => current.filter((item) => {
        const itemId = item?.id ?? item?.Id ?? item?.reviewId ?? item?.ReviewId;
        return itemId !== reviewId;
      }));
    } catch (err) {
      console.error("Failed to delete review", err);
      toast.error("Unable to delete review");
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (!restaurantId) {
    return null;
  }

  return (
    <section className="container pb-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>{title}</h4>
      </div>

      {!canViewReviews ? (
        <div className="alert alert-secondary">
          Review access is restricted for this restaurant.
        </div>
      ) : loading ? (
        <p className="text-muted">Loading reviews...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : reviews.length === 0 ? (
        <p className="text-muted">No reviews found for this restaurant yet.</p>
      ) : (
        <div className="row g-3">
          {reviews.map((review, index) => {
            const rating = getReviewRating(review);
            const comment = getReviewComment(review);
            const reviewer = getReviewerName(review);
            const dateLabel = formatReviewDate(review);
            const reviewKey = review?.id ?? review?.Id ?? review?.reviewId ?? review?.ReviewId ?? `review-${index}`;

            return (
              <div className="col-md-6" key={reviewKey}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-1">{reviewer}</h6>
                        {dateLabel && <p className="text-muted small mb-0">{dateLabel}</p>}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary fs-6">{rating.toFixed(1)} ★</span>
                        {canDeleteReviews && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteReview(review)}
                            disabled={deletingReviewId === reviewKey}
                          >
                            {deletingReviewId === reviewKey ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mb-0">{comment}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ReviewList;
