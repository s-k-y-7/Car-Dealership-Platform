# Premium Car Dealership Platform — Brand X (Lucknow)
### Authorized Dealer: Company A

A modern digital showroom and CRM platform for **Company A**, the exclusive authorized dealer for Brand X in Lucknow, operating 3 luxury showrooms (Hazratganj, Gomti Nagar, Kanpur Road), 2 master service workshops (Transport Nagar, Alambagh), and a certified pre-owned evaluation yard.

---

## 🌟 Key Features

### 1. Public Digital Showroom & Inventory
* **Automotive Editorial Experience**: Bespoke luxury visual hierarchy with rich typography and vehicle photography.
* **New & Certified Pre-Owned Inventory**: Filter by model, fuel type (Petrol, Diesel, Strong Hybrid, Electric), transmission, and price tier.
* **Realistic Sample Fleet**: Includes prompt-specified models:
  * `NEW-H-02`: Model H, ZX CVT Automatic, Petrol, 2026, ₹12,45,000 ex-showroom.
  * `UC-1182`: Model C, VX Manual, Diesel, 2022, 41,200 km, ₹8,45,000 (Certified 160-Point Warranty).
  * `UC-1190`: Model S, LX Executive, Petrol, 2021, 58,600 km, ₹5,12,000.
  * `NEW-E-01`: Model E Strong Hybrid 2026, 27.1 km/l.
  * `NEW-V-05`: Model V Prestige AWD 7-Seater Luxury SUV.
* **Masked Registration Numbers**: Certified used cars feature privacy-safe registration numbers (e.g. `UP32-**-4412`).

### 2. Live City-Specific On-Road Price Breakdown
* **Database Source of Truth**: Calculated dynamically from the admin-managed `OnRoadPrice` table.
* **Itemized Transparency**:
  * Ex-Showroom Base Price
  * State RTO Registration & Road Safety Tax (Lucknow, Kanpur, Varanasi, Noida)
  * Comprehensive 1-Year OD + 3-Year Third-Party Insurance
  * Mandatory Dealer Accessories Pack & Safety Kit
  * FASTag & Smart Card Statutory Fees
  * Optional Extended Warranty / Roadside Assistance
* **Legal Disclaimer & Tariff Validity Dates**: Clear disclosure on RTO notifications.

### 3. VIP Test-Drive Booking with Duplicate Prevention
* Select showroom, demo vehicle, date, and preferred time slot.
* **Duplicate Prevention**: Database-level unique constraint prevents double-booking of the same demo car and time slot.
* **Automated Lead Creation**: Automatically persists booking, generates tracking codes (`TD-XXXX`, `LD-XXXX`), and initiates auto-assignment.

### 4. Automatic Lead Assignment & SLA Response Timer
* **Least-Active Routing**: Automatically distributes leads among active sales consultants based on their current open pipeline.
* **30-Minute Response SLA**: Real-time response countdown timer with visual alerts and urgent overdue flags for breached response times.
* **Automatic SLA Tracking**: Setting status to `CONTACTED` or logging an outbound reply records `first_response_at` and satisfies the timer.

### 5. AI CRM Copilot (Groq LLM + Transparent Fallback)
* **Buyer Requirements Summary**: Identifies buyer intent and explicitly itemizes missing or ambiguous information.
* **Personalized First-Reply Draft**: Drafts an editable opening message for the consultant, prefilled with showroom details.
* **Strict Guardrails**:
  * Never sends messages automatically; consultant reviews and edits before sending.
  * Never hallucinates unauthorized discounts, fake cashbacks, or delivery dates.
  * Provides a transparent rule-based heuristic fallback when API credentials are absent.

### 6. Custom Admin Center
* Vehicle inventory CRUD (add, edit, remove new and used stock).
* City-wise on-road pricing management: **changes reflect immediately on public vehicle pages**.
* Network management for Lucknow showrooms and workshops.
* Sales consultant workload monitoring.

---

## 🚀 Quick Start

### 1. Clone & Set Up Backend

```bash
# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run migrations and seed database
python backend/manage.py migrate
python backend/manage.py seed_dealership

# Run unit tests
python backend/manage.py test vehicles leads

# Start backend server
python backend/manage.py runserver 127.0.0.1:8000
```

### 2. Set Up Frontend

```bash
cd frontend
npm install
npm run build
npm run dev
```

Visit **`http://127.0.0.1:5173/`** in your browser.

---

## 🔑 Demo Login Accounts

Quick 1-click login buttons are available in the navigation bar:

* **Administrator**: `admin` / `admin123` (Vikramaditya Singhania, General Manager)
* **Sales Consultant 1**: `rohit.verma` / `consultant123` (Rohit Verma, Senior Consultant)
* **Sales Consultant 2**: `priya.sharma` / `consultant123` (Priya Sharma, Relationship Lead)
* **Buyer**: `ananya.dixit` / `buyer123` (Ananya Dixit)

---

## 🧪 Automated End-to-End Verification

Execute the comprehensive test suite verifying all 10 acceptance criteria:

```bash
python test_e2e_verification.py
```

---

## 📚 Documentation Links
* [Technical Design Document (TDD)](technical_design_document.md)
* [Deployment Guide](deployment.md)
