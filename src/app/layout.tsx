import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const font = Space_Grotesk({ subsets: ["latin"], display: "swap", weight: ["400","500","600","700"] });

export const metadata: Metadata = { title: "Dropy Affiliates", description: "Influencer affiliate management" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${font.className} h-full`} style={{ colorScheme: 'dark' }}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
