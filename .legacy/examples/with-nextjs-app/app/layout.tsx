import React from "react"
import { Inter } from "next/font/google"
import type { Metadata } from "next"

// Application Component || Define Imports
// =================================================================================================
// =================================================================================================
import "./globals.scss"

const inter = Inter({ subsets: ["latin"] })

// Application Component || Define Metadata
// =================================================================================================
// =================================================================================================
export const metadata: Metadata = {
  title: "Next + tRPC + Swagger",
  description: "A demo ",
  authors: [{ name: "Verc James", url: "https://github.com/Vercjames" }]
}

// Application Component || Define Exports
// =================================================================================================
// =================================================================================================
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
