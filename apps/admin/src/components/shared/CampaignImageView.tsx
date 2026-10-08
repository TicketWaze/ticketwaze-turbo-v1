"use client";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  GripVertical,
  Trash2,
} from "lucide-react";

/**
 * THE IMAGE AS THE ADMIN HANDLES IT IN THE EDITOR.
 *
 * Selected, it grows two corner handles to resize by dragging and a small
 * toolbar for alignment, preset sizes, moving and deleting. Every control
 * writes one of the two attributes the sanitiser keeps — `width` in email
 * pixels and `align` — so nothing done here is lost on the way to the inbox.
 *
 * Widths are email pixels, not editor pixels. The editor column is exactly the
 * email's content width, so the two are the same number and what is resized
 * here is what lands.
 */

/**
 * The email's content column in pixels: the 680px card less its 80px gutters.
 * The editor column is set to the same width so an image resized here is the
 * size it arrives. Keep in step with `CONTENT_WIDTH` in `campaign_content.ts`.
 */
export const CAMPAIGN_CONTENT_WIDTH = 520;
export const CAMPAIGN_IMAGE_MIN_WIDTH = 40;

export interface CampaignImageLabels {
  move: string;
  left: string;
  center: string;
  right: string;
  remove: string;
}

type Align = "left" | "center" | "right";

const PRESETS = [
  { label: "S", ratio: 0.25 },
  { label: "M", ratio: 0.5 },
  { label: "L", ratio: 0.75 },
  { label: "Full", ratio: 1 },
] as const;

function clampWidth(value: number, max: number) {
  return Math.round(
    Math.min(Math.max(value, CAMPAIGN_IMAGE_MIN_WIDTH), max),
  );
}

export default function CampaignImageView({
  node,
  selected,
  updateAttributes,
  deleteNode,
  editor,
  extension,
}: ReactNodeViewProps) {
  const labels = (extension.options as { labels: CampaignImageLabels }).labels;
  const { src, alt } = node.attrs as { src: string; alt: string };
  const align = ((node.attrs.align as Align | null) ?? "center") as Align;
  const storedWidth =
    (node.attrs.width as number | null) ?? CAMPAIGN_CONTENT_WIDTH;

  /** Live width while a handle is being dragged; committed on release. */
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const width = dragWidth ?? storedWidth;
  const editable = editor.isEditable;

  function maxWidth() {
    const available = wrapperRef.current?.clientWidth ?? CAMPAIGN_CONTENT_WIDTH;
    return Math.min(available, CAMPAIGN_CONTENT_WIDTH);
  }

  function startResize(event: React.PointerEvent, side: "left" | "right") {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = storedWidth;
    const max = maxWidth();
    // A centred image grows from its middle, so the pointer only covers half
    // the change; doubling keeps the corner under the cursor.
    const factor = (side === "right" ? 1 : -1) * (align === "center" ? 2 : 1);

    let latest = startWidth;
    const onMove = (move: PointerEvent) => {
      latest = clampWidth(startWidth + (move.clientX - startX) * factor, max);
      setDragWidth(latest);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDragWidth(null);
      updateAttributes({ width: latest });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const justify =
    align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={`flex ${justify} my-2`}
      data-align={align}
    >
      <div
        className="relative max-w-full"
        style={{ width: `${width}px` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={`block w-full h-auto rounded-[0.8rem] !mb-0 ${
            selected ? "outline-2 outline-primary-500 outline-offset-2" : ""
          }`}
        />

        {selected && editable && (
          <>
            {/* Corner handles */}
            {(["left", "right"] as const).map((side) => (
              <span
                key={side}
                onPointerDown={(e) => startResize(e, side)}
                className={`absolute -bottom-[7px] ${
                  side === "left"
                    ? "-left-[7px] cursor-nesw-resize"
                    : "-right-[7px] cursor-nwse-resize"
                } w-[14px] h-[14px] rounded-full bg-white border-2 border-primary-500 shadow-sm`}
              />
            ))}

            {/* Floating toolbar */}
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
              <span className="w-[1px] h-6 bg-neutral-200 mx-1" />
              {(
                [
                  ["left", AlignLeft],
                  ["center", AlignCenter],
                  ["right", AlignRight],
                ] as const
              ).map(([value, Icon]) => (
                <button
                  key={value}
                  type="button"
                  title={labels[value]}
                  onClick={() => updateAttributes({ align: value })}
                  className={`p-[5px] rounded-[6px] cursor-pointer ${
                    align === value
                      ? "bg-primary-100 text-primary-600"
                      : "text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}
              <span className="w-[1px] h-6 bg-neutral-200 mx-1" />
              {PRESETS.map(({ label, ratio }) => {
                const target = Math.round(CAMPAIGN_CONTENT_WIDTH * ratio);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      updateAttributes({ width: clampWidth(target, maxWidth()) })
                    }
                    className={`px-[7px] py-[3px] rounded-[6px] text-[1.2rem] font-medium cursor-pointer ${
                      storedWidth === target
                        ? "bg-primary-100 text-primary-600"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              <span className="text-[1.2rem] text-neutral-400 tabular-nums px-2">
                {width}px
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
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
