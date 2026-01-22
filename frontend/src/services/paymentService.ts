/**
 * Payment Service for processing payments
 * Supports Stripe, PayPal, and other payment gateways
 */

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  receipt?: string;
}

class PaymentService {
  private stripe: any = null;

  /**
   * Initialize payment service
   */
  async initialize(stripePublishableKey: string) {
    // Load Stripe.js
    if (typeof window !== 'undefined' && !(window as any).Stripe) {
      await this.loadStripeScript();
    }

    if ((window as any).Stripe) {
      this.stripe = (window as any).Stripe(stripePublishableKey);
      console.log('[Payment] Stripe initialized');
    }
  }

  /**
   * Load Stripe script dynamically
   */
  private loadStripeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe'));
      document.head.appendChild(script);
    });
  }

  /**
   * Process payment with Stripe
   */
  async processPayment(
    amount: number,
    currency: string = 'USD',
    description?: string,
    metadata?: Record<string, any>
  ): Promise<PaymentResult> {
    try {
      // Create payment intent on backend
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          description,
          metadata,
        }),
      });

      const { clientSecret, paymentIntentId } = await response.json();

      // Confirm payment with Stripe
      const result = await this.stripe.confirmCardPayment(clientSecret);

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        };
      }

      return {
        success: true,
        paymentId: paymentIntentId,
        receipt: result.paymentIntent.receipt_url,
      };
    } catch (error: any) {
      console.error('[Payment] Error processing payment:', error);
      return {
        success: false,
        error: error.message || 'Payment processing failed',
      };
    }
  }

  /**
   * Process payment for registration fee
   */
  async processRegistrationPayment(
    registrationId: string,
    amount: number
  ): Promise<PaymentResult> {
    return this.processPayment(amount, 'USD', 'Vehicle Registration Fee', {
      type: 'registration',
      registrationId,
    });
  }

  /**
   * Process payment for title transfer fee
   */
  async processTitleTransferPayment(
    transferId: string,
    amount: number
  ): Promise<PaymentResult> {
    return this.processPayment(amount, 'USD', 'Title Transfer Fee', {
      type: 'title_transfer',
      transferId,
    });
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(cardElement: any): Promise<{ success: boolean; paymentMethodId?: string; error?: string }> {
    try {
      const { paymentMethod, error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Save payment method to backend
      const response = await fetch('/api/payments/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save payment method');
      }

      return {
        success: true,
        paymentMethodId: paymentMethod.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add payment method',
      };
    }
  }

  /**
   * Get saved payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await fetch('/api/payments/payment-methods', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      return data.paymentMethods || [];
    } catch (error) {
      console.error('[Payment] Error fetching payment methods:', error);
      return [];
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/payments/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('[Payment] Error deleting payment method:', error);
      return false;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<PaymentIntent[]> {
    try {
      const response = await fetch('/api/payments/history', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      return data.payments || [];
    } catch (error) {
      console.error('[Payment] Error fetching payment history:', error);
      return [];
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          paymentId,
          amount: amount ? Math.round(amount * 100) : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.error };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Refund failed',
      };
    }
  }

  /**
   * Calculate fees for registration
   */
  calculateRegistrationFees(registrationType: 'new' | 'renewal', vehicleType: string): number {
    const baseFees: Record<string, number> = {
      new: 150,
      renewal: 75,
    };

    const vehicleFees: Record<string, number> = {
      car: 0,
      truck: 25,
      motorcycle: -25,
      commercial: 100,
    };

    const baseFee = baseFees[registrationType] || 100;
    const vehicleFee = vehicleFees[vehicleType] || 0;

    return baseFee + vehicleFee;
  }

  /**
   * Calculate fees for title transfer
   */
  calculateTitleTransferFees(transferType: 'standard' | 'out_of_state' | 'family'): number {
    const fees: Record<string, number> = {
      standard: 50,
      out_of_state: 100,
      family: 25,
    };

    return fees[transferType] || 50;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
