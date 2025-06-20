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
    const { mergedData, format, userId } = await req.json();
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader.replace('Bearer ', '');
    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.id !== userId) {
      throw new Error('Unauthorized');
    }
    const timestamp = new Date().toISOString().split('T')[0];
    let content = '';
    let contentType = '';
    let filename = '';
    if (format === 'csv') {
      // Create CSV content with combined items
      const headers = [
        'Receipt #',
        'Merchant',
        'Date',
        'Item Description',
        'Amount',
        'Category',
        'File Name'
      ];
      const csvRows = [
        headers.join(',')
      ];
      mergedData.combinedItems.forEach((item)=>{
        csvRows.push([
          item.receiptNumber,
          `"${item.merchant}"`,
          item.date,
          `"${item.description}"`,
          item.amount,
          item.category,
          `"${item.fileName}"`
        ].join(','));
      });
      // Add summary section
      csvRows.push('');
      csvRows.push('SUMMARY');
      csvRows.push(`Total Files,${mergedData.summary.totalFiles}`);
      csvRows.push(`Total Amount,$${mergedData.summary.totalAmount}`);
      csvRows.push(`Total Items,${mergedData.summary.totalItems}`);
      csvRows.push(`Processed At,${mergedData.summary.processedAt}`);
      content = csvRows.join('\n');
      contentType = 'text/csv';
      filename = `merged-receipts-${timestamp}.csv`;
    } else if (format === 'json') {
      content = JSON.stringify(mergedData, null, 2);
      contentType = 'application/json';
      filename = `merged-receipts-${timestamp}.json`;
    } else if (format === 'excel') {
      // For Excel format, we'll create a simple tab-separated format
      // In a real implementation, you'd use a proper Excel library
      const headers = [
        'Receipt #',
        'Merchant',
        'Date',
        'Item Description',
        'Amount',
        'Category',
        'File Name'
      ];
      const tsvRows = [
        headers.join('\t')
      ];
      mergedData.combinedItems.forEach((item)=>{
        tsvRows.push([
          item.receiptNumber,
          item.merchant,
          item.date,
          item.description,
          item.amount,
          item.category,
          item.fileName
        ].join('\t'));
      });
      // Add summary section
      tsvRows.push('');
      tsvRows.push('SUMMARY');
      tsvRows.push(`Total Files\t${mergedData.summary.totalFiles}`);
      tsvRows.push(`Total Amount\t$${mergedData.summary.totalAmount}`);
      tsvRows.push(`Total Items\t${mergedData.summary.totalItems}`);
      tsvRows.push(`Processed At\t${mergedData.summary.processedAt}`);
      content = tsvRows.join('\n');
      contentType = 'application/vnd.ms-excel';
      filename = `merged-receipts-${timestamp}.xlsx`;
    }
    return new Response(JSON.stringify({
      content: content,
      contentType: contentType,
      filename: filename
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error exporting merged data:', error);
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
