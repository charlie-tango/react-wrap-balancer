import Section from "../src/sections";
import {Alice, Inter} from "@next/font/google";
import clsx from "clsx";
const inter = Inter({
    weight: "variable",
    subsets: ["latin"],
    display: "block",
});

const alice = Alice({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-alice",
    display: "block",
});

export default function HomePage() {
  return (
    <main className={clsx(inter.className, alice.variable)}>
      <Section.Header />
      <Section.Hero />
      <Section.GettingStarted />
      <Section.CustomBalanceRatio />
      <Section.HowItWorks />
      <Section.UseCases />
      <Section.Performance />
      <Section.About />
      <Section.Footer />
    </main>
  );
}
