import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5063/api";

const InvoiceView = ({ orderId, token, onBack }) => {
  const [invoice, setInvoice] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/Invoice/order/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoice(response.data);

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
    <div className="container py-4">
      <div className="d-flex justify-content-between mb-4">
        <button className="btn btn-outline-secondary" onClick={onBack}>
          ← Back to Orders
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div className="card p-4" id="invoice">
        <div className="text-center mb-4">
          <h2>🧾 INVOICE</h2>
          <p className="text-muted">{invoice?.invoiceNumber}</p>
        </div>

        <div className="row mb-4">
          <div className="col-md-6">
            <strong>Bill To:</strong>
            <p>
              {order?.user?.userName || "Customer"}
              <br />
              {order?.adresaDorezimit}
            </p>
          </div>
          <div className="col-md-6 text-end">
            <strong>Invoice Date:</strong>
            <p>{new Date(invoice?.invoiceDate).toLocaleString()}</p>
            <strong>Order ID:</strong>
            <p>#{orderId}</p>
          </div>
        </div>

        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>Item</th>
              <th>Quantity</th>
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
              <td colSpan="3" className="text-end">
                <strong>Subtotal:</strong>
              </td>
              <td>€{invoice?.subtotal?.toFixed(2)}</td>
            </tr>
            {invoice?.deliveryFee > 0 && (
              <tr>
                <td colSpan="3" className="text-end">
                  <strong>Delivery Fee:</strong>
                </td>
                <td>€{invoice?.deliveryFee?.toFixed(2)}</td>
              </tr>
            )}
            {invoice?.discount > 0 && (
              <tr>
                <td colSpan="3" className="text-end">
                  <strong>Discount:</strong>
                </td>
                <td>-€{invoice?.discount?.toFixed(2)}</td>
              </tr>
            )}
            <tr className="table-active">
              <td colSpan="3" className="text-end">
                <strong>Total:</strong>
              </td>
              <td>
                <strong>€{invoice?.total?.toFixed(2)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-3">
          <p>
            <strong>Payment Method:</strong> {invoice?.paymentMethod}
          </p>
          {invoice?.notes && <p><strong>Notes:</strong> {invoice.notes}</p>}
          <p className="text-muted small mt-4 text-center">
            Thank you for your order! | FoodDeliveryyy
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          .btn, .container > div:first-child { display: none; }
          .card { box-shadow: none; padding: 0; }
        }
      `}</style>
    </div>
  );
};

export default InvoiceView;