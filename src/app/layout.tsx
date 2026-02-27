import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Typecraft — Font Pairing Studio",
  description: "Professional font pairing tool for UI/UX designers and web developers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
