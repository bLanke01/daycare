// components/admin/PaymentManagement.js
'use client';

import { useState } from 'react';

const PaymentManagement = () => {
  // Mock data for payments
  const [payments, setPayments] = useState([
    { 
      id: 1, 
      parentName: 'Sarah Thompson', 
      childName: 'Emma Thompson',
      amount: 350.00, 
      date: '2025-04-05', 
      status: 'Paid', 
      paymentMethod: 'Credit Card',
      invoiceNumber: 'INV-2025-001'
    },
    { 
      id: 2, 
      parentName: 'Maria Garcia', 
      childName: 'Noah Garcia',
      amount: 350.00, 
      date: '2025-04-10', 
      status: 'Paid', 
      paymentMethod: 'Bank Transfer',
      invoiceNumber: 'INV-2025-002'
    },
    { 
      id: 3, 
      parentName: 'Juan Martinez', 
      childName: 'Olivia Martinez',
      amount: 300.00, 
      date: '2025-05-01', 
      status: 'Pending', 
      paymentMethod: 'Pending',
      invoiceNumber: 'INV-2025-010'
    },
    { 
      id: 4, 
      parentName: 'James Johnson', 
      childName: 'William Johnson',
      amount: 350.00, 
      date: '2025-05-03', 
      status: 'Paid', 
      paymentMethod: 'Credit Card',
      invoiceNumber: 'INV-2025-011'
    },
    { 
      id: 5, 
      parentName: 'Emily Wilson', 
      childName: 'Sophia Wilson',
      amount: 400.00, 
      date: '2025-05-05', 
      status: 'Pending', 
      paymentMethod: 'Pending',
      invoiceNumber: 'INV-2025-015'
    }
  ]);
  
  // State for modal and form
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('invoice'); // 'invoice' or 'receipt'
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  
  // New invoice state
  const [newInvoice, setNewInvoice] = useState({
    parentName: '',
    childName: '',
    amount: '',
    dueDate: '',
    description: ''
  });
  
  // Filter payments based on status, search, and date range
  const filteredPayments = payments.filter(payment => {
    const matchesStatus = filterStatus === 'All' || payment.status === filterStatus;
    const matchesSearch = payment.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDateRange = true;
    if (dateRange.start && dateRange.end) {
      const paymentDate = new Date(payment.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDateRange = paymentDate >= startDate && paymentDate <= endDate;
    }
    
    return matchesStatus && matchesSearch && matchesDateRange;
  });
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvoice({
      ...newInvoice,
      [name]: value
    });
  };
  
  // Handle date range changes
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create new invoice
    const newInvoiceObj = {
      id: payments.length + 1,
      parentName: newInvoice.parentName,
      childName: newInvoice.childName,
      amount: parseFloat(newInvoice.amount),
      date: newInvoice.dueDate,
      status: 'Pending',
      paymentMethod: 'Pending',
      invoiceNumber: `INV-2025-${(payments.length + 1).toString().padStart(3, '0')}`
    };
    
    setPayments([...payments, newInvoiceObj]);
    setShowModal(false);
    setNewInvoice({
      parentName: '',
      childName: '',
      amount: '',
      dueDate: '',
      description: ''
    });
  };
  
  // Handle payment status update
  const handlePaymentStatusUpdate = (id, status) => {
    const updatedPayments = payments.map(payment => {
      if (payment.id === id) {
        return {
          ...payment,
          status,
          paymentMethod: status === 'Paid' ? 'Manual Entry' : 'Pending',
          date: status === 'Paid' ? new Date().toISOString().split('T')[0] : payment.date
        };
      }
      return payment;
    });
    
    setPayments(updatedPayments);
  };
  
  // View invoice or receipt
  const viewInvoiceOrReceipt = (payment, type) => {
    setSelectedPayment(payment);
    setModalType(type);
    setShowModal(true);
  };
  
  return (
    <div className="payment-management">
      <div className="page-header">
        <h1>Payment Management</h1>
        <button 
          className="create-invoice-btn"
          onClick={() => {
            setModalType('invoice');
            setSelectedPayment(null);
            setShowModal(true);
          }}
        >
          Create New Invoice
        </button>
      </div>
      
      <div className="payment-summary">
        <div className="summary-card">
          <h3>Total Payments</h3>
          <p className="summary-number">
            ${payments.reduce((total, payment) => total + payment.amount, 0).toFixed(2)}
          </p>
        </div>
        
        <div className="summary-card">
          <h3>Paid</h3>
          <p className="summary-number">
            ${payments.filter(payment => payment.status === 'Paid')
              .reduce((total, payment) => total + payment.amount, 0).toFixed(2)}
          </p>
        </div>
        
        <div className="summary-card">
          <h3>Pending</h3>
          <p className="summary-number">
            ${payments.filter(payment => payment.status === 'Pending')
              .reduce((total, payment) => total + payment.amount, 0).toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by parent, child or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="status-filter">
          <label htmlFor="statusFilter">Status:</label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        
        <div className="date-range">
          <label>Date Range:</label>
          <input
            type="date"
            name="start"
            value={dateRange.start}
            onChange={handleDateRangeChange}
          />
          <span>to</span>
          <input
            type="date"
            name="end"
            value={dateRange.end}
            onChange={handleDateRangeChange}
          />
        </div>
      </div>
      
      <div className="payments-list">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Parent</th>
              <th>Child</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Payment Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map(payment => (
              <tr key={payment.id}>
                <td>{payment.invoiceNumber}</td>
                <td>{payment.parentName}</td>
                <td>{payment.childName}</td>
                <td>${payment.amount.toFixed(2)}</td>
                <td>{new Date(payment.date).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${payment.status.toLowerCase()}`}>
                    {payment.status}
                  </span>
                </td>
                <td>{payment.paymentMethod}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="view-btn"
                      onClick={() => viewInvoiceOrReceipt(payment, payment.status === 'Paid' ? 'receipt' : 'invoice')}
                    >
                      {payment.status === 'Paid' ? 'Receipt' : 'Invoice'}
                    </button>
                    
                    {payment.status === 'Pending' && (
                      <button 
                        className="mark-paid-btn"
                        onClick={() => handlePaymentStatusUpdate(payment.id, 'Paid')}
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Invoice/Receipt Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {modalType === 'invoice' 
                  ? (selectedPayment ? 'Invoice Details' : 'Create New Invoice') 
                  : 'Payment Receipt'}
              </h2>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            
            {modalType === 'invoice' && !selectedPayment ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="parentName">Parent Name</label>
                  <input
                    type="text"
                    id="parentName"
                    name="parentName"
                    value={newInvoice.parentName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="childName">Child Name</label>
                  <input
                    type="text"
                    id="childName"
                    name="childName"
                    value={newInvoice.childName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="amount">Amount ($)</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    min="0"
                    step="0.01"
                    value={newInvoice.amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="dueDate">Due Date</label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={newInvoice.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={newInvoice.description}
                    onChange={handleInputChange}
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-btn">Create Invoice</button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="document-view">
                <div className="document-header">
                  <div className="document-logo">
                    <h2>Daycare Management</h2>
                  </div>
                  <div className="document-info">
                    <p><strong>{modalType === 'invoice' ? 'INVOICE' : 'RECEIPT'}</strong></p>
                    <p><strong>{selectedPayment.invoiceNumber}</strong></p>
                    <p>Date: {new Date(selectedPayment.date).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="document-parties">
                  <div className="from-section">
                    <p><strong>From:</strong></p>
                    <p>Daycare Management Center</p>
                    <p>123 Daycare Street</p>
                    <p>Anytown, CA 12345</p>
                    <p>info@daycaremanagement.com</p>
                  </div>
                  
                  <div className="to-section">
                    <p><strong>To:</strong></p>
                    <p>{selectedPayment.parentName}</p>
                    <p>Child: {selectedPayment.childName}</p>
                  </div>
                </div>
                
                <div className="document-details">
                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Monthly Daycare Services</td>
                        <td>${selectedPayment.amount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td><strong>Total</strong></td>
                        <td><strong>${selectedPayment.amount.toFixed(2)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div className="document-footer">
                  <p>Thank you for your business!</p>
                  {modalType === 'invoice' ? (
                    <p>Please make payment by {new Date(selectedPayment.date).toLocaleDateString()}</p>
                  ) : (
                    <p>Payment received via {selectedPayment.paymentMethod} on {new Date(selectedPayment.date).toLocaleDateString()}</p>
                  )}
                </div>
                
                <div className="document-actions">
                  <button className="print-btn">Print</button>
                  <button className="email-btn">Email to Parent</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;