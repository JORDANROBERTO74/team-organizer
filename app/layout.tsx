import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const defaultUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "Organizador de Equipos - Gestiona tus equipos de trabajo",
    template: "%s | Organizador de Equipos",
  },
  description:
    "Sistema de organización de equipos de trabajo. Crea equipos, gestiona miembros y programa horarios con un calendario visual intuitivo.",
  keywords: [
    "organizador de equipos",
    "gestión de equipos",
    "calendario de trabajo",
    "organización de equipos",
    "gestión de horarios",
    "equipos de trabajo",
    "coordinación de equipos",
  ],
  authors: [{ name: "Roberto Jordan" }],
  creator: "Roberto Jordan",
  publisher: "Roberto Jordan",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: defaultUrl,
    siteName: "Organizador de Equipos",
    title: "Organizador de Equipos - Gestiona tus equipos de trabajo",
    description:
      "Sistema de organización de equipos de trabajo. Crea equipos, gestiona miembros y programa horarios con un calendario visual intuitivo.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Organizador de Equipos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Organizador de Equipos - Gestiona tus equipos de trabajo",
    description:
      "Sistema de organización de equipos de trabajo. Crea equipos, gestiona miembros y programa horarios con un calendario visual intuitivo.",
    images: ["/og-image.png"],
    creator: "@organizadorequipos",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Agregar cuando tengas Google Search Console
    // google: "verification-code",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.className} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
