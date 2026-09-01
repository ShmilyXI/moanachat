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

function saveDemoPrompt(prompt: string) {
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
        className="mx-auto w-full max-w-[820px] overflow-hidden rounded-[32px] border border-[#0e2942]/15 bg-white/80 p-2 shadow-[0_24px_80px_rgba(14,41,66,0.16)] backdrop-blur-md"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="flex items-center gap-1">
          <button
            aria-label="Attach file or image"
            className="flex size-10 shrink-0 cursor-not-allowed items-center justify-center rounded-full text-[#0e2942]/40"
            disabled
            type="button"
          >
            <Paperclip className="size-[18px]" />
          </button>
          <div className="relative flex min-h-10 flex-1 items-center">
            {preview && !value ? (
              <span className="pointer-events-none absolute inset-0 flex items-center truncate text-base text-[#0e2942]/55">
                {preview}
              </span>
            ) : null}
            <textarea
              aria-label="Chat message input"
              className={`min-h-10 w-full resize-none bg-transparent px-0 py-2.5 text-base leading-5 text-[#0e2942] outline-none placeholder:text-[#0e2942]/40 ${preview && !value ? "opacity-0" : ""}`}
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
            className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed ${value.trim() ? "bg-[#0e2942]/60 text-white" : "bg-[#0e2942]/5 text-[#0e2942]/45"}`}
            disabled={!value.trim()}
            type="submit"
          >
            <ArrowUp className="size-[18px]" />
          </button>
        </div>
      </form>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {prompts.map(({ icon: Icon, label, prompt }) => (
          <button
            aria-label={label}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#0e2942]/10 bg-white/40 px-3 py-1.5 text-sm font-medium leading-none text-[#0e2942]/80 backdrop-blur transition hover:bg-white/70"
            key={label}
            onClick={() => saveDemoPrompt(prompt)}
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
