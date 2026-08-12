import express from "express";
import { 
  getTransactionByTransactionId,
  createPaymentTransaction,
  updateOrderStatus,
  updateInstallmentPayment,
  updatePaymentPlanStatus,
  getMerchandiseOrderById,
  getPaymentPlanByOrderId,
  getInstallmentsByPaymentPlanId,
  getInstallmentById,
  getOrderItemsByOrderId,
  getMerchandiseItemById,
} from "./db.js";
import { sendEmail, buildPaymentConfirmationEmail, buildInstallmentReceiptEmail } from "./_core/emailService.js";

const router = express.Router();

// IntaSend webhook endpoint
router.post("/webhooks/intasend", async (req, res) => {
  try {
    const { 
      id: event_id,
      event, // "approval.completed" | "approval.failed"
      payload 
    } = req.body;

    console.log("[IntaSend Webhook] Received:", JSON.stringify(req.body, null, 2));

    // Verify the webhook signature (implement based on IntaSend docs)
    // const signature = req.headers['x-intasend-signature'];
    // if (!verifySignature(req.body, signature)) {
    //   console.error("[IntaSend Webhook] Invalid signature");
    //   return res.status(401).json({ error: "Invalid signature" });
    // }

    if (event === "approval.completed") {
      const {
        id: transaction_id,
        amount,
        currency,
        status,
        metadata
      } = payload;

      // Parse metadata to get orderId or installmentId
      let orderId = null;
      let installmentId = null;
      
      if (metadata) {
        try {
          const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
          orderId = metadataObj.orderId;
          installmentId = metadataObj.installmentId;
        } catch (e) {
          console.error("[IntaSend Webhook] Failed to parse metadata:", e);
        }
      }

      // Check if transaction already processed
      const existingTransaction = await getTransactionByTransactionId(transaction_id);
      if (existingTransaction) {
        console.log("[IntaSend Webhook] Transaction already processed:", transaction_id);
        return res.status(200).json({ received: true, message: "Already processed" });
      }

      const paymentAmount = Math.round(amount);

      // Record the transaction
      await createPaymentTransaction({
        orderId: orderId || null,
        installmentId: installmentId || null,
        transactionId: transaction_id,
        amount: paymentAmount,
        paymentMethod: "intasend",
        status: "success",
        metadata: JSON.stringify(payload),
      });

      // Get order details for email
      const order = orderId ? await getMerchandiseOrderById(orderId) : null;

      // Update order status if orderId is present
      if (orderId) {
        await updateOrderStatus(orderId, "paid", "intasend");
        console.log("[IntaSend Webhook] Updated order status:", orderId);
      }

      // Update installment if installmentId is present
      if (installmentId) {
        const installment = await getInstallmentById(installmentId);
        if (installment) {
          await updateInstallmentPayment(installmentId, {
            amountPaid: installment.amountPaid + paymentAmount,
            paymentDate: new Date(),
            paymentMethod: "intasend",
            transactionId: transaction_id,
            status: "paid",
          });

          // Check if all installments in the plan are now paid
          const plan = await getPaymentPlanByOrderId(orderId || 0);
          if (plan) {
            const allInstallments = await getInstallmentsByPaymentPlanId(plan.id);
            const allPaid = allInstallments.every(i => i.status === "paid");
            
            if (allPaid) {
              await updatePaymentPlanStatus(plan.id, "completed");
              await updateOrderStatus(plan.orderId, "paid", "intasend");
              console.log("[IntaSend Webhook] All installments paid, order completed:", plan.orderId);
            }
          }

          // Send installment receipt email
          try {
            if (order) {
              const plan = await getPaymentPlanByOrderId(orderId || 0);
              if (plan) {
                const allInstallments = await getInstallmentsByPaymentPlanId(plan.id);
                const paidCount = allInstallments.filter(i => i.status === "paid").length;
                const nextPending = allInstallments.find(i => i.status === "pending");
                const remaining = allInstallments
                  .filter(i => i.status === "pending")
                  .reduce((sum, i) => sum + (i.amountDue - i.amountPaid), 0);

                const emailContent = buildInstallmentReceiptEmail(
                  order.fullName,
                  orderId || 0,
                  installment.installmentNumber,
                  plan.numberOfInstallments,
                  paymentAmount,
                  remaining,
                  paidCount,
                  nextPending?.dueDate || new Date(),
                  order.registrationId ? `REG-${order.registrationId.toString().padStart(3, '0')}` : `ORDER-${orderId}`
                );
                await sendEmail({ to: order.email, ...emailContent });
                console.log("[IntaSend Webhook] Sent installment receipt to:", order.email);
              }
            }
          } catch (emailError) {
            console.error("[IntaSend Webhook] Failed to send installment receipt:", emailError);
          }

          console.log("[IntaSend Webhook] Updated installment:", installmentId);
        }
      } else if (order) {
        // Full payment — send full receipt
        try {
          const items = await getOrderItemsByOrderId(orderId || 0);
          const emailItems = [];
          for (const item of items) {
            const merch = await getMerchandiseItemById(item.merchandiseId);
            emailItems.push({
              name: merch?.name || `Item #${item.merchandiseId}`,
              quantity: item.quantity,
              price: item.unitPrice,
            });
          }

          const emailContent = buildPaymentConfirmationEmail(
            order.fullName,
            orderId || 0,
            emailItems,
            order.totalAmount,
            paymentAmount,
            transaction_id,
            order.registrationId ? `REG-${order.registrationId.toString().padStart(3, '0')}` : `ORDER-${orderId}`
          );
          await sendEmail({ to: order.email, ...emailContent });
          console.log("[IntaSend Webhook] Sent full payment receipt to:", order.email);
        } catch (emailError) {
          console.error("[IntaSend Webhook] Failed to send receipt:", emailError);
        }
      }

      console.log("[IntaSend Webhook] Payment processed successfully:", transaction_id);
      return res.status(200).json({ received: true, message: "Payment processed" });
    }

    if (event === "approval.failed") {
      console.log("[IntaSend Webhook] Payment failed:", payload);
      
      // Record failed transaction
      if (payload.id) {
        await createPaymentTransaction({
          orderId: null,
          installmentId: null,
          transactionId: payload.id,
          amount: Math.round(payload.amount * 100),
          paymentMethod: "intasend",
          status: "failed",
          metadata: JSON.stringify(payload),
        });
      }

      return res.status(200).json({ received: true, message: "Failure recorded" });
    }

    // Handle other events
    console.log("[IntaSend Webhook] Unhandled event:", event);
    return res.status(200).json({ received: true, message: "Event not handled" });

  } catch (error) {
    console.error("[IntaSend Webhook] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
