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


  export const metadata = {
    metadataBase: new URL('https://foodgenie-lg9n.vercel.app'),
    title: "FoodGenie | AI Recipe App",
    description: "Generate personalized recipes instantly with AI.",
    openGraph: {
      title: "FoodGenie 🍳",
      description: "Your AI-powered recipe assistant.",
      url: "https://foodgenie-lg9n.vercel.app/",
      siteName: "FoodGenie",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
      locale: "en_US",
      type: "website",
    },
  };

export default function RootLayout({ children }) {
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
