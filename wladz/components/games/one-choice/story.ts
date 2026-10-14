// Dialogue, choices and branching outcomes for Game 01 — "One Choice".
// Pure data: no React, no browser APIs.

export type NpcId = "yacine" | "amel" | "karim";
export type ActorId = NpcId | "player";
export type Speaker = ActorId | "narrator";

export type Anim =
  | "idle"
  | "walk"
  | "walkAway"
  | "talk"
  | "offer"
  | "nod"
  | "shake"
  | "shrug"
  | "cheer"
  | "wave"
  | "crossArms"
  | "lookDown"
  | "angry";

export type Beat = {
  speaker: Speaker;
  text: string;
  /** Seconds before auto-advancing. Ignored when awaitChoice is set. */
  duration: number;
  anims?: Partial<Record<ActorId, Anim>>;
  /** Darkens the scene edges to set a reflective tone. */
  mood?: "dim";
  /** Stops on this beat and shows the four choices. */
  awaitChoice?: boolean;
};

export type ChoiceId = 1 | 2 | 3 | 4;

export type Choice = {
  id: ChoiceId;
  label: string;
  title: string;
  message: string;
  beats: Beat[];
};

export const SPEAKER_NAMES: Record<Speaker, string> = {
  player: "You",
  yacine: "Yacine",
  amel: "Amel",
  karim: "Karim",
  narrator: "",
};

export const PRESSURE_LINE = "Come on, just try it. Everyone does it.";

export const INTRO_BEATS: Beat[] = [
  {
    speaker: "amel",
    text: "Hey, you made it!",
    duration: 2.2,
    anims: { amel: "wave", karim: "nod" },
  },
  {
    speaker: "yacine",
    text: PRESSURE_LINE,
    duration: 0,
    awaitChoice: true,
    anims: { yacine: "offer", amel: "lookDown" },
  },
];

export const CHOICES: Choice[] = [
  {
    id: 1,
    label: "I don't want to. Let's do something else.",
    title: "Clear and honest",
    message: "You can say no and still be respected.",
    beats: [
      {
        speaker: "player",
        text: "I don't want to. Let's do something else.",
        duration: 2.6,
        anims: { player: "shake" },
      },
      {
        speaker: "yacine",
        text: "Okay, okay. Your call.",
        duration: 2.3,
        anims: { yacine: "shrug" },
      },
      {
        speaker: "amel",
        text: "Honestly? I didn't want to either.",
        duration: 2.6,
        anims: { amel: "talk", karim: "nod" },
      },
      {
        speaker: "karim",
        text: "So… what are we doing instead?",
        duration: 2.6,
        anims: { karim: "talk", player: "nod" },
      },
    ],
  },
  {
    id: 2,
    label: "Okay, just this once.",
    title: "Going along with it",
    message: "Your decisions should reflect your values, not social pressure.",
    beats: [
      {
        speaker: "player",
        text: "Okay… just this once.",
        duration: 2.4,
        mood: "dim",
        anims: { player: "lookDown", yacine: "offer" },
      },
      {
        speaker: "yacine",
        text: "See? No big deal.",
        duration: 2.3,
        mood: "dim",
        anims: { yacine: "talk", amel: "crossArms", player: "lookDown" },
      },
      {
        speaker: "narrator",
        text: "It didn't feel right. You said yes to fit in — not because you wanted to.",
        duration: 3.6,
        mood: "dim",
        anims: { player: "lookDown", amel: "crossArms" },
      },
      {
        speaker: "narrator",
        text: "Later, you keep thinking about it. Next time, the choice can be yours.",
        duration: 3.4,
        mood: "dim",
        anims: { player: "lookDown" },
      },
    ],
  },
  {
    id: 3,
    label: "Get angry and walk away.",
    title: "A boundary — and a slammed door",
    message: "You can set boundaries without being aggressive.",
    beats: [
      {
        speaker: "player",
        text: "Seriously?! Get that away from me!",
        duration: 2.3,
        anims: { player: "angry", amel: "lookDown" },
      },
      {
        speaker: "narrator",
        text: "You storm off without another word.",
        duration: 2.6,
        anims: { player: "walkAway", yacine: "shrug", karim: "shake" },
      },
      {
        speaker: "yacine",
        text: "Whoa… I only asked.",
        duration: 2.3,
        anims: { yacine: "shrug", amel: "crossArms" },
      },
      {
        speaker: "narrator",
        text: "You kept your boundary — but now everyone is tense, you included. A calm “no” would have worked too.",
        duration: 3.8,
        anims: { player: "lookDown", amel: "crossArms" },
      },
    ],
  },
  {
    id: 4,
    label: "Say no calmly and suggest another activity.",
    title: "Calm, confident, creative",
    message: "A healthy alternative can help you handle peer pressure.",
    beats: [
      {
        speaker: "player",
        text: "No thanks, I'm good. Who's up for football? The court's free.",
        duration: 3.0,
        anims: { player: "talk" },
      },
      {
        speaker: "yacine",
        text: "…Football? Fine. But I'm on your team.",
        duration: 2.6,
        anims: { yacine: "shrug", player: "nod" },
      },
      {
        speaker: "amel",
        text: "I'm in! Losers buy the juice.",
        duration: 2.3,
        anims: { amel: "cheer", karim: "nod" },
      },
      {
        speaker: "karim",
        text: "Let's go!",
        duration: 2.2,
        anims: { karim: "cheer", player: "cheer", amel: "cheer", yacine: "nod" },
      },
    ],
  },
];
