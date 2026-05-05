import React, { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

const API_BASE_URL = "http://localhost:5001";

const OrderTracking = ({ orderId, token }) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const connectionRef = useRef(null); 

  useEffect(() => {
    const fetchOrderInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/Orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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

    if (token && orderId) {
      fetchOrderInfo();
    }
  }, [orderId, token]);

  useEffect(() => {
    if (typeof window.L === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        document.head.appendChild(link);
        initMap();
      };
      document.body.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapRef.current && window.L) {
        const defaultLat = 42.6629;
        const defaultLng = 21.1655;

        const map = window.L.map('map').setView([defaultLat, defaultLng], 13);
        
        // 🔥 Rregullo: tileLayer (jo titleLayer)
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        mapRef.current = map;

        markerRef.current = window.L.marker([defaultLat, defaultLng], {
          icon: window.L.divIcon({
            html: '🚚',
            iconSize: [35, 35],
            className: 'driver-marker',
            popupAnchor: [0, -15]
          })
        }).addTo(map);

        window.L.circle([defaultLat, defaultLng], {
          radius: 100,
          color: '#4CAF50',
          fillColor: '#4CAF50',
          fillOpacity: 0.1
        }).addTo(map);
      }
    }
  }, []); 

  useEffect(() => {
    if (mapRef.current && markerRef.current && driverLocation) {
      const newLat = driverLocation.latitude;
      const newLng = driverLocation.longitude;
      mapRef.current.setView([newLat, newLng], 15);
      markerRef.current.setLatLng([newLat, newLng]);
      
      markerRef.current.bindPopup(`
        <strong>🚚 Driver</strong><br/>
        Last update: ${new Date(driverLocation.lastUpdate).toLocaleTimeString()}
      `).openPopup();
    }
  }, [driverLocation]);

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

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📍 Track Your Order</h2>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => window.location.hash = "/my-orders"}
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
                <span className="badge bg-primary ms-2">{orderInfo?.statusi || "Processing"}</span>
              </p>
              <p className="mb-1">
                <strong>Total:</strong> €{orderInfo?.shumaTotale?.toFixed(2) || "0"}
              </p>
              <p className="mb-0">
                <strong>Delivery Address:</strong> {orderInfo?.adresaDorezimit || "-"}
              </p>
            </div>
            <div className="col-md-6">
              <div className="text-md-end">
                <p className="mb-1">
                  <strong>Restaurant:</strong> {orderInfo?.restaurant?.emertimi || "-"}
                </p>
                <p className="mb-0">
                  <strong>Payment:</strong> {orderInfo?.metodaPageses === 1 ? "Cash" : "Other"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Status */}
      <div className="card mb-4">
        <div className="card-body">
          {error ? (
            <div className="alert alert-danger mb-0">{error}</div>
          ) : isConnected ? (
            <div className="alert alert-success mb-0">
              <i className="bi bi-check-circle-fill me-2"></i>
              Connected to live tracking {driverLocation ? "📍 Driver location active" : "⏳ Waiting for driver location..."}
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

      {driverLocation && (
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

      <div 
        id="map" 
        style={{ height: "500px", width: "100%", borderRadius: "10px" }}
        className="shadow-sm"
      ></div>

      {/* Help Text */}
      <div className="mt-3 text-muted small">
        <div className="d-flex justify-content-between">
          <span>📍 <strong>Green marker:</strong> Driver's current location</span>
          <span>🔄 The map updates automatically every few seconds</span>
          <span>🚚 Driver is on the way to your address</span>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;