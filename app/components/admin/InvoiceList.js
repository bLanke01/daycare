'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const q = query(collection(db, 'invoices'), orderBy(sortField, sortDirection));
      const snapshot = await getDocs(q);
      
      const invoiceList = [];
      snapshot.forEach(doc => {
        invoiceList.push({ id: doc.id, ...doc.data() });
      });
      
      setInvoices(invoiceList);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesSearch = 
      invoice.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'badge badge-success';
      case 'pending':
        return 'badge badge-warning';
      case 'overdue':
        return 'badge badge-error';
      default:
        return 'badge';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="form-control w-full sm:w-auto">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search invoices..."
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
                <button 
                  className="flex items-center gap-2"
                  onClick={() => handleSort('invoiceNumber')}
                >
                  Invoice #
                  {sortField === 'invoiceNumber' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th>
                <button 
                  className="flex items-center gap-2"
                  onClick={() => handleSort('parentName')}
                >
                  Parent
                  {sortField === 'parentName' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th>
                <button 
                  className="flex items-center gap-2"
                  onClick={() => handleSort('amount')}
                >
                  Amount
                  {sortField === 'amount' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th>
                <button 
                  className="flex items-center gap-2"
                  onClick={() => handleSort('dueDate')}
                >
                  Due Date
                  {sortField === 'dueDate' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.parentName}</td>
                <td>{formatCurrency(invoice.amount)}</td>
                <td>{formatDate(invoice.dueDate)}</td>
                <td>
                  <span className={getStatusBadgeClass(invoice.status)}>
                    {invoice.status}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-primary">View</button>
                    <button className="btn btn-sm btn-ghost">Edit</button>
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-sm btn-ghost">
                        •••
                      </label>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li><a>Download PDF</a></li>
                        <li><a>Send Reminder</a></li>
                        <li><a>Mark as Paid</a></li>
                      </ul>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-8">
          <h3 className="font-semibold mb-2">No invoices found</h3>
          <p className="text-base-content/70">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default InvoiceList; 