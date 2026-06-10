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
- [x] Build category tabs component (Adults 18–26, Teens 13–17, Little Stars 5–12)
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
