import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API_BASE_URL = "http://localhost:5063/api";

const AdminBranchRequests = ({ token, onBack }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/BranchRequest/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests((prev) => {
        const processed = prev.filter((r) => r.status !== "Pending");
        return [...response.data, ...processed];
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Failed to load requests",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await axios.post(`${API_BASE_URL}/BranchRequest/approve/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests((prev) => prev.map((req) =>
        req.id === requestId ? { ...req, status: "Approved", processedAt: new Date().toISOString() } : req
      ));
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Submitted",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: "#d4edda",
        color: "#155724",
      });
      fetchRequests();
    } catch (err) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Failed to approve request",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    }
  };

  const handleReject = async (requestId) => {
    const { value: reason } = await Swal.fire({
      title: "Reject request",
      input: "textarea",
      inputLabel: "Rejection reason",
      inputPlaceholder: "Write the reason for rejection...",
      inputAttributes: {
        "aria-label": "Rejection reason"
      },
      showCancelButton: true,
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      preConfirm: (value) => {
        if (!value || !value.trim()) {
          Swal.showValidationMessage("Please enter a rejection reason.");
        }
        return value;
      },
      width: 500,
    });

    if (!reason) return;

    const sendRejectRequest = async () => {
      try {
        await axios.post(`${API_BASE_URL}/BranchRequest/reject/${requestId}`, { reason }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        return;
      } catch (err) {
        const status = err.response?.status;
        if (status === 400 || status === 422) {
          try {
            await axios.post(`${API_BASE_URL}/BranchRequest/reject/${requestId}`, new URLSearchParams({ reason }), {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/x-www-form-urlencoded"
              }
            });
            return;
          } catch (innerErr) {
            // continue to next fallback
          }
        }
        if (status === 415 || status === 400 || status === 422) {
          await axios.post(`${API_BASE_URL}/BranchRequest/reject/${requestId}`, reason, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "text/plain"
            }
          });
          return;
        }
        throw err;
      }
    };

    try {
      await sendRejectRequest();
      setRequests((prev) => prev.map((req) =>
        req.id === requestId ? { ...req, status: "Rejected", processedAt: new Date().toISOString() } : req
      ));
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Request rejected",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: "#d4edda",
        color: "#155724",
      });
      fetchRequests();
    } catch (err) {
      console.error("Branch reject failed:", err.response?.data || err.response || err.message || err);
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || "Failed to reject request";
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: typeof errorMessage === "string" ? errorMessage : "Failed to reject request",
        text: typeof errorMessage === "string" ? undefined : JSON.stringify(errorMessage),
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading requests...</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === "Pending");
  const approvedRequests = requests.filter(r => r.status === "Approved");
  const rejectedRequests = requests.filter(r => r.status === "Rejected");

  const displayedRequests = activeTab === "pending" ? pendingRequests :
                            activeTab === "approved" ? approvedRequests : rejectedRequests;

  return (
    <div className="container py-4" style={{ marginTop: "70px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📋 Branch Modification Requests</h2>
        <button className="btn btn-outline-secondary" onClick={onBack}>
          ← Back to Dashboard
        </button>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            ⏳ Pending ({pendingRequests.length})
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            ✅ Approved ({approvedRequests.length})
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            ❌ Rejected ({rejectedRequests.length})
          </button>
        </li>
      </ul>

      {displayedRequests.length === 0 ? (
        <div className="alert alert-info text-center py-4">
          <i className="bi bi-inbox fs-1"></i>
          <p className="mb-0 mt-2">No {activeTab} requests</p>
        </div>
      ) : (
        <div className="row">
          {displayedRequests.map((req) => (
            <div className="col-md-6 col-lg-4 mb-4" key={req.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0">
                      {req.requestType === "Edit" ? "✏️ Edit Request" : "🗑️ Delete Request"}
                    </h5>
                    <span className={`badge ${
                      req.status === "Pending" ? "bg-warning" :
                      req.status === "Approved" ? "bg-success" : "bg-danger"
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="small text-muted mb-3">
                    <div><strong>Branch ID:</strong> {req.branchId}</div>
                    <div><strong>Merchant:</strong> {req.requester?.userName || req.requestedBy}</div>
                    <div><strong>Requested:</strong> {new Date(req.requestedAt).toLocaleString()}</div>
                  </div>

                  {req.requestType === "Edit" && (
                    <div className="border-top pt-2 mt-2">
                      <h6>Proposed Changes:</h6>
                      {req.newAddress && (
                        <div className="small">
                          📍 <strong>Address:</strong> {req.newAddress}
                        </div>
                      )}
                      {req.newCity && (
                        <div className="small">
                          🏙️ <strong>City:</strong> {req.newCity}
                        </div>
                      )}
                      {req.newZone && (
                        <div className="small">
                          📌 <strong>Zone:</strong> {req.newZone}
                        </div>
                      )}
                      {req.newDeliveryFee && (
                        <div className="small">
                          💰 <strong>Delivery Fee:</strong> €{req.newDeliveryFee}
                        </div>
                      )}
                      {req.newIsActive !== null && (
                        <div className="small">
                          🔘 <strong>Active:</strong> {req.newIsActive ? "Yes" : "No"}
                        </div>
                      )}
                    </div>
                  )}

                  {req.reason && (
                    <div className="mt-2 p-2 bg-light rounded small">
                      <strong>📝 Reason:</strong> {req.reason}
                    </div>
                  )}

                  {req.status === "Pending" && (
                    <div className="d-flex gap-2 mt-3">
                      <button 
                        className="btn btn-success btn-sm flex-grow-1"
                        onClick={() => handleApprove(req.id)}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        className="btn btn-danger btn-sm flex-grow-1"
                        onClick={() => handleReject(req.id)}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}

                  {req.processedAt && (
                    <div className="mt-2 small text-muted">
                      Processed: {new Date(req.processedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBranchRequests;