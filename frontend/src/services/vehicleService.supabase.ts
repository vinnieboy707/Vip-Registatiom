import { supabase } from '../lib/supabase'

export const vehicleService = {
  /**
   * Get vehicle by VIN using Supabase Edge Function
   */
  async getVehicleByVIN(vin: string, refresh = false) {
    const { data, error } = await supabase.functions.invoke('vehicle-lookup', {
      body: { vin, refresh }
    })

    if (error) throw error
    return data
  },

  /**
   * Search vehicles in database
   */
  async searchVehicles(query: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .or(`vin.ilike.%${query}%,make.ilike.%${query}%,model.ilike.%${query}%,license_plate.ilike.%${query}%`)
      .limit(50)

    if (error) throw error
    return data
  },

  /**
   * Get registration status and records
   */
  async getRegistrationStatus(vin: string) {
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('vin', vin)
      .single()

    if (vehicleError) throw vehicleError

    const { data: records, error: recordsError } = await supabase
      .from('registration_records')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .order('registration_date', { ascending: false })

    if (recordsError) throw recordsError

    return {
      vin: vehicle.vin,
      status: vehicle.registration_status,
      expiry: vehicle.registration_expiry,
      licensePlate: vehicle.license_plate,
      records
    }
  },

  /**
   * Get registration fees using Edge Function
   */
  async getRegistrationFees(vin: string, type: 'new' | 'renewal' | 'transfer') {
    const { data, error } = await supabase.functions.invoke('calculate-fees', {
      body: { vin, registrationType: type }
    })

    if (error) throw error
    return data
  },

  /**
   * Create registration using Edge Function
   */
  async createRegistration(registrationData: {
    vin: string
    registrationType: 'new' | 'renewal' | 'transfer'
    locationFiled?: string
    notes?: string
  }) {
    const { data, error } = await supabase.functions.invoke('create-registration', {
      body: registrationData
    })

    if (error) throw error
    return data
  },

  /**
   * Get ownership history
   */
  async getOwnershipHistory(vin: string) {
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, vin, current_owner_name')
      .eq('vin', vin)
      .single()

    if (vehicleError) throw vehicleError

    const { data: history, error: historyError } = await supabase
      .from('ownership_history')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .order('start_date', { ascending: false })

    if (historyError) throw historyError

    return {
      vin: vehicle.vin,
      currentOwner: vehicle.current_owner_name,
      history
    }
  },

  /**
   * Subscribe to vehicle updates (Real-time)
   */
  subscribeToVehicleUpdates(vin: string, callback: (payload: any) => void) {
    return supabase
      .channel(`vehicle:${vin}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles',
          filter: `vin=eq.${vin}`
        },
        callback
      )
      .subscribe()
  }
}
