"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { localizeTag } from "@/lib/service-options";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Preset suggestions (canonical English keys). */
  options: string[];
  language?: "en" | "fr" | "mfe";
  placeholder?: string;
  max?: number;
};

/**
 * One unified skills/services field: artisans pick from preset (localized) tags
 * OR type their own. Stored values stay canonical; only labels are translated.
 */
export function TagInput({
  value,
  onChange,
  options,
  language = "en",
  placeholder = "Add a skill and press Enter…",
  max = 8,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim().replace(/\s+/g, " ");
    if (tag.length < 2 || tag.length > 34) return;
    if (value.some((item) => item.toLowerCase() === tag.toLowerCase())) return;
    if (value.length >= max) return;
    onChange([...value, tag]);
  }

  function removeTag(tag: string) {
    onChange(value.filter((item) => item !== tag));
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
      setDraft("");
    } else if (event.key === "Backspace" && !draft && value.length) {
      removeTag(value[value.length - 1]);
    }
  }

  const suggestions = options.filter(
    (option) => !value.some((item) => item.toLowerCase() === option.toLowerCase()),
  );

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#d8d1c3] bg-white p-2 focus-within:border-[#0d8b66]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-[#0d8b66] px-2 py-1 text-xs font-semibold text-white"
          >
            {localizeTag(tag, language)}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="rounded hover:opacity-80"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKey}
          onBlur={() => {
            if (draft.trim()) {
              addTag(draft);
              setDraft("");
            }
          }}
          placeholder={value.length ? "" : placeholder}
          aria-label="Add a skill or service"
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
        />
      </div>

      {suggestions.length && value.length < max ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => addTag(option)}
              className="inline-flex items-center gap-1 rounded-md border border-[#ddd8cd] bg-[#f8f4ea] px-2.5 py-1 text-xs font-medium text-[#4d5651] transition hover:border-[#0d8b66]"
            >
              <Plus className="size-3" aria-hidden="true" />
              {localizeTag(option, language)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
