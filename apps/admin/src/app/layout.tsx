import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FriendsCircle Admin",
  description: "Admin panel for FriendsCircle",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
