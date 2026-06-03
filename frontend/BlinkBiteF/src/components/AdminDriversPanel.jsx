import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5063/api").replace(/\/+$/, "");
const ENV_DRIVER_ENDPOINTS = (import.meta.env.VITE_DRIVERS_ENDPOINTS || "").split(",").map(s => s.trim()).filter(Boolean);
const DEFAULT_DRIVER_ENDPOINTS = [
  `${API_BASE_URL}/admin/applications/couriers`,
  "http://localhost:5063/api/DeliveryDrivers",
  "http://localhost:5063/api/drivers",
  "http://localhost:5063/api/couriers",
  "http://localhost:5063/api/Driver",
  "http://localhost:5063/api/Couriers",
  "http://localhost:5063/api/users/drivers",
  "http://localhost:5063/api/users?role=driver",
  "http://localhost:5063/api/users?role=courier",
  "http://localhost:5063/api/delivery/drivers",
  "http://localhost:5063/api/couriers/all",
  "http://localhost:5063/api/drivers/all"
];

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token") || sessionStorage.getItem("access_token")}`
});

const tryToggleDriverActive = async (driverId, makeActive) => {
  const targetStatus = makeActive ? "Available" : "Offline";
  const candidates = [
    { method: "patch", url: `${API_BASE_URL}/DeliveryDrivers/${driverId}/status`, data: targetStatus },
    { method: "post", url: `${API_BASE_URL}/drivers/${driverId}/${makeActive ? "activate" : "deactivate"}` },
    { method: "post", url: `${API_BASE_URL}/drivers/${makeActive ? "activate" : "deactivate"}/${driverId}` },
    { method: "put", url: `${API_BASE_URL}/drivers/${driverId}`, data: { isActive: makeActive } },
    { method: "put", url: `${API_BASE_URL}/users/${driverId}`, data: { isActive: makeActive } }
  ];

  let lastErr = null;
  for (const c of candidates) {
    try {
      const res = await axios({ method: c.method, url: c.url, data: c.data, headers: getAuthHeader() });
      return res.data;
    } catch (err) {
      lastErr = err;
      if (err.response && err.response.status === 404) continue;
      // try next candidate for other errors as well
    }
  }
  throw lastErr;
};

const AdminDriversPanel = ({ show, onClose }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [isApplicationMode, setIsApplicationMode] = useState(false);
  const [lastTriedUrl, setLastTriedUrl] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [triedEndpoints, setTriedEndpoints] = useState([]);

  const fetchDrivers = async () => {
    setLoading(true);
    const baseCandidates = [
      `${API_BASE_URL}/DeliveryDrivers`,
      `${API_BASE_URL}/drivers`,
      `${API_BASE_URL}/couriers`,
      `${API_BASE_URL}/Driver`,
      `${API_BASE_URL}/Couriers`,
      `${API_BASE_URL}/users/drivers`,
      `${API_BASE_URL}/users?role=driver`,
      `${API_BASE_URL}/users?role=courier`,
      `${API_BASE_URL}/delivery/drivers`,
      `${API_BASE_URL}/couriers/all`,
      `${API_BASE_URL}/drivers/all`
    ];

    const envCandidates = ENV_DRIVER_ENDPOINTS.map(p => p.startsWith("http") ? p : `${API_BASE_URL}/${p.replace(/^\/+/,"")}`);
    const candidates = [...DEFAULT_DRIVER_ENDPOINTS, ...envCandidates, ...baseCandidates];

    let lastErr = null;
    let tried = [];
    for (const url of candidates) {
      tried.push(url);
      try {
        const res = await axios.get(url, { headers: getAuthHeader() });
        const payload = res.data;
        const items = Array.isArray(payload) ? payload : (payload?.items || payload?.drivers || payload?.couriers || payload?.data || payload?.results || []);
        const applicationMode = Array.isArray(items) && items.some(item => item?.status !== undefined || item?.Status !== undefined);
        setDrivers(items);
        setIsApplicationMode(applicationMode);
        console.debug(`Loaded drivers from ${url}`);
        setLastTriedUrl(url);
        setLastError(null);
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        setLastTriedUrl(url);
        setLastError(err?.response?.data ?? err?.message ?? String(err));
        if (err.response && err.response.status === 404) {
          continue;
        }
        console.warn(`Request to ${url} failed:`, err?.response?.status || err.message);
      }
    }

    if (lastErr) {
      console.error("Failed to fetch drivers from all candidate endpoints", lastErr);
      toast.error("Unable to load drivers");
    }

    setTriedEndpoints(Array.from(new Set(tried)));
    setLoading(false);
  };

  useEffect(() => {
    if (!show) return;
    fetchDrivers();
  }, [show]);

  const handleToggle = async (driver) => {
    const driverId = driver?.id ?? driver?.Id ?? driver?.userId ?? driver?.UserId;
    if (!driverId) return;

    const makeActive = !Boolean(driver?.isActive ?? driver?.IsActive ?? driver?.active ?? driver?.Active);

    const result = await Swal.fire({
      title: `${makeActive ? "Activate" : "Deactivate"} driver?`,
      text: `Driver ${driver?.name || driver?.Name || "#" + driverId} will be ${makeActive ? "activated" : "deactivated"}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: makeActive ? "Activate" : "Deactivate",
      confirmButtonColor: makeActive ? "#0d6efd" : "#d33"
    });
    if (!result.isConfirmed) return;

    setSavingId(driverId);
    try {
      await tryToggleDriverActive(driverId, makeActive);
      toast.success(`Driver ${makeActive ? "activated" : "deactivated"}`);
      setDrivers((cur) => cur.map(d => {
        const id = d?.id ?? d?.Id ?? d?.userId ?? d?.UserId;
        if (String(id) !== String(driverId)) return d;
        return { ...d, isActive: makeActive };
      }));
    } catch (err) {
      console.error("Toggle driver failed", err);
      toast.error("Failed to update driver");
    } finally {
      setSavingId(null);
    }
  };

  const handleApproveCourierApplication = async (application) => {
    const applicationId = application?.id ?? application?.Id;
    if (!applicationId) return;
    setSavingId(applicationId);
    try {
      await axios.post(`${API_BASE_URL}/admin/applications/courier/${applicationId}/approve`, {}, { headers: getAuthHeader() });
      toast.success("Courier application approved");
      fetchDrivers();
    } catch (err) {
      console.error("Approve courier failed", err);
      toast.error("Failed to approve courier application");
    } finally {
      setSavingId(null);
    }
  };

  const handleRejectCourierApplication = async (application) => {
    const applicationId = application?.id ?? application?.Id;
    if (!applicationId) return;

    const { value: reason } = await Swal.fire({
      title: "Reject courier application",
      input: "textarea",
      inputLabel: "Rejection reason",
      inputPlaceholder: "Enter the reason for rejection...",
      showCancelButton: true,
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      preConfirm: (value) => {
        if (!value || !value.trim()) {
          Swal.showValidationMessage("Please enter a rejection reason.");
        }
        return value;
      }
    });

    if (!reason) return;

    setSavingId(applicationId);
    try {
      await axios.post(`${API_BASE_URL}/admin/applications/courier/${applicationId}/reject`, { reason }, { headers: getAuthHeader() });
      toast.success("Courier application rejected");
      fetchDrivers();
    } catch (err) {
      console.error("Reject courier failed", err);
      toast.error("Failed to reject courier application");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteCourierApplication = async (application) => {
    const applicationId = application?.id ?? application?.Id;
    if (!applicationId) return;
    const result = await Swal.fire({
      title: "Delete courier application?",
      text: "This will permanently delete this courier application.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    setSavingId(applicationId);
    try {
      await axios.delete(`${API_BASE_URL}/admin/applications/courier-application/${applicationId}`, { headers: getAuthHeader() });
      toast.success("Courier application deleted");
      fetchDrivers();
    } catch (err) {
      console.error("Delete courier application failed", err);
      toast.error("Failed to delete courier application");
    } finally {
      setSavingId(null);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1060 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5>{isApplicationMode ? "Courier Applications" : "Manage Drivers"}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <p className="text-muted">Loading couriers...</p>
            ) : (!drivers || drivers.length === 0) ? (
              <div>
                <p className="text-muted">No records found.</p>
                {lastTriedUrl && (
                  <div className="text-muted small mb-2">Last attempted: <code style={{fontSize:12}}>{lastTriedUrl}</code></div>
                )}
                {lastError && (
                  <div className="alert alert-warning small">Error: {typeof lastError === 'string' ? lastError : JSON.stringify(lastError)}</div>
                )}
                {triedEndpoints && triedEndpoints.length > 0 && (
                  <div className="text-muted small mb-2">Tried endpoints:</div>
                )}
                {triedEndpoints && triedEndpoints.length > 0 && (
                  <ul className="small">
                    {triedEndpoints.map((e) => <li key={e}><code style={{fontSize:12}}>{e}</code></li>)}
                  </ul>
                )}
                <div className="mt-2">
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={fetchDrivers} disabled={loading}>Retry</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { navigator.clipboard && triedEndpoints.length && navigator.clipboard.writeText(triedEndpoints.join("\n")); toast.success('Endpoints copied'); }}>Copy endpoints</button>
                </div>
              </div>
            ) : isApplicationMode ? (
              <div className="list-group">
                {drivers.map((d, idx) => {
                  const id = d?.id ?? d?.Id ?? d?.applicationId ?? d?.ApplicationId ?? `d-${idx}`;
                  const name = d?.fullName ?? d?.name ?? d?.Name ?? d?.userName ?? d?.UserName ?? `Courier ${id}`;
                  const status = d?.status ?? d?.Status ?? "Unknown";
                  const email = d?.email ?? d?.Email;
                  const phone = d?.phone ?? d?.Phone ?? d?.telephone ?? d?.telefoni;
                  const appliedAt = d?.appliedAt ?? d?.AppliedAt;
                  const vehicleType = d?.vehicleType ?? d?.VehicleType ?? d?.vehicle ?? d?.Vehicle;
                  const licensePlate = d?.licensePlate ?? d?.LicensePlate ?? d?.license ?? d?.License;
                  const workingArea = d?.workingArea ?? d?.WorkingArea ?? d?.area ?? d?.Area;

                  return (
                    <div key={id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <strong>{name}</strong>
                          {email && <div className="text-muted small">{email}</div>}
                          {phone && <div className="text-muted small">{phone}</div>}
                        </div>
                        <span className={`badge ${status === 'Pending' ? 'bg-warning text-dark' : status === 'Approved' ? 'bg-success' : 'bg-danger'}`}>
                          {status}
                        </span>
                      </div>
                      <div className="small text-muted mb-3">
                        {appliedAt && <div><i className="bi bi-calendar me-2"></i>Applied: {new Date(appliedAt).toLocaleString()}</div>}
                        {vehicleType && <div><i className="bi bi-car-front me-2"></i>Vehicle: {vehicleType}</div>}
                        {licensePlate && <div><i className="bi bi-card-text me-2"></i>License: {licensePlate}</div>}
                        {workingArea && <div><i className="bi bi-map me-2"></i>Area: {workingArea}</div>}
                      </div>
                      <div className="d-flex gap-2">
                        {status === 'Pending' ? (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleApproveCourierApplication(d)} disabled={savingId === id}>
                              {savingId === id ? 'Saving...' : 'Approve'}
                            </button>
                            <button className="btn btn-outline-danger btn-sm" onClick={() => handleRejectCourierApplication(d)} disabled={savingId === id}>
                              {savingId === id ? 'Saving...' : 'Reject'}
                            </button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => handleDeleteCourierApplication(d)} disabled={savingId === id}>
                              {savingId === id ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        ) : (
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => handleDeleteCourierApplication(d)} disabled={savingId === id}>
                            {savingId === id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="list-group">
                {drivers.map((d, idx) => {
                  const id = d?.id ?? d?.Id ?? d?.userId ?? d?.UserId ?? `d-${idx}`;
                  const name = d?.name ?? d?.Name ?? d?.userName ?? d?.UserName ?? `Driver ${id}`;
                  const active = Boolean(d?.isActive ?? d?.IsActive ?? d?.active ?? d?.Active);
                  return (
                    <div key={id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{name}</strong>
                        <div className="text-muted small">{d?.phone || d?.telefoni || d?.Phone || d?.PhoneNumber}</div>
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <span className={`badge ${active ? 'bg-success' : 'bg-secondary'}`}>{active ? 'Active' : 'Inactive'}</span>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleToggle(d)} disabled={savingId === id}>
                          {savingId === id ? 'Saving...' : (active ? 'Deactivate' : 'Activate')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDriversPanel;
