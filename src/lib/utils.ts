import { format } from 'date-fns';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMonth(date: Date = new Date()): string {
  return format(date, 'MMM-yy');
}

export function generateCampaignName(name: string, platform: string): string {
  const month = format(new Date(), 'MMMyy');
  return `${name} - ${capitalize(platform)} - ${month}`;
}

export function generateDiscountCode(name: string, discountValue: number): string {
  return `${name.toUpperCase().replace(/\s+/g, '')}${discountValue}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-800';
    case 'paused': return 'bg-amber-100 text-amber-800';
    case 'ended': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getDashboardUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/dash/${token}`;
}
