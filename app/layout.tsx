import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Analytics } from "@vercel/analytics/next";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "G Events Dashboard",
  description: "Event management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
        <Analytics />
      </body>
    </html>
  );
}
