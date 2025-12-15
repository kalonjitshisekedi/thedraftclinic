# Draft Clinic Design Guidelines

## Design Approach

**Hybrid Approach**: Drawing inspiration from professional service platforms (Upwork, Fiverr) for trust-building and workflow clarity, combined with productivity tool aesthetics (Linear, Notion) for the dashboard interfaces. The design prioritizes credibility, transparency, and efficient task completion.

**Core Principle**: Professional credibility meets streamlined workflow. Every interface should communicate trustworthiness while guiding users effortlessly through document submission, payment, and delivery.

---

## Typography System

**Primary Font**: Inter (Google Fonts)
- Headings: 700 weight
- Subheadings: 600 weight  
- Body: 400 weight
- Small text/labels: 500 weight

**Secondary Font**: Georgia (system)
- Use sparingly for testimonials or editorial content to add warmth

**Scale**:
- Hero headline: text-5xl to text-6xl
- Page titles: text-4xl
- Section headings: text-3xl
- Card titles: text-xl
- Body text: text-base
- Small text: text-sm
- Captions: text-xs

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4 to p-8
- Section spacing: py-12 to py-24
- Card gaps: gap-6 to gap-8
- Form fields: space-y-4

**Container Strategy**:
- Marketing pages: max-w-7xl
- Dashboard content: max-w-6xl
- Forms: max-w-2xl
- Reading content: max-w-prose

---

## Page-Specific Layouts

### Landing Page (Marketing)
**Structure** (8 sections):

1. **Hero Section** (80vh)
   - Large hero image: Professional editor reviewing document at modern workspace (warm, inviting, competent)
   - Headline + subheadline centered overlay with blurred background buttons
   - Primary CTA: "Get Your Quote" + Secondary: "How It Works"
   - Trust indicators below fold: "500+ Documents Reviewed" • "4.9/5 Rating" • "24h Turnaround Available"

2. **Service Selection Cards** (3-column grid lg:, 1-column mobile)
   - Proofreading, Editing, Formatting cards with icons (from Heroicons)
   - Each card: Service name, 2-3 bullet points, starting price, "Select Service" button
   - Hover effect: subtle elevation increase

3. **How It Works** (4-column process flow, 2-column tablet, 1-column mobile)
   - Step numbers in large serif font
   - Icon + title + description per step
   - Connected with subtle arrows (desktop only)

4. **Pricing Calculator Preview** (centered, max-w-4xl)
   - Interactive mini-calculator: word count slider → instant quote display
   - Shows turnaround options with price differential
   - "Get Detailed Quote" CTA

5. **Trust Section** (2-column split)
   - Left: "Why Choose Draft Clinic" with 4-5 benefit points
   - Right: Testimonial card with reviewer photo, quote, attribution

6. **Security & Compliance** (3-column grid)
   - POPIA Compliant badge/icon
   - Secure Payment icons
   - Data Encryption statement
   - Each with brief description

7. **Reviewer Showcase** (3-4 column grid of reviewer cards)
   - Professional photos
   - Name, specialization, years of experience
   - "Meet Our Team" heading

8. **Final CTA Section** (centered, py-20)
   - Compelling headline
   - Primary CTA button (large)
   - Supporting text: "No commitment required • Get quote in 60 seconds"

**Footer** (4-column layout, stacks on mobile):
- Services list
- Company (About, Contact, Careers)
- Legal (Privacy, Terms, POPIA Notice)  
- Newsletter signup + social links

---

### Service Selection & Quote Flow

**Layout**: Single-column centered flow (max-w-3xl)

**Progress Indicator**: 
- Horizontal stepper at top: Select Service → Upload Document → Review Quote → Payment
- Current step highlighted, completed steps with checkmarks

**Service Selection Screen**:
- Large radio card selection (similar to Stripe Checkout)
- Each service: icon, name, description, features list, price range
- Turnaround time selector: chips/pills UI for 24h/48h/72h/1 week options
- Sticky bottom bar with "Continue" button and price estimate

**Upload Screen**:
- Large drag-and-drop zone (dashed border, centered icon + text)
- File requirements listed below: formats, max size
- Alternative "Browse Files" button
- Uploaded file preview card with filename, size, remove option
- Auto-analysis happening: loading state → word count displayed

**Quote Review Screen**:
- Breakdown card: Service type, word count, turnaround time, subtotal, VAT, total
- Currency selector (flag icons + dropdown)
- Quote valid for: countdown timer (subtle)
- Large "Proceed to Payment" button
- "Modify Selection" link to go back

---

### Dashboard Interface

**Layout**: Left sidebar navigation + main content area

**Sidebar** (w-64, fixed):
- Logo at top
- Navigation items: Dashboard, My Jobs, Upload New, Payment History, Profile, Help
- User profile card at bottom (avatar, name, plan/credits)

**Dashboard Main** (Jobs Overview):
- Stats cards row (4-column grid): Active Jobs, Completed, In Review, Pending Payment
- Jobs table/list: Job ID, document name, service type, status badge, date, actions dropdown
- Status badges: distinct visual treatment (border + background) for each state
- Filters: status dropdown, date range, search bar

**Job Detail View**:
- Breadcrumb navigation
- Job header: document name, status, submission date
- 2-column layout:
  - Left: Job details card, payment info card, communication thread
  - Right: Document preview/download, timeline of status changes

**Upload New** (within dashboard):
- Simplified version of public upload flow
- Pre-filled user info, faster checkout for returning users

---

### Payment Flow

**Layout**: Checkout-style centered column (max-w-2xl)

**Structure**:
- Order summary card (sticky on scroll, desktop): itemized breakdown
- Payment method selection: radio cards for each gateway
- Payment form fields based on selected method
- Security badges below form: SSL, PCI compliance icons
- Terms checkbox + "Pay Now" button (prominent, full-width)
- Money-back guarantee statement

---

### Admin Dashboard

**Layout**: Same sidebar structure, different navigation items

**Admin Navigation**: 
- Dashboard, All Jobs, Assign Jobs, Users, Reviewers, Payments, Disputes, Settings

**Jobs Management**:
- Advanced filtering: assignee, status, service type, date range, priority
- Bulk actions: assign reviewer, change status, export
- Table with more columns: customer, reviewer, deadline, priority flag

**Assignment Interface**:
- Split view: Unassigned jobs list (left) + Reviewer roster (right)
- Drag-and-drop or select + assign pattern
- Reviewer cards show: current workload, specialization, rating, availability

---

## Component Library

### Navigation
- **Top Nav** (marketing): Transparent overlay on hero, solid on scroll, logo left, links center, CTA right
- **Sidebar Nav** (dashboard): Fixed, icons + labels, active state indicator (left border accent)

### Cards
- **Service Cards**: Rounded corners (rounded-lg), shadow on hover, clear hierarchy
- **Job Cards**: Compact, status badge prominent, action icons right-aligned
- **Stat Cards**: Large number, label below, subtle icon, min-h-32

### Forms
- **Input Fields**: Border-based, focus state with subtle ring, labels above
- **File Upload**: Dashed border zone, icon + instructional text centered
- **Select/Dropdown**: Native enhanced with custom styling
- **Buttons**: 
  - Primary: Solid, rounded, medium padding (px-6 py-3)
  - Secondary: Outlined, same sizing
  - Text/Ghost: No border, subtle hover background
  - Blurred backgrounds when over images

### Data Display
- **Tables**: Striped rows (subtle), hover highlight, sortable headers
- **Status Badges**: Pill-shaped, border + light background, semantic states
- **Progress Indicators**: Step-based (circles connected by lines) or linear bar
- **Timeline**: Vertical line with event nodes, timestamp + description

### Modals/Overlays
- **Modal**: Centered, overlay backdrop, rounded corners, max-w-lg to max-w-2xl based on content
- **Dropdown Menus**: Attached to trigger, shadow-lg, rounded corners
- **Tooltips**: Small, dark background, white text, arrow pointer

---

## Images

**Hero Section**: Professional document editing scene - clean desk, laptop, coffee, soft natural lighting. Conveys expertise and approachability. Full-width, subtle overlay gradient for text readability.

**Reviewer Photos**: Headshots on clean backgrounds, professional but friendly. Circular or rounded square crops.

**How It Works Icons**: Use Heroicons - DocumentText, Upload, CheckCircle, Download

**Trust Section**: Consider authentic photo of team collaboration or editing in progress

---

## Animations

**Minimal and Purposeful**:
- Hover transitions on cards/buttons: 200-300ms ease
- Page transitions: Subtle fade
- Loading states: Spinner for async actions
- Success confirmations: Checkmark animation on payment/upload completion
- No scroll-triggered animations, no parallax

---

## Accessibility

- Maintain WCAG AA contrast ratios throughout
- Focus indicators on all interactive elements (ring with offset)
- Keyboard navigation fully supported in forms and navigation
- Form validation: inline error messages, clear labels, required field indicators
- Skip links for dashboard navigation