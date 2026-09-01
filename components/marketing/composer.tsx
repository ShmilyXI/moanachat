// biome-ignore-all lint/performance/noJsxPropsBind: prompt controls intentionally close over their prompt values

"use client";

import {
  ArrowUp,
  Code2,
  Lightbulb,
  Paperclip,
  Pencil,
  Search,
  Sparkles,
} from "lucide-react";
import { useCallback, useState } from "react";

const prompts = [
  {
    icon: Pencil,
    label: "Write content",
    prompt:
      "I need help writing something. If you need more details about the tone, audience, or format, ask me a couple quick questions first.",
  },
  {
    icon: Lightbulb,
    label: "Brainstorm ideas",
    prompt:
      "I'd like to brainstorm ideas with you. Ask me a few clarifying questions, then generate a range of creative options.",
  },
  {
    icon: Code2,
    label: "Write code",
    prompt:
      "Help me write some code. Ask me about the language, framework, and what I'm trying to accomplish if it's not clear.",
  },
  {
    icon: Search,
    label: "Research a topic",
    prompt:
      "Research a topic for me. Find current, reliable information, summarize the key findings, and cite sources.",
  },
  {
    icon: Sparkles,
    label: "Surprise me",
    prompt:
      "Tell me something genuinely fascinating that most people don't know about.",
  },
];

export function saveDemoPrompt(prompt: string) {
  window.localStorage.setItem(
    "moanaDemoPrompt",
    JSON.stringify({ value: prompt })
  );
  window.location.assign("/chat/agent");
}

export function Composer() {
  const [value, setValue] = useState("");
  const [preview, setPreview] = useState<string>();

  const submit = useCallback(() => {
    const prompt = value.trim();
    if (prompt) {
      saveDemoPrompt(prompt);
    }
  }, [value]);

  return (
    <div className="w-full">
      <form
        className="marketing-composer"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="marketing-composer__row">
          <button
            aria-label="Attach file or image"
            className="marketing-composer__icon"
            disabled
            type="button"
          >
            <Paperclip className="size-[18px]" />
          </button>
          <div className="marketing-composer__field">
            {preview && !value ? (
              <span className="pointer-events-none absolute inset-0 flex items-center truncate text-base text-[#0e2942]/55">
                {preview}
              </span>
            ) : null}
            <textarea
              aria-label="Chat message input"
              className={`marketing-composer__input ${preview && !value ? "marketing-composer__input--hidden" : ""}`}
              onChange={(event) => {
                setValue(event.target.value);
                if (event.target.value.trim()) {
                  setPreview(undefined);
                }
              }}
              onFocus={() => setPreview(undefined)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask anything privately..."
              rows={1}
              value={value}
            />
          </div>
          <button
            aria-label="Send message"
            className="marketing-composer__send"
            disabled={!value.trim()}
            type="submit"
          >
            <ArrowUp className="size-[18px]" />
          </button>
        </div>
      </form>
      <div className="marketing-composer__presets no-scrollbar">
        {prompts.map(({ icon: Icon, label, prompt }) => (
          <button
            aria-label={label}
            className="marketing-composer__preset"
            data-prompt-preset
            key={label}
            onClick={() => saveDemoPrompt(prompt)}
            onFocus={() => setPreview(prompt)}
            onMouseEnter={() => setPreview(prompt)}
            onMouseLeave={() => setPreview(undefined)}
            type="button"
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
