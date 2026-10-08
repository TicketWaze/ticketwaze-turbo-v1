"use client";
import dynamic from "next/dynamic";
import type { RichTextEditorProps } from "./RichTextEditorField";

/** Same footprint as the editor, so nothing shifts when it arrives. */
export function RichTextEditorSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="h-[52px] bg-white border border-neutral-200 rounded-t-[1.5rem]" />
      <div className="h-[180px] bg-neutral-100 rounded-b-[1.5rem] border-x border-b border-neutral-200 animate-pulse" />
    </div>
  );
}

/**
 * The description editor. Tiptap and ProseMirror are ~70 KB, so they load as
 * their own chunk: the rest of the form is usable while the editor arrives.
 */
const RichTextEditor = dynamic<RichTextEditorProps>(
  () => import("./RichTextEditorField"),
  { ssr: false, loading: () => <RichTextEditorSkeleton /> },
);

export default RichTextEditor;
