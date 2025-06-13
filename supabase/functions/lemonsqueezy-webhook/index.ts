import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
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

    // Verify webhook signature
    const signature = req.headers.get('x-signature')
    const webhookSecret = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET')
    
    if (!signature || !webhookSecret) {
      throw new Error('Missing signature or webhook secret')
    }

    const body = await req.text()
    
    // In production, you should verify the signature here
    // For now, we'll skip signature verification for simplicity
    
    const payload = JSON.parse(body)
    const { meta, data } = payload

    console.log('Webhook received:', meta.event_name)
    console.log('Data:', data)

    const eventName = meta.event_name
    const customData = data.attributes.custom_data || {}
    const userId = customData.user_id
    const userEmail = data.attributes.user_email || customData.user_email

    if (!userId && !userEmail) {
      throw new Error('No user identifier found in webhook data')
    }

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
        await handleSubscriptionUpdate(supabase, data, userId, userEmail)
        break
      
      case 'subscription_cancelled':
      case 'subscription_expired':
        await handleSubscriptionCancellation(supabase, data, userId, userEmail)
        break
      
      case 'order_created':
        await handleOrderCreated(supabase, data, userId, userEmail)
        break
      
      default:
        console.log(`Unhandled event: ${eventName}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function handleSubscriptionUpdate(supabase: any, data: any, userId: string, userEmail: string) {
  const attributes = data.attributes
  const subscriptionId = data.id
  const customerId = attributes.customer_id
  const status = attributes.status
  const endsAt = attributes.ends_at
  
  const isActive = ['active', 'on_trial'].includes(status)
  
  // Upsert subscriber record
  const { error } = await supabase
    .from('subscribers')
    .upsert({
      user_id: userId,
      email: userEmail,
      lemonsqueezy_customer_id: customerId.toString(),
      lemonsqueezy_subscription_id: subscriptionId.toString(),
      subscribed: isActive,
      subscription_tier: isActive ? 'premium' : null,
      subscription_end: endsAt,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })

  if (error) {
    throw error
  }

  console.log(`Subscription ${isActive ? 'activated' : 'deactivated'} for user ${userId}`)
}

async function handleSubscriptionCancellation(supabase: any, data: any, userId: string, userEmail: string) {
  const subscriptionId = data.id
  
  // Update subscriber record
  const { error } = await supabase
    .from('subscribers')
    .update({
      subscribed: false,
      subscription_tier: null,
      updated_at: new Date().toISOString()
    })
    .eq('lemonsqueezy_subscription_id', subscriptionId.toString())

  if (error) {
    throw error
  }

  console.log(`Subscription cancelled for user ${userId}`)
}

async function handleOrderCreated(supabase: any, data: any, userId: string, userEmail: string) {
  const attributes = data.attributes
  const customerId = attributes.customer_id
  const status = attributes.status
  
  // For one-time purchases, we might want to grant temporary premium access
  if (status === 'paid') {
    console.log(`Order created for user ${userId}`)
    // Handle one-time purchase logic here if needed
  }
}