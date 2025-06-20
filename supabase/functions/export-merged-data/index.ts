import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { utils, write } from 'https://cdn.sheetjs.com/xlsx-0.19.3/package/xlsx.mjs';
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
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') ?? '';
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.id !== userId) {
      throw new Error('Unauthorized');
    }
    const timestamp = new Date().toISOString().split('T')[0];
    if (format === 'excel') {
      // Create Excel workbook
      const workbook = utils.book_new();
      const worksheet = utils.aoa_to_sheet([
        [
          'Receipt #',
          'Merchant',
          'Date',
          'Item Description',
          'Amount',
          'Category',
          'File Name'
        ],
        ...mergedData.combinedItems.map((item)=>[
            item.receiptNumber,
            item.merchant,
            item.date,
            item.description,
            item.amount,
            item.category,
            item.fileName
          ])
      ]);
      utils.book_append_sheet(workbook, worksheet, "Receipts");
      // Convert to base64 string (supported by Deno)
      const excelBase64 = write(workbook, {
        type: 'base64',
        bookType: 'xlsx'
      });
      return new Response(excelBase64, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="receipts-${timestamp}.xlsx"`
        }
      });
    } else if (format === 'csv') {
      // Generate CSV content
      const csvContent = [
        [
          'Receipt #',
          'Merchant',
          'Date',
          'Item Description',
          'Amount',
          'Category',
          'File Name'
        ].join(','),
        ...mergedData.combinedItems.map((item)=>[
            item.receiptNumber,
            `"${item.merchant.replace(/"/g, '""')}"`,
            item.date,
            `"${item.description.replace(/"/g, '""')}"`,
            item.amount,
            item.category,
            `"${item.fileName.replace(/"/g, '""')}"`
          ].join(','))
      ].join('\n');
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="receipts-${timestamp}.csv"`
        }
      });
    } else if (format === 'json') {
      return new Response(JSON.stringify(mergedData, null, 2), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="receipts-${timestamp}.json"`
        }
      });
    }
    throw new Error('Invalid format specified');
  } catch (error) {
    console.error('Error:', error);
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
