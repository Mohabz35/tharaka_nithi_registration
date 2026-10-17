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
- [x] Add countdown timer (registration closes July 1, 2026)
- [x] Display "Registration is FREE" message
- [x] Update eligibility criteria (no height restrictions, tattoos/scars welcome)
- [x] Add talent information section

## Frontend - Registration System
- [x] Build category tabs component (Adults 18–35, Teens 13–17, Little Stars 5–12)
- [x] Create multi-step registration form with progress indicator
- [x] Add portfolio/talent submission field
- [x] Add consent forms (Data Protection & Photography Consent)
- [x] Add parental consent form for teens and little stars
- [x] Add terms and conditions acceptance checkbox
- [x] Implement form validation with category-specific age ranges
- [x] Implement photo upload to S3 storage
- [x] Create payment instructions modal with M-PESA details (Paybill 522522, Account ROYALS2026, fees)
- [x] Create confirmation message after submission
- [x] Wire registration form to tRPC mutation
- [x] Add prominent CTA button to hero section

## Frontend - Admin Dashboard
- [x] Create protected admin dashboard page (owner-only)
- [x] Display registrations organized by category
- [x] Implement export functionality per category (CSV)
- [x] Add admin navigation/access control
- [x] Display registration statistics by category
- [x] Add search functionality (name, email, phone, location)
- [x] Add advanced filter options (category, payment status, age range, county)
- [x] Implement combined search and filter functionality
- [x] Display active filter count indicator
- [x] Add reset filters button

## Document Generation
- [x] Create PDF generation utility for registration confirmations
- [x] Create PDF generation utility for parental consent forms
- [x] Integrate PDF generation with registration submission
- [x] Generate category-specific PDFs automatically

## Backend Features
- [x] Create poster generation endpoint using AI image generation
- [x] Integrate poster generation with registration flow
- [x] Add upload handler for photo and portfolio uploads
- [x] Implement S3 storage integration for all file uploads

## Testing & Deployment
- [x] Write vitest tests for registration submission
- [x] Write vitest tests for admin dashboard access control
- [x] Write vitest tests for search and filter functionality
- [x] Test all features in browser
- [x] Verify countdown timer functionality
- [x] Verify multi-step form flow
- [x] Verify consent form validation
- [x] Verify search and filter functionality
- [x] Create final checkpoint

## Completed Features Summary

### Core Registration System
- Multi-category registration (Adults, Teens, Little Stars)
- Category-specific age validation
- Photo upload with S3 storage
- Portfolio/talent submission
- Consent forms for photo/video usage and data processing
- Parental consent for minors
- Terms and conditions acceptance
- M-PESA payment instructions with exact details

### Landing Page Features
- Glamorous burgundy and gold theme matching event branding
- Countdown timer to July 1, 2026 registration deadline
- Event details (date: September 15, 2026, venue: Chuka Grounds)
- Eligibility guidelines (free registration, no height restrictions, tattoos/scars welcome)
- Talent information section
- Prominent "Register Now" CTA button

### Admin Dashboard
- Owner-only access control
- View registrations by category
- Export registrations to CSV
- Display registration statistics
- Category-specific filtering
- Advanced search by name, email, phone, or location
- Multi-criteria filtering (category, payment status, age range, county)
- Combined search and filter capabilities
- Active filter count indicator
- Reset filters functionality
- Responsive table with pagination support

### Document Generation
- Automatic PDF generation for registration confirmations
- Category-specific parental consent PDFs for minors
- S3 storage integration for all documents

### AI Features
- Automatic poster generation from uploaded photos
- Glamorous poster design with participant name and category
- Burgundy and gold color scheme matching event branding

## Public Gallery Feature
- [x] Add gallery tRPC procedure to fetch public registrations with photos
- [x] Create gallery page component with photo grid
- [x] Add profile cards with model names and categories
- [x] Implement filtering by category
- [x] Add search functionality for gallery
- [x] Style with glamorous burgundy/gold theme
- [x] Add gallery route to navigation
- [x] Write gallery tests
- [x] Add "View Gallery" button to home page

## Known Limitations & Future Enhancements
- Email notifications not yet implemented
- M-PESA payment verification webhook not yet integrated
- SMS notifications not yet implemented

## Post-Competition Phase (Winners, Events Gallery, Training)

### Competition Winners + Social Share Meta Tags
- [x] Add `winners` table (name, title, category, placement, prize, description, photo, publish toggle)
- [x] Add winner tRPC router (public getPublished/getById, admin create/update/delete/togglePublish)
- [x] Server-rendered OG/Twitter meta tag route `GET /api/share/winner/:id` (JSON-LD Person, HTML escaping, redirect to SPA)
- [x] Add vercel.json rewrites for `/share/winner/:id` before the SPA fallback
- [x] Create public Winners page (`/winners`) with category filters and share buttons
- [x] Create Winner detail page (`/winners/:id`) with WhatsApp/Facebook/copy-link sharing
- [x] Add Winners section to Home page + footer links
- [x] Admin "Winners" tab: add/edit/delete/publish winners with photo upload

### Events Gallery (admin-uploaded photos)
- [x] Add `events` and `event_photos` tables (slug, cover image, date, location, captions, ordering)
- [x] Add events tRPC router (public getPublished/getBySlug, admin CRUD + multi-photo upload/delete, getWithPhotos)
- [x] Server-rendered OG meta tag route `GET /api/share/event/:slug` (JSON-LD Event)
- [x] Add vercel.json rewrite for `/share/event/:slug`
- [x] Create public Events page (`/events`) with searchable album cards
- [x] Create Event detail page (`/events/:slug`) with photo grid + lightbox (keyboard-free prev/next)
- [x] Add Events section to Home page + footer link
- [x] Admin "Events" tab: create events, upload multiple photos, publish/unpublish, delete

### Training / Bootcamp Registration
- [x] Add `training_programs` and `training_registrations` tables
- [x] Add training tRPC router (public getActivePrograms with capacity counts, register with capacity check)
- [x] Send confirmation email on training registration (buildTrainingRegistrationEmail)
- [x] Create public Training page (`/training`) with program cards and registration dialog
- [x] Add Training section to Home page + footer link
- [x] Admin "Training" tab: program CRUD (dates, fee, capacity, cover image) + registrants table with payment toggle

### Fixes & Verification
- [x] Fix pre-existing import error in merchandiseRouter.ts (buildOrderReceiptEmail not imported)
- [x] Add `newFeatures.test.ts` — share meta rendering/escaping + access control for new routers (11 tests)
- [x] `npm run check` passes, `npm run build` passes
- [ ] Full test suite green (9 pre-existing failures require DATABASE_URL)


## Phase 3 Enhancements

### Error Handling & Validation
- [x] Add error messages to registration form fields
- [x] Display validation feedback for each input
- [x] Show error toast notifications for submission failures
- [x] Add field-level error highlighting

### Free Registration
- [x] Remove all payment/fee references
- [x] Update messaging to "FREE Registration"
- [x] Remove M-PESA payment modal
- [x] Update confirmation message

### Certificate Design
- [ ] Design custom certificate template with poster theme
- [ ] Add participant name generation
- [ ] Add partners section to certificate
- [ ] Blend certificate with poster colors and theme
- [ ] Generate PDF with logo and design

### Landing Page Redesign
- [ ] Change background to poster texture
- [ ] Add featured models carousel
- [ ] Update hero section styling
- [ ] Optimize for mobile viewing

### Social Sharing
- [x] Add WhatsApp share button to gallery cards
- [x] Add Instagram share button to gallery cards
- [x] Add Facebook share button to gallery cards
- [x] Add Twitter/X share button to gallery cards
- [x] Generate shareable links with model profile

### Featured Models Carousel
- [ ] Create rotating carousel component
- [ ] Display latest registered models
- [ ] Add auto-rotation functionality
- [ ] Add manual navigation controls

### Gallery Enhancements
- [x] Add sorting by newest registration
- [x] Add sorting by specific talents
- [x] Add filter by talent categories
- [x] Improve gallery UI/UX

### Admin Dashboard Bug Fixes
- [x] Fix AdminArtistsTable tRPC path (artist.getAll → admin.getArtists)
- [x] Fix AdminSponsorsTable tRPC path (sponsor.getAll → admin.getSponsors)
- [x] Fix AdminShowcasesTable tRPC path (showcase.getAll → admin.getShowcases)

### New Sections
- [ ] Create Sponsors section
- [ ] Create Partners section
- [ ] Create Artist Registration section
- [ ] Create Bootcamp Showcase section
- [ ] Add "Know More" buttons
- [ ] Add Support panel

### Image Storage Solution
- [ ] Fix gallery image display issues
- [ ] Implement PostImages integration for image storage
- [ ] Set up portfolio upload solution
- [ ] Configure image CDN/storage

### Final Deployment
- [ ] Run comprehensive tests
- [ ] Push all changes to GitHub
- [ ] Deploy to production
- [ ] Verify all features working

## Models Portfolio Platform (Phases A–C)

### Phase A — Public Portfolios
- [x] Add slug helpers (`slugifyText`, `modelSlug`, `parseModelSlug`) to shared/const.ts
- [x] Add `modelProfile.getPortfolio` (resolves any-name-123 slug via trailing id, returns socials/measurements JSON)
- [x] Add `/share/model/:slug` OG share route + vercel.json rewrite
- [x] Create public ModelPortfolio page (`/models/:slug`) with bio, showreel embed, measurements, talents, socials, share buttons
- [x] Wire Gallery cards (keeps confetti for top contestants) and FeaturedModelsCarousel "View Portfolio" CTAs to portfolio pages
- [x] Replace static sitemap.xml with dynamic `/sitemap.xml` route (static pages + model/event/winner URLs, 1h cache); added vercel rewrite
- [x] Verified Vercel rewrite chaining works in production (share routes reach Express)

### Phase B — Rich Profiles & Bookings
- [x] Add registrations columns: bio, showreelUrl, measurements (JSON), availableForBookings + ensureSchema ALTERs
- [x] Add booking_enquiries table + ensureSchema
- [x] Extend modelProfile.updateProfile (bio/showreel/measurements/socials/bookings, email-ownership check; email no longer editable in UI)
- [x] Add "My Portfolio" tab on /profile: copy/preview public link, edit bio/showreel/measurements/socials/availability
- [x] Add bookModel mutation (validates availability, stores enquiry, emails SUPPORT_EMAIL via buildBookingEnquiryEmail)
- [x] Admin "Bookings" tab: list/filter by status (new/contacted/closed), status transitions, delete
- [x] `portfolio.test.ts` — 12 tests (slugs, portfolio NOT_FOUND, updateProfile validation, bookings access control)

### Phase C — Performance, SEO, Legal
- [x] Image optimization: scripts/optimize-images.mjs (sharp) → banner 4.6MB→310KB webp, logo 797KB→50KB webp, 173KB og-image.jpg
- [x] Fix broken hero images (ri_logo_transparent.png / ri_logo_white.png did not exist) → optimized assets; added width/height (CLS)
- [x] Update all OG/twitter/JSON-LD share images to /optimized/og-image.jpg (index.html, usePageMeta, shareRoutes DEFAULT_IMAGE)
- [x] Add usePageMeta hook (title/OG/Twitter/canonical) to Gallery, Winners, WinnerDetail, Events, EventDetail, Training, ModelPortfolio, Privacy, Terms
- [x] Create /privacy and /terms pages (Kenya DPA 2019 / event rules); link from footer + registration consent checkboxes
- [x] `npm run check` / `npm run build` pass; tests: 41 pass, 9 pre-existing DB-dependent failures unchanged

## Security & Reliability Hardening (rating-gap fixes)

### Security
- [x] IntaSend webhook challenge verification (timing-safe compare, top-level + nested payload shape); warns loudly when INTASEND_WEBHOOK_CHALLENGE unset
- [x] Rate limiting (server/_core/security.ts, in-memory sliding window): /api/auth 15/min, /api/upload 30/min, /api/trpc 300/min, webhooks 120/min; 429 + Retry-After
- [x] trust proxy=1 so req.ip is real client behind Vercel; x-powered-by disabled
- [x] Security headers: nosniff, X-Frame-Options SAMEORIGIN, Referrer-Policy, Permissions-Policy; X-Powered-By stripped
- [x] Body limits: global JSON 50mb->10mb (largest case is poster base64 ~6.7MB), urlencoded 50mb->1mb; /api/upload keeps its own 50mb raw parser
- [x] `security.test.ts` - 10 tests (timing-safe compare, challenge verification, 429 behavior, headers)

### SEO
- [x] WebSite + Organization JSON-LD added to client/index.html (robots.txt already had Sitemap directive)

### Test reliability
- [x] DB-dependent tests skip cleanly when DATABASE_URL missing (gallery 6, registration 3) instead of failing
- [x] Registration deadline now overridable via REGISTRATION_DEADLINE_ISO env (admin site setting still wins); deadline tests no longer break after the real deadline
- [x] Suite: 52 pass / 9 skipped (DB) / 0 fail; npm run check + build pass; smoke-tested headers, webhook 401, rate-limit 429 on prod build

### Follow-ups (need env/config, not code)
- [ ] Set INTASEND_WEBHOOK_CHALLENGE in Vercel env (must match the challenge configured in IntaSend dashboard) - until then webhooks are accepted unverified
- [ ] Consider captcha on public submit forms and a persistent rate-limit store (Redis/Upstash) if abuse appears

## Receipts, Certificates, Digest, Reports & Committee Role

### Registration receipts
- [x] `server/_core/receiptGenerator.ts` - PDF receipt (cloudinary `receipts/`) with fee, status, registration no.
- [x] `registration.downloadReceipt` public mutation (signed URL); "Download Payment Receipt" button in SuccessModal
- [x] Receipt email auto-sent when registration fee > 0 (paid) or pending status (payment due); `registration_fee` site setting governs the amount (0 = free, no fee receipt)
- [x] `admin.updateRegistration` pending -> completed transition also emails a paid receipt

### Achievement certificates
- [x] `generateAchievementCertificate` in certificateGenerator.ts (winner / participation kinds)
- [x] `admin.emailWinnerCertificate` - generates PDF, emails it to the registration linked to the winner (BAD_REQUEST when no email linked); Award button in AdminWinnersManager
- [x] Bulk email panel: new "Certificate of Participation" option (`sendBulkEmail` type enum)

### Weekly admin digest
- [x] `server/_core/weeklyDigest.ts` - isDigestDue (pure), sendWeeklyDigest (force), maybeSendWeeklyDigest (fire-and-forget); stamp in site_settings `last_weekly_digest_sent_at`
- [x] Auto-sends when an admin opens the dashboard and the digest is >7 days stale; "Send now" button + due status in Reports tab
- [x] Digest emailed to SUPPORT_EMAIL with new registrations, category breakdown, bookings, payments

### Financial reports + team access (Reports & Team tab)
- [x] `getFinancialSummary` in db.ts: collected (all/7d/30d), tx counts by status, order stats, installment due/paid/outstanding/overdue, latest 50 transactions
- [x] AdminReportsTab.tsx: summary cards, transactions table + CSV export, digest card, team access table
- [x] Team management: `listUsers` / `setUserRole` (self-demote guard + at-least-one-admin guard)

### Committee sub-admin role
- [x] role enum += "committee" (drizzle schema + ensureSchema ALTER TYPE ... ADD VALUE IF NOT EXISTS)
- [x] `staffProcedure` middleware (admin|committee; UNAUTHORIZED when logged out) in server/_core/trpc.ts
- [x] Staff-gated: getRegistrationsByCategory, getStats, search/filter, searchAndFilter, bookings getAll/updateStatus
- [x] Admin-only (unchanged): settings, payments, financial report, team management, delete/add/edit contestant, bulk email, digest, winner certificate email
- [x] AdminDashboard: committee sees only Registrations (read + CSV, no edit/delete/add/bulk) + Bookings tabs; Reports & Team, Settings, Payments etc. admin-only
- [x] `AdminSiteSettings`: Registration Fee input card
- [x] `reports.test.ts` - 16 tests: isDigestDue, receipt/achievement/digest email builders, role gates (incl. self-demote guard); suite now 68 pass / 9 skipped (DB) / 0 fail

### Verification
- [x] npm run check (tsc) + npm run test + npm run build all pass

## Executive Council Accounts (9 seats + Treasurer finance + VP applications)

### Schema & migrations
- [x] `users.staffRole` text column (president | vice_president | secretary | org_sec | marketing | welfare | treasurer | coordinator | models_coordinator); council = role "committee" + staffRole seat key
- [x] `fund_requests` table (advance|payout, amount, purpose, eventDate, status pending/approved/rejected/paid, adminNote, reviewedById/At)
- [x] `finance_reports` table (title, body, amount, category, submitterId)
- [x] `vp_applications` table (fullName, email, phone, statement, status, adminNote, reviewedById/At)
- [x] ensureSchema: ADD COLUMN IF NOT EXISTS staffRole + CREATE TABLE IF NOT EXISTS for all three tables

### Server
- [x] `treasurerProcedure` middleware (admin OR committee+treasurer) in server/_core/trpc.ts; staffProcedure unchanged (council uses committee role)
- [x] db helpers: createStaffAccount, createFundRequest, listFundRequests (join requester), listFundRequestsByUser, reviewFundRequest, markFundRequestPaid, createFinanceReport, listFinanceReports (join submitter+seat), createVpApplication, listVpApplications, reviewVpApplication, getFinanceLedger (completed regs×fee + successful tx − paid requests), setUserStaffRole
- [x] council router: applyForVicePresident (public), getFinanceLedger/submitFundRequest/listMyFundRequests/submitFinanceReport (treasurerProcedure), listFinanceReports (admin+treasurer+ president), listFundRequests/reviewFundRequest/markFundRequestPaid/listVpApplications/reviewVpApplication/createStaffAccount/setSeat (admin-only); VP approve can create account with one-time temp password
- [x] shared/const.ts: COUNCIL_SEATS (9 seats with named holders, VP vacant), councilSeatLabel helper

### Client
- [x] AdminCouncilTab.tsx: fund ledger cards, submit fund request form, admin review queue (approve/reject/mark paid), my-requests table, finance report submit + inbox, VP applications (approve & create account with temp password), council seats overview; tab visible to all staff, sections gated treasurer/admin
- [x] AdminDashboard: Council tab wired for all staff
- [x] AdminReportsTab Team Access: Council seat assignment dropdown (setSeat)
- [x] VpApplication.tsx public page at /vice-president (form + success state); route in App.tsx; sitemap entry added

### Tests & verification
- [x] council.test.ts — 9 tests: seat constants, treasurer gate (user/committee blocked, treasurer+admin allowed), admin-only review/seat/VP, public VP application, unknown-seat BAD_REQUEST
- [x] Suite: 95 pass / 9 skipped (DB) / 0 fail; npm run check + npm run build pass

### Seating plan (manual, after deploy)
- [ ] Assign each council member an account: have them register, then set role=committee + seat in Reports & Team (or create via Council tab seat flow / createStaffAccount)
- [ ] Treasurer = Pilly Aly (committee + treasurer seat); President = Maxwell Okoth; Secretary = Reginah Akelo; Org Sec = Deborah Moraa; Marketing = Sheddy Precious Global; Welfare = Rahman Ali; County Coordinator = Winslet Flynn; Models Coordinator = Idah Apule; VP seat open until an application is approved
