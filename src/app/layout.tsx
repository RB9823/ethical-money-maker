import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { clerkEnabled } from "@/lib/server-auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ethical Money Maker",
  description: "Hot-button event tracking console with Dune confirmation and operator-gated outbound workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {clerkEnabled ? <ClerkProvider>{children}</ClerkProvider> : children}
      </body>
    </html>
  );
}
