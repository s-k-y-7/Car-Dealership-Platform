# Technical Design Document (TDD)
## Premium Car Dealership Platform — Company A (Brand X Lucknow)

---

**GitHub Repository:** https://github.com/s-k-y-7/Car-Dealership-Platform

### 1. Executive Summary & Problem Statement

**Assumptions:** Brand X, Company A, dealership locations, vehicle listings, prices, and customer records are fictional sample data created for demonstration purposes. Pricing components and operational rules are illustrative and should not be treated as verified official dealership quotations.

**Company A** is the exclusive authorized dealer for **Brand X** in Lucknow, operating:
* 3 premier automotive showrooms (Hazratganj Flagship, Gomti Nagar Experience Centre, Kanpur Road Showroom).
* 2 high-capacity master service workshops (Transport Nagar and Alambagh).
* 1 certified pre-owned evaluation yard (Alambagh).

Prior to this platform, dealership operations suffered from fragmented manual workflows: lead tracking was maintained on scattered spreadsheets, test-drives and service appointments were booked informally over phone calls, and certified used-car stock was manually distributed via WhatsApp messages without verified pricing or audit trails.

This platform replaces those manual practices with a **unified, high-end automotive digital showroom and enterprise CRM suite**.

---

### 2. Architecture & Technology Choices

The application uses a **clean two-part decoupled architecture**:

```
 ┌──────────────────────────────────────────────────────────────┐
 │                     React 18 + Vite SPA                      │
 │     Tailwind CSS • TypeScript • Lucide Icons • Axios         │
 └──────────────────────────────┬───────────────────────────────┘
                                │ JSON REST API / JWT
 ┌──────────────────────────────▼───────────────────────────────┐
 │               Django 5 + Django REST Framework               │
 │           ORM • Role-Based Auth • Background Routing         │
 └──────────────┬───────────────────────────────┬───────────────┘
                │                               │
 ┌──────────────▼──────────────┐ ┌──────────────▼───────────────┐
 │   PostgreSQL Relational DB  │ │     Groq AI Integration      │
 │  (SQLite Zero-Config Dev)   │ │ Server-Side Transparent LLM  │
 └─────────────────────────────┘ └──────────────────────────────┘
```

#### Technology Decisions:
1. **Backend**: Python 3, Django 5.x, Django REST Framework (DRF), and SimpleJWT.
   * *Rationale*: Django provides an enterprise-grade ORM, bulletproof migration engine, role-based security, and transactional integrity.
2. **Database**: PostgreSQL as the production database, with dynamic, zero-configuration local fallback to SQLite3 for instant testing without requiring external host daemons.
3. **Frontend**: React 18 with TypeScript and Vite.
   * *Rationale*: Instant HMR, strict type safety matching backend serializers, zero-latency client routing via React Router DOM.
4. **Styling & Design System**: Tailwind CSS configured with a bespoke editorial automotive theme (`#0B0F19` obsidian dark, `#9E1B24` brand crimson accent, `#F8F9FA` surface, and refined serif typography).
5. **AI Integration**: Server-side Groq API (`llama-3.3-70b-versatile`) with transparent, rule-based heuristic fallback if API keys are absent or network calls fail.

---

### 3. Normalized Relational Database Schema

```
 ┌──────────────┐          ┌────────────────┐
 │     City     │◄────┐    │    Showroom    │
 └──────┬───────┘     │    └────────┬───────┘
        │             │             │
        │ 1:N         │ 1:N         │ 1:N
        ▼             │             ▼
 ┌──────────────┐     │    ┌────────────────┐
 │ OnRoadPrice  │     │    │TestDriveBooking│
 └──────┬───────┘     │    └────────┬───────┘
        │ N:1         │             │ 1:1
        ▼             │             ▼
 ┌──────────────┐     │    ┌────────────────┐
 │   Vehicle    │◄────┴────┤      Lead      │◄───────┐
 └──────────────┘ 1:N      └────────┬───────┘        │
                                    │                │
                          ┌─────────┴─────────┐      │
                      1:N │               1:N │      │
                          ▼                   ▼      │
                  ┌──────────────┐    ┌─────────────┐│
                  │ LeadActivity │    │AIInteraction││
                  └──────────────┘    └─────────────┘│
                                                     │ N:1
                                              ┌──────┴──────┐
                                              │    User     │
                                              └─────────────┘
```

#### Core Entities:
1. **`core.User`**:
   * Custom user extending `AbstractUser`.
   * Fields: `role` (`BUYER`, `CONSULTANT`, `ADMIN`), `phone`, `full_name`, `is_active_consultant`.
2. **`vehicles.City`**:
   * Fields: `name`, `state`, `rto_code` (e.g. `UP32`), `is_active`, `display_order`.
3. **`vehicles.Showroom`**:
   * Fields: `name`, `showroom_type` (`SHOWROOM`, `SERVICE_WORKSHOP`, `USED_CAR_YARD`), `city` (FK), `address`, `phone`, `opening_hours`, `has_test_drive`.
4. **`vehicles.Vehicle`**:
   * Fields: `stock_id` (unique, e.g. `NEW-H-02`, `UC-1182`), `vehicle_type` (`NEW`, `USED`), `brand`, `model_name`, `variant`, `year`, `fuel_type`, `transmission`, `body_type`, `color`, `ex_showroom_price`, `availability` (`AVAILABLE`, `BOOKED`, `SOLD_OUT`), `hero_image`, `gallery`, `features`, `specifications`.
   * Certified Pre-Owned specifics: `registration_number` (masked to `UP32-**-9821` for buyers), `odometer_km`, `owner_count`, `is_certified`, `inspection_report_summary`.
5. **`vehicles.OnRoadPrice`**:
   * **Source of truth** for calculated consumer pricing.
   * Fields: `vehicle` (FK), `city` (FK), `ex_showroom_price`, `road_tax`, `insurance`, `mandatory_accessories`, `registration_charges`, `optional_warranty`, `valid_until`, `disclaimer`.
   * Unique constraint: `('vehicle', 'city')`.
   * Property: `total_on_road_price`.
6. **`leads.TestDriveBooking`**:
   * Fields: `booking_reference`, `vehicle` (FK), `showroom` (FK), `customer_name`, `customer_phone`, `customer_email`, `preferred_date`, `time_slot`, `status`, `consent_given`.
   * **Collision prevention**: `unique_together = ('vehicle', 'showroom', 'preferred_date', 'time_slot')`.
7. **`leads.Lead`**:
   * Fields: `lead_reference`, `source` (`TEST_DRIVE`, `WEBSITE_ENQUIRY`, `PRICE_QUOTE`, `USED_CAR_INQUIRY`, `WALK_IN`), `customer_name`, `customer_phone`, `customer_email`, `customer_city`, `interested_vehicle` (FK), `test_drive_booking` (OneToOne), `budget_range`, `requirements_notes`, `status` (`NEW`, `ASSIGNED`, `CONTACTED`, `TEST_DRIVE_SCHEDULED`, `NEGOTIATION`, `WON`, `LOST`), `priority`, `assigned_consultant` (FK User), `assigned_at`, `first_response_at`, `response_due_minutes` (30 mins), `consent_data_processing`.
   * Properties: `is_response_overdue`, `response_timer_minutes_left`.
8. **`leads.LeadActivity`**:
   * Audit log for all assignments, status changes, phone notes, and AI operations.
9. **`leads.AIInteraction`**:
   * Permanent audit trail of prompts, responses, provider models, and fallback status.

---

### 4. Main Application Workflows

#### A. Vehicle Browsing & Dynamic City On-Road Price Breakdown
* Buyers browse new and certified pre-owned stock with multi-faceted filtering (fuel, transmission, body type, budget).
* On the Vehicle Details page, the user selects their registration city (Lucknow, Kanpur, Varanasi, Noida).
* Pricing is fetched from the database table `OnRoadPrice` as the single source of truth.
* Calculation breakdown displays:
  $$\text{On-Road Price} = \text{Ex-Showroom} + \text{Road Tax (RTO)} + \text{Comprehensive Insurance} + \text{Accessories} + \text{FASTag \& Reg}$$
* Changes made by an Administrator to `OnRoadPrice` immediately update public quotes.

#### B. VIP Test-Drive Booking with Double-Booking Prevention
* Buyer selects a vehicle, showroom, available date, and one of five hourly test-drive windows.
* Enforces database-level constraint `(vehicle, showroom, preferred_date, time_slot)` preventing double booking of the same demo car.
* Persists booking and automatically creates an inbound `Lead` with priority `HOT`.

#### C. Automatic Lead Assignment (Least-Active Strategy)
* When a lead is created, the system queries all active sales consultants (`is_active_consultant=True`).
* Annotates each consultant with their current count of open leads (`status` not in `['WON', 'LOST']`).
* Automatically assigns the new lead to the consultant with the lowest workload, records `assigned_at`, sets status to `ASSIGNED`, and writes a `LeadActivity` log.

#### D. Consultant Lead Inbox & Response SLA Timer
* Sales consultants see assigned leads and aggregate KPIs: Total Assigned, New Leads, Pending Responses, Overdue Breaches, Test Drives, and Converted Leads.
* A live countdown timer tracks the 30-minute first-response SLA.
* If a response is delayed beyond 30 minutes, an urgent overdue alert is triggered.
* Changing status to `CONTACTED` or logging an outbound reply records `first_response_at` and satisfies the SLA timer.

#### E. Admin Operations Center
* Administrators have exclusive access to manage vehicle stock (CRUD), edit new/used specifications, and update city-wise on-road price components.
* Role-based permissions enforce that buyers and consultants receive HTTP 403 Forbidden on admin endpoints.

---

### 5. AI Integration & Guardrails

* **Server-Side Architecture**: AI calls are strictly initiated from Django backend services (`backend/core/ai_service.py`). API keys are never exposed to the client.
* **Two Core Capabilities**:
  1. *Buyer Requirements Summary*: Analyzes raw customer enquiries, extracts core intent, and explicitly itemizes missing or ambiguous information (e.g. unstated budget, trade-in vehicle details, financing needs).
  2. *Personalized First-Reply Draft*: Prepares a courteous, structured opening email or WhatsApp reply. Includes consultant name, showroom location, and exact vehicle details.
* **Mandatory Guardrails**:
  * AI messages are **never sent automatically**; consultants must review, edit, and approve them.
  * AI does not hallucinate discounts, price cuts, or delivery dates.
  * If `GROQ_API_KEY` is unavailable or the external service fails, the system executes a **transparent heuristic rule-based fallback**, clearly labeling the provider as fallback mode.

---

### 6. Security & Data Protection Considerations

1. **Authentication**: Stateless JWT token authentication with short-lived access tokens and refresh rotation.
2. **Role-Based Access Control (RBAC)**:
   * `BUYER`: Public inventory browsing and booking submission.
   * `CONSULTANT`: Access restricted strictly to assigned leads and AI assistance.
   * `ADMIN`: Full authority across inventory, pricing, showrooms, and all dealership leads.
3. **Data Masking (PII Protection)**:
   * Used car registration numbers are stored securely but masked as `UP32-**-9821` on public endpoints. Raw numbers are visible only to authorized administrators.
4. **Consent & Privacy**:
   * Explicit checkboxes capture user consent for contact and appointment scheduling.

---
### 7. UI & Design Decisions

The interface follows a premium automotive editorial design language, using deep obsidian backgrounds, crimson accents, serif headings, and spacious layouts.

Key screens:
- **Public Homepage:** A cinematic vehicle-focused landing page with prominent inventory exploration and test-drive booking actions.
- **Inventory:** Vehicle cards with filtering by fuel type, transmission, price, and vehicle category.
- **Vehicle Details & Price Breakdown:** Large vehicle imagery alongside a city-specific, itemized on-road quotation.
- **Showroom Locations:** Dedicated cards displaying showroom addresses, contact information, operating hours, and visit scheduling.
- **Test Drive Booking:** A modal-based booking experience that collects vehicle, showroom, date, time slot, and customer details.
- **Consultant CRM:** A two-column lead management interface with customer information, activity history, AI-generated assistance, and response tracking.

The navigation was simplified to avoid redundant links that previously led to the same inventory component. Vehicle filtering remains available within the inventory page.

The design prioritizes desktop usability while maintaining responsive layouts for smaller screens.
---
### 8. Deliberately Excluded Features & Future Roadmap

* **Deliberately Excluded**:
  * Real payment gateway (credit card/UPI down payments): Replaced with simulated order booking per brief guidelines to avoid third-party sandbox friction.
  * Real DMS (Dealer Management System) sync: Simulated via internal inventory tables.
  * WhatsApp Business API webhook: Outbound message drafting is provided with one-click clipboard copying and CRM logging.
* **Future Roadmap**:
  * Real-time WebSocket updates for lead assignments across consultant browsers.
  * WhatsApp Business Cloud API integration for automated template messaging.
  * Direct VAHAN database integration for automated trade-in vehicle valuation.

---

