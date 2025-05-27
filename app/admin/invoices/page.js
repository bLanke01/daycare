'use client';

import { useState } from 'react';
import { withAuth } from '../../utils/with-auth';
import InvoiceForm from '../../components/admin/InvoiceForm';
import InvoiceList from '../../components/admin/InvoiceList';

function AdminInvoicesPage() {
  const [showForm, setShowForm] = useState(false);

  const handleInvoiceCreated = () => {
    setShowForm(false);
  };

  return (
    <div className="admin-invoices-page">
      {showForm ? (
        <div>
          <button 
            className="back-btn"
            onClick={() => setShowForm(false)}
          >
            ← Back to List
          </button>
          <InvoiceForm onSuccess={handleInvoiceCreated} />
        </div>
      ) : (
        <div>
          <div className="page-header">
            <h1>Invoices</h1>
            <button 
              className="create-btn"
              onClick={() => setShowForm(true)}
            >
              Create Invoice
            </button>
          </div>
          <InvoiceList />
        </div>
      )}
    </div>
  );
}

export default withAuth(AdminInvoicesPage, 'admin'); 