export type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

export type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
};

export type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function mergeSpeechTranscript(
  current: string,
  transcript: string
): string {
  return [current.trim(), transcript.trim()].filter(Boolean).join(" ");
}

export function extractSpeechTranscript(
  event: SpeechRecognitionEventLike
): string {
  const transcripts: string[] = [];
  for (const result of Array.from(event.results)) {
    if (result?.isFinal && result[0]?.transcript) {
      transcripts.push(result[0].transcript);
    }
  }
  return transcripts.join(" ").trim();
}

export function createSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") {
    return null;
  }
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  const Constructor =
    speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  return Constructor ? new Constructor() : null;
}
