import { ENV } from "./env.js";

const INTASEND_BASE_URL = ENV.intasendTestMode
  ? "https://sandbox.intasend.com/api/v1"
  : "https://api.intasend.com/api/v1";

interface IntaSendCheckoutResponse {
  id: string;
  url: string;
  paid: boolean;
  amount: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export async function createIntaSendPayment(params: {
  amount: number;
  email: string;
  phone?: string;
  orderId: number;
  installmentId?: number;
  narration?: string;
}): Promise<{
  success: boolean;
  paymentId?: string;
  paymentLink?: string;
  error?: string;
}> {
  try {
    const apiRef = params.installmentId
      ? `order-${params.orderId}-installment-${params.installmentId}`
      : `order-${params.orderId}`;

    const body: Record<string, any> = {
      public_key: ENV.intasendPublishableKey,
      amount: params.amount,
      currency: "KES",
      email: params.email,
      api_ref: apiRef,
      comment: params.narration || `Payment for Order #${params.orderId}`,
    };

    if (params.phone) {
      body.phone_number = params.phone;
    }

    const response = await fetch(`${INTASEND_BASE_URL}/checkout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const rawData = await response.json();
    console.log("[IntaSend] Checkout response:", JSON.stringify(rawData));

    if (!response.ok) {
      console.error("[IntaSend] Checkout creation failed:", rawData);
      return { success: false, error: rawData.message || rawData.detail || "Payment creation failed" };
    }

    return {
      success: true,
      paymentId: rawData.id,
      paymentLink: rawData.url,
    };
  } catch (error) {
    console.error("[IntaSend] Error:", error);
    return { success: false, error: "Failed to initialize payment" };
  }
}

export async function getIntaSendPaymentStatus(paymentId: string): Promise<{
  status: string;
  amount: number;
  metadata?: Record<string, string>;
} | null> {
  try {
    const response = await fetch(`${INTASEND_BASE_URL}/checkout/${paymentId}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      status: data.paid ? "completed" : "pending",
      amount: parseFloat(data.amount),
    };
  } catch (error) {
    console.error("[IntaSend] Status check failed:", error);
    return null;
  }
}
