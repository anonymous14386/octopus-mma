import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MMA Reference | OctopusTechnology",
  description:
    "Comprehensive martial arts reference — Taekwondo, BJJ, Karate, Tai Chi, Muay Thai, and more. Belt-level curriculum with diagrams for every technique.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-brand-dark text-foreground min-h-screen`}>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-brand-border mt-16 py-8 text-center text-brand-muted text-sm">
          <p>MMA Reference · <a href="https://octopustechnology.net" className="hover:text-brand-red transition-colors">OctopusTechnology.net</a></p>
        </footer>
      </body>
    </html>
  );
}
