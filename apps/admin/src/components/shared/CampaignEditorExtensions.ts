import { Extension, Node, mergeAttributes } from "@tiptap/core";

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
 *     the table-based markup Outlook needs.
 *
 * Change either shape without changing the sanitiser and the feature keeps
 * working in the editor while quietly producing plain text in the inbox.
 */

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    campaignImage: {
      setCampaignImage: (options: { src: string; alt?: string }) => ReturnType;
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
 * option — every image is its own block, which is what the sanitiser's
 * `display:block` on `<img>` assumes.
 */
export const CampaignImage = Node.create({
  name: "campaignImage",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },

  addCommands() {
    return {
      setCampaignImage:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { src: options.src, alt: options.alt ?? "" },
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
