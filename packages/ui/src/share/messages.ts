/*
 * The share modal's own copy, so it reads the same in every app without each
 * one keeping the keys in its next-intl messages.
 */
const messages = {
  en: {
    title: "Share Activity",
    description:
      "Spread the word and invite your friends! Share this activity on social media or via direct message.",
    copy: "Copy",
    copied: "Link copied",
    copyFailed: "Could not copy the link",
    pasteHint: (app: string) =>
      `Link copied. Paste it in your ${app} story, post or bio.`,
    qr: "Download QR code",
    fallback:
      "Check this out — it’s worth your time! Something exciting is happening and I wanted you to be part of it.",
    profileTitle: "Share Profile",
    profileDescription:
      "Spread the word! Share this organiser’s page so people can discover their activities and follow them.",
    profileFallback: "Follow them on Ticketwaze to keep up with their upcoming activities.",
  },
  fr: {
    title: "Partager",
    description:
      "Faites passer le mot et invitez vos amis ! Partagez cette activité sur les réseaux sociaux ou par message direct.",
    copy: "Copier",
    copied: "Lien copié",
    copyFailed: "Impossible de copier le lien",
    pasteHint: (app: string) =>
      `Lien copié. Collez-le dans votre story, publication ou bio ${app}.`,
    qr: "Télécharger le code QR",
    fallback:
      "Jetez un œil, ça vaut le détour ! Il se passe quelque chose de génial et je voulais que vous en fassiez partie.",
    profileTitle: "Partager le profil",
    profileDescription:
      "Faites passer le mot ! Partagez la page de cet organisateur pour que les gens découvrent ses activités et le suivent.",
    profileFallback:
      "Suivez-le sur Ticketwaze pour ne rien manquer de ses prochaines activités.",
  },
};

export type ShareMessages = (typeof messages)["en"];

export function shareCopy(locale: string): ShareMessages {
  return locale.startsWith("fr") ? messages.fr : messages.en;
}
