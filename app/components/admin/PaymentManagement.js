'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function PaymentManagement() {
  const [parents, setParents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form state
  const [invoiceData, setInvoiceData] = useState({
    parentId: '',
    amount: '',
    dueDate: '',
    items: [{ description: '', amount: '' }],
    notes: ''
  });

  useEffect(() => {
    Promise.all([fetchParents(), fetchPayments()]);
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
    } catch (err) {
      console.error('Error fetching parents:', err);
      setError('Failed to load parents');
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'invoices'));
      const paymentsList = [];
      snapshot.forEach((doc) => {
        paymentsList.push({ id: doc.id, ...doc.data() });
      });
      setPayments(paymentsList);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const sendInvoiceNotification = async (invoiceData, parentData) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'invoice',
        recipientId: parentData.id,
        recipientName: `${parentData.firstName} ${parentData.lastName}`,
        title: 'New Invoice Generated',
        message: `A new invoice for $${invoiceData.totalAmount} has been generated for your account.`,
        amount: invoiceData.totalAmount,
        dueDate: invoiceData.dueDate,
        status: 'unread',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error sending invoice notification:', err);
      throw new Error('Failed to send notification');
    }
  };

  const sendPaymentConfirmationNotification = async (invoiceData, parentData) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'payment_confirmation',
        recipientId: parentData.id,
        recipientName: `${parentData.firstName} ${parentData.lastName}`,
        title: 'Payment Received',
        message: `Your payment of $${invoiceData.totalAmount} has been received. Thank you!`,
        amount: invoiceData.totalAmount,
        status: 'unread',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error sending payment confirmation:', err);
      throw new Error('Failed to send confirmation');
    }
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const parent = parents.find(p => p.id === invoiceData.parentId);
      if (!parent) {
        throw new Error('Parent not found');
      }

      const totalAmount = invoiceData.items.reduce((sum, item) => sum + Number(item.amount), 0);
      
      const paymentData = {
        parentId: invoiceData.parentId,
        parentName: `${parent.firstName} ${parent.lastName}`,
        totalAmount: totalAmount,
        subTotal: totalAmount,
        dueDate: invoiceData.dueDate,
        items: invoiceData.items.map(item => ({
          description: item.description,
          rate: Number(item.amount),
          quantity: 1,
          total: Number(item.amount)
        })),
        notes: invoiceData.notes,
        status: 'pending',
        createdAt: new Date().toISOString(),
        invoiceNo: `INV-${Date.now()}`,
        paymentEmail: 'payments@daycare.com'
      };

      const docRef = await addDoc(collection(db, 'invoices'), paymentData);
      
      await sendInvoiceNotification(paymentData, parent);

      setPayments(prev => [...prev, { id: docRef.id, ...paymentData }]);
      
      // Reset form
      setInvoiceData({
        parentId: '',
        dueDate: '',
        items: [{ description: '', amount: '' }],
        notes: ''
      });

    } catch (err) {
      console.error('Error creating invoice:', err);
      setError('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    setInvoiceData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      return {
        ...prev,
        items: newItems
      };
    });
  };

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', amount: '' }]
    }));
  };

  const removeItem = (index) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setInvoiceData({
      parentId: payment.parentId,
      amount: payment.amount,
      dueDate: payment.dueDate,
      items: payment.items || [{ description: '', amount: payment.amount }],
      notes: payment.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError(null);

      const totalAmount = invoiceData.items.reduce((sum, item) => sum + Number(item.amount), 0);
      
      const updatedData = {
        totalAmount: totalAmount,
        subTotal: totalAmount,
        dueDate: invoiceData.dueDate,
        items: invoiceData.items.map(item => ({
          description: item.description,
          rate: Number(item.amount),
          quantity: 1,
          total: Number(item.amount)
        })),
        notes: invoiceData.notes,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'invoices', selectedPayment.id), updatedData);

      setPayments(prev => prev.map(p => 
        p.id === selectedPayment.id 
          ? { ...p, ...updatedData }
          : p
      ));

      setShowEditModal(false);
      setSelectedPayment(null);
    } catch (err) {
      console.error('Error updating payment:', err);
      setError('Failed to update payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    try {
      setLoading(true);
      setError(null);

      await deleteDoc(doc(db, 'invoices', paymentId));
      setPayments(prev => prev.filter(p => p.id !== paymentId));

    } catch (err) {
      console.error('Error deleting payment:', err);
      setError('Failed to delete payment');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (paymentId) => {
    try {
      setLoading(true);
      setError(null);

      const payment = payments.find(p => p.id === paymentId);
      const parent = parents.find(p => p.id === payment.parentId);

      await updateDoc(doc(db, 'invoices', paymentId), {
        status: 'paid',
        paidAt: new Date().toISOString()
      });

      await sendPaymentConfirmationNotification(payment, parent);

      setPayments(prev => prev.map(p => 
        p.id === paymentId 
          ? { ...p, status: 'paid', paidAt: new Date().toISOString() }
          : p
      ));

    } catch (err) {
      console.error('Error marking payment as paid:', err);
      setError('Failed to update payment status');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const selectedPayments = payments.filter(p => selectedRows.has(p.id));
    // Implement export logic here
    console.log('Exporting:', selectedPayments);
  };

  const handleRowSelect = (paymentId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(payments.map(p => p.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      (payment.parentName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'badge-success';
      case 'overdue':
        return 'badge-error';
      default:
        return 'badge-warning';
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Create Invoice Form */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Create New Invoice</h2>
          <form onSubmit={handleInvoiceSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Parent</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={invoiceData.parentId}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, parentId: e.target.value }))}
                  required
                >
                  <option value="">Select Parent</option>
                  {parents.map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.firstName} {parent.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Due Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={invoiceData.dueDate}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Invoice Items</h3>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={addItem}
                >
                  Add Item
                </button>
              </div>

              {invoiceData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text">Description</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Amount</span>
                    </label>
                    <div className="join">
                      <span className="join-item flex items-center px-3 bg-base-200">$</span>
                      <input
                        type="number"
                        className="input input-bordered join-item w-full"
                        value={item.amount}
                        onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                        required
                        min="0"
                        step="0.01"
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm join-item"
                          onClick={() => removeItem(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Notes</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes..."
              />
            </div>

            <div className="card-actions justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Create Invoice'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Payments List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
            <h2 className="card-title">Payment Records</h2>
            <div className="flex gap-2">
              <button
                className="btn btn-outline btn-sm"
                onClick={handleExport}
                disabled={selectedRows.size === 0}
              >
                Export Selected
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
            <div className="form-control w-full sm:w-auto">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search payments..."
                  className="input input-bordered w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-square">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <select
              className="select select-bordered w-full sm:w-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>
                    <label>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedRows.size === payments.length}
                        onChange={handleSelectAll}
                      />
                    </label>
                  </th>
                  <th>Parent</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(payment.id)}
                        onChange={() => handleRowSelect(payment.id)}
                        className="checkbox"
                      />
                    </td>
                    <td>{payment.parentName}</td>
                    <td>{formatCurrency(payment.totalAmount)}</td>
                    <td>{formatDate(payment.dueDate)}</td>
                    <td>
                      <span className={getStatusBadgeClass(payment.status)}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="flex gap-2">
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleEdit(payment)}
                      >
                        Edit
                      </button>
                      {payment.status === 'pending' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => markAsPaid(payment.id)}
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => handleDelete(payment.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <h3 className="font-semibold mb-2">No payments found</h3>
              <p className="text-base-content/70">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Edit Payment</h3>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Due Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={invoiceData.dueDate}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Invoice Items</h4>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={addItem}
                  >
                    Add Item
                  </button>
                </div>

                {invoiceData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="form-control md:col-span-2">
                      <label className="label">
                        <span className="label-text">Description</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Amount</span>
                      </label>
                      <div className="join">
                        <span className="join-item flex items-center px-3 bg-base-200">$</span>
                        <input
                          type="number"
                          className="input input-bordered join-item w-full"
                          value={item.amount}
                          onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                          required
                          min="0"
                          step="0.01"
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm join-item"
                            onClick={() => removeItem(index)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Notes</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                className="btn"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPayment(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}