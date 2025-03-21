import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// Application Component || Define Imports
// =======================================================================================
// =======================================================================================
import "./globals.scss";

// Application Component || Define Variables
// =======================================================================================
// =======================================================================================
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next + tRPC + Swagger",
  description: "Nextjs Demo of the tRPC-Swagger module",
  authors: [{ name: "Verc James", url: "https://github.com/Vercjames" }]
}

// Application Component || Define Exports
// =======================================================================================
// =======================================================================================
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
