'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'invoices'),
      orderBy('createdAt', 'desc')
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
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'status-badge success';
      case 'pending':
        return 'status-badge warning';
      case 'declined':
        return 'status-badge danger';
      default:
        return 'status-badge';
    }
  };

  if (loading) {
    return <div className="loading">Loading invoices...</div>;
  }

  return (
    <div className="invoice-list">
      <div className="list-header">
        <h2>Payments overview</h2>
        <button className="export-btn">Export</button>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>Date range</label>
          <input type="date" className="filter-input" />
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select className="filter-input">
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Payment Method</label>
          <select className="filter-input">
            <option value="">All</option>
            <option value="card">Card</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>
      </div>

      <table className="invoice-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" />
            </th>
            <th>PAYMENT ID</th>
            <th>STATUS</th>
            <th>AMOUNT</th>
            <th>P. METHOD</th>
            <th>CREATION DATE</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>
                <input type="checkbox" />
              </td>
              <td>{invoice.id.substring(0, 12)}...</td>
              <td>
                <span className={getStatusBadgeClass(invoice.status)}>
                  {invoice.status}
                </span>
              </td>
              <td>${invoice.totalAmount.toFixed(2)}</td>
              <td>
                <div className="payment-method">
                  {invoice.paymentMethod || 'Pending'}
                </div>
              </td>
              <td>{new Date(invoice.createdAt).toLocaleString()}</td>
              <td>
                <button className="action-btn">•••</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button className="page-btn">Previous</button>
        <span className="page-info">Page 1 of 1</span>
        <button className="page-btn">Next</button>
      </div>
    </div>
  );
} 