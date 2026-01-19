import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VehicleRequest {
  vin: string
  refresh?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { vin, refresh = false }: VehicleRequest = await req.json()

    if (!vin || vin.length !== 17) {
      return new Response(
        JSON.stringify({ error: 'Invalid VIN format. Must be 17 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (!refresh) {
      const { data: existingVehicle, error: dbError } = await supabaseClient
        .from('vehicles')
        .select('*')
        .eq('vin', vin)
        .single()

      if (existingVehicle && !dbError) {
        return new Response(
          JSON.stringify({ vehicle: existingVehicle, source: 'database' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const nhtsaResponse = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
    )

    if (!nhtsaResponse.ok) {
      throw new Error('Failed to fetch from NHTSA')
    }

    const nhtsaData = await nhtsaResponse.json()
    const vehicleData = nhtsaData.Results[0]

    if (vehicleData.ErrorCode !== '0') {
      return new Response(
        JSON.stringify({ error: 'Vehicle not found in NHTSA database' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const vehicleRecord = {
      vin: vin,
      make: vehicleData.Make || 'Unknown',
      model: vehicleData.Model || 'Unknown',
      year: parseInt(vehicleData.ModelYear) || new Date().getFullYear(),
      body_type: vehicleData.BodyClass || null,
      engine_type: vehicleData.EngineModel || null,
      registration_status: 'inactive',
      nhtsa_data: vehicleData,
    }

    const { data: upsertedVehicle, error: upsertError } = await supabaseClient
      .from('vehicles')
      .upsert(vehicleRecord, { onConflict: 'vin' })
      .select()
      .single()

    if (upsertError) {
      console.error('Database error:', upsertError)
      return new Response(
        JSON.stringify({ vehicle: vehicleRecord, source: 'nhtsa', dbError: upsertError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ vehicle: upsertedVehicle, source: 'nhtsa' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
