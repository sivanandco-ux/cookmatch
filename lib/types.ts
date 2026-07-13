export type CookStatus = 'pending' | 'active' | 'watch' | 'training' | 'dormant'
// price_unit is a free-text DB column — 'hourly' and 'per_session' are the
// known values checked against directly, 'per_item' is the per-item pricing
// mode, and (string & {}) preserves those literals for autocomplete while
// still accepting any custom unit text (e.g. "dozen cookies").
export type PriceUnit = 'hourly' | 'per_session' | 'per_item' | (string & {})
export type SessionType = 'one_time' | 'recurring'
export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly'
export type JobCategory = 'family_cooking' | 'small_event' | 'medium_event'
export type GrocerySituation = 'client_has_everything' | 'need_grocery_pickup' | 'cook_brings_ingredients'
export type JobPostStatus = 'open' | 'taken' | 'done' | 'expired'
export type BookingStatus = 'legacy' | 'pending' | 'cook_interested' | 'confirmed' | 'in_progress' | 'cancelled' | 'completed'
export type JobInterestStatus = 'pending' | 'accepted' | 'rejected'

export interface Cook {
  id: string
  name: string
  email: string
  phone: string
  whatsapp: string | null
  bio: string
  tagline: string
  video_url: string | null
  photo_url: string | null
  cuisine_types: string[]
  dietary_specialties: string[]
  occasion_types: string[]
  languages: string[]
  price_min: number
  price_max: number
  price_unit: PriceUnit
  min_hours: number | null
  service_areas: string[]
  group_size_min: number
  group_size_max: number
  signature_dishes: string
  years_experience: number
  available_recurring: boolean
  recurring_options: RecurringFrequency[]
  status: CookStatus
  // V0 additions
  job_categories: JobCategory[]
  does_cleanup: boolean
  grocery_pickup: boolean
  grocery_pickup_charge: number | null
  created_at: string
}

export interface CookVerification {
  id: string
  cook_id: string
  id_verified: boolean
  id_verified_at: string | null
  background_check_passed: boolean
  background_check_at: string | null
  food_handler_certified: boolean
  food_handler_expiry: string | null
  references_verified: boolean
  created_at: string
}

export interface CookScore {
  id: string
  cook_id: string
  overall_score: number
  cleanliness_avg: number
  punctuality_avg: number
  taste_avg: number
  respect_avg: number
  clean_appearance_avg: number
  session_count: number
  response_rate: number
  verification_score: number
  training_complete: boolean
  trust_score: number
  updated_at: string
}

export interface Booking {
  id: string
  cook_id: string
  client_name: string
  client_email: string
  client_phone: string
  session_type: SessionType
  recurring_frequency: RecurringFrequency | null
  preferred_date: string
  group_size: string
  cuisine_needs: string
  dietary_needs: string
  occasion_type: string
  notes: string
  discount_code_sent: boolean
  cook_notified: boolean
  // V0 session brief additions
  job_category: JobCategory | null
  occasion: string | null
  specific_dishes: string | null
  num_dishes: number | null
  preferred_time: string | null
  expected_duration_hours: number | null
  num_people: number | null
  dietary_restrictions: string[] | null
  grocery_situation: GrocerySituation | null
  cleanup_needed: boolean
  kitchen_access_time: string | null
  city: string | null
  parking_available: boolean
  language_preferred: string | null
  text_description: string | null
  voice_memo_url: string | null
  status: BookingStatus
  cook_interested_at: string | null
  confirmed_at: string | null
  started_at: string | null
  cancelled_at: string | null
  cancelled_by: 'client' | 'cook' | null
  created_at: string
}

export interface JobPost {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  job_category: JobCategory
  occasion: string
  specific_dishes: string | null
  num_dishes: number
  requested_date: string
  requested_time: string
  expected_duration_hours: number
  num_people: number
  dietary_restrictions: string[]
  grocery_situation: GrocerySituation
  cleanup_needed: boolean
  kitchen_access_time: string
  city: string
  parking_available: boolean
  language_preferred: string | null
  recurring: boolean
  voice_memo_url: string
  additional_notes: string | null
  status: JobPostStatus
  assigned_cook_id: string | null
  confirmed_at: string | null
  completed_at: string | null
  expired_at: string | null
  created_at: string
  updated_at: string
}

export interface JobPostPublic {
  id: string
  job_category: JobCategory
  occasion: string
  num_dishes: number
  requested_date: string
  requested_time: string
  expected_duration_hours: number
  num_people: number
  dietary_restrictions: string[]
  grocery_situation: GrocerySituation
  cleanup_needed: boolean
  city: string
  recurring: boolean
  status: JobPostStatus
  created_at: string
}

export interface JobInterest {
  id: string
  job_post_id: string
  cook_id: string
  expressed_at: string
  status: JobInterestStatus
}

export interface ClientCancellation {
  id: string
  client_email: string
  booking_id: string | null
  job_post_id: string | null
  session_date: string
  hours_before_session: number
  within_48hrs: boolean
  cancelled_at: string
}

export interface CookRating {
  id: string
  cook_id: string
  booking_id: string
  cleanliness: number
  punctuality: number
  taste: number
  respect: number
  clean_appearance: number
  overall_avg: number
  notes: string
  created_at: string
}

export interface ClientRating {
  id: string
  cook_id: string
  booking_id: string
  respect_courtesy: number
  clear_instructions: number
  timely_payment: number
  supplies_available: number
  would_cook_again: number
  overall_avg: number
  created_at: string
}

export interface CookDish {
  id: string
  cook_id: string
  photo_url: string
  description: string
  sort_order: number
  created_at: string
}

export interface CookWithDetails extends Cook {
  cook_verifications: CookVerification | null
  cook_scores: CookScore | null
  cook_ratings: CookRating[]
  cook_dishes: CookDish[]
}

export interface SessionBriefFormData {
  client_name: string
  client_email: string
  client_phone: string
  job_category: JobCategory
  occasion: string
  specific_dishes: string
  num_dishes: number
  preferred_date: string
  preferred_time: string
  expected_duration_hours: number
  num_people: number
  dietary_restrictions: string[]
  grocery_situation: GrocerySituation
  cleanup_needed: boolean
  kitchen_access_time: string
  city: string
  parking_available: boolean
  language_preferred: string
  recurring: boolean
  text_description: string
  voice_memo_url: string
  additional_notes: string
}
