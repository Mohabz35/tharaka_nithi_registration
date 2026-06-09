CREATE TYPE "public"."category" AS ENUM('adults', 'teens', 'little_stars');--> statement-breakpoint
CREATE TYPE "public"."paymentStatus" AS ENUM('pending', 'completed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "partner_logos" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"logoUrl" text NOT NULL,
	"logoKey" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"fullName" varchar(255) NOT NULL,
	"dateOfBirth" varchar(10) NOT NULL,
	"age" integer NOT NULL,
	"category" "category" NOT NULL,
	"phoneNumber" varchar(20) NOT NULL,
	"email" varchar(320) NOT NULL,
	"countySubLocation" varchar(255) NOT NULL,
	"photoUrl" text,
	"photoKey" text,
	"portfolioUrl" text,
	"portfolioKey" text,
	"talents" text,
	"posterUrl" text,
	"posterKey" text,
	"consentPhotoVideo" boolean DEFAULT false NOT NULL,
	"consentDataProcessing" boolean DEFAULT false NOT NULL,
	"consentTerms" boolean DEFAULT false NOT NULL,
	"parentalConsentSigned" boolean DEFAULT false,
	"parentalConsentUrl" text,
	"paymentStatus" "paymentStatus" DEFAULT 'pending' NOT NULL,
	"registrationDate" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(320) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
