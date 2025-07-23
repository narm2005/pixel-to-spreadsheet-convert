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

  console.log('📤 Export-merged-data function called')
  console.log('📝 Request method:', req.method)

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    console.log('✅ Supabase client created for export')

    const { mergedData, format, userId } = await req.json();
    console.log('📄 Export request payload:', { 
      hasData: !!mergedData, 
      format, 
      userId,
      itemCount: mergedData?.combinedItems?.length 
    })

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') ?? '';
    console.log('🔑 Auth token for export:', { hasToken: !!token, tokenLength: token.length })

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('👤 User verification for export:', { 
      hasUser: !!user, 
      verifiedUserId: user?.id, 
      requestUserId: userId,
      match: user?.id === userId,
      authError: authError?.message 
    })

    if (authError || !user || user.id !== userId) {
      console.error('❌ Export authentication failed')
      throw new Error('Unauthorized');
    }

    const timestamp = new Date().toISOString().split('T')[0];
    console.log('📅 Export timestamp:', timestamp)

    if (format === 'excel') {
      console.log('📊 Generating Excel export...')
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
      console.log('✅ Excel file generated, base64 length:', excelBase64.length)
      return new Response(excelBase64, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="receipts-${timestamp}.xlsx"`
        }
      });
    } else if (format === 'csv') {
      console.log('📄 Generating CSV export...')
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
      console.log('✅ CSV content generated, length:', csvContent.length)
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="receipts-${timestamp}.csv"`
        }
      });
    } else if (format === 'json') {
      console.log('🔧 Generating JSON export...')
      const jsonContent = JSON.stringify(mergedData, null, 2)
      console.log('✅ JSON content generated, length:', jsonContent.length)
      return new Response(JSON.stringify(mergedData, null, 2), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="receipts-${timestamp}.json"`
        }
      });
    }
    console.error('❌ Invalid export format specified:', format)
    throw new Error('Invalid format specified');
  } catch (error) {
    console.error('❌ Fatal error in export-merged-data:', {
      error,
      message: error.message,
      stack: error.stack
    });
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
