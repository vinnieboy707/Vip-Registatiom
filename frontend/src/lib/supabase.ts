import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:8000'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-application-name': 'dmv-registration-platform'
    }
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'agent' | 'customer'
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          last_login: string | null
        }
      }
      vehicles: {
        Row: {
          id: string
          vin: string
          license_plate: string | null
          make: string
          model: string
          year: number
          color: string | null
          body_type: string | null
          engine_type: string | null
          current_owner_id: string | null
          current_owner_name: string | null
          current_owner_address: string | null
          registration_status: 'active' | 'inactive' | 'expired' | 'suspended'
          registration_expiry: string | null
          is_stolen: boolean
          nhtsa_data: any
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
