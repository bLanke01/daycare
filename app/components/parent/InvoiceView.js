'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../firebase/auth-context';

export default function InvoiceView() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
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
      // Sort invoices by date (most recent first)
      invoiceList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInvoices(invoiceList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Your Invoices</h2>
      
      {selectedInvoice ? (
        <div className="space-y-4">
          <button 
            className="btn btn-ghost"
            onClick={() => setSelectedInvoice(null)}
          >
            ← Back to List
          </button>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">Invoice #{selectedInvoice.invoiceNo}</h3>
                  <p className="text-sm opacity-70">Created: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm opacity-70">Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="badge badge-lg" data-status={selectedInvoice.status}>
                  {selectedInvoice.status}
                </div>
              </div>

              <div className="divider"></div>

              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Rate</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, index) => (
                      <tr key={index}>
                        <td>
                          {item.description}
                          {item.notes && <div className="text-sm opacity-70">{item.notes}</div>}
                        </td>
                        <td>{item.quantity || 1}</td>
                        <td>${(item.rate || 0).toFixed(2)}</td>
                        <td>${(item.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divider"></div>

              <div className="flex flex-col gap-2 items-end">
                <div className="text-right">
                  <span className="opacity-70">Sub Total: </span>
                  <span className="font-semibold">${(selectedInvoice.subTotal || 0).toFixed(2)}</span>
                </div>
                <div className="text-right text-lg font-bold">
                  <span>Total Amount: </span>
                  <span>${(selectedInvoice.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>

              {selectedInvoice.status === 'pending' && (
                <div className="alert alert-info mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-bold">Payment Instructions</h4>
                    <p>Please send payment via e-transfer to:</p>
                    <ul className="mt-2 space-y-1">
                      <li><strong>Email:</strong> {selectedInvoice.paymentEmail}</li>
                      <li><strong>Amount:</strong> ${(selectedInvoice.totalAmount || 0).toFixed(2)}</li>
                      <li><strong>Reference:</strong> Invoice #{selectedInvoice.invoiceNo}</li>
                    </ul>
                  </div>
                </div>
              )}

              {selectedInvoice.status === 'paid' && (
                <div className="alert alert-success mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-bold">Payment Received</h4>
                    <p>Date: {new Date(selectedInvoice.paidAt).toLocaleDateString()}</p>
                    <p>Thank you for your payment!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {invoices.length === 0 ? (
            <div className="alert">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>No invoices found.</span>
            </div>
          ) : (
            invoices.map((invoice) => (
              <div 
                key={invoice.id} 
                className="card bg-base-100 shadow-hover cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedInvoice(invoice)}
              >
                <div className="card-body">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="card-title">Invoice #{invoice.invoiceNo}</h3>
                      <p className="text-sm opacity-70">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold">
                        ${(invoice.totalAmount || 0).toFixed(2)}
                      </span>
                      <div className="badge badge-lg" data-status={invoice.status}>
                        {invoice.status}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
