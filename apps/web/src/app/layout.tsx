import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "FriendsCircle - Your Campus Community",
  description:
    "Connect with your university friends. Buy, sell, find roommates, share past papers, review teachers, and more!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-dark antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
