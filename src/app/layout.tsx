import type { Metadata } from "next";
import { Tajawal, IBM_Plex_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-tajawal",
});

const ibmPlex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-ibm-plex",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "LifeOS Premium — مركز التحكم",
  description: "نظام تشغيل الحياة — تتبع الأهداف والعادات والصحة والمال",
  applicationName: "LifeOS",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${tajawal.variable} ${ibmPlex.variable} ${playfair.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
