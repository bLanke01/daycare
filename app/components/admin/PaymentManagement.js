// components/admin/PaymentManagement.js
'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, addDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function PaymentManagement() {
  const [parents, setParents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [dateRange, setDateRange] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [selectedRows, setSelectedRows] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    items: [{ description: '', quantity: 1, rate: 0, total: 0 }],
    dueDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchParents();
    fetchPayments();
  }, []);

  const fetchParents = async () => {
    try {
      const parentsRef = collection(db, 'users');
      const q = query(parentsRef, where('role', '==', 'parent'));
      const snapshot = await getDocs(q);
      const parentsList = [];
      snapshot.forEach((doc) => {
        parentsList.push({ id: doc.id, ...doc.data() });
      });
      setParents(parentsList);
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const paymentsRef = collection(db, 'invoices');
      const snapshot = await getDocs(paymentsRef);
      const paymentsList = [];
      snapshot.forEach((doc) => {
        paymentsList.push({ id: doc.id, ...doc.data() });
      });
      setPayments(paymentsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedParent) return;

    try {
      const invoice = {
        ...invoiceData,
        parentId: selectedParent.id,
        parentName: selectedParent.name || selectedParent.email,
        status: 'pending',
        createdAt: new Date().toISOString(),
        invoiceNo: `INV-${Date.now()}`,
        subTotal: invoiceData.items.reduce((sum, item) => sum + item.total, 0),
        totalAmount: invoiceData.items.reduce((sum, item) => sum + item.total, 0),
        paymentEmail: '[Your E-transfer Email]' // Replace with actual admin e-transfer email
      };

      await addDoc(collection(db, 'invoices'), invoice);
      setShowInvoiceForm(false);
      setSelectedParent(null);
      setInvoiceData({
        items: [{ description: '', quantity: 1, rate: 0, total: 0 }],
        dueDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchPayments();
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      newItems[index].total = newItems[index].quantity * newItems[index].rate;
    }
    
    setInvoiceData({ ...invoiceData, items: newItems });
  };

  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { description: '', quantity: 1, rate: 0, total: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData({ ...invoiceData, items: newItems });
  };

  const handleEdit = (payment) => {
    setInvoiceData({
      items: payment.items || [],
      dueDate: payment.dueDate,
      notes: payment.notes || ''
    });
    setSelectedParent(parents.find(p => p.id === payment.parentId));
    setIsEditing(true);
    setSelectedPayment(payment);
  };

  const handleUpdate = async () => {
    try {
      const paymentRef = doc(db, 'invoices', selectedPayment.id);
      await updateDoc(paymentRef, {
        ...invoiceData,
        totalAmount: invoiceData.items.reduce((sum, item) => sum + item.total, 0),
        subTotal: invoiceData.items.reduce((sum, item) => sum + item.total, 0)
      });
      fetchPayments();
      setIsEditing(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await deleteDoc(doc(db, 'invoices', paymentId));
      fetchPayments();
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const markAsPaid = async (paymentId) => {
    try {
      const paymentRef = doc(db, 'invoices', paymentId);
      await updateDoc(paymentRef, {
        status: 'paid',
        paidAt: new Date().toISOString()
      });
      fetchPayments();
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error marking payment as paid:', error);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting data...');
  };

  const handleRowSelect = (paymentId) => {
    setSelectedRows(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(payments.map(payment => payment.id));
    } else {
      setSelectedRows([]);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (showInvoiceForm || isEditing) {
    return (
      <div className="invoice-form">
        <h3>{isEditing ? 'Edit Invoice' : 'Create New Invoice'}</h3>
        
        <div className="parent-selector">
          <label>Select Parent:</label>
          <select 
            value={selectedParent?.id || ''} 
            onChange={(e) => setSelectedParent(parents.find(p => p.id === e.target.value))}
            disabled={isEditing}
          >
            <option value="">Select a parent...</option>
            {parents.map(parent => (
              <option key={parent.id} value={parent.id}>
                {parent.name || parent.email}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={isEditing ? handleUpdate : handleInvoiceSubmit}>
          <div className="invoice-items">
            {invoiceData.items.map((item, index) => (
              <div key={index} className="invoice-item">
                <div className="field-group">
                  <label>Item Description</label>
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                  min="1"
                  required
                />
                </div>
                <div className="field-group">
                  <label>Rate</label>
                  <input
                    type="number"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  required
                />
                </div>
                <span className="item-total">${item.total.toFixed(2)}</span>
                <button type="button" onClick={() => removeItem(index)}>Remove</button>
              </div>
            ))}
            <button type="button" className="add-item-btn" onClick={addItem}>Add Item</button>
          </div>

          <div className="invoice-details">
            <div>
              <label>Due Date:</label>
              <input
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Notes:</label>
              <textarea
                placeholder="Notes"
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit">{isEditing ? 'Update Invoice' : 'Send Invoice'}</button>
            <button 
              type="button" 
              onClick={() => {
                setShowInvoiceForm(false);
                setIsEditing(false);
                setSelectedPayment(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-invoices">
      <div className="page-header">
        <h1>Invoices</h1>
        <button 
          className="create-invoice-btn"
          onClick={() => setShowInvoiceForm(true)}
        >
          Create Invoice
        </button>
      </div>

      <div className="payments-overview">
        <h2>Payments overview</h2>
        
        <div className="filters">
          <div className="filter-group">
            <label>Date range</label>
            <input
              type="date"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="date-picker"
            />
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="All">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="payment-method-filter"
            >
              <option value="All">All</option>
              <option value="e-transfer">E-transfer</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <button 
            className="export-btn"
            onClick={handleExport}
          >
            Export
          </button>
        </div>

        <div className="payments-table">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedRows.length === payments.length}
                  />
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
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(payment.id)}
                      onChange={() => handleRowSelect(payment.id)}
                    />
                  </td>
                  <td>{payment.invoiceNo}</td>
                  <td>
                    <span className={`status-badge ${payment.status}`}>
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                  <td>${payment.totalAmount.toFixed(2)}</td>
                  <td>{payment.status === 'pending' ? 'Pending' : 'e-transfer'}</td>
                  <td>{new Date(payment.createdAt).toLocaleString()}</td>
                  <td>
                    <button 
                      className="more-actions"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      ...
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button disabled>Previous</button>
            <span>Page 1 of 1</span>
            <button disabled>Next</button>
          </div>
        </div>
      </div>

      {selectedPayment && (
        <div className="payment-detail-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setSelectedPayment(null)}>&times;</button>
            <h3>Invoice #{selectedPayment.invoiceNo}</h3>
            <div className="payment-info">
              <p><strong>Parent:</strong> {selectedPayment.parentName}</p>
              <p><strong>Amount:</strong> ${selectedPayment.totalAmount.toFixed(2)}</p>
              <p><strong>Status:</strong> {selectedPayment.status}</p>
              <p><strong>Created:</strong> {new Date(selectedPayment.createdAt).toLocaleString()}</p>
              <p><strong>Due Date:</strong> {new Date(selectedPayment.dueDate).toLocaleDateString()}</p>
              {selectedPayment.paidAt && (
                <p><strong>Paid Date:</strong> {new Date(selectedPayment.paidAt).toLocaleString()}</p>
              )}
            </div>
            <div className="modal-actions">
              {selectedPayment.status === 'pending' && (
                <>
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(selectedPayment)}
                  >
                    Edit
                  </button>
                  <button 
                    className="mark-paid-btn"
                    onClick={() => markAsPaid(selectedPayment.id)}
                  >
                    Mark as Paid
                  </button>
                </>
              )}
              <button 
                className="delete-btn"
                onClick={() => handleDelete(selectedPayment.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}