import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc.js";
import { TRPCError } from "@trpc/server";
import {
  getAllMerchandiseItems,
  getMerchandiseItemById,
  createMerchandiseOrder,
  getMerchandiseOrderById,
  getOrderItemsByOrderId,
  createOrderItems,
  createPaymentPlan,
  getPaymentPlanByOrderId,
  createInstallmentPayments,
  updateOrderStatus,
  updateInstallmentPayment,
  updatePaymentPlanStatus,
  createPaymentTransaction,
  getTransactionByTransactionId,
  getOrdersByUserId,
  getPaymentPlansByUserId,
  getInstallmentsByPaymentPlanId,
  getUpcomingInstallments,
  getOrdersByEmail,
  getAllOrders,
  getAllPaymentPlans,
  getAllOverdueInstallments,
} from "./db.js";
import { sendEmail, buildPaymentConfirmationEmail, buildInstallmentReminderEmail } from "./_core/emailService.js";

export const merchandiseRouter = router({
  // Get all active merchandise items
  getItems: publicProcedure.query(async () => {
    try {
      return await getAllMerchandiseItems();
    } catch (error) {
      console.error("Failed to fetch merchandise items:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch items" });
    }
  }),

  // Get single merchandise item
  getItem: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const item = await getMerchandiseItemById(input.id);
        if (!item) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
        }
        return item;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch item" });
      }
    }),

  // Create a new order (with optional payment plan)
  createOrder: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(1, "Full name is required"),
        email: z.string().email("Invalid email"),
        phoneNumber: z.string().min(9, "Phone number is required"),
        registrationId: z.number().optional(),
        items: z.array(z.object({
          merchandiseId: z.number(),
          quantity: z.number().min(1),
        })).min(1, "At least one item is required"),
        numberOfInstallments: z.number().min(1).max(12).optional(), // 1 = pay in full
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate items and calculate total
        let totalAmount = 0;
        const orderItems: any[] = [];

        for (const item of input.items) {
          const merchandise = await getMerchandiseItemById(item.merchandiseId);
          if (!merchandise) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Item ${item.merchandiseId} not found` });
          }
          if (!merchandise.isActive) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `${merchandise.name} is not available` });
          }
          
          const itemTotal = merchandise.price * item.quantity;
          totalAmount += itemTotal;
          
          orderItems.push({
            merchandiseId: item.merchandiseId,
            quantity: item.quantity,
            unitPrice: merchandise.price,
            totalPrice: itemTotal,
          });
        }

        // Create order
        const orderId = await createMerchandiseOrder({
          fullName: input.fullName,
          email: input.email,
          phoneNumber: input.phoneNumber,
          registrationId: input.registrationId || null,
          totalAmount,
          status: "pending",
        });

        // Create order items
        await createOrderItems(orderItems.map(item => ({
          orderId,
          ...item,
        })));

        // Create payment plan if installments requested
        let paymentPlanId = null;
        let installmentAmount = totalAmount;
        let numberOfInstallments = 1;

        if (input.numberOfInstallments && input.numberOfInstallments > 1) {
          numberOfInstallments = input.numberOfInstallments;
          installmentAmount = Math.ceil(totalAmount / numberOfInstallments);
          
          paymentPlanId = await createPaymentPlan({
            orderId,
            userId: null, // Will be linked when user logs in
            totalAmount,
            numberOfInstallments,
            installmentAmount,
            status: "active",
            startDate: new Date(),
          });

          // Create installment schedule
          const installments = [];
          const startDate = new Date();
          
          for (let i = 1; i <= numberOfInstallments; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            
            installments.push({
              paymentPlanId,
              installmentNumber: i,
              amountDue: installmentAmount,
              amountPaid: 0,
              dueDate,
              status: "pending" as const,
            });
          }
          
          await createInstallmentPayments(installments);
        }

        return {
          success: true,
          orderId,
          paymentPlanId,
          totalAmount,
          installmentAmount,
          numberOfInstallments,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to create order:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create order" });
      }
    }),

  // Get order details
  getOrder: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      try {
        const order = await getMerchandiseOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        
        const items = await getOrderItemsByOrderId(input.orderId);
        const paymentPlan = await getPaymentPlanByOrderId(input.orderId);
        
        let installments: any[] = [];
        if (paymentPlan) {
          installments = await getInstallmentsByPaymentPlanId(paymentPlan.id);
        }

        return {
          order,
          items,
          paymentPlan,
          installments,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch order" });
      }
    }),

  // Get user's orders (by email)
  getMyOrders: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      try {
        const orders = await getOrdersByEmail(input.email);
        return orders;
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch orders" });
      }
    }),

  // Process payment (called after IntaSend webhook confirmation)
  processPayment: publicProcedure
    .input(
      z.object({
        transactionId: z.string(),
        orderId: z.number().optional(),
        installmentId: z.number().optional(),
        amount: z.number().positive(),
        paymentMethod: z.string(),
        status: z.enum(["success", "failed", "pending"]),
        metadata: z.string().optional(), // JSON string
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Create transaction record
        const transactionId = await createPaymentTransaction({
          orderId: input.orderId || null,
          installmentId: input.installmentId || null,
          transactionId: input.transactionId,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          status: input.status,
          metadata: input.metadata || null,
        });

        if (input.status === "success") {
          // Update order status if provided
          if (input.orderId) {
            await updateOrderStatus(input.orderId, "paid", input.paymentMethod);
          }

          // Update installment if provided
          if (input.installmentId) {
            const installment = await getInstallmentsByPaymentPlanId(input.installmentId);
            if (installment && installment.length > 0) {
              await updateInstallmentPayment(input.installmentId, {
                amountPaid: input.amount,
                paymentDate: new Date(),
                paymentMethod: input.paymentMethod,
                transactionId: input.transactionId,
                status: "paid",
              });

              // Check if all installments are paid
              const plan = await getPaymentPlanByOrderId(input.orderId || 0);
              if (plan) {
                const allInstallments = await getInstallmentsByPaymentPlanId(plan.id);
                const allPaid = allInstallments.every(i => i.status === "paid");
                if (allPaid) {
                  await updatePaymentPlanStatus(plan.id, "completed");
                  await updateOrderStatus(plan.orderId, "paid", input.paymentMethod);
                }
              }
            }
          }

          // Send confirmation email
          try {
            const emailContent = buildPaymentConfirmationEmail(
              input.amount,
              input.transactionId,
              input.paymentMethod
            );
            // Would need to get user email from order
          } catch (emailError) {
            console.error("Failed to send payment confirmation email:", emailError);
          }
        }

        return { success: true, transactionId };
      } catch (error) {
        console.error("Failed to process payment:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to process payment" });
      }
    }),

  // Check order payment status
  checkPaymentStatus: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      try {
        const order = await getMerchandiseOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        const paymentPlan = await getPaymentPlanByOrderId(input.orderId);
        let installments: any[] = [];
        
        if (paymentPlan) {
          installments = await getInstallmentsByPaymentPlanId(paymentPlan.id);
        }

        return {
          orderStatus: order.status,
          paymentPlan: paymentPlan ? {
            status: paymentPlan.status,
            totalAmount: paymentPlan.totalAmount,
            numberOfInstallments: paymentPlan.numberOfInstallments,
            installmentAmount: paymentPlan.installmentAmount,
          } : null,
          installments: installments.map(i => ({
            installmentNumber: i.installmentNumber,
            amountDue: i.amountDue,
            amountPaid: i.amountPaid,
            dueDate: i.dueDate,
            status: i.status,
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to check payment status" });
      }
    }),

  // ============ Admin Procedures ============
  admin: router({
    // Get all orders
    getAllOrders: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getAllOrders();
    }),

    // Get all payment plans
    getAllPaymentPlans: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getAllPaymentPlans();
    }),

    // Get overdue installments
    getOverdueInstallments: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getAllOverdueInstallments();
    }),

    // Update order status manually
    updateOrderStatus: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum(["pending", "paid", "cancelled"]),
          paymentMethod: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        await updateOrderStatus(input.orderId, input.status, input.paymentMethod);
        return { success: true };
      }),

    // Update installment status manually
    updateInstallmentStatus: protectedProcedure
      .input(
        z.object({
          installmentId: z.number(),
          status: z.enum(["pending", "paid", "overdue", "cancelled"]),
          amountPaid: z.number().optional(),
          paymentMethod: z.string().optional(),
          transactionId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        
        await updateInstallmentPayment(input.installmentId, {
          status: input.status,
          amountPaid: input.amountPaid,
          paymentDate: input.status === "paid" ? new Date() : undefined,
          paymentMethod: input.paymentMethod,
          transactionId: input.transactionId,
        });

        return { success: true };
      }),

    // Get payment stats
    getPaymentStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      
      const orders = await getAllOrders();
      const plans = await getAllPaymentPlans();
      const overdue = await getAllOverdueInstallments();

      const totalRevenue = orders
        .filter(o => o.status === "paid")
        .reduce((sum, o) => sum + o.totalAmount, 0);

      const pendingPayments = orders
        .filter(o => o.status === "pending")
        .reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        totalOrders: orders.length,
        paidOrders: orders.filter(o => o.status === "paid").length,
        pendingOrders: orders.filter(o => o.status === "pending").length,
        cancelledOrders: orders.filter(o => o.status === "cancelled").length,
        totalRevenue,
        pendingPayments,
        activePlans: plans.filter(p => p.status === "active").length,
        completedPlans: plans.filter(p => p.status === "completed").length,
        overdueInstallments: overdue.length,
      };
    }),

    // Seed merchandise items
    seedMerchandise: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      
      const { createMerchandiseItem, getAllMerchandiseItems } = await import("./db.js");
      
      // Check if items already exist
      const existing = await getAllMerchandiseItems();
      if (existing.length > 0) {
        return { success: true, message: "Merchandise items already exist", count: existing.length };
      }

      const items = [
        { name: "Bootcamp Registration", description: "Access to the full bootcamp training program", price: 3000, category: "bootcamp", isActive: true },
        { name: "Event T-Shirt", description: "Official Mr & Miss Face of Tharaka-Nithi 2026 T-Shirt", price: 1000, category: "apparel", isActive: true },
        { name: "Hoodie", description: "Premium event hoodie with official branding", price: 2000, category: "apparel", isActive: true },
        { name: "Kofia (Cap)", description: "Official event cap", price: 500, category: "accessories", isActive: true },
        { name: "Reflector Vest", description: "Event reflector vest for visibility", price: 300, category: "accessories", isActive: true },
      ];

      for (const item of items) {
        await createMerchandiseItem(item);
      }

      return { success: true, message: "Merchandise items seeded successfully", count: items.length };
    }),

    // Create merchandise item
    createMerchandiseItem: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        price: z.number().min(1, "Price must be at least 1"),
        category: z.string().min(1, "Category is required"),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const { createMerchandiseItem } = await import("./db.js");
        const id = await createMerchandiseItem(input);
        return { success: true, id };
      }),

    // Update merchandise item
    updateMerchandiseItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        category: z.string().optional(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const { updateMerchandiseItem } = await import("./db.js");
        const { id, ...data } = input;
        await updateMerchandiseItem(id, data);
        return { success: true };
      }),

    // Delete merchandise item
    deleteMerchandiseItem: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const { getDb } = await import("./db.js");
        const { merchandise_items } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await db.delete(merchandise_items).where(eq(merchandise_items.id, input));
        return { success: true };
      }),
  }),
});

export type MerchandiseRouter = typeof merchandiseRouter;
