export type CookStatus = 'pending' | 'active' | 'watch' | 'training' | 'dormant'
export type PriceUnit = 'hourly' | 'per_session' | 'per_person' | 'monthly'
export type SessionType = 'one_time' | 'recurring'
export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly'

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
  service_areas: string[]
  group_size_min: number
  group_size_max: number
  signature_dishes: string
  years_experience: number
  available_recurring: boolean
  recurring_options: RecurringFrequency[]
  status: CookStatus
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
  created_at: string
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

export interface CookWithDetails extends Cook {
  cook_verifications: CookVerification | null
  cook_scores: CookScore | null
  cook_ratings: CookRating[]
}
