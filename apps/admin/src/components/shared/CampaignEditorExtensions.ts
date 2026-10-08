import { Extension, Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CampaignImageView, {
  type CampaignImageLabels,
} from "@/components/shared/CampaignImageView";

import CampaignImageGridView, {
  CAMPAIGN_GRID_MAX,
  type CampaignImageGridOptions,
  type GridImage,
} from "@/components/shared/CampaignImageGridView";

export {
  CAMPAIGN_CONTENT_WIDTH,
  type CampaignImageLabels,
} from "@/components/shared/CampaignImageView";
export { CAMPAIGN_GRID_MAX } from "@/components/shared/CampaignImageGridView";

/**
 * A row of one to three images, side by side.
 *
 * An atom holding its images as an attribute rather than as child image nodes:
 * children would let the caret, a paste or a drag put a paragraph inside the
 * row, and the email has no way to render that. The row is one thing — added
 * to, taken from, moved and deleted as a whole.
 */
export const CampaignImageGrid = Node.create<CampaignImageGridOptions>({
  name: "campaignImageGrid",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return {
      upload: async () => {
        throw new Error("No upload handler configured.");
      },
      labels: {
        move: "Move",
        add: "Add image",
        removeImage: "Remove image",
        remove: "Remove row",
        uploadFailed: "That image could not be uploaded.",
      },
    };
  },

  addAttributes() {
    return {
      images: {
        default: [],
        // Read from the child <img> tags; the row's own markup carries no list.
        parseHTML: (element) =>
          Array.from(element.querySelectorAll("img[src]"))
            .slice(0, CAMPAIGN_GRID_MAX)
            .map((img) => ({
              src: img.getAttribute("src") ?? "",
              alt: img.getAttribute("alt") ?? "",
            })),
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-tw-grid]" }];
  },

  renderHTML({ node }) {
    const images = (node.attrs.images as GridImage[]) ?? [];
    return [
      "div",
      { "data-tw-grid": String(images.length) },
      ...images.map((image) => ["img", { src: image.src, alt: image.alt }]),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CampaignImageGridView);
  },

  addCommands() {
    return {
      setCampaignImageGrid:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { images: options.images.slice(0, CAMPAIGN_GRID_MAX) },
          }),
    };
  },
});

/**
 * THE THREE THINGS A CAMPAIGN BODY NEEDS THAT STARTERKIT DOES NOT SHIP.
 *
 * Written here rather than pulled from `@tiptap/extension-image` and
 * `@tiptap/extension-text-align` on purpose. Those two packages are not in the
 * workspace's lockfile, and adding them means an install — while what they
 * provide is, between them, about eighty lines. The button node has no upstream
 * equivalent at all: it has to render markup the API's sanitiser recognises, so
 * it was always going to be local.
 *
 * WHAT THE EDITOR EMITS IS A CONTRACT WITH `campaign_content.ts`. Its sanitiser
 * keeps an allowlist of tags and attributes and drops everything else, so an
 * attribute invented here that it does not know about is silently discarded on
 * the way into the email. The two that matter:
 *
 *   - alignment travels as `style="text-align:…"`, which the sanitiser
 *     re-validates against three literal values;
 *   - a button is an `<a data-tw-button="1">`, which the sanitiser turns into
 *     the table-based markup Outlook needs;
 *   - an image row is a `<div data-tw-grid="N">` holding N `<img>`, which the
 *     sanitiser turns into columns that stack on a phone.
 *
 * Change either shape without changing the sanitiser and the feature keeps
 * working in the editor while quietly producing plain text in the inbox.
 */

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    campaignImage: {
      setCampaignImage: (options: {
        src: string;
        alt?: string;
        width?: number | null;
      }) => ReturnType;
    };
    campaignImageGrid: {
      setCampaignImageGrid: (options: { images: GridImage[] }) => ReturnType;
    };
    campaignButton: {
      setCampaignButton: (options: {
        href: string;
        label: string;
      }) => ReturnType;
    };
    campaignTextAlign: {
      setCampaignTextAlign: (alignment: string) => ReturnType;
      unsetCampaignTextAlign: () => ReturnType;
    };
  }
}

/**
 * An image in the body.
 *
 * A block node, not inline. An email image that sits in a line of text needs
 * float rules that half the clients ignore, so the editor does not offer the
 * option — every image is its own block, placed by dragging it between blocks
 * and aligned left, centre or right within its row.
 *
 * Size and placement travel as `width="…"` (email pixels) and
 * `style="text-align:…"`, the two image attributes the sanitiser keeps.
 */
export const CampaignImage = Node.create<{ labels: CampaignImageLabels }>({
  name: "campaignImage",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return {
      labels: {
        move: "Move",
        left: "Align left",
        center: "Align centre",
        right: "Align right",
        remove: "Remove",
      },
    };
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      width: {
        default: null,
        parseHTML: (element) => {
          const value = parseInt(element.getAttribute("width") ?? "", 10);
          return Number.isFinite(value) && value > 0 ? value : null;
        },
        renderHTML: (attributes) =>
          attributes.width ? { width: String(attributes.width) } : {},
      },
      align: {
        default: "center",
        parseHTML: (element) => {
          const value = element.style.textAlign;
          return value === "left" || value === "right" ? value : "center";
        },
        renderHTML: (attributes) => ({
          style: `text-align:${attributes.align ?? "center"}`,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CampaignImageView);
  },

  addCommands() {
    return {
      setCampaignImage:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              alt: options.alt ?? "",
              width: options.width ?? null,
            },
          }),
    };
  },
});

/**
 * The call-to-action button.
 *
 * AN ATOM, NOT A LINK AROUND EDITABLE TEXT. Making the label editable in place
 * sounds friendlier, but it lets the caret wander inside the button and leaves
 * an admin able to split it in half with a Return — producing two anchors, one
 * of which the sanitiser renders as a second button with no label. Editing it
 * means replacing it, which is the honest version of what is happening anyway.
 */
export const CampaignButton = Node.create({
  name: "campaignButton",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      href: { default: "#" },
      label: { default: "Click here" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "a[data-tw-button]",
        getAttrs: (element) => ({
          href: (element as HTMLElement).getAttribute("href") ?? "#",
          label: (element as HTMLElement).textContent ?? "",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    // `data-tw-button` is the flag the API's sanitiser looks for. Without it
    // this renders as an ordinary link and the button is silently lost.
    return [
      "a",
      mergeAttributes(
        {
          "data-tw-button": "1",
          href: HTMLAttributes.href,
          class: "tw-campaign-button",
        },
      ),
      node.attrs.label,
    ];
  },

  addCommands() {
    return {
      setCampaignButton:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { href: options.href, label: options.label },
          }),
    };
  },
});

/**
 * Alignment on paragraphs and headings.
 *
 * Stored as a real `style` attribute rather than a class, because the value has
 * to survive `editor.getHTML()` into the API — the editor's stylesheet does not
 * travel with the body, and a class name would arrive meaning nothing.
 */
export const CampaignTextAlign = Extension.create({
  name: "campaignTextAlign",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element) => {
              const value = element.style.textAlign;
              return value === "center" || value === "right" || value === "left"
                ? value
                : null;
            },
            renderHTML: (attributes) =>
              attributes.textAlign
                ? { style: `text-align:${attributes.textAlign}` }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setCampaignTextAlign:
        (alignment: string) =>
        ({ commands }) =>
          ["paragraph", "heading"].every((type) =>
            commands.updateAttributes(type, { textAlign: alignment }),
          ),
      unsetCampaignTextAlign:
        () =>
        ({ commands }) =>
          ["paragraph", "heading"].every((type) =>
            commands.resetAttributes(type, "textAlign"),
          ),
    };
  },
});
