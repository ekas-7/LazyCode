"use client";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { useMemo } from "react";

const cozyTheme = EditorView.theme({
  "&": {
    backgroundColor: "#fffaf2",
    color: "#3b2a2a",
    height: "100%",
  },
  ".cm-content": {
    caretColor: "#d6384a",
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
    padding: "14px 0",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#d6384a", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "#fbdadd !important",
  },
  ".cm-gutters": {
    backgroundColor: "#f8ecdd",
    color: "#b79d8c",
    border: "none",
    borderRight: "1px solid #ecd9cc",
  },
  ".cm-activeLine": { backgroundColor: "rgba(251, 218, 221, 0.28)" },
  ".cm-activeLineGutter": { backgroundColor: "rgba(251, 218, 221, 0.5)", color: "#b92b3c" },
  ".cm-scroller": { overflow: "auto" },
});

export default function CodeEditor({
  value,
  onChange,
  onRun,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  onSubmit: () => void;
}) {
  const extensions = useMemo(
    () => [
      javascript(),
      cozyTheme,
      EditorView.lineWrapping,
      Prec.highest(
        keymap.of([
          { key: "Mod-Enter", run: () => (onRun(), true) },
          { key: "Mod-Shift-Enter", run: () => (onSubmit(), true) },
        ]),
      ),
    ],
    [onRun, onSubmit],
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      height="100%"
      style={{ height: "100%" }}
      basicSetup={{ foldGutter: false, highlightActiveLine: true, autocompletion: true }}
      aria-label="Code editor"
    />
  );
}
