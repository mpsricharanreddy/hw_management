import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hardware Management System",
  description: "Track hardware components, classifications, and ownership transfers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
