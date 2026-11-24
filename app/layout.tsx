import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SupportAI — Answers from your help docs, with sources",
    template: "%s · SupportAI",
  },
  description:
    "SupportAI turns your help docs into a support assistant that answers customer questions and cites the page it used. Embed it on your site with one script tag.",
  openGraph: {
    title: "SupportAI — Answers from your help docs, with sources",
    description:
      "Upload your help docs. SupportAI answers customer questions from them and shows which document each answer came from.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f3ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1112" },
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
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${schibsted.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      {/* suppressHydrationWarning: next-themes sets the theme class before first paint, and
          browser extensions inject attributes onto <body>; both are expected. */}
      <body className="min-h-full bg-bg text-fg" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
