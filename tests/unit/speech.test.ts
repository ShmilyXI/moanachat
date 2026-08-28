import assert from "node:assert/strict";
import test from "node:test";
import {
  extractSpeechTranscript,
  mergeSpeechTranscript,
  type SpeechRecognitionEventLike,
} from "@/lib/chat/speech";

test("merges recognized speech into the existing composer text", () => {
  assert.equal(
    mergeSpeechTranscript("Plan a trip", "to Kyoto"),
    "Plan a trip to Kyoto"
  );
  assert.equal(mergeSpeechTranscript("", "  Hello  "), "Hello");
});

test("extracts final speech result text", () => {
  const event: SpeechRecognitionEventLike = {
    results: [
      { 0: { transcript: "hello" }, isFinal: false, length: 1 },
      { 0: { transcript: "world" }, isFinal: true, length: 1 },
    ],
  };
  assert.equal(extractSpeechTranscript(event), "world");
});
