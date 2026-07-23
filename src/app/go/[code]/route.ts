import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  // Find influencer by discount code
  const { data: inf } = await supabaseAdmin
    .from('influencers')
    .select('id, shareable_link, discount_code, discount_value')
    .eq('discount_code', upperCode)
    .single();

  if (!inf) {
    // Fallback: redirect to homepage
    return NextResponse.redirect('https://dropy.in', { status: 302 });
  }

  // Log the click (non-blocking)
  supabaseAdmin.from('clicks').insert({ influencer_id: inf.id }).then(() => {});

  // Redirect — to discount URL if discount exists, otherwise homepage
  const redirectUrl = inf.discount_value && inf.discount_value > 0
    ? `https://dropy.in/discount/${inf.discount_code}`
    : 'https://dropy.in';
  return NextResponse.redirect(redirectUrl, { status: 302 });
}
