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

  console.log('🚀 Process-receipt function called')
  console.log('📝 Request method:', req.method)
  console.log('📝 Request headers:', Object.fromEntries(req.headers.entries()))

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('✅ Supabase client created')

    const { fileIds, fileNames } = await req.json()
    console.log('📄 Request payload:', { fileIds, fileNames })

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    console.log('🔑 Auth token length:', token?.length || 0)

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    console.log('👤 User verification:', { 
      hasUser: !!user, 
      userId: user?.id, 
      userEmail: user?.email,
      authError: authError?.message 
    })
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      throw new Error('Unauthorized')
    }

    // Check if user can upload these files (pricing logic)
    const fileCount = Array.isArray(fileIds) ? fileIds.length : 1
    console.log('📊 Checking upload permission for:', { userId: user.id, fileCount })
    
    const { data: canUpload, error: checkError } = await supabase.rpc('can_user_upload', {
      user_uuid: user.id,
      new_file_count: fileCount
    })

    console.log('🔍 Upload permission check result:', { canUpload, checkError })
    if (checkError) {
      console.error('❌ Error checking upload permission:', checkError)
      throw new Error('Failed to check upload permission')
    }

    if (!canUpload) {
      // Get current file count for better error message
      const { data: currentCount } = await supabase.rpc('get_user_file_count', {
        user_uuid: user.id
      })

      console.log('❌ Upload limit exceeded:', { currentCount, newFiles: fileCount })

      return new Response(
        JSON.stringify({ 
          error: 'USAGE_LIMIT_EXCEEDED',
          message: `You have reached the limit of your free plan. Current usage: ${currentCount}/10 files. Please upgrade to continue processing files.`,
          upgradeUrl: '/pricing'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        },
      )
    }

    console.log('✅ Upload permission granted, starting file processing...')

    // Process files (handle both single file and bulk upload)
    const processedResults = []
    const fileIdsArray = Array.isArray(fileIds) ? fileIds : [fileIds]
    const fileNamesArray = Array.isArray(fileNames) ? fileNames : [fileNames]

    console.log('📁 Processing files:', { 
      totalFiles: fileIdsArray.length,
      fileIds: fileIdsArray,
      fileNames: fileNamesArray 
    })
    for (let i = 0; i < fileIdsArray.length; i++) {
      const fileId = fileIdsArray[i]
      const fileName = fileNamesArray[i]

      console.log(`📄 Processing file ${i + 1}/${fileIdsArray.length}:`, { fileId, fileName })

      // Download file from storage
      console.log('📥 Downloading file from storage:', fileName)
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('receipts')
        .download(fileName)

      if (downloadError) {
        console.error(`❌ Error downloading file ${fileName}:`, downloadError)
        throw new Error(`Failed to download file: ${fileName}`)
      }

      console.log('✅ File downloaded successfully:', { fileName, size: fileData.size })

      // Convert file to base64 for processing
      const arrayBuffer = await fileData.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      console.log('🔄 File converted to base64:', { fileName, base64Length: base64.length })

      // Mock processing with category detection
      const categories = ['groceries', 'restaurants', 'gas', 'shopping', 'travel', 'healthcare', 'entertainment']
      const randomCategory = categories[Math.floor(Math.random() * categories.length)]
      
      const mockProcessedData = {
        fileId: fileId,
        fileName: fileName,
        merchant: `Store ${i + 1}`,
        date: new Date().toISOString().split('T')[0],
        total: (Math.random() * 100 + 10).toFixed(2),
        category: randomCategory,
        confidence_score: 0.85 + Math.random() * 0.15, // 85-100% confidence
        items: [
          { description: `Item ${i + 1}-1`, amount: (Math.random() * 50 + 5).toFixed(2), category: randomCategory },
          { description: `Item ${i + 1}-2`, amount: (Math.random() * 30 + 5).toFixed(2), category: randomCategory },
          { description: `Item ${i + 1}-3`, amount: (Math.random() * 20 + 5).toFixed(2), category: randomCategory }
        ]
      }

      console.log('🎯 Generated mock processed data:', mockProcessedData)
      processedResults.push(mockProcessedData)

      // Update the database record
      console.log('💾 Updating database record:', fileId)
      const { error: updateError } = await supabase
        .from('processed_files')
        .update({
          status: 'completed',
          merchant: mockProcessedData.merchant,
          total: parseFloat(mockProcessedData.total),
          item_count: mockProcessedData.items.length,
          category: mockProcessedData.category,
          confidence_score: mockProcessedData.confidence_score,
          processed_data: mockProcessedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error(`❌ Error updating file record ${fileId}:`, updateError)
        throw new Error(`Failed to update file record: ${fileId}`)
      }

      console.log('✅ Database record updated successfully:', fileId)

      // Update expense analytics for premium users
      try {
        console.log('📊 Checking user tier for analytics update...')
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('user_tier')
          .eq('id', user.id)
          .single()

        console.log('👤 User profile for analytics:', { 
          userId: user.id, 
          userTier: userProfile?.user_tier 
        })
        if (userProfile?.user_tier === 'premium') {
          console.log('💎 Premium user detected, updating analytics...')
          await supabase.functions.invoke('update-expense-analytics', {
            body: {
              fileId: fileId,
              userId: user.id,
              merchant: mockProcessedData.merchant,
              total: mockProcessedData.total,
              category: mockProcessedData.category,
              date: mockProcessedData.date
            }
          })
          console.log('✅ Analytics update function called')
        } else {
          console.log('👤 Freemium user, skipping analytics update')
        }
      } catch (analyticsError) {
        console.error('❌ Error updating analytics:', analyticsError)
        // Don't fail the main process for analytics errors
      }
    }

    // Log the upload count
    console.log('📝 Logging upload count...')
    const { error: logError } = await supabase
      .from('upload_logs')
      .insert({
        user_id: user.id,
        file_count: fileCount
      })

    if (logError) {
      console.error('❌ Error logging upload:', logError)
      // Don't throw here, just log the error
    } else {
      console.log('✅ Upload logged successfully')
    }

    // Create merged output data
    const mergedData = {
      summary: {
        totalFiles: processedResults.length,
        totalAmount: processedResults.reduce((sum, result) => sum + parseFloat(result.total), 0).toFixed(2),
        totalItems: processedResults.reduce((sum, result) => sum + result.items.length, 0),
        processedAt: new Date().toISOString()
      },
      receipts: processedResults,
      combinedItems: processedResults.flatMap((result, receiptIndex) => 
        result.items.map(item => ({
          receiptNumber: receiptIndex + 1,
          merchant: result.merchant,
          date: result.date,
          description: item.description,
          amount: item.amount,
          category: item.category,
          fileName: result.fileName
        }))
      )
    }

    console.log('🎉 Processing completed successfully:', {
      userId: user.id,
      fileCount,
      processedResults: processedResults.length,
      mergedDataSummary: mergedData.summary
    })

    return new Response(
      JSON.stringify({ 
        receipts: processedResults,
        mergedData: mergedData,
        summary: mergedData.summary
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Fatal error in process-receipt function:', {
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