import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

const maximaNouva = localFont({
  variable: "--font-maxima-nouva",
  src: [
    { path: "./fonts/MaximaNouva/MaximaNouva-Thin.ttf", weight: "100", style: "normal" },
    { path: "./fonts/MaximaNouva/MaximaNouva-ThinItalic.ttf", weight: "100", style: "italic" },
    { path: "./fonts/MaximaNouva/MaximaNouva-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/MaximaNouva/MaximaNouva-Italic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/MaximaNouva/MaximaNouva-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/MaximaNouva/MaximaNouva-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/MaximaNouva/MaximaNouva-BoldItalic.ttf", weight: "700", style: "italic" },
    { path: "./fonts/MaximaNouva/MaximaNouva-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "./fonts/MaximaNouva/MaximaNouva-ExtraBoldItalic.ttf", weight: "800", style: "italic" },
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gauge - Personal finance tracker",
  description:
    "Track subscriptions, everyday expenses, and budgets in one place.",
  appleWebApp: {
    title: "Gauge",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${maximaNouva.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" />
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
