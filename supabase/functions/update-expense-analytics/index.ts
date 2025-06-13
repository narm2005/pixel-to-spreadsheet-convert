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

    const { fileId, userId, merchant, total, category, date } = await req.json()

    // Extract month-year from date
    const monthYear = date ? date.substring(0, 7) : new Date().toISOString().substring(0, 7)
    const categoryName = category || 'uncategorized'
    const amount = parseFloat(total) || 0

    // Update or insert analytics record
    const { data: existingRecord, error: fetchError } = await supabase
      .from('expense_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .eq('category', categoryName)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('expense_analytics')
        .update({
          total_amount: existingRecord.total_amount + amount,
          transaction_count: existingRecord.transaction_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)

      if (updateError) throw updateError
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('expense_analytics')
        .insert({
          user_id: userId,
          month_year: monthYear,
          category: categoryName,
          total_amount: amount,
          transaction_count: 1
        })

      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error updating analytics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})