
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

    console.log('Starting cleanup job...')

    // Create cleanup job record
    const { data: jobData, error: jobError } = await supabase
      .from('cleanup_jobs')
      .insert({
        job_type: 'expired_files_cleanup',
        status: 'running'
      })
      .select()
      .single()

    if (jobError) {
      throw jobError
    }

    const jobId = jobData.id
    let filesDeleted = 0
    let storageDeleted = 0
    let errorMessage = null

    try {
      // Find expired files
      const { data: expiredFiles, error: queryError } = await supabase
        .from('processed_files')
        .select('id, file_name, user_id')
        .lt('expires_at', new Date().toISOString())
        .not('expires_at', 'is', null)

      if (queryError) {
        throw queryError
      }

      console.log(`Found ${expiredFiles?.length || 0} expired files`)

      if (expiredFiles && expiredFiles.length > 0) {
        // Delete files from storage
        for (const file of expiredFiles) {
          try {
            const { error: storageError } = await supabase.storage
              .from('receipts')
              .remove([file.file_name])

            if (storageError) {
              console.error(`Failed to delete file ${file.file_name}:`, storageError)
            } else {
              storageDeleted++
              console.log(`Deleted file from storage: ${file.file_name}`)
            }
          } catch (error) {
            console.error(`Error deleting file ${file.file_name}:`, error)
          }
        }

        // Delete database records
        const { error: deleteError } = await supabase
          .from('processed_files')
          .delete()
          .in('id', expiredFiles.map(f => f.id))

        if (deleteError) {
          throw deleteError
        }

        filesDeleted = expiredFiles.length
        console.log(`Deleted ${filesDeleted} database records`)
      }

      // Update job status to completed
      await supabase
        .from('cleanup_jobs')
        .update({
          status: 'completed',
          files_deleted: filesDeleted,
          storage_cleaned: storageDeleted,
        })
        .eq('id', jobId)

      console.log(`Cleanup completed: ${filesDeleted} files deleted, ${storageDeleted} storage items cleaned`)

    } catch (error) {
      console.error('Cleanup error:', error)
      errorMessage = error.message

      // Update job status to failed
      await supabase
        .from('cleanup_jobs')
        .update({
          status: 'failed',
          files_deleted: filesDeleted,
          storage_cleaned: storageDeleted,
          error_message: errorMessage,
        })
        .eq('id', jobId)
    }

    return new Response(
      JSON.stringify({
        success: !errorMessage,
        filesDeleted,
        storageDeleted,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errorMessage ? 500 : 200,
      },
    )

  } catch (error) {
    console.error('Cleanup function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
