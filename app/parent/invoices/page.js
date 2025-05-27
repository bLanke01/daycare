'use client';

import { withAuth } from '../../utils/with-auth';
import InvoiceView from '../../components/parent/InvoiceView';

function ParentInvoicesPage() {
  return (
    <div className="parent-invoices-page">
      <InvoiceView />
    </div>
  );
}

export default withAuth(ParentInvoicesPage, 'parent'); 