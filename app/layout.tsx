import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stuff I wish I had found ONLINE | Fixes, Solutions, and Answers You Couldn't Find",
  description: "A community-driven site for sharing solutions, fixes, and answers to problems you couldn't find online. Search, discover, and contribute unique solutions to rare or unsolved issues.",
  keywords: [
    "fixes", "solutions", "answers", "problems", "troubleshooting", "how to", "help", "community", "rare issues", "unanswered questions", "tech support", "DIY", "unique solutions", "stuff I didn't find online"
  ],
  openGraph: {
    title: "Stuff I wish I had found ONLINE | Fixes, Solutions, and Answers You Couldn't Find",
    description: "A community-driven site for sharing solutions, fixes, and answers to problems you couldn't find online. Search, discover, and contribute unique solutions to rare or unsolved issues.",
    images: [
      {
        url: "/metatag/metatag.png",
        width: 1200,
        height: 630,
        alt: "Stuff I wish I had found ONLINE",
      },
    ],
    type: "website",
    locale: "en_US",
    url: "https://foundtheanswer.live/",
    siteName: "Stuff I wish I had found ONLINE"
  },
  twitter: {
    card: "summary_large_image",
    title: "Stuff I wish I had found ONLINE | Fixes, Solutions, and Answers You Couldn't Find",
    description: "A community-driven site for sharing solutions, fixes, and answers to problems you couldn't find online. Search, discover, and contribute unique solutions to rare or unsolved issues.",
    images: ["/metatag/metatag.png"],
    site: "@stuffididntfindonline"
  },
  metadataBase: new URL("https://foundtheanswer.live/"),
  alternates: {
    canonical: "https://foundtheanswer.live/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-snippet': -1,
      'max-image-preview': "large",
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
