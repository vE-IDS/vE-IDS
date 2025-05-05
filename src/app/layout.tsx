import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import axios from "axios";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "vE-IDS",
  description: "Virtual Enterprise Information Display System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // configure axios
  axios.defaults.withCredentials = true
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    axios.defaults.baseURL = "http://localhost:3000"
  } else {
    axios.defaults.baseURL = "updatethis"
  }

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
