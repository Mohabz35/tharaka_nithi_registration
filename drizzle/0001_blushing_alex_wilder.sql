CREATE TYPE "public"."sponsorType" AS ENUM('sponsor', 'partner');--> statement-breakpoint
CREATE TABLE "artist_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"fullName" varchar(255) NOT NULL,
	"stageName" varchar(255),
	"email" varchar(320) NOT NULL,
	"phoneNumber" varchar(20) NOT NULL,
	"artType" varchar(255) NOT NULL,
	"socialMediaHandles" text,
	"message" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_sponsors" (
	"id" serial PRIMARY KEY NOT NULL,
	"fullName" varchar(255) NOT NULL,
	"organizationName" varchar(255),
	"email" varchar(320) NOT NULL,
	"phoneNumber" varchar(20) NOT NULL,
	"sponsorType" "sponsorType" NOT NULL,
	"message" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showcase_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"fullName" varchar(255) NOT NULL,
	"businessName" varchar(255),
	"email" varchar(320) NOT NULL,
	"phoneNumber" varchar(20) NOT NULL,
	"showcaseType" varchar(255) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "socialMediaHandles" text;