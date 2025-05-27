'use client';

import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function InvoiceForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    invoiceNo: '',
    invoiceDate: '',
    dueDate: '',
    parentId: '',
    items: [
      { description: 'General Fee', quantity: 1, rate: 0, total: 0 },
      { description: 'Supplemental Fee', quantity: 1, rate: 0, total: 0, notes: 'Meals & Snack, activity' }
    ],
    status: 'pending',
    subTotal: 0,
    totalAmount: 0
  });

  const calculateTotals = (items) => {
    const subTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    return {
      subTotal,
      totalAmount: subTotal
    };
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
      total: field === 'rate' ? value * newItems[index].quantity : 
             field === 'quantity' ? value * newItems[index].rate :
             newItems[index].total
    };

    const { subTotal, totalAmount } = calculateTotals(newItems);
    setFormData(prev => ({
      ...prev,
      items: newItems,
      subTotal,
      totalAmount
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const invoice = {
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      const docRef = await addDoc(collection(db, 'invoices'), invoice);
      onSuccess({ ...invoice, id: docRef.id });
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="invoice-form">
      <div className="form-header">
        <h2>Create New Invoice</h2>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Invoice No.</label>
          <input
            type="text"
            value={formData.invoiceNo}
            onChange={(e) => setFormData(prev => ({ ...prev, invoiceNo: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Invoice Date</label>
          <input
            type="date"
            value={formData.invoiceDate}
            onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Due Date</label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Parent ID</label>
          <input
            type="text"
            value={formData.parentId}
            onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="items-section">
        <h3>Invoice Items</h3>
        <table className="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    readOnly
                  />
                  {item.notes && <div className="item-notes">{item.notes}</div>}
                </td>
                <td>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                    min="1"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.rate}
                    onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                    step="0.01"
                    min="0"
                  />
                </td>
                <td>${item.total?.toFixed(2) || '0.00'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="invoice-summary">
        <div className="summary-row">
          <span>Sub Total:</span>
          <span>${formData.subTotal.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Total Amount:</span>
          <span>${formData.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="submit-btn">Create Invoice</button>
      </div>
    </form>
  );
} 