import { Poppins } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Script from "next/script";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata = {
  title: "Snacker",
  description: "Vend your snack in no time",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Snacker",
  },
};

export default function RootLayout({ children }) {
  // Only load the in-app modal SDK when a gateway is configured. Without it, payments open
  // the hosted checkout link instead (see utils/processPayment.js). A localhost default
  // was blocked as mixed content on the HTTPS site and only produced console errors.
  const youpiHost = (
    process.env.NEXT_PUBLIC_YOUPI_GATEWAY_URL ||
    (process.env.NEXT_PUBLIC_YOUPI_PORT
      ? `http://localhost:${process.env.NEXT_PUBLIC_YOUPI_PORT}`
      : "")
  ).replace(/\/$/, "");

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        layout: {
          socialButtonsVariant: "iconButton",
          termsPageUrl: "/terms",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={poppins.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <main>{children}</main>
            <Toaster />
          </ThemeProvider>
          {/* YouPI-PG Sovereign In-App Modal Checkout SDK */}
          {youpiHost && (
            <Script
              id="youpi-pg-sdk"
              src={`${youpiHost}/youpi.js`}
              data-youpi-key={process.env.NEXT_PUBLIC_YOUPI_MERCHANT_ID || "00000000-0000-0000-0000-000000000001"}
              data-currency="INR"
              strategy="afterInteractive"
            />
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
