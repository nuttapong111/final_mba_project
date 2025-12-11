import type { Metadata } from "next";
import "./globals.css";

// Use Sukhumvit Set font from CSS @font-face instead of Google Fonts

export const metadata: Metadata = {
  title: "LMS Platform - ระบบจัดการการเรียนรู้ออนไลน์",
  description: "ระบบจัดการการเรียนรู้ออนไลน์แบบ Multi-tenant สำหรับโรงเรียนกวดวิชา",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased" style={{ fontFamily: "'Sukhumvit Set', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
