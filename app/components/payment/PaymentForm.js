'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function PaymentForm({ amount, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '10px 12px',
      },
      invalid: {
        color: '#dc3545',
        iconColor: '#dc3545'
      }
    },
    hidePostalCode: true
  };

  const handleCardChange = (event) => {
    setPaymentError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  const validateForm = () => {
    if (!stripe || !elements) {
      setPaymentError('Stripe has not been initialized yet. Please try again.');
      return false;
    }

    if (!cardComplete) {
      setPaymentError('Please complete your card information.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Create payment intent on the server
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'usd',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred while processing your payment.');
      }

      const { clientSecret } = data;

      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      } else {
        throw new Error('Payment was not successful. Please try again.');
      }
    } catch (err) {
      setPaymentError(err.message);
      onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="form-row">
        <label htmlFor="card-element">Credit or debit card</label>
        <div className={`card-element-container ${paymentError ? 'has-error' : ''}`}>
          <CardElement
            id="card-element"
            options={cardElementOptions}
            onChange={handleCardChange}
          />
        </div>
      </div>

      {paymentError && (
        <div className="error-message" role="alert">
          {paymentError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing || !cardComplete}
        className="submit-payment-btn"
      >
        <span className="button-text">
          {isProcessing ? (
            <>
              <span className="spinner" aria-hidden="true"></span>
              <span className="visually-hidden">Processing...</span>
            </>
          ) : (
            `Pay $${(amount || 0).toFixed(2)}`
          )}
        </span>
      </button>
    </form>
  );
} 