import { cleanReading } from "./kana";

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(cleanReading(text));
    u.lang = "ja-JP";
    u.rate = 0.85;
    const voice = speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("ja"));
    if (voice) u.voice = voice;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {
    // speech is a nicety; never break the UI over it
  }
}
