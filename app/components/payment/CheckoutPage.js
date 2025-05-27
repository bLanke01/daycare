'use client';

import { useState } from 'react';
import PaymentProvider from './PaymentProvider';
import PaymentForm from './PaymentForm';

export default function CheckoutPage() {
  const [paymentStatus, setPaymentStatus] = useState({
    success: false,
    error: null,
  });

  const handlePaymentSuccess = (paymentIntent) => {
    setPaymentStatus({
      success: true,
      error: null,
    });
    // Here you can update your database or perform other actions
    console.log('Payment successful:', paymentIntent);
  };

  const handlePaymentError = (error) => {
    setPaymentStatus({
      success: false,
      error: error.message,
    });
  };

  if (paymentStatus.success) {
    return (
      <div className="payment-success-modal">
        <h2>Payment Successful!</h2>
        <p>Thank you for your payment. A receipt has been sent to your email.</p>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h1>Complete Your Payment</h1>
      <PaymentProvider>
        <PaymentForm
          amount={99.99} // Replace with your actual amount
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </PaymentProvider>
    </div>
  );
} 