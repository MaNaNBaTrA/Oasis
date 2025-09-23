import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import SidebarLayout from "@/components/SidebarLayout";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Oasis",
  description: "Green Technology",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={outfit.className}>
        <ToastProvider>
          <SidebarLayout>{children}</SidebarLayout>
        </ToastProvider>
      </body>
    </html>
  );
}
