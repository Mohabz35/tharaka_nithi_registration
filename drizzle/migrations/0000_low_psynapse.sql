CREATE TYPE "public"."artist_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('adults', 'teens', 'little_stars');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"artist_type" varchar(255) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"email" varchar(320) NOT NULL,
	"portfolio_url" text,
	"description" text,
	"status" "artist_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_url" text NOT NULL,
	"logo_key" text,
	"website_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"date_of_birth" varchar(10) NOT NULL,
	"age" integer NOT NULL,
	"category" "category" NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"email" varchar(320) NOT NULL,
	"county_sub_location" varchar(255) NOT NULL,
	"photo_url" text,
	"photo_key" text,
	"portfolio_url" text,
	"portfolio_key" text,
	"talents" text,
	"poster_url" text,
	"poster_key" text,
	"consent_photo_video" boolean DEFAULT false NOT NULL,
	"consent_data_processing" boolean DEFAULT false NOT NULL,
	"consent_terms" boolean DEFAULT false NOT NULL,
	"parental_consent_signed" boolean DEFAULT false,
	"parental_consent_url" text,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"registration_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"login_method" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
