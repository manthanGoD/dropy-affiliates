import { NextResponse } from 'next/server';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

export async function GET() {
  try {
    const headers = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': SHOPIFY_TOKEN };

    // Fetch custom collections
    const customRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-10/custom_collections.json?limit=250&fields=id,title,handle`, { headers });
    const customData = await customRes.json();

    const collections = (customData.custom_collections || [])
      .map((c: { title: string; handle: string }) => ({
        title: c.title,
        handle: c.handle,
        path: `/collections/${c.handle}`,
      }))
      .sort((a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title));

    return NextResponse.json([
      { title: 'Home Page', handle: '', path: '/' },
      ...collections,
    ]);
  } catch (err) {
    console.error('Failed to fetch collections:', err);
    return NextResponse.json([{ title: 'Home Page', handle: '', path: '/' }]);
  }
}
