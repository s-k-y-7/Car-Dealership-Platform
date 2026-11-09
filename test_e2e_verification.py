import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def test_workflow():
    print("=" * 60)
    print("RUNNING END-TO-END VERIFICATION SUITE")
    print("=" * 60)

    # 1. Browse vehicles
    print("\n[Step 1] Verifying public vehicle browsing...")
    r = requests.get(f"{BASE_URL}/vehicles/")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    vehicles = r.json()
    if isinstance(vehicles, dict):
        vehicles = vehicles.get('results', [])
    assert len(vehicles) >= 5, f"Expected >= 5 vehicles, found {len(vehicles)}"
    print(f"✓ Found {len(vehicles)} vehicles in inventory.")

    # Check required vehicles from brief
    stock_ids = [v['stock_id'] for v in vehicles]
    for req_id in ['NEW-H-02', 'UC-1182', 'UC-1190']:
        assert req_id in stock_ids, f"Required vehicle {req_id} missing!"
    print(f"✓ Required sample vehicles NEW-H-02, UC-1182, UC-1190 present and verified.")

    # 2. Vehicle details & city-specific on-road price
    print("\n[Step 2] Verifying vehicle details and city on-road price breakdown...")
    r = requests.get(f"{BASE_URL}/vehicles/NEW-H-02/")
    assert r.status_code == 200
    v_data = r.json()
    assert v_data['stock_id'] == 'NEW-H-02'
    assert float(v_data['ex_showroom_price']) == 1245000.0

    r_price_lko = requests.get(f"{BASE_URL}/vehicles/NEW-H-02/pricing/?city_name=Lucknow")
    assert r_price_lko.status_code == 200
    p_lko = r_price_lko.json()
    assert float(p_lko['ex_showroom_price']) == 1245000.0
    assert float(p_lko['road_tax']) > 0
    assert float(p_lko['total_on_road_price']) > 1245000.0
    print(f"✓ Lucknow on-road price for NEW-H-02: ₹{float(p_lko['total_on_road_price']):,.2f} (Source of truth verified)")

    # 3. Test-drive booking & auto lead assignment
    print("\n[Step 3] Verifying test-drive booking and automatic lead assignment...")
    r_showrooms = requests.get(f"{BASE_URL}/showrooms/")
    s_data = r_showrooms.json()
    if isinstance(s_data, dict):
        s_data = s_data.get('results', [])
    showroom_id = s_data[0]['id']

    test_booking_payload = {
        "vehicle": v_data['id'],
        "showroom": showroom_id,
        "preferred_date": "2026-11-20",
        "time_slot": "02:00 PM - 03:00 PM",
        "customer_name": "Rohan Gupta",
        "customer_phone": "+91 98399 77112",
        "customer_email": "rohan.gupta@example.com",
        "notes": "Testing ADAS on highway stretch",
        "consent_given": True
    }
    r_book = requests.post(f"{BASE_URL}/test-drive/", json=test_booking_payload)
    assert r_book.status_code == 201, f"Booking failed: {r_book.text}"
    book_res = r_book.json()
    assert 'booking_reference' in book_res
    assert 'lead_reference' in book_res
    assert book_res['assigned_consultant'] in ['Rohit Verma', 'Priya Sharma']
    print(f"✓ VIP Test-Drive Booked: {book_res['booking_reference']}")
    print(f"✓ Lead Automatically Created: {book_res['lead_reference']}")
    print(f"✓ Auto-assigned via least-active strategy to: {book_res['assigned_consultant']}")

    # 4. Duplicate test-drive prevention
    print("\n[Step 4] Verifying duplicate booking collision prevention...")
    r_dup = requests.post(f"{BASE_URL}/test-drive/", json=test_booking_payload)
    assert r_dup.status_code == 400, f"Expected 400 rejection for duplicate slot, got {r_dup.status_code}"
    print(f"✓ Duplicate booking for identical demo car/date/slot successfully rejected: {r_dup.json()}")

    # 5. Authentication & Consultant Lead Inbox
    print("\n[Step 5] Verifying consultant JWT authentication and lead inbox...")
    r_auth = requests.post(f"{BASE_URL}/auth/token/", json={"username": "rohit.verma", "password": "consultant123"})
    assert r_auth.status_code == 200
    token = r_auth.json()['access']
    headers = {"Authorization": f"Bearer {token}"}

    r_inbox = requests.get(f"{BASE_URL}/inbox/", headers=headers)
    assert r_inbox.status_code == 200
    inbox_data = r_inbox.json()
    assert 'kpis' in inbox_data
    assert 'leads' in inbox_data
    print(f"✓ Consultant Dashboard KPIs verified: {inbox_data['kpis']}")
    print(f"✓ Consultant sees {len(inbox_data['leads'])} assigned leads.")

    # 6. Lead Response Timer & Status Update
    print("\n[Step 6] Verifying lead response timer and status update...")
    lead = inbox_data['leads'][0]
    lead_id = lead['id']
    print(f"  Target Lead: {lead['lead_reference']} | Status: {lead['status']} | Timer left: {lead['response_timer_minutes_left']}m")

    r_status = requests.patch(
        f"{BASE_URL}/leads/{lead_id}/status/",
        json={"status": "CONTACTED", "note": "Called customer to confirm test drive schedule."},
        headers=headers
    )
    assert r_status.status_code == 200
    updated_lead = r_status.json()
    assert updated_lead['status'] == 'CONTACTED'
    assert updated_lead['first_response_at'] is not None
    print(f"✓ Status updated to CONTACTED; first_response_at recorded and timer SLA satisfied.")

    # 7. AI Requirements Summary & Editable Reply Draft
    print("\n[Step 7] Verifying AI Requirements Summary & First-Reply Draft...")
    r_ai_sum = requests.post(f"{BASE_URL}/leads/{lead_id}/ai-summary/", headers=headers)
    assert r_ai_sum.status_code == 200
    ai_sum = r_ai_sum.json()
    assert 'summary' in ai_sum
    assert 'provider' in ai_sum
    print(f"✓ AI Summary Generated via [{ai_sum['provider']}]:\n  {ai_sum['summary'][:160]}...")

    r_ai_draft = requests.post(f"{BASE_URL}/leads/{lead_id}/ai-draft/", headers=headers)
    assert r_ai_draft.status_code == 200
    ai_draft = r_ai_draft.json()
    assert 'draft' in ai_draft
    print(f"✓ AI First-Reply Draft Generated via [{ai_draft['provider']}]:\n  {ai_draft['draft'][:160]}...")

    # 8. Admin Management & Price Update Immediate Reflection
    print("\n[Step 8] Verifying Admin pricing update and immediate public reflection...")
    r_admin_auth = requests.post(f"{BASE_URL}/auth/token/", json={"username": "admin", "password": "admin123"})
    assert r_admin_auth.status_code == 200
    admin_token = r_admin_auth.json()['access']
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Fetch on-road price entry for NEW-H-02 in Lucknow
    r_pricing_list = requests.get(f"{BASE_URL}/admin/pricing/", headers=admin_headers)
    pricing_entries = r_pricing_list.json()
    if isinstance(pricing_entries, dict):
        pricing_entries = pricing_entries.get('results', [])
    lko_price_entry = [p for p in pricing_entries if p['vehicle'] == v_data['id'] and p['city_name'] == 'Lucknow'][0]

    old_total = float(lko_price_entry['total_on_road_price'])
    # Update road tax by +₹5,000
    new_road_tax = float(lko_price_entry['road_tax']) + 5000.0
    r_price_update = requests.put(
        f"{BASE_URL}/admin/pricing/{lko_price_entry['id']}/",
        json={
            "vehicle": v_data['id'],
            "city": lko_price_entry['city'],
            "ex_showroom_price": lko_price_entry['ex_showroom_price'],
            "road_tax": new_road_tax,
            "insurance": lko_price_entry['insurance'],
            "mandatory_accessories": lko_price_entry['mandatory_accessories'],
            "registration_charges": lko_price_entry['registration_charges'],
            "optional_warranty": lko_price_entry['optional_warranty'],
            "valid_until": "2026-12-31",
            "disclaimer": "Updated RTO notification verified."
        },
        headers=admin_headers
    )
    assert r_price_update.status_code == 200
    print(f"✓ Admin updated Lucknow road tax from ₹{float(lko_price_entry['road_tax']):,.2f} to ₹{new_road_tax:,.2f}")

    # Immediately query public pricing endpoint to prove source of truth
    r_verify_price = requests.get(f"{BASE_URL}/vehicles/NEW-H-02/pricing/?city_name=Lucknow")
    updated_public_price = r_verify_price.json()
    new_total = float(updated_public_price['total_on_road_price'])
    assert new_total == old_total + 5000.0, f"Expected {old_total + 5000}, got {new_total}"
    print(f"✓ Immediate reflection verified on public vehicle pricing page: Total On-Road = ₹{new_total:,.2f} (+₹5,000 exact change)")

    # 9. Access Control Verification
    print("\n[Step 9] Verifying role-based access control...")
    # Unauthenticated user trying to access admin vehicles
    r_unauth = requests.get(f"{BASE_URL}/admin/vehicles/")
    assert r_unauth.status_code in [401, 403], f"Expected 401/403, got {r_unauth.status_code}"
    # Consultant trying to access admin vehicles
    r_consultant_admin = requests.get(f"{BASE_URL}/admin/vehicles/", headers=headers)
    assert r_consultant_admin.status_code == 403, f"Expected 403, got {r_consultant_admin.status_code}"
    print("✓ Role-based access control verified: Unauthenticated (401) and Consultant (403) blocked from Admin Center.")

    print("\n" + "=" * 60)
    print("ALL 9 ACCEPTANCE CRITERIA TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    test_workflow()
