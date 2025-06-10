
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { fileId, fileName } = await req.json()

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('receipts')
      .download(fileName)

    if (downloadError) {
      throw downloadError
    }

    // Convert file to base64 for processing
    const arrayBuffer = await fileData.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    // Mock processing - in production, you would integrate with OCR/AI services
    // This simulates the receipt processing without exposing external API keys
    const mockProcessedData = [{
      merchant: "Sample Store",
      date: new Date().toISOString().split('T')[0],
      total: "25.99",
      items: [
        { description: "Sample Item 1", amount: "15.99", category: "Food" },
        { description: "Sample Item 2", amount: "10.00", category: "Beverage" }
      ]
    }]

    // Update the database record
    const { error: updateError } = await supabase
      .from('processed_files')
      .update({
        status: 'completed',
        merchant: mockProcessedData[0].merchant,
        total: parseFloat(mockProcessedData[0].total),
        item_count: mockProcessedData[0].items.length,
        processed_data: mockProcessedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId)
      .eq('user_id', user.id)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ receipts: mockProcessedData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error processing receipt:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
