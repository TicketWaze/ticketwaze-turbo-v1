"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Match } from "@ticketwaze/typescript-config";
import { Link } from "@/i18n/navigation";
import useAdminCan from "@/lib/useAdminCan";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { ButtonNeutral, ButtonPrimary } from "@/components/shared/buttons";
import { TextField } from "@/components/shared/form/ActivityFormControls";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpdateMatchAsAdminAction } from "@/actions/ActivityEdit";

type AdminMatch = Match & { season?: { seasonId: string; name: string } | null };

function Crest({ name, url }: { name: string; url: string | null }) {
  return url ? (
    <Image
      src={url}
      alt={name}
      width={28}
      height={28}
      className="w-[2.8rem] h-[2.8rem] rounded-full object-cover border border-neutral-100 shrink-0"
    />
  ) : (
    <span className="w-[2.8rem] h-[2.8rem] rounded-full bg-neutral-100 text-deep-100 text-[1.2rem] font-semibold flex items-center justify-center uppercase shrink-0">
      {name.charAt(0)}
    </span>
  );
}

/**
 * On a match's admin page: its season (a link back), the two teams and the
 * round, and "Edit match" for the away team, its logo and the round. The home
 * team is always the organiser and cannot be changed here. Dates, venue and
 * tickets stay on the ordinary event edit.
 */
export default function AdminMatchBar({ match }: { match: AdminMatch }) {
  const t = useTranslations("Activities.edit.season.match");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const canManage = useAdminCan("activity.manage");
  const [open, setOpen] = useState(false);
  const [away, setAway] = useState(match.awayTeamName);
  const [round, setRound] = useState(match.round ?? "");
  const [logo, setLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setAway(match.awayTeamName);
    setRound(match.round ?? "");
    setLogo(null);
    setRemoveLogo(false);
  }

  async function save() {
    if (!away.trim()) {
      toast.error(t("away_required"));
      return;
    }
    setSaving(true);
    const formData = new FormData();
    formData.append("awayTeamName", away.trim());
    formData.append("round", round.trim());
    if (logo) formData.append("awayTeamLogo", logo);
    else if (removeLogo) formData.append("removeAwayTeamLogo", "true");
    const result = await UpdateMatchAsAdminAction({
      seasonId: match.seasonId,
      eventId: match.eventId,
      formData,
      accessToken: session?.user.accessToken ?? "",
      locale,
    });
    setSaving(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(t("saved"));
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-[15px] border border-neutral-100 px-6 py-4">
      <div className="flex flex-col gap-2 min-w-0">
        {match.season && (
          <Link
            href={`/activities/season/${match.season.seasonId}`}
            className="text-[1.3rem] text-primary-500 hover:underline w-fit"
          >
            {t("part_of", { season: match.season.name })}
          </Link>
        )}
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <Crest name={match.homeTeamName} url={match.homeTeamLogoUrl} />
          <span className="text-[1.5rem] font-medium text-deep-100">{match.homeTeamName}</span>
          <span className="text-[1.3rem] text-neutral-500">vs</span>
          <Crest name={match.awayTeamName} url={match.awayTeamLogoUrl} />
          <span className="text-[1.5rem] font-medium text-deep-100">{match.awayTeamName}</span>
          {match.round && (
            <span className="text-[1.3rem] text-neutral-600">· {match.round}</span>
          )}
        </div>
      </div>
      {canManage && (
        <ButtonNeutral
          className="h-[3.5rem] px-6 shrink-0"
          onClick={() => {
            reset();
            setOpen(true);
          }}
        >
          {t("edit")}
        </ButtonNeutral>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle className="font-primary font-medium text-[2rem] leading-10 text-black">
            {t("title")}
          </DialogTitle>
          <div className="flex flex-col gap-6">
            <p className="text-[1.3rem] leading-8 text-neutral-600">
              {t("home", { name: match.homeTeamName })}
            </p>
            <TextField label={t("away")} value={away} onChange={setAway} />
            <TextField label={t("round")} value={round} onChange={setRound} />
            <div className="flex flex-col gap-2">
              <span className="text-[1.4rem] font-medium text-black">{t("logo")}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label={t("logo")}
                onChange={(e) => {
                  setLogo(e.target.files?.[0] ?? null);
                  setRemoveLogo(false);
                }}
                className="text-[1.3rem]"
              />
              {match.awayTeamLogoUrl && !logo && (
                <label className="flex items-center gap-3 text-[1.3rem] text-neutral-600">
                  <input
                    type="checkbox"
                    checked={removeLogo}
                    onChange={(e) => setRemoveLogo(e.target.checked)}
                  />
                  {t("remove_logo")}
                </label>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-6 pt-6">
            <DialogClose asChild>
              <ButtonNeutral className="flex-1">{t("cancel")}</ButtonNeutral>
            </DialogClose>
            <ButtonPrimary className="flex-1" disabled={saving} onClick={save}>
              {saving ? <LoadingCircleSmall /> : t("save")}
            </ButtonPrimary>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
