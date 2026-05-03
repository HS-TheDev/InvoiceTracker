# InvoiceTracker — Improvement Roadmap

## Priority 1: Critical Bugs
- [ ] Auto-update invoice status to "Paid" when total payments >= invoice amount
- [ ] Auto-update invoice status to "Overdue" when due date has passed
- [ ] Prevent payments exceeding the invoice total amount
- [ ] Prevent duplicate invoice numbers

## Priority 2: Backend Improvements
- [ ] Add proper validation with Data Annotations ([Required], [EmailAddress], [MaxLength])
- [ ] Add DTOs (Data Transfer Objects) instead of exposing raw entities
- [ ] Add error handling middleware (try-catch globally)
- [ ] Add pagination to all GET endpoints (skip/take)
- [ ] Add search/filter endpoints (search clients by name, invoices by status)
- [ ] Add a Dashboard API endpoint that returns all summary stats in one call

## Priority 3: Frontend Improvements
- [ ] Add loading spinners while data is fetching
- [ ] Add error messages when API calls fail (try-catch around API calls)
- [ ] Add search bar on Clients, Invoices, and Payments pages
- [ ] Add pagination controls on all tables
- [ ] Add "View Invoice" detail page showing line items + payments together
- [ ] Add confirmation before navigating away from unsaved form
- [ ] Highlight active nav link
- [ ] Make the app fully responsive on mobile

## Priority 4: New Features
- [ ] Add InvoiceItems page (add/edit/delete line items per invoice)
- [ ] Auto-calculate invoice TotalAmount from line items (quantity x unitPrice)
- [ ] PDF invoice generation (download invoice as PDF)
- [ ] Email invoice to client
- [ ] Authentication (register/login with JWT)
- [ ] Role-based access (admin vs viewer)
- [ ] Dark mode toggle
- [ ] Export data to CSV/Excel

## Priority 5: AI Integration Ideas
- [ ] AI-powered invoice description generator
- [ ] Smart payment reminders (predict which clients pay late)
- [ ] Natural language search ("show me unpaid invoices from last month")
- [ ] Auto-categorize expenses using AI

## Priority 6: DevOps & Deployment
- [ ] Deploy backend to Azure App Service or Railway
- [ ] Deploy frontend to Vercel or Netlify
- [ ] Add environment variables for API URL (dev vs production)
- [ ] Set up CI/CD with GitHub Actions
- [ ] Add unit tests for controllers
- [ ] Add integration tests for API endpoints

---

## Daily Rule
Pick 2-3 items per day. Commit after each one. Never skip two days in a row.
