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

    const { fileIds, fileNames } = await req.json()

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user can upload these files (pricing logic)
    const fileCount = Array.isArray(fileIds) ? fileIds.length : 1
    const { data: canUpload, error: checkError } = await supabase.rpc('can_user_upload', {
      user_uuid: user.id,
      new_file_count: fileCount
    })

    if (checkError) {
      console.error('Error checking upload permission:', checkError)
      throw new Error('Failed to check upload permission')
    }

    if (!canUpload) {
      // Get current file count for better error message
      const { data: currentCount } = await supabase.rpc('get_user_file_count', {
        user_uuid: user.id
      })

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

    // Process files (handle both single file and bulk upload)
    const processedResults = []
    const fileIdsArray = Array.isArray(fileIds) ? fileIds : [fileIds]
    const fileNamesArray = Array.isArray(fileNames) ? fileNames : [fileNames]

    for (let i = 0; i < fileIdsArray.length; i++) {
      const fileId = fileIdsArray[i]
      const fileName = fileNamesArray[i]

      console.log(`Processing file ${i + 1}/${fileIdsArray.length}: ${fileName}`)

      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('receipts')
        .download(fileName)

      if (downloadError) {
        console.error(`Error downloading file ${fileName}:`, downloadError)
        throw new Error(`Failed to download file: ${fileName}`)
      }

      // Convert file to base64 for processing
      const arrayBuffer = await fileData.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

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

      processedResults.push(mockProcessedData)

      // Update the database record
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
        console.error(`Error updating file record ${fileId}:`, updateError)
        throw new Error(`Failed to update file record: ${fileId}`)
      }

      // Update expense analytics for premium users
      try {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('user_tier')
          .eq('id', user.id)
          .single()

        if (userProfile?.user_tier === 'premium') {
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
        }
      } catch (analyticsError) {
        console.error('Error updating analytics:', analyticsError)
        // Don't fail the main process for analytics errors
      }
    }

    // Log the upload count
    const { error: logError } = await supabase
      .from('upload_logs')
      .insert({
        user_id: user.id,
        file_count: fileCount
      })

    if (logError) {
      console.error('Error logging upload:', logError)
      // Don't throw here, just log the error
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

    console.log(`Successfully processed ${fileCount} files for user ${user.id}`)

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