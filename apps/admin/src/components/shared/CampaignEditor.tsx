"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  MousePointerClick,
  Quote,
  Underline as UnderlineIcon,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  CampaignButton,
  CampaignImage,
  CampaignTextAlign,
} from "@/components/shared/CampaignEditorExtensions";

/**
 * STEP ONE OF THE COMPOSER: the body of the email.
 *
 * A SEPARATE COMPONENT FROM THE ORGANISER APP'S `RichTextEditor`, deliberately.
 * That one edits an activity description — a paragraph of prose in a page that
 * already has its own layout, so it strips links on paste and offers no images.
 * This one is authoring an entire email, where the image, the button and the
 * link ARE the content. The toolbars have almost nothing in common, and the
 * shared half is a dozen lines of StarterKit configuration.
 *
 * EVERY CONTROL HERE HAS A COUNTERPART IN THE API'S SANITISER, and nothing is
 * offered that the sanitiser would throw away. A toolbar button that produces
 * markup the email drops is worse than no button: the admin sees it work,
 * approves the preview, and only the recipients find out.
 */

interface CampaignEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Uploads a dropped image and resolves to its CDN URL. */
  onUploadImage: (file: File) => Promise<string>;
  t: (key: string, values?: Record<string, unknown>) => string;
}

function ToolbarBtn({
  onClick,
  active,
  title,
  disabled,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      // `onMouseDown` with `preventDefault`, not `onClick`: a click steals
      // focus from the editor first, which collapses the selection the command
      // is about to act on.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`p-[6px] rounded-[8px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "bg-primary-100 text-primary-600"
          : "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="w-[1px] h-8 bg-neutral-200 mx-1" />;
}

/** The merge tags the API knows how to resolve. Keep in step with `MERGE_TAG`. */
const MERGE_TAGS = ["firstName", "name", "email"] as const;

export default function CampaignEditor({
  value,
  onChange,
  placeholder,
  onUploadImage,
  t,
}: CampaignEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const lastInternalHtml = useRef(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          // Only the schemes the sanitiser will keep. Anything else is dropped
          // server-side, so offering it here would be a lie.
          protocols: ["http", "https", "mailto", "tel"],
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      CampaignImage,
      CampaignButton,
      CampaignTextAlign,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastInternalHtml.current = html;
      onChange(html);
    },
    editorProps: {
      attributes: {
        class:
          "outline-none min-h-[320px] text-[1.5rem] leading-8 text-deep-200 campaign-rich-text",
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []);
        const image = files.find((file) => file.type.startsWith("image/"));
        if (!image) return false;
        event.preventDefault();
        void uploadAndInsert(image);
        return true;
      },
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files ?? []);
        const image = files.find((file) => file.type.startsWith("image/"));
        if (!image) return false;
        event.preventDefault();
        void uploadAndInsert(image);
        return true;
      },
    },
  });

  /**
   * Keeps the editor in step when the parent replaces the body wholesale —
   * loading a saved draft, or switching between the French and English tab.
   *
   * Guarded on `lastInternalHtml` so a keystroke does not round-trip back in as
   * a `setContent`, which would reset the cursor to the top of the document on
   * every character typed.
   */
  useEffect(() => {
    if (!editor) return;
    if (value === lastInternalHtml.current) return;
    lastInternalHtml.current = value;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [value, editor]);

  async function uploadAndInsert(file: File) {
    setIsUploading(true);
    try {
      const url = await onUploadImage(file);
      editor?.chain().focus().setCampaignImage({ src: url, alt: "" }).run();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("editor.uploadFailed"),
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleSetLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt(t("editor.linkPrompt"), previous ?? "https://");
    if (href === null) return;
    if (href.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: href.trim() })
      .run();
  }

  function handleAddButton() {
    if (!editor) return;
    const label = window.prompt(t("editor.buttonLabelPrompt"), "");
    if (!label || !label.trim()) return;
    const href = window.prompt(t("editor.buttonUrlPrompt"), "https://");
    if (!href || !href.trim()) return;
    editor
      .chain()
      .focus()
      .setCampaignButton({ href: href.trim(), label: label.trim() })
      .run();
  }

  function insertMergeTag(tag: string) {
    editor?.chain().focus().insertContent(`{{${tag}}}`).run();
  }

  // Rendered only after mount: TipTap builds its document from the DOM, and
  // letting the server render an empty editor produces a hydration mismatch.
  if (!mounted || !editor) {
    return (
      <div className="bg-neutral-100 rounded-[10px] min-h-[400px] animate-pulse" />
    );
  }

  return (
    <div className="flex flex-col">
      <div className="bg-neutral-100 rounded-[10px] border border-transparent focus-within:border-primary-500 transition-colors duration-300 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 px-6 py-4 border-b border-neutral-200">
          <ToolbarBtn
            title={t("editor.bold")}
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={16} />
          </ToolbarBtn>
          <ToolbarBtn
            title={t("editor.italic")}
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={16} />
          </ToolbarBtn>
          <ToolbarBtn
            title={t("editor.underline")}
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon size={16} />
          </ToolbarBtn>

          <ToolbarDivider />

          <ToolbarBtn
            title={t("editor.heading2")}
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 size={16} />
          </ToolbarBtn>
          <ToolbarBtn
            title={t("editor.heading3")}
            active={editor.isActive("heading", { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 size={16} />
          </ToolbarBtn>
          <ToolbarBtn
            title={t("editor.bulletList")}
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={16} />
          </ToolbarBtn>
          <ToolbarBtn
            title={t("editor.orderedList")}
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={16} />
          </ToolbarBtn>
          <ToolbarBtn
            title={t("editor.quote")}
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={16} />
          </ToolbarBtn>

          <ToolbarDivider />

          <ToolbarBtn
            title={t("editor.alignLeft")}
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setCampaignTextAlign("left").run()}
          >
            <AlignLeft size={16} />
          </ToolbarBtn>
          <ToolbarBtn
            title={t("editor.alignCenter")}
            active={editor.isActive({ textAlign: "center" })}
            onClick={() =>
              editor.chain().focus().setCampaignTextAlign("center").run()
            }
          >
            <AlignCenter size={16} />
          </ToolbarBtn>
          <ToolbarBtn
            title={t("editor.alignRight")}
            active={editor.isActive({ textAlign: "right" })}
            onClick={() =>
              editor.chain().focus().setCampaignTextAlign("right").run()
            }
          >
            <AlignRight size={16} />
          </ToolbarBtn>

          <ToolbarDivider />

          <ToolbarBtn
            title={t("editor.link")}
            active={editor.isActive("link")}
            onClick={handleSetLink}
          >
            <Link2 size={16} />
          </ToolbarBtn>
          <ToolbarBtn
            title={t("editor.unlink")}
            disabled={!editor.isActive("link")}
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Unlink size={16} />
          </ToolbarBtn>
          <ToolbarBtn title={t("editor.button")} onClick={handleAddButton}>
            <MousePointerClick size={16} />
          </ToolbarBtn>
          <ToolbarBtn
            title={t("editor.image")}
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? <LoadingCircleSmall /> : <ImagePlus size={16} />}
          </ToolbarBtn>
          <ToolbarBtn
            title={t("editor.divider")}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus size={16} />
          </ToolbarBtn>
        </div>

        <div className="px-8 py-6" onClick={() => editor.chain().focus().run()}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Merge tags */}
      <div className="flex flex-wrap items-center gap-3 pt-4">
        <span className="text-[1.3rem] leading-8 text-neutral-600">
          {t("editor.mergeTagsLabel")}
        </span>
        {MERGE_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              insertMergeTag(tag);
            }}
            className="px-4 py-[0.4rem] rounded-[3rem] bg-neutral-100 hover:bg-primary-50 hover:text-primary-500 text-neutral-700 text-[1.3rem] leading-8 font-medium cursor-pointer transition-colors"
          >
            {`{{${tag}}}`}
          </button>
        ))}
        <span className="text-[1.3rem] leading-8 text-neutral-500">
          {t("editor.mergeTagsHint")}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Cleared so picking the same file twice in a row still fires.
          event.target.value = "";
          if (file) void uploadAndInsert(file);
        }}
      />
    </div>
  );
}
