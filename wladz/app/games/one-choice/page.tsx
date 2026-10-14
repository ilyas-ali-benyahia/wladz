import type { Metadata } from "next";
import OneChoiceGame from "@/components/games/one-choice/OneChoiceGame";

export const metadata: Metadata = {
  title: "One Choice · WlaDZ",
  description:
    "A one-minute 3D game about handling peer pressure: find your friends in the park and decide how to respond.",
};

export default function OneChoicePage() {
  return <OneChoiceGame exitHref="/" />;
}
