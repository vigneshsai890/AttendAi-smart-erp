import type { Metadata } from "next";
import { Sora, DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/Toast";
import CustomCursor from "@/components/CustomCursor";
import AuthProvider from "@/components/AuthProvider";
import PageWrapper from "@/components/PageWrapper";
import SplashScreen from "@/components/SplashScreen";
import { ThemeProvider } from "@/components/ThemeProvider";

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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen font-sans antialiased selection:bg-indigo-500/30",
        sora.variable,
        dmSans.variable,
        inter.variable
      )}>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <SplashScreen />
              <CustomCursor />
              <PageWrapper>
                {children}
              </PageWrapper>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
