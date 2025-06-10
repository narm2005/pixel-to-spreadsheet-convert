
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

    const { data, format, userId } = await req.json()

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user || user.id !== userId) {
      throw new Error('Unauthorized')
    }

    let content: string
    let contentType: string
    let filename: string

    if (format === 'json') {
      content = JSON.stringify(data, null, 2)
      contentType = 'application/json'
      filename = `receipt-data-${Date.now()}.json`
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = ['Description', 'Amount', 'Category']
      const rows = data[0]?.items?.map((item: any) => 
        [item.description, item.amount, item.category || '']
      ) || []
      
      content = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      contentType = 'text/csv'
      filename = `receipt-data-${Date.now()}.csv`
    } else {
      // Excel format - simplified as CSV for this implementation
      const headers = ['Description', 'Amount', 'Category']
      const rows = data[0]?.items?.map((item: any) => 
        [item.description, item.amount, item.category || '']
      ) || []
      
      content = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      contentType = 'application/vnd.ms-excel'
      filename = `receipt-data-${Date.now()}.xls`
    }

    return new Response(
      JSON.stringify({ content, contentType, filename }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error exporting data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
