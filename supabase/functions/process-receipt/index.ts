import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { fileIds, fileNames } = await req.json();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');
    const fileCount = Array.isArray(fileIds) ? fileIds.length : 1;
    const { data: canUpload, error: checkError } = await supabase.rpc('can_user_upload', {
      user_uuid: user.id,
      new_file_count: fileCount
    });
    if (checkError) throw new Error('Failed to check upload permission');
    if (!canUpload) {
      const { data: currentCount } = await supabase.rpc('get_user_file_count', {
        user_uuid: user.id
      });
      return new Response(JSON.stringify({
        error: 'USAGE_LIMIT_EXCEEDED',
        message: `You have reached your limit (${currentCount}/10). Upgrade to continue.`,
        upgradeUrl: '/pricing'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 403
      });
    }
    const processedResults = [];
    const fileIdsArray = Array.isArray(fileIds) ? fileIds : [
      fileIds
    ];
    const fileNamesArray = Array.isArray(fileNames) ? fileNames : [
      fileNames
    ];
    for(let i = 0; i < fileIdsArray.length; i++){
      const filesPayload = [];
      const fileId = fileIdsArray[i];
      const fileName = fileNamesArray[i];
      const { data: fileData, error: downloadError } = await supabase.storage.from('receipts').download(fileName);
      if (downloadError) throw new Error(`Failed to download ${fileName}`);
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      filesPayload.push({
        file_id: fileId,
        file_name: fileName,
        user_id: user.id,
        content_base64: base64
      });
      // 🔁 Send to FastAPI backend
      const fastapiResp = await fetch("https://receipt2xcl.onrender.com/process", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: filesPayload
        })
      });
      if (!fastapiResp.ok) {
        const err = await fastapiResp.text();
        throw new Error(`Backend error for ${fileName}: ${err}`);
      }
      const { receipts } = await fastapiResp.json();
      const parsed = receipts?.[0];
      if (!parsed) throw new Error(`Missing receipt data for ${fileName}`);
      const items = Array.isArray(parsed.items) ? parsed.items : [];
      const processedResult = {
        fileId: fileId,
        fileName: fileName,
        merchant: parsed.merchant,
        date: new Date().toISOString().split('T')[0],
        total: parsed.total,
        items,
        category: items[0]?.category || 'uncategorized',
        confidence_score: 0.95
      };
      processedResults.push(processedResult);
      const { error: updateError } = await supabase.from('processed_files').update({
        status: 'completed',
        merchant: processedResult.merchant,
        total: parseFloat(processedResult.total),
        item_count: processedResult.items.length,
        category: processedResult.category,
        confidence_score: processedResult.confidence_score,
        processed_data: processedResult,
        updated_at: new Date().toISOString()
      }).eq('id', fileId).eq('user_id', user.id);
      if (updateError) throw new Error(`Failed to update DB for ${fileId}`);
      // 🔍 Check user tier and trigger expense analytics
      const { data: userProfile } = await supabase.from('profiles').select('user_tier').eq('id', user.id).single();
      if (userProfile?.user_tier === 'premium') {
        await supabase.functions.invoke('update-expense-analytics', {
          body: {
            fileId,
            userId: user.id,
            merchant: processedResult.merchant,
            total: processedResult.total,
            category: processedResult.category,
            date: processedResult.date
          }
        });
      }
    }
    // 🪵 Log upload
    await supabase.from('upload_logs').insert({
      user_id: user.id,
      file_count: fileCount
    });
    // 📊 Return merged summary
    const mergedData = {
      summary: {
        totalFiles: processedResults.length,
        totalAmount: processedResults.reduce((sum, r)=>sum + parseFloat(r.total), 0).toFixed(2),
        totalItems: processedResults.reduce((sum, r)=>sum + r.items.length, 0),
        processedAt: new Date().toISOString()
      },
      receipts: processedResults,
      combinedItems: processedResults.flatMap((r, index)=>r.items.map((item)=>({
            receiptNumber: index + 1,
            merchant: r.merchant,
            date: r.date,
            description: item.description,
            amount: item.amount,
            category: item.category,
            fileName: r.fileName
          })))
    };
    return new Response(JSON.stringify({
      receipts: processedResults,
      mergedData,
      summary: mergedData.summary
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
