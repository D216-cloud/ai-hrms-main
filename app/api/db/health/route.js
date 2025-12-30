import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Check pg_extension for 'vector'
    const vectorCheck = await supabaseAdmin.rpc('pg_extension_exists', { extname: 'vector' }).catch(() => null);

    // Fallback: query directly
    const { data: extRows, error: extErr } = await supabaseAdmin.rpc('pg_extension_list').catch(() => ({ data: null, error: true }));

    // Check applications.resume_embedding column info
    const res = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name,data_type,udt_name')
      .eq('table_name', 'applications')
      .eq('column_name', 'resume_embedding')
      .limit(1);

    const colInfo = res?.data && res.data.length > 0 ? res.data[0] : null;

    return NextResponse.json({ ok: true, vectorExtension: !!(extRows && Array.isArray(extRows) && extRows.length > 0), column: colInfo });
  } catch (err) {
    console.error('Error in GET /api/db/health:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed' }, { status: 500 });
  }
}
