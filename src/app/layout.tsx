import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "creative-coding-library: built to be broken",
  description:
    "30 generative-art sketches, ordered by what you need to know first. Predict, run, break, fix, repeat.",
  openGraph: {
    title: "creative-coding-library: built to be broken",
    description:
      "30 generative-art sketches, ordered by what you need to know first. Predict, run, break, fix, repeat.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "creative-coding-library: built to be broken",
    description:
      "30 generative-art sketches, ordered by what you need to know first. Predict, run, break, fix, repeat.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
