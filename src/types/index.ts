export interface GolfRange {
  id: string | number
  name: string
  slug?: string
  address: string
  city: string
  county: string
  postcode: string
  phone?: string
  website?: string
  email?: string
  latitude?: number
  longitude?: number
  description?: string
  detailed_description?: string
  facilities?: string[]
  bays?: number
  num_bays?: number
  features?: string
  special_features?: string[]
  pricing?: string
  opening_hours?: {
    [key: string]: string
  } | string
  prices?: {
    [key: string]: string
  }
  images?: string[]
  meta_title?: string
  meta_description?: string
  created_at?: string
  updated_at?: string
  distance?: number | null
}

export interface IndoorSimulator {
  id: string | number
  name: string
  slug?: string
  address: string
  city: string
  county: string
  postcode: string
  phone?: string
  website?: string
  email?: string
  latitude?: number
  longitude?: number
  description?: string
  detailed_description?: string
  simulator_brand?: string
  num_simulators?: number
  simulator_features?: string
  facilities?: string[]
  pricing?: string
  opening_hours?: {
    [key: string]: string
  } | string
  images?: string[]
  meta_title?: string
  meta_description?: string
  created_at?: string
  updated_at?: string
  distance?: number | null
}