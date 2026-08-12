import { ENV } from "./env.js";

const INTASEND_BASE_URL = ENV.intasendTestMode
  ? "https://sandbox.intasend.com/api/v1"
  : "https://api.intasend.com/api/v1";

interface IntaSendPaymentRequest {
  amount: number;
  currency: string;
  email: string;
  phone_number?: string;
  narration?: string;
  metadata?: Record<string, string>;
}

interface IntaSendPaymentResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  payment_link?: string;
  created_at: string;
}

interface IntaSendTokenResponse {
  token: string;
}

async function getIntaSendToken(): Promise<string> {
  const response = await fetch(`${INTASEND_BASE_URL}/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      public_key: ENV.intasendPublishableKey,
      secret_key: ENV.intasendSecretKey,
    }),
  });

  if (!response.ok) {
    throw new Error(`IntaSend auth failed: ${response.status}`);
  }

  const data: IntaSendTokenResponse = await response.json();
  return data.token;
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
    const token = await getIntaSendToken();

    const metadata: Record<string, string> = {
      orderId: params.orderId.toString(),
    };
    if (params.installmentId) {
      metadata.installmentId = params.installmentId.toString();
    }

    const body: IntaSendPaymentRequest = {
      amount: params.amount,
      currency: "KES",
      email: params.email,
      narration: params.narration || `Payment for Order #${params.orderId}`,
      metadata,
    };

    if (params.phone) {
      body.phone_number = params.phone;
    }

    const response = await fetch(`${INTASEND_BASE_URL}/payment/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[IntaSend] Payment creation failed:", error);
      return { success: false, error: error.message || "Payment creation failed" };
    }

    const data: IntaSendPaymentResponse = await response.json();
    return {
      success: true,
      paymentId: data.id,
      paymentLink: data.payment_link,
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
    const token = await getIntaSendToken();

    const response = await fetch(`${INTASEND_BASE_URL}/payment/${paymentId}/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[IntaSend] Status check failed:", error);
    return null;
  }
}
