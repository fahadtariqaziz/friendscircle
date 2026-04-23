import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://friendscircle.app"),
  title: {
    default: "FriendsCircle - Your Campus Community",
    template: "%s | FriendsCircle",
  },
  description:
    "Connect with your university friends. Buy, sell, find roommates, share past papers, review teachers, and more!",
  openGraph: {
    title: "FriendsCircle - Your Campus Community",
    description:
      "Pakistan's #1 university social platform. Rate professors, buy & sell, find roommates, share rides, access past papers, and connect with 10,000+ students.",
    url: "https://friendscircle.app",
    siteName: "FriendsCircle",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FriendsCircle - Your Campus Community",
    description:
      "Pakistan's #1 university social platform for students.",
  },
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
