const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

Deno.serve(async (req) => {
  console.log('🚀 Process-receipt function started');
  console.log('📝 Request method:', req.method);
  console.log('📝 Request URL:', req.url);
  console.log('📝 Headers received:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Import Supabase client
    console.log('📦 Importing Supabase client...');
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔧 Environment variables check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0,
      url: supabaseUrl?.substring(0, 30) + '...'
    });
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');

    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('📄 Raw request body received:', bodyText);
      requestBody = JSON.parse(bodyText);
      console.log('📄 Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { fileIds, fileNames } = requestBody;
    console.log('📄 Extracted from payload:', { 
      fileIds, 
      fileNames,
      fileIdsType: typeof fileIds,
      fileNamesType: typeof fileNames,
      fileIdsLength: Array.isArray(fileIds) ? fileIds.length : 'not array',
      fileNamesLength: Array.isArray(fileNames) ? fileNames.length : 'not array'
    });

    // Validate payload
    if (!fileIds || !fileNames) {
      console.error('❌ Missing required fields in payload');
      throw new Error('Missing fileIds or fileNames in request');
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('🔑 Auth header check:', {
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader?.length || 0,
      authHeaderStart: authHeader?.substring(0, 20) + '...'
    });
    
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      throw new Error('Missing Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token extracted:', {
      tokenLength: token?.length || 0,
      tokenStart: token?.substring(0, 10) + '...'
    });

    // Verify the user
    console.log('👤 Verifying user with token...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('👤 User verification result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      userEmail: user?.email,
      authError: authError?.message 
    });
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', {
        authError: authError?.message,
        hasUser: !!user
      });
      return new Response(
        JSON.stringify({ 
          error: 'UNAUTHORIZED',
          message: 'Authentication failed. Please sign in again.',
          details: authError?.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Check if user can upload these files (pricing logic)
    const fileCount = Array.isArray(fileIds) ? fileIds.length : 1;
    console.log('📊 Checking upload permission:', { 
      userId: user.id, 
      fileCount,
      fileIdsArray: Array.isArray(fileIds)
    });
    
    // Check user tier first
    console.log('👤 Fetching user profile for tier check...');
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_tier')
      .eq('id', user.id)
      .single();
    
    console.log('👤 User profile result:', {
      hasProfile: !!userProfile,
      userTier: userProfile?.user_tier,
      profileError: profileError?.message,
      profileErrorCode: profileError?.code
    });
    
    // Check upload permission
    console.log('🔍 Calling can_user_upload RPC function...');
    const { data: canUpload, error: checkError } = await supabase.rpc('can_user_upload', {
      user_uuid: user.id,
      new_file_count: fileCount
    });

    console.log('🔍 Upload permission result:', { 
      canUpload, 
      checkError: checkError?.message,
      checkErrorCode: checkError?.code
    });
    
    if (checkError) {
      console.error('❌ Error checking upload permission:', checkError);
      throw new Error('Failed to check upload permission');
    }

    if (!canUpload) {
      // Get current file count for better error message
      console.log('📊 Getting current file count for limit message...');
      const { data: currentCount } = await supabase.rpc('get_user_file_count', {
        user_uuid: user.id
      });

      console.log('❌ Upload limit exceeded:', { 
        currentCount, 
        newFiles: fileCount,
        userTier: userProfile?.user_tier
      });

      return new Response(
        JSON.stringify({ 
          error: 'USAGE_LIMIT_EXCEEDED',
          message: `You have reached your upload limit. Current usage: ${currentCount}/10 files. Please upgrade to Premium for unlimited uploads.`,
          upgradeUrl: '/pricing'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        },
      );
    }

    console.log('✅ Upload permission granted, starting file processing...');

    // Process files (handle both single file and bulk upload)
    const processedResults = [];
    const fileIdsArray = Array.isArray(fileIds) ? fileIds : [fileIds];
    const fileNamesArray = Array.isArray(fileNames) ? fileNames : [fileNames];

    console.log('📁 Processing files array:', { 
      totalFiles: fileIdsArray.length,
      fileIds: fileIdsArray,
      fileNames: fileNamesArray 
    });
    
    for (let i = 0; i < fileIdsArray.length; i++) {
      const fileId = fileIdsArray[i];
      const fileName = fileNamesArray[i];

      console.log(`📄 Processing file ${i + 1}/${fileIdsArray.length}:`, { 
        fileId, 
        fileName,
        fileIdType: typeof fileId,
        fileNameType: typeof fileName
      });

      // Download file from storage
      console.log('📥 Downloading file from storage:', fileName);
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('receipts')
        .download(fileName);

      if (downloadError) {
        console.error(`❌ Error downloading file ${fileName}:`, {
          error: downloadError,
          message: downloadError.message,
          fileName
        });
        
        // Update file status to failed
        console.log('🔄 Updating file status to failed:', fileId);
        await supabase
          .from('processed_files')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', fileId);
        
        throw new Error(`Failed to download file: ${fileName} - ${downloadError.message}`);
      }

      console.log('✅ File downloaded successfully:', { 
        fileName, 
        size: fileData.size,
        type: fileData.type
      });

      // Convert file to base64 for processing
      console.log('🔄 Converting file to base64...');
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      console.log('🔄 File converted to base64:', { 
        fileName, 
        base64Length: base64.length,
        base64Preview: base64.substring(0, 50) + '...'
      });

      // Enhanced mock processing with better category detection
      console.log('🎯 Starting mock data processing for:', fileName);
      const categories = ['groceries', 'restaurants', 'gas', 'shopping', 'travel', 'healthcare', 'entertainment'];
      
      // Simple category detection based on filename or random
      let detectedCategory = 'other';
      const fileNameLower = fileName.toLowerCase();
      if (fileNameLower.includes('grocery') || fileNameLower.includes('food')) {
        detectedCategory = 'groceries';
      } else if (fileNameLower.includes('gas') || fileNameLower.includes('fuel')) {
        detectedCategory = 'gas';
      } else if (fileNameLower.includes('restaurant') || fileNameLower.includes('cafe')) {
        detectedCategory = 'restaurants';
      } else {
        detectedCategory = categories[Math.floor(Math.random() * categories.length)];
      }
      
      const totalAmount = (Math.random() * 100 + 10).toFixed(2);
      const itemCount = Math.floor(Math.random() * 5) + 1;
      
      const mockProcessedData = {
        fileId: fileId,
        fileName: fileName,
        merchant: `${detectedCategory.charAt(0).toUpperCase() + detectedCategory.slice(1)} Store ${i + 1}`,
        date: new Date().toISOString().split('T')[0],
        total: totalAmount,
        category: detectedCategory,
        confidence_score: 0.85 + Math.random() * 0.15, // 85-100% confidence
        items: Array.from({ length: itemCount }, (_, idx) => ({
          description: `${detectedCategory} Item ${idx + 1}`,
          amount: (parseFloat(totalAmount) / itemCount).toFixed(2),
          category: detectedCategory
        }))
      };

      console.log('🎯 Generated mock processed data:', {
        fileId: mockProcessedData.fileId,
        merchant: mockProcessedData.merchant,
        total: mockProcessedData.total,
        category: mockProcessedData.category,
        itemCount: mockProcessedData.items.length,
        confidenceScore: mockProcessedData.confidence_score
      });
      
      processedResults.push(mockProcessedData);

      // Update the database record
      console.log('💾 Updating database record:', fileId);
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
        .eq('user_id', user.id);

      if (updateError) {
        console.error(`❌ Error updating file record ${fileId}:`, updateError);
        throw new Error(`Failed to update file record: ${fileId} - ${updateError.message}`);
      }

      console.log('✅ Database record updated successfully:', fileId);

      // Update expense analytics for premium users only
      try {
        console.log('📊 Checking user tier for analytics update...');
        
        if (userProfile?.user_tier === 'premium') {
          console.log('💎 Premium user detected, calling analytics update...');
          const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('update-expense-analytics', {
            body: {
              fileId: fileId,
              userId: user.id,
              merchant: mockProcessedData.merchant,
              total: mockProcessedData.total,
              category: mockProcessedData.category,
              date: mockProcessedData.date
            }
          });
          
          if (analyticsError) {
            console.error('❌ Analytics update failed:', {
              error: analyticsError,
              message: analyticsError.message
            });
          } else {
            console.log('✅ Analytics update function called successfully:', analyticsData);
          }
        } else {
          console.log('👤 Freemium user, skipping analytics update');
        }
      } catch (analyticsError) {
        console.error('❌ Error updating analytics:', analyticsError);
        // Don't fail the main process for analytics errors
      }
    }

    // Log the upload count
    console.log('📝 Logging upload count...');
    const { error: logError } = await supabase
      .from('upload_logs')
      .insert({
        user_id: user.id,
        file_count: fileCount
      });

    if (logError) {
      console.error('❌ Error logging upload:', logError);
      // Don't throw here, just log the error
    } else {
      console.log('✅ Upload logged successfully');
    }

    // Create merged output data
    console.log('🔄 Creating merged output data...');
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
    };

    console.log('🎉 Processing completed successfully:', {
      userId: user.id,
      fileCount,
      processedResults: processedResults.length,
      mergedDataSummary: mergedData.summary,
      totalAmount: mergedData.summary.totalAmount,
      totalItems: mergedData.summary.totalItems
    });

    const responseData = { 
      receipts: processedResults,
      mergedData: mergedData,
      summary: mergedData.summary
    };
    
    console.log('📤 Sending response with data:', {
      receiptsCount: responseData.receipts.length,
      hasMergedData: !!responseData.mergedData,
      summaryKeys: Object.keys(responseData.summary),
      combinedItemsCount: responseData.mergedData.combinedItems.length
    });
    
    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
    
  } catch (error) {
    console.error('❌ Fatal error in process-receipt function:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'PROCESSING_FAILED',
        message: error.message,
        timestamp: new Date().toISOString(),
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});