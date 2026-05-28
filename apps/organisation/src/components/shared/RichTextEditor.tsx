"use client";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: string;
  minChars?: number;
  maxChars?: number;
}

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`p-[6px] rounded-[8px] transition-colors cursor-pointer ${
        active
          ? "bg-primary-100 text-primary-600"
          : "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  error,
  minChars = 150,
  maxChars = 3000,
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const lastInternalHtml = useRef(value);

  useEffect(() => setMounted(true), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      CharacterCount,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastInternalHtml.current = html;
      onChange(html);
    },
    editorProps: {
      transformPastedHTML(html) {
        return html.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");
      },
      attributes: {
        class:
          "outline-none min-h-[120px] text-[1.5rem] leading-8 text-deep-200 rich-text",
      },
    },
  });

  // Sync external value (e.g. form reset) without triggering a loop
  useEffect(() => {
    if (!editor || value === lastInternalHtml.current) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
    lastInternalHtml.current = value;
  }, [value, editor]);

  const activeState = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor?.isActive("bold") ?? false,
      italic: ctx.editor?.isActive("italic") ?? false,
      underline: ctx.editor?.isActive("underline") ?? false,
      h2: ctx.editor?.isActive("heading", { level: 2 }) ?? false,
      h3: ctx.editor?.isActive("heading", { level: 3 }) ?? false,
      bulletList: ctx.editor?.isActive("bulletList") ?? false,
      orderedList: ctx.editor?.isActive("orderedList") ?? false,
    }),
  });

  const charCount = editor?.storage.characterCount?.characters() ?? 0;

  if (!mounted) {
    return (
      <div className="flex flex-col">
        <div className="h-[52px] bg-white border border-neutral-200 rounded-t-[1.5rem]" />
        <div className="h-[180px] bg-neutral-100 rounded-b-[1.5rem] border-x border-b border-neutral-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-4 py-[6px] bg-white border border-neutral-200 rounded-t-[1.5rem]">
        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={activeState.bold}
          title="Bold"
        >
          <Bold size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={activeState.italic}
          title="Italic"
        >
          <Italic size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          active={activeState.underline}
          title="Underline"
        >
          <UnderlineIcon size={15} />
        </ToolbarBtn>
        <div className="w-px h-5 bg-neutral-200 mx-1" />
        <ToolbarBtn
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={activeState.h2}
          title="Heading 2"
        >
          <Heading2 size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={activeState.h3}
          title="Heading 3"
        >
          <Heading3 size={15} />
        </ToolbarBtn>
        <div className="w-px h-5 bg-neutral-200 mx-1" />
        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={activeState.bulletList}
          title="Bullet list"
        >
          <List size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={activeState.orderedList}
          title="Ordered list"
        >
          <ListOrdered size={15} />
        </ToolbarBtn>
      </div>

      {/* Editor area */}
      <div
        className={`bg-neutral-100 rounded-b-[1.5rem] px-8 py-6 border-x border-b transition-colors ${
          error
            ? "border-failure"
            : "border-neutral-200 focus-within:border-primary-500"
        }`}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-8 pt-1">
        <span className="text-[1.2rem] text-failure">{error}</span>
        {charCount > 0 && (
          <span
            className={`text-[1.2rem] text-nowrap ${
              charCount < minChars ? "text-failure" : "text-success"
            }`}
          >
            {charCount} / {maxChars}
          </span>
        )}
      </div>
    </div>
  );
}
