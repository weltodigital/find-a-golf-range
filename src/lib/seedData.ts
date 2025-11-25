import { supabase } from './supabase'
import { GolfRange } from '@/types'

// Empty sample data - ready for fresh import
const sampleRanges: Omit<GolfRange, 'id' | 'created_at' | 'updated_at'>[] = []

export async function seedDatabase() {
  console.log('Starting database seeding...')

  try {
    // Insert the sample data
    const { data, error } = await supabase
      .from('golf_ranges')
      .insert(sampleRanges)

    if (error) {
      console.error('Error seeding database:', error)
      return false
    }

    console.log('Database seeded successfully with', sampleRanges.length, 'golf ranges')
    return true
  } catch (error) {
    console.error('Unexpected error during seeding:', error)
    return false
  }
}