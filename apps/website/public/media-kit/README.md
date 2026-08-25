# Media kit download

The `/media-kit` page links to `ticketwaze-media-kit.zip` in this folder
(see `MEDIA_KIT_FILE` in `src/app/[locale]/media-kit/components/Kit.tsx`).

Drop the archive here as:

    public/media-kit/ticketwaze-media-kit.zip

Keep the filename stable so links already shared with press keep working.
Suggested archive layout:

    ticketwaze-media-kit/
      logos/           full logo + standalone mark, colour / black / white, SVG + PNG
      colors/          palette swatches and hex reference
      typography/      typeface names, weights, and where each is used
      screenshots/     current product views at publication resolution
      boilerplate.txt  short and long company descriptions (EN + FR)

Keep it under ~25 MB. Anything larger belongs on the CDN instead: upload it
there and point `MEDIA_KIT_FILE` at the absolute URL.
