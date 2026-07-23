const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const STOREFRONT_DOMAIN = process.env.SHOPIFY_STOREFRONT_DOMAIN || 'dropy.in';

// ─── GraphQL helper ──────────────────────────
async function shopifyGraphQL(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API error: ${res.status} — ${text}`);
  }

  const data = await res.json();
  if (data.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(data.errors)}`);
  }
  return data;
}

// ─── REST helper ─────────────────────────────
async function shopifyREST(endpoint: string, method: string = 'GET', body?: unknown) {
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-10/${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    const error = new Error(`Shopify REST error: ${res.status} — ${text}`);
    (error as Error & { status: number }).status = res.status;
    throw error;
  }

  return res.json();
}

// ─── Create Marketing Campaign ───────────────
export async function createCampaign(campaignName: string) {
  // Use REST API for marketing events/campaigns
  const data = await shopifyREST('marketing_events.json', 'POST', {
    marketing_event: {
      event_type: 'ad',
      marketing_channel: 'social',
      paid: false,
      started_at: new Date().toISOString(),
      utm_campaign: campaignName.toLowerCase().replace(/\s+/g, '-'),
      utm_source: 'influencer',
      utm_medium: 'social',
      description: `Influencer campaign: ${campaignName}`,
    },
  });

  const campaignId = data.marketing_event?.id;
  const utmCampaign = campaignName.toLowerCase().replace(/\s+/g, '-');
  const shareableLink = `https://${STOREFRONT_DOMAIN}?utm_campaign=${utmCampaign}&utm_source=influencer&utm_medium=social`;

  return {
    campaign_id: String(campaignId || utmCampaign),
    shareable_link: shareableLink,
  };
}

// ─── Create Discount Code ────────────────────
export async function createDiscountCode(
  code: string,
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  combinesWith?: { productDiscounts: boolean; orderDiscounts: boolean; shippingDiscounts: boolean }
) {
  // Use GraphQL to create discount with correct combinations
  const mutation = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              codes(first: 1) {
                nodes { code }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `;

  const variables = {
    basicCodeDiscount: {
      title: code.toUpperCase(),
      code: code.toUpperCase(),
      startsAt: new Date().toISOString(),
      customerGets: {
        value: discountType === 'percentage'
          ? { percentage: discountValue / 100 }
          : { discountAmount: { amount: String(discountValue), appliesOnEachItem: false } },
        items: { all: true },
      },
      customerSelection: { all: true },
      appliesOncePerCustomer: true,
      combinesWith: combinesWith || {
        productDiscounts: true,
        orderDiscounts: false,
        shippingDiscounts: false,
      },
    },
  };

  const data = await shopifyGraphQL(mutation, variables);
  const result = data.data.discountCodeBasicCreate;

  if (result.userErrors?.length > 0) {
    throw new Error(`Shopify discount error: ${result.userErrors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  const discountId = result.codeDiscountNode?.id || '';
  const createdCode = result.codeDiscountNode?.codeDiscount?.codes?.nodes?.[0]?.code || code.toUpperCase();

  return {
    discount_id: discountId,
    price_rule_id: '',
    code: createdCode,
  };
}

// ─── Fetch Orders by Discount Code ───────────
export async function fetchOrdersByDiscount(discountCode: string, since?: string) {
  const query = `
    {
      orders(first: 100, query: "discount_code:${discountCode}${since ? ` created_at:>=${since}` : ''}", sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            totalPriceSet { shopMoney { amount } }
            totalDiscountsSet { shopMoney { amount } }
            subtotalPriceSet { shopMoney { amount } }
            customer { displayName }
            discountCodes
          }
        }
      }
    }
  `;

  const data = await shopifyGraphQL(query);
  return data.data.orders.edges.map((edge: { node: Record<string, unknown> }) => edge.node);
}

// ─── Fetch Orders Count & Revenue Summary ────
export async function fetchInfluencerStats(discountCode: string) {
  const orders = await fetchOrdersByDiscount(discountCode);

  let totalRevenue = 0;
  let totalDiscounts = 0;

  for (const order of orders) {
    const revenue = parseFloat((order.totalPriceSet as { shopMoney: { amount: string } }).shopMoney.amount);
    const discount = parseFloat((order.totalDiscountsSet as { shopMoney: { amount: string } }).shopMoney.amount);
    totalRevenue += revenue;
    totalDiscounts += discount;
  }

  return {
    total_orders: orders.length,
    total_revenue: totalRevenue,
    total_discounts: totalDiscounts,
    total_net_revenue: totalRevenue,
    orders,
  };
}

// ─── Deactivate Discount Code ────────────────
export async function deactivateDiscount(priceRuleId: string) {
  await shopifyREST(`price_rules/${priceRuleId}.json`, 'PUT', {
    price_rule: {
      id: priceRuleId,
      ends_at: new Date().toISOString(),
    },
  });
}

// ─── Create Short Link (URL Redirect) ────────
export async function createShortLink(handle: string, destinationPath: string) {
  const data = await shopifyREST('redirects.json', 'POST', {
    redirect: {
      path: `/s/${handle.toLowerCase()}`,
      target: destinationPath.startsWith('/') ? destinationPath : `/${destinationPath}`,
    },
  });

  return {
    redirect_id: String(data.redirect.id),
    short_url: `https://${STOREFRONT_DOMAIN}/s/${handle.toLowerCase()}`,
    path: data.redirect.path,
  };
}
