import type { Metadata, Viewport } from "next";
import { Jost, Playfair_Display, Pinyon_Script } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const jost = Jost({ variable: "--font-jost", subsets: ["latin"] });
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});
const script = Pinyon_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Berry Quest · Learn to code on a little adventure",
    template: "%s · Berry Quest",
  },
  description:
    "A gentle, gamified coding journey through a 3D world. Solve puzzles, collect berries, and walk the path from Strawberry Meadow to Dragon's Peak.",
};

export const viewport: Viewport = {
  themeColor: "#fdf4e6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jost.variable} ${playfair.variable} ${script.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="mx-auto w-full max-w-[1500px] px-5 pb-6 pt-10 sm:px-10">
          <p className="text-center font-serif text-sm italic text-muted">
            Little steps, big berries, and a kinder day.
          </p>
        </footer>
      </body>
    </html>
  );
}
