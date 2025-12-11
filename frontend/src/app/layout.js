import { Geist, Geist_Mono, Baloo_2, Inter } from "next/font/google";
import "./globals.css";
import LayoutClient from "./components/layout/LayoutClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const pickleFont = Baloo_2({
  variable: "--font-pickle",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata = {
  title: "Pickle Pickle",
  description: "PicklePickle Booking - Đặt sân chơi pickleball dễ dàng",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${pickleFont.variable}`}
    >
      <body className="bg-black text-white min-h-screen flex flex-col">
        {/* LayoutClient sẽ quyết định có render Header public hay không */}
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
