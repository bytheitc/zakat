import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zakat Kit",
  description:
    "Work out whether you owe zakat and what to set aside each month — a calculator, not a ruling.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
