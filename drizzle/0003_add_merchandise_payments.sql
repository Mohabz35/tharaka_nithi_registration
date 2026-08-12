-- Create enum types
CREATE TYPE "public"."planStatus" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."installmentStatus" AS ENUM('pending', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."orderStatus" AS ENUM('pending', 'paid', 'cancelled');--> statement-breakpoint

-- Merchandise items table
CREATE TABLE "merchandise_items" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"category" varchar(100) NOT NULL,
	"imageUrl" text,
	"imageKey" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Merchandise orders table
CREATE TABLE "merchandise_orders" (
	"id" serial PRIMARY KEY,
	"userId" integer,
	"registrationId" integer,
	"fullName" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phoneNumber" varchar(20) NOT NULL,
	"totalAmount" integer NOT NULL,
	"status" "orderStatus" DEFAULT 'pending' NOT NULL,
	"paymentMethod" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merchandise_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON UPDATE no action ON DELETE no action,
	CONSTRAINT "merchandise_orders_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "public"."registrations"("id") ON UPDATE no action ON DELETE no action
);

-- Order items table
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"merchandiseId" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unitPrice" integer NOT NULL,
	"totalPrice" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."merchandise_orders"("id") ON UPDATE no action ON DELETE no action,
	CONSTRAINT "order_items_merchandiseId_fkey" FOREIGN KEY ("merchandiseId") REFERENCES "public"."merchandise_items"("id") ON UPDATE no action ON DELETE no action
);

-- Payment plans table (for installments)
CREATE TABLE "payment_plans" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"userId" integer,
	"totalAmount" integer NOT NULL,
	"numberOfInstallments" integer NOT NULL,
	"installmentAmount" integer NOT NULL,
	"status" "planStatus" DEFAULT 'active' NOT NULL,
	"startDate" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_plans_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."merchandise_orders"("id") ON UPDATE no action ON DELETE no action,
	CONSTRAINT "payment_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON UPDATE no action ON DELETE no action
);

-- Installment payments table
CREATE TABLE "installment_payments" (
	"id" serial PRIMARY KEY,
	"paymentPlanId" integer NOT NULL,
	"installmentNumber" integer NOT NULL,
	"amountDue" integer NOT NULL,
	"amountPaid" integer DEFAULT 0 NOT NULL,
	"dueDate" timestamp NOT NULL,
	"paymentDate" timestamp,
	"paymentMethod" varchar(50),
	"transactionId" varchar(255),
	"status" "installmentStatus" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "installment_payments_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "public"."payment_plans"("id") ON UPDATE no action ON DELETE no action
);

-- Payment transactions table
CREATE TABLE "payment_transactions" (
	"id" serial PRIMARY KEY,
	"orderId" integer,
	"installmentId" integer,
	"transactionId" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"paymentMethod" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."merchandise_orders"("id") ON UPDATE no action ON DELETE no action,
	CONSTRAINT "payment_transactions_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "public"."installment_payments"("id") ON UPDATE no action ON DELETE no action,
	CONSTRAINT "payment_transactions_transactionId_unique" UNIQUE("transactionId")
);

-- Seed merchandise items
INSERT INTO "merchandise_items" ("name", "description", "price", "category", "isActive") VALUES
('Bootcamp Registration', 'Access to the full bootcamp training program', 3000, 'bootcamp', true),
('Event T-Shirt', 'Official Mr & Miss Face of Tharaka-Nithi 2026 T-Shirt', 1000, 'apparel', true),
('Hoodie', 'Premium event hoodie with official branding', 2000, 'apparel', true),
('Kofia (Cap)', 'Official event cap', 500, 'accessories', true),
('Reflector Vest', 'Event reflector vest for visibility', 300, 'accessories', true);
