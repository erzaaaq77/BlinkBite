import React, { useState, useEffect } from "react";
import axios from "axios";
import Confetti from "react-confetti";

const API_BASE_URL = "http://localhost:5063/api";

const InvoiceView = ({ orderId, token, onBack }) => {
  const [invoice, setInvoice] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/Invoice/order/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoice(response.data);
        
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);

        const orderRes = await axios.get(`${API_BASE_URL}/Orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrder(orderRes.data);
      } catch (err) {
        setError("Invoice not found");
      } finally {
        setLoading(false);
      }
    };

    if (orderId && token) {
      fetchInvoice();
    }
  }, [orderId, token]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="text-center py-5">Loading invoice...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={200}
          recycle={false}
          colors={["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]}
          gravity={0.1}
        />
      )}
      
      <div className="invoice-print-container">
        <div className="d-flex justify-content-between mb-4 no-print">
          <button className="btn btn-outline-secondary" onClick={onBack}>
            ← Back to Orders
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Print / Save as PDF
          </button>
        </div>

        <div className="invoice-card" id="invoice">
          <div className="text-center mb-4">
            <h2 style={{ fontSize: "28px", margin: 0 }}>🧾 INVOICE</h2>
            <p style={{ fontSize: "14px", marginTop: "5px" }}>{invoice?.invoiceNumber}</p>
          </div>

          <div className="invoice-header">
            <div className="invoice-bill-to">
              <strong>Bill To:</strong>
              <p>{order?.user?.userName || "Customer"}</p>
              <p>{order?.adresaDorezimit}</p>
            </div>
            <div className="invoice-details">
              <p><strong>Invoice Date:</strong> {new Date(invoice?.invoiceDate).toLocaleString()}</p>
              <p><strong>Order ID:</strong> #{orderId}</p>
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order?.orderItems?.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.menuItem?.emertimi || `Item ${item.menuItemId}`}</td>
                  <td>{item.sasia}</td>
                  <td>€{item.cmimi?.toFixed(2)}</td>
                  <td>€{(item.sasia * item.cmimi).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-end"><strong>Subtotal:</strong></td>
                <td>€{invoice?.subtotal?.toFixed(2)}</td>
              </tr>
              {invoice?.deliveryFee > 0 && (
                <tr>
                  <td colSpan="3" className="text-end"><strong>Delivery Fee:</strong></td>
                  <td>€{invoice?.deliveryFee?.toFixed(2)}</td>
                </tr>
              )}
              {invoice?.discount > 0 && (
                <tr>
                  <td colSpan="3" className="text-end"><strong>Discount:</strong></td>
                  <td>-€{invoice?.discount?.toFixed(2)}</td>
                </tr>
              )}
              <tr className="invoice-total">
                <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                <td><strong>€{invoice?.total?.toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>

          <div className="invoice-footer">
            <p><strong>Payment Method:</strong> {invoice?.paymentMethod}</p>
            {invoice?.notes && <p><strong>Notes:</strong> {invoice.notes}</p>}
            <p className="text-center" style={{ marginTop: "40px", fontSize: "12px" }}>
              Thank you for your order! | FoodDeliveryyy
            </p>
          </div>
        </div>
      </div>

      <style>{`
        /* Stilet për ekran */
        .invoice-print-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .invoice-card {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }
        
        .invoice-bill-to {
          flex: 1;
        }
        
        .invoice-bill-to p {
          margin: 5px 0;
          font-size: 14px;
        }
        
        .invoice-details {
          text-align: right;
        }
        
        .invoice-details p {
          margin: 5px 0;
          font-size: 14px;
        }
        
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .invoice-table th,
        .invoice-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
          font-size: 14px;
        }
        
        .invoice-table th {
          background-color: #f5f5f5;
          font-weight: 600;
        }
        
        .invoice-total td {
          border-top: 2px solid #ddd;
          font-weight: bold;
          font-size: 16px;
        }
        
        .invoice-footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
        
        .invoice-footer p {
          font-size: 14px;
          margin: 5px 0;
        }
        
        .text-end {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        /* Stilet për PRINTIM */
        @media print {
          /* Fshih të gjithë navbar-in dhe butonat */
          nav, 
          .navbar, 
          .fixed-top, 
          .custom-navbar,
          .no-print,
          button,
          .btn {
            display: none !important;
          }
          
          /* Fshih gjithçka jashtë faturës */
          body * {
            visibility: hidden;
          }
          
          .invoice-print-container,
          .invoice-print-container * {
            visibility: visible;
          }
          
          .invoice-print-container {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            margin: 0;
            padding: 0;
            max-width: 100%;
          }
          
          .invoice-card {
            box-shadow: none;
            padding: 0;
            margin: 0;
          }
          
          .invoice-table th {
            background-color: #f5f5f5 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        
        @page {
          size: A4;
          margin: 1.5cm;
        }
      `}</style>
    </>
  );
};

export default InvoiceView;