"use client";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useRef, useState } from "react";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

/**
 * A ROW OF ONE TO THREE IMAGES, SIDE BY SIDE.
 *
 * The column count is simply how many images the row holds, so there is no
 * separate setting to fall out of step with it: add a third image and it is a
 * three-column row, remove one and it is two. In the email the columns stack
 * full-width on a phone (`.tw-grid-col` in the API's emails/partials/head).
 */

export const CAMPAIGN_GRID_MAX = 3;

export interface GridImage {
  src: string;
  alt: string;
}

export interface CampaignImageGridOptions {
  upload: (file: File) => Promise<string>;
  labels: {
    move: string;
    add: string;
    removeImage: string;
    remove: string;
    uploadFailed: string;
  };
}

export default function CampaignImageGridView({
  node,
  selected,
  updateAttributes,
  deleteNode,
  editor,
  extension,
}: ReactNodeViewProps) {
  const { upload, labels } = extension.options as CampaignImageGridOptions;
  const images = (node.attrs.images as GridImage[]) ?? [];
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editable = editor.isEditable;

  async function addImages(files: File[]) {
    const room = CAMPAIGN_GRID_MAX - images.length;
    if (room <= 0) return;
    setIsUploading(true);
    try {
      const urls = await Promise.all(files.slice(0, room).map(upload));
      updateAttributes({
        images: [...images, ...urls.map((src) => ({ src, alt: "" }))],
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : labels.uploadFailed);
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index);
    if (next.length === 0) deleteNode();
    else updateAttributes({ images: next });
  }

  return (
    <NodeViewWrapper className="relative my-2">
      <div
        className={`flex gap-[12px] rounded-[0.8rem] ${
          selected ? "outline-2 outline-primary-500 outline-offset-4" : ""
        }`}
      >
        {images.map((image, index) => (
          <div key={`${image.src}-${index}`} className="relative flex-1 min-w-0 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              draggable={false}
              className="block w-full h-auto rounded-[0.8rem] !mb-0"
            />
            {editable && (
              <button
                type="button"
                title={labels.removeImage}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-[4px] rounded-full bg-white/90 text-neutral-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}

        {editable && images.length < CAMPAIGN_GRID_MAX && selected && (
          <button
            type="button"
            title={labels.add}
            disabled={isUploading}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="flex-1 min-w-0 min-h-[120px] flex flex-col items-center justify-center gap-2 rounded-[0.8rem] border-2 border-dashed border-neutral-300 text-neutral-500 hover:border-primary-500 hover:text-primary-500 transition-colors cursor-pointer"
          >
            {isUploading ? <LoadingCircleSmall /> : <Plus size={18} />}
            <span className="text-[1.2rem]">{labels.add}</span>
          </button>
        )}
      </div>

      {selected && editable && (
        <div
          contentEditable={false}
          className="absolute left-1/2 -translate-x-1/2 -top-[46px] z-10 flex items-center gap-1 px-2 py-1 rounded-[10px] bg-white border border-neutral-200 shadow-md whitespace-nowrap"
          onMouseDown={(e) => e.preventDefault()}
        >
          <span
            data-drag-handle
            draggable
            title={labels.move}
            className="p-[5px] rounded-[6px] text-neutral-500 hover:bg-neutral-100 cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={14} />
          </span>
          <span className="text-[1.2rem] text-neutral-400 tabular-nums px-2">
            {images.length} / {CAMPAIGN_GRID_MAX}
          </span>
          <span className="w-[1px] h-6 bg-neutral-200 mx-1" />
          <button
            type="button"
            title={labels.remove}
            onClick={() => deleteNode()}
            className="p-[5px] rounded-[6px] text-neutral-500 hover:bg-failure/10 hover:text-failure cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) void addImages(files);
        }}
      />
    </NodeViewWrapper>
  );
}
