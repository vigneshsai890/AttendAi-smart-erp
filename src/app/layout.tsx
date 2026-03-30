import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/Toast";
import CustomCursor from "@/components/CustomCursor";
import PageWrapper from "@/components/PageWrapper";
import SplashScreen from "@/components/SplashScreen";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "The Apollo University — AttendAI",
  description: "Smart Attendance System with AI-powered proxy detection, QR check-in, and real-time analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className={cn(
        "min-h-screen font-sans antialiased selection:bg-indigo-500/30",
        sora.variable,
        dmSans.variable
      )}>
        <ToastProvider>
          <SplashScreen />
          <CustomCursor />
          <PageWrapper>
            {children}
          </PageWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}
