import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import UnhandledMediaAbortGuard from "@/components/common/UnhandledMediaAbortGuard";
import AppDataCacheProvider from "@/components/common/AppDataCacheProvider";
import { Analytics } from "@vercel/analytics/next";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
        <LocaleProvider>
          <UnhandledMediaAbortGuard />
          <AppDataCacheProvider />
          <NotificationProvider>
            <PermissionProvider>
              {children}
            </PermissionProvider>
          </NotificationProvider>
        </LocaleProvider>
        <Analytics />
      </body>
    </html>
  );
}
