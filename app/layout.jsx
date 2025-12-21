import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import VoiceCommandLoader from "@/app/components/VoiceCommandLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI-Powered HRMS - Smart Recruitment Solution",
  description:
    "Modern AI-powered Human Resource Management System for automated recruitment and employee management",
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var theme=localStorage.getItem('theme');if(theme==='dark'||(!theme&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){} })();`}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
          <Toaster />
          {/* Voice command component auto-mounted for site-wide navigation */}
          <VoiceCommandLoader />
        </ThemeProvider>
      </body>
    </html>
  );
}
