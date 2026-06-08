# Models Call Out Event - Registration System TODO

## Database & Backend
- [x] Create registrations table schema in drizzle/schema.ts
- [x] Generate and apply database migration
- [x] Create registration query helpers in server/db.ts
- [x] Create tRPC procedures for registration submission
- [x] Create tRPC procedures for admin dashboard (list registrations by category, export)
- [x] Implement owner-only access control for admin procedures

## Frontend - Landing Page
- [x] Design and build glamorous hero section with burgundy and gold theme
- [x] Add event details section (name, date, venue)
- [x] Display eligibility rules in an elegant format
- [x] Add registration CTA button

## Frontend - Registration System
- [x] Build category tabs component (Adults 18–26, Teens 13–17, Little Stars 5–12)
- [x] Create registration form component with fields: full name, age/DOB, phone, email, category, county sub-location, photo upload
- [x] Implement form validation with category-specific age ranges
- [x] Implement photo upload to S3 storage
- [x] Create payment instructions modal with M-PESA details (Paybill 522522, Account ROYALS2026, fees)
- [x] Create confirmation message after submission
- [x] Wire registration form to tRPC mutation
- [x] Add prominent CTA button to hero section

## Frontend - Admin Dashboard
- [x] Create protected admin dashboard page (owner-only)
- [x] Display registrations organized by category
- [x] Implement export functionality per category (CSV or similar)
- [x] Add admin navigation/access control

## Testing & Deployment
- [x] Write vitest tests for registration submission
- [x] Write vitest tests for admin dashboard access control
- [x] Test all features in browser
- [x] Create checkpoint before delivery
