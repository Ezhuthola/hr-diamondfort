import { Roboto_Mono } from "next/font/google"; // Typewriter style
import "./globals.css";

const technoFont = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={technoFont.className}>{children}</body>
    </html>
  );
}