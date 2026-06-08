# Deployment Guide

This guide will help you set up Supabase and deploy the project to Vercel.

## 1. Supabase Setup (Database)

1.  **Create a Project**: Go to [supabase.com](https://supabase.com/) and create a new project.
2.  **Get Connection String**:
    *   Navigate to **Project Settings** > **Database**.
    *   Find the **Connection string** section.
    *   Copy the **URI** (make sure to replace `[YOUR-PASSWORD]` with your actual database password).
    *   You will need this for the `DATABASE_URL` environment variable.
3.  **Run SQL Script**:
    *   Go to the **SQL Editor** in the Supabase dashboard.
    *   Click **New query**.
    *   Paste the content of `vercel_output/supabase.sql` into the editor.
    *   Click **Run**. This will create all necessary tables and enums.

## 2. Vercel Deployment

1.  **Connect Repo**: Import your GitHub repository to Vercel.
2.  **Enable Corepack**: In the Vercel project settings, ensure you have enabled Corepack or set the `ENABLE_VC_COREPACK=1` environment variable to support pnpm 10.
2.  **Environment Variables**: In the Vercel dashboard, add the following variables:
    *   `DATABASE_URL`: The URI you copied from Supabase.
    *   `JWT_SECRET`: A random strong string for session signing.
    *   `OAUTH_SERVER_URL`: Your Manus OAuth server URL.
    *   `BUILT_IN_FORGE_API_URL`: Your Manus Forge API URL.
    *   `BUILT_IN_FORGE_API_KEY`: Your Manus Forge API Key.
3.  **Build Settings**:
    *   **Build Command**: `pnpm vercel-build`
    *   **Output Directory**: `dist/public`
    *   **Install Command**: `pnpm install`

## 3. SEO Verification

The site is already configured with:
*   **Meta Tags**: Title, Description, Keywords.
*   **Open Graph**: Optimized for Facebook/WhatsApp sharing.
*   **Structured Data**: JSON-LD for Google Event indexing.
*   **Robots.txt**: Guided crawling.

## 4. Troubleshooting

*   **Images not showing?**: Ensure you use direct image links (ending in .jpg, .png) from PostImages.
*   **Database errors?**: Double check your `DATABASE_URL` and ensure you ran the `supabase.sql` script.
