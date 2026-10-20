import { Fragment } from "react";

/** Tiny renderer for quest text: paragraphs, "- " lists, and `inline code`. */
function inline(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={i}>{part.slice(1, -1)}</code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className={`prose-quest space-y-3 leading-relaxed ${className}`}>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 marker:text-berry">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(block)}</p>;
      })}
    </div>
  );
}
