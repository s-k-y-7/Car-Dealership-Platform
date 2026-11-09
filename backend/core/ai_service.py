import os
import json
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

def generate_lead_summary(lead):
    """
    Summarize buyer requirements from enquiries.
    Uses Groq API if GROQ_API_KEY is configured; otherwise provides a transparent heuristic fallback.
    Explicitly highlights missing/ambiguous details.
    Does NOT fabricate discounts or availability.
    """
    groq_api_key = getattr(settings, 'GROQ_API_KEY', '') or os.getenv('GROQ_API_KEY', '')
    
    # Extract verified lead facts
    vehicle_info = "None specified"
    if lead.interested_vehicle:
        v = lead.interested_vehicle
        vehicle_info = f"{v.brand} {v.model_name} {v.variant} ({v.year}) - {v.get_fuel_type_display()}, Ex-showroom: ₹{v.ex_showroom_price:,.0f}, Status: {v.get_availability_display()}"
    
    td_info = "No test drive requested"
    if lead.test_drive_booking:
        tb = lead.test_drive_booking
        td_info = f"Requested for {tb.preferred_date} ({tb.time_slot}) at {tb.showroom.name}"

    context = f"""
Customer Name: {lead.customer_name}
Contact: {lead.customer_phone} / {lead.customer_email or 'Not provided'}
City: {lead.customer_city}
Source: {lead.get_source_display()}
Interested Vehicle: {vehicle_info}
Test Drive: {td_info}
Stated Budget: {lead.budget_range or 'Not specified'}
Customer Notes / Message: {lead.requirements_notes or 'No additional notes provided'}
Consent Provided: {'Yes' if lead.consent_data_processing else 'No'}
"""

    if groq_api_key and groq_api_key.strip():
        try:
            headers = {
                'Authorization': f'Bearer {groq_api_key.strip()}',
                'Content-Type': 'application/json'
            }
            system_prompt = (
                "You are an executive automotive CRM assistant for Brand X Lucknow authorized dealership. "
                "Analyze the customer enquiry and produce a structured summary for the sales consultant. "
                "CRITICAL RULES:\n"
                "1. Summarize verified facts: Buyer intent, vehicle of interest, timeline/urgency, and key requirements.\n"
                "2. Explicitly label any MISSING or AMBIGUOUS information (e.g., financing need, trade-in vehicle, preferred color).\n"
                "3. Never invent prices, unauthorized discounts, or imaginary stock.\n"
                "4. Keep the summary concise, professional, and directly actionable for the consultant."
            )
            payload = {
                "model": getattr(settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile'),
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Enquiry details:\n{context}\n\nPlease generate the structured requirements summary."}
                ],
                "temperature": 0.2,
                "max_tokens": 500
            }
            resp = requests.post(
                getattr(settings, 'GROQ_API_URL', 'https://api.groq.com/openai/v1/chat/completions'),
                headers=headers,
                json=payload,
                timeout=12
            )
            if resp.status_code == 200:
                result = resp.json()
                content = result['choices'][0]['message']['content'].strip()
                return {
                    "provider": "Groq LLM",
                    "model": getattr(settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile'),
                    "is_fallback": False,
                    "summary": content
                }
            else:
                logger.warning(f"Groq API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Error calling Groq API for summary: {e}")

    # Transparent Heuristic Fallback
    missing_items = []
    if not lead.budget_range:
        missing_items.append("Budget / purchase price limit")
    if not lead.customer_email:
        missing_items.append("Verified email address")
    if not lead.test_drive_booking:
        missing_items.append("Test-drive date & showroom preference")
    missing_items.append("Financing vs. upfront purchase preference")
    missing_items.append("Existing vehicle exchange / trade-in evaluation")

    missing_text = "\n".join([f"• {item}" for item in missing_items])

    fallback_summary = f"""**Customer Profile**: {lead.customer_name} ({lead.customer_city}) via {lead.get_source_display()}
**Primary Interest**: {vehicle_info}
**Test Drive**: {td_info}
**Stated Notes**: {lead.requirements_notes or 'Customer reached out for pricing and vehicle availability details.'}

**Identified Missing / Ambiguous Details**:
{missing_text}

**Recommended Next Step**:
Call customer at {lead.customer_phone} to verify delivery timeline and invite for showroom visit."""

    return {
        "provider": "Rule-Based Heuristic Engine (Fallback: Groq API Key Not Set)",
        "model": "rule-based-automotive-v1",
        "is_fallback": True,
        "summary": fallback_summary
    }


def generate_first_reply_draft(lead, consultant):
    """
    Generate an editable, personalized first-reply draft for the sales consultant.
    The sales consultant must review and edit before sending.
    Does NOT fabricate unapproved discounts or vehicle delivery promises.
    """
    groq_api_key = getattr(settings, 'GROQ_API_KEY', '') or os.getenv('GROQ_API_KEY', '')
    
    vehicle_str = "Brand X vehicle range"
    price_info = "official dealership pricing"
    if lead.interested_vehicle:
        v = lead.interested_vehicle
        vehicle_str = f"Brand X {v.model_name} {v.variant} ({v.year})"
        price_info = f"ex-showroom price of ₹{v.ex_showroom_price:,.0f}"

    consultant_name = consultant.full_name or consultant.first_name or "Sales Consultant"
    showroom_name = "Brand X Hazratganj Flagship Showroom, Lucknow"
    if lead.test_drive_booking:
        showroom_name = lead.test_drive_booking.showroom.name

    context = f"""
Customer Name: {lead.customer_name}
Consultant Name: {consultant_name}
Dealership: Company A - Brand X Authorized Dealer, Lucknow
Showroom: {showroom_name}
Vehicle: {vehicle_str} ({price_info})
Source: {lead.get_source_display()}
Customer Message: {lead.requirements_notes or 'Enquiry regarding vehicle details'}
Test Drive Booking: {'Requested' if lead.test_drive_booking else 'Not yet requested'}
"""

    if groq_api_key and groq_api_key.strip():
        try:
            headers = {
                'Authorization': f'Bearer {groq_api_key.strip()}',
                'Content-Type': 'application/json'
            }
            system_prompt = (
                "You are an executive sales assistant at Company A, an authorized Brand X dealer in Lucknow. "
                "Draft a polite, highly personalized first email/WhatsApp reply from the sales consultant to the customer. "
                "MANDATORY REQUIREMENTS:\n"
                "1. Address the customer by name with high courtesy.\n"
                "2. Reference the exact vehicle they enquired about.\n"
                "3. If a test drive was booked, acknowledge the date and showroom; if not, cordially invite them to experience the car at the showroom.\n"
                "4. Ask 1-2 pertinent clarifying questions (e.g. expected delivery month, trade-in car preference).\n"
                "5. NEVER promise discounts, fake cashbacks, or fabricate instant delivery without stock check.\n"
                "6. Sign off with the consultant's name, designation, and dealership showroom details.\n"
                "7. Output ONLY the editable reply message text."
            )
            payload = {
                "model": getattr(settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile'),
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Context:\n{context}\n\nDraft the first reply:"}
                ],
                "temperature": 0.4,
                "max_tokens": 600
            }
            resp = requests.post(
                getattr(settings, 'GROQ_API_URL', 'https://api.groq.com/openai/v1/chat/completions'),
                headers=headers,
                json=payload,
                timeout=12
            )
            if resp.status_code == 200:
                result = resp.json()
                content = result['choices'][0]['message']['content'].strip()
                return {
                    "provider": "Groq LLM",
                    "model": getattr(settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile'),
                    "is_fallback": False,
                    "draft": content
                }
            else:
                logger.warning(f"Groq API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Error calling Groq API for draft: {e}")

    # Transparent Heuristic Fallback
    test_drive_section = ""
    if lead.test_drive_booking:
        tb = lead.test_drive_booking
        test_drive_section = (
            f"We have noted your preferred test-drive schedule for {tb.preferred_date} "
            f"during the {tb.time_slot} window at our {tb.showroom.name}. Our demo specialist "
            f"is preparing the vehicle for you."
        )
    else:
        test_drive_section = (
            f"I would be delighted to arrange a VIP test drive for you at your convenience "
            f"at our {showroom_name}, or right at your doorstep in Lucknow."
        )

    fallback_draft = f"""Dear {lead.customer_name},

Greetings from Company A — Brand X Authorized Dealership, Lucknow.

Thank you for your interest in the {vehicle_str}. My name is {consultant_name}, and I will be your dedicated Senior Product Consultant to assist you with complete vehicle specifications, personalized finance solutions, and city-specific on-road pricing.

{test_drive_section}

To help tailor the best ownership package for you:
1. Would you like our city-specific on-road price quotation including Lucknow RTO and corporate insurance options?
2. Do you have an existing vehicle you would like our certified evaluation team to appraise for exchange?

Please let me know a convenient time to connect briefly, or feel free to reply to this message directly.

Warm regards,

{consultant_name}
Senior Sales Consultant
Company A | Brand X Authorized Dealer
{showroom_name}
Lucknow, Uttar Pradesh
Direct: {consultant.phone or '+91 98390 12345'}"""

    return {
        "provider": "Rule-Based Automotive Engine (Fallback: Groq API Key Not Set)",
        "model": "rule-based-reply-v1",
        "is_fallback": True,
        "draft": fallback_draft
    }
