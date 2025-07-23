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

  console.log('📊 Update-expense-analytics function called')
  console.log('📝 Request method:', req.method)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('✅ Supabase client created for analytics')

    const { fileId, userId, merchant, total, category, date } = await req.json()
    console.log('📄 Analytics request payload:', { 
      fileId, 
      userId, 
      merchant, 
      total, 
      category, 
      date 
    })

    // Extract month-year from date
    const monthYear = date ? date.substring(0, 7) : new Date().toISOString().substring(0, 7)
    const categoryName = category || 'uncategorized'
    const amount = parseFloat(total) || 0

    console.log('🔍 Processed analytics data:', { 
      monthYear, 
      categoryName, 
      amount 
    })
    // Update or insert analytics record
    console.log('🔍 Checking for existing analytics record...')
    const { data: existingRecord, error: fetchError } = await supabase
      .from('expense_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .eq('category', categoryName)
      .single()

    console.log('📊 Existing record check:', { 
      hasExisting: !!existingRecord, 
      fetchError: fetchError?.code,
      existingId: existingRecord?.id 
    })
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching existing analytics record:', fetchError)
      throw fetchError
    }

    if (existingRecord) {
      // Update existing record
      console.log('🔄 Updating existing analytics record:', existingRecord.id)
      const { error: updateError } = await supabase
        .from('expense_analytics')
        .update({
          total_amount: existingRecord.total_amount + amount,
          transaction_count: existingRecord.transaction_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)

      if (updateError) {
        console.error('❌ Error updating analytics record:', updateError)
        throw updateError
      }
      console.log('✅ Analytics record updated successfully')
    } else {
      // Insert new record
      console.log('➕ Creating new analytics record')
      const { error: insertError } = await supabase
        .from('expense_analytics')
        .insert({
          user_id: userId,
          month_year: monthYear,
          category: categoryName,
          total_amount: amount,
          transaction_count: 1
        })

      if (insertError) {
        console.error('❌ Error inserting analytics record:', insertError)
        throw insertError
      }
      console.log('✅ New analytics record created successfully')
    }

    console.log('🎉 Analytics update completed successfully')

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Fatal error in update-expense-analytics:', {
      error,
      message: error.message,
      stack: error.stack
    })
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})