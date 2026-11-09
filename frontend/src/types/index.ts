export type UserRole = 'BUYER' | 'CONSULTANT' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  is_active_consultant?: boolean;
  active_leads_count?: number;
}

export interface City {
  id: number;
  name: string;
  state: string;
  rto_code: string;
  is_active: boolean;
  display_order: number;
}

export type ShowroomType = 'SHOWROOM' | 'SERVICE_WORKSHOP' | 'USED_CAR_YARD';

export interface Showroom {
  id: number;
  name: string;
  showroom_type: ShowroomType;
  city: number;
  city_name: string;
  address: string;
  pincode: string;
  phone: string;
  email: string;
  opening_hours: string;
  has_test_drive: boolean;
  is_active: boolean;
}

export interface OnRoadPrice {
  id: number;
  vehicle: number;
  city: number;
  city_name: string;
  city_rto: string;
  ex_showroom_price: string;
  road_tax: string;
  insurance: string;
  mandatory_accessories: string;
  registration_charges: string;
  optional_warranty: string;
  total_on_road_price: string;
  valid_until: string;
  disclaimer: string;
  updated_at: string;
}

export interface Vehicle {
  id: number;
  stock_id: string;
  vehicle_type: 'NEW' | 'USED';
  brand: string;
  model_name: string;
  variant: string;
  year: number;
  fuel_type: 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';
  transmission: 'MANUAL' | 'AUTOMATIC' | 'CVT' | 'EV';
  body_type: 'SEDAN' | 'SUV' | 'HATCHBACK';
  color: string;
  color_hex: string;
  seating_capacity?: number;
  engine_capacity?: string;
  max_power?: string;
  max_torque?: string;
  fuel_efficiency?: string;
  ex_showroom_price: string;
  availability: 'AVAILABLE' | 'BOOKED' | 'SOLD_OUT';
  is_featured: boolean;
  hero_image: string;
  gallery?: string[];
  features?: string[];
  specifications?: Record<string, string>;
  
  // Used car specifics
  registration_number?: string;
  masked_registration_number?: string;
  odometer_km?: number;
  owner_count?: number;
  is_certified?: boolean;
  warranty_info?: string;
  inspection_report_summary?: string;
  
  on_road_prices?: OnRoadPrice[];
  created_at?: string;
  updated_at?: string;
}

export interface TestDriveBooking {
  id: number;
  booking_reference: string;
  vehicle: number;
  vehicle_details?: Vehicle;
  showroom: number;
  showroom_details?: Showroom;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  preferred_date: string;
  time_slot: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes: string;
  consent_given: boolean;
  created_at: string;
}

export interface LeadActivity {
  id: number;
  activity_type: string;
  details: string;
  performer_name: string | null;
  created_at: string;
}

export interface AIInteraction {
  id: number;
  action_type: 'SUMMARY' | 'FIRST_REPLY';
  prompt_context: string;
  response_text: string;
  provider: string;
  model: string;
  is_fallback: boolean;
  consultant_name: string;
  created_at: string;
}

export interface Lead {
  id: number;
  lead_reference: string;
  source: 'TEST_DRIVE' | 'WEBSITE_ENQUIRY' | 'PRICE_QUOTE' | 'USED_CAR_INQUIRY' | 'WALK_IN' | 'SOCIAL_MEDIA';
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_city: string;
  interested_vehicle: number | null;
  vehicle_name?: string;
  vehicle_details?: Vehicle;
  test_drive_booking?: TestDriveBooking;
  budget_range: string;
  requirements_notes: string;
  status: 'NEW' | 'ASSIGNED' | 'CONTACTED' | 'TEST_DRIVE_SCHEDULED' | 'NEGOTIATION' | 'WON' | 'LOST';
  priority: 'HOT' | 'WARM' | 'COLD';
  assigned_consultant: number | null;
  consultant_name?: string;
  consultant_details?: User;
  assigned_at: string | null;
  first_response_at: string | null;
  response_due_minutes?: number;
  is_response_overdue: boolean;
  response_timer_minutes_left: number | null;
  consent_data_processing: boolean;
  opt_out_marketing?: boolean;
  activities?: LeadActivity[];
  ai_interactions?: AIInteraction[];
  created_at: string;
  updated_at?: string;
}

export interface DashboardKPIs {
  total_assigned: number;
  new_leads: number;
  pending_responses: number;
  overdue_responses: number;
  contacted_leads: number;
  test_drive_scheduled: number;
  converted_leads: number;
}
