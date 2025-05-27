'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../firebase/auth-context';
import PaymentProvider from '../payment/PaymentProvider';
import PaymentForm from '../payment/PaymentForm';

export default function InvoiceView() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'invoices'),
      where('parentId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoiceList = [];
      snapshot.forEach((doc) => {
        invoiceList.push({ id: doc.id, ...doc.data() });
      });
      setInvoices(invoiceList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      if (!selectedInvoice?.id) {
        throw new Error('No invoice selected');
      }

      const invoiceRef = doc(db, 'invoices', selectedInvoice.id);
      await updateDoc(invoiceRef, {
        status: 'paid',
        paymentId: paymentIntent.id,
        paymentMethod: 'card',
        paidAt: new Date().toISOString()
      });

      setShowPayment(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw new Error('Failed to update invoice status');
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
  };

  if (loading) {
    return <div className="loading">Loading invoices...</div>;
  }

  if (showPayment && selectedInvoice) {
    return (
      <div className="payment-container">
        <button 
          className="back-btn"
          onClick={() => setShowPayment(false)}
        >
          ← Back to Invoice
        </button>
        <PaymentProvider>
          <PaymentForm
            amount={selectedInvoice.totalAmount}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </PaymentProvider>
      </div>
    );
  }

  return (
    <div className="parent-invoices">
      <h2>Your Invoices</h2>
      
      {selectedInvoice ? (
        <div className="invoice-detail">
          <button 
            className="back-btn"
            onClick={() => setSelectedInvoice(null)}
          >
            ← Back to List
          </button>

          <div className="invoice-card">
            <div className="invoice-header">
              <div>
                <h3>Invoice #{selectedInvoice.invoiceNo}</h3>
                <p>Created: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                <p>Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
              </div>
              <div className="invoice-status">
                <span className={`status-badge ${selectedInvoice.status}`}>
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            <div className="invoice-items">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        {item.description}
                        {item.notes && <div className="item-notes">{item.notes}</div>}
                      </td>
                      <td>{item.quantity}</td>
                      <td>${item.rate.toFixed(2)}</td>
                      <td>${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="invoice-summary">
              <div className="summary-row">
                <span>Sub Total:</span>
                <span>${selectedInvoice.subTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <span>${selectedInvoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {selectedInvoice.status === 'pending' && (
              <div className="invoice-actions">
                <button 
                  className="pay-btn"
                  onClick={() => setShowPayment(true)}
                >
                  Pay Now
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="invoice-list">
          {invoices.map((invoice) => (
            <div 
              key={invoice.id} 
              className="invoice-item"
              onClick={() => setSelectedInvoice(invoice)}
            >
              <div className="invoice-item-header">
                <h3>Invoice #{invoice.invoiceNo}</h3>
                <span className={`status-badge ${invoice.status}`}>
                  {invoice.status}
                </span>
              </div>
              <div className="invoice-item-details">
                <p>Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                <p className="amount">${invoice.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
