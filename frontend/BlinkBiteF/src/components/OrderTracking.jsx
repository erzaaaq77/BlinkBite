import React, { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons broken by webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const truckIcon = L.divIcon({
  html: "🚚",
  iconSize: [35, 35],
  className: "driver-marker",
  popupAnchor: [0, -15],
});

const API_BASE_URL = "http://localhost:5063";
const DEFAULT_POS = [42.6629, 21.1655];

const STATUS_LABELS = {
  1: "Pending", 2: "Accepted", 3: "Preparing", 4: "Ready",
  5: "Delivered", 6: "Cancelled",
};

const STATUS_BADGE_CLASS = {
  Pending: "bg-warning text-dark",
  Accepted: "bg-primary",
  Preparing: "bg-info text-dark",
  Ready: "bg-success",
  Delivered: "bg-secondary",
  Cancelled: "bg-danger",
};

function resolveStatus(orderInfo) {
  const raw = orderInfo?.statusi ?? orderInfo?.status ?? orderInfo?.statusLabel ?? "";
  if (typeof raw === "number" || (typeof raw === "string" && !isNaN(Number(raw)) && raw !== "")) {
    return STATUS_LABELS[Number(raw)] || `Status ${raw}`;
  }
  return raw || "Processing";
}

function MapMover({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 15);
  }, [position, map]);
  return null;
}

const OrderTracking = ({ orderId, token }) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const connectionRef = useRef(null);

  // Scroll to top when page loads
  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fetchOrderInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/Orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setOrderInfo(data);
        }
      } catch (err) {
        console.error("Failed to fetch order info:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token && orderId) fetchOrderInfo();
    else setLoading(false);
  }, [orderId, token]);

  useEffect(() => {
    const connectToHub = async () => {
      if (!token || !orderId) return;

      try {
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(`${API_BASE_URL}/locationHub`, {
            accessTokenFactory: () => token
          })
          .withAutomaticReconnect()
          .build();

        connection.on("DriverLocationUpdated", (location) => {
          console.log("Location update received:", location);
          setDriverLocation(location);
        });

        connection.on("DriverAssigned", (data) => {
          console.log("Driver assigned:", data);
          setOrderInfo(prev => ({
            ...prev,
            driverAssigned: true,
            driverMessage: data.message
          }));
        });

        await connection.start();
        await connection.invoke("JoinOrderTracking", parseInt(orderId));
        connectionRef.current = connection;
        setIsConnected(true);
        console.log("Connected to tracking hub for order:", orderId);
      } catch (err) {
        console.error("SignalR connection failed:", err);
        setError("Could not connect to tracking service. Please refresh the page.");
      }
    };

    connectToHub();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [orderId, token]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading order information...</p>
      </div>
    );
  }

  const driverPos = driverLocation
    ? [driverLocation.latitude, driverLocation.longitude]
    : null;

  return (
    <div className="container" style={{ paddingTop: "120px", paddingBottom: "3rem" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📍 Track Your Order</h2>
        <button
          className="btn btn-outline-secondary"
          onClick={() => (window.location.hash = "/my-orders")}
        >
          ← Back to Orders
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h5>Order #{orderId}</h5>
              <p className="mb-1">
                <strong>Status:</strong>
                <span className={`badge ms-2 ${STATUS_BADGE_CLASS[resolveStatus(orderInfo)] || "bg-secondary"}`}>
                  {resolveStatus(orderInfo)}
                </span>
              </p>
              <p className="mb-1">
                <strong>Total:</strong> €
                {(orderInfo?.shumaTotale ?? orderInfo?.totalAmount ?? 0).toFixed(2)}
              </p>
              <p className="mb-0">
                <strong>Delivery Address:</strong>{" "}
                {orderInfo?.adresaDorezimit || orderInfo?.deliveryAddress || "-"}
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-1">
                <strong>Restaurant:</strong>{" "}
                {orderInfo?.restaurant?.emertimi || orderInfo?.restaurant?.name || orderInfo?.restaurantName || "-"}
              </p>
              <p className="mb-0">
                <strong>Payment:</strong>{" "}
                {orderInfo?.metodaPageses === 1 || orderInfo?.paymentMethod === 1 ? "Cash" : "Other"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          {error ? (
            <div className="alert alert-danger mb-0">{error}</div>
          ) : isConnected ? (
            <div className="alert alert-success mb-0">
              <i className="bi bi-check-circle-fill me-2"></i>
              Connected to live tracking{" "}
              {driverPos ? "📍 Driver location active" : "⏳ Waiting for driver location..."}
            </div>
          ) : (
            <div className="alert alert-warning mb-0">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              Connecting to tracking service...
            </div>
          )}
        </div>
      </div>

      {driverPos && (
        <div className="card mb-3">
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <strong>🚚 Driver Location:</strong>
                <p className="mb-0 small">
                  Lat: {driverLocation.latitude}, Lng: {driverLocation.longitude}
                </p>
              </div>
              <div className="col-md-6">
                <strong>🕐 Last Update:</strong>
                <p className="mb-0 small">
                  {new Date(driverLocation.lastUpdate).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: "500px", width: "100%", borderRadius: "10px", overflow: "hidden" }} className="shadow-sm">
        <MapContainer center={driverPos || DEFAULT_POS} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          {driverPos ? (
            <>
              <MapMover position={driverPos} />
              <Marker position={driverPos} icon={truckIcon}>
                <Popup>
                  <strong>🚚 Driver</strong>
                  <br />
                  Last update: {new Date(driverLocation.lastUpdate).toLocaleTimeString()}
                </Popup>
              </Marker>
              <Circle
                center={driverPos}
                radius={100}
                pathOptions={{ color: "#4CAF50", fillColor: "#4CAF50", fillOpacity: 0.1 }}
              />
            </>
          ) : (
            <Marker position={DEFAULT_POS}>
              <Popup>Waiting for driver...</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="mt-3 text-muted small d-flex justify-content-between flex-wrap gap-2">
        <span>📍 <strong>Marker:</strong> Driver's current location</span>
        <span>🔄 Map updates automatically</span>
        <span>🚚 Driver is on the way</span>
      </div>
    </div>
  );
};

export default OrderTracking;