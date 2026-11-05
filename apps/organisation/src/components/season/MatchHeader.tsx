"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ArrowRight2, Edit2 } from "iconsax-reactjs";
import { Match } from "@ticketwaze/typescript-config";
import { Link, useRouter } from "@/i18n/navigation";
import { Dialog, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import ModalShell from "@/components/shared/ModalShell";
import { ButtonPill, ButtonPrimary } from "@/components/shared/buttons";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { slugify } from "@/lib/Slugify";
import { UpdateMatch } from "@/actions/SeasonActions";
import { MAX_UPLOAD_BYTES, formDataSize } from "@/lib/uploadLimit";
import TeamCrest from "./TeamCrest";
import MatchFields, {
  appendMatchFields,
  emptyTeam,
  MatchFieldsErrors,
  MatchFieldsValue,
  validateMatchFields,
} from "./MatchFields";

type MatchWithSeason = Match & {
  season?: { seasonId: string; name: string } | null;
};

const fromMatch = (match: Match): MatchFieldsValue => ({
  // Shown only: the home team is the organiser.
  home: emptyTeam(match.homeTeamLogoUrl, match.homeTeamName),
  away: emptyTeam(match.awayTeamLogoUrl, match.awayTeamName),
  round: match.round ?? "",
});

/**
 * On a match's event page: the season it belongs to (a way back), the two
 * teams, and an "Edit teams" dialog. Dates, venue and tickets stay on the
 * ordinary event edit.
 */
export default function MatchHeader({ match }: { match: MatchWithSeason }) {
  const t = useTranslations("Events.season.match");
  const tSeason = useTranslations("Events.season");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const canEdit = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).editEvent();

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<MatchFieldsValue>(() => fromMatch(match));
  const [errors, setErrors] = useState<MatchFieldsErrors>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    const found = validateMatchFields(value, t);
    setErrors(found);
    if (Object.keys(found).length) return;
    const organisationId = session?.activeOrganisation?.organisationId;
    if (!organisationId) return;

    const fd = new FormData();
    appendMatchFields(fd, value, { edit: true });
    if (formDataSize(fd) > MAX_UPLOAD_BYTES) {
      toast.error(tSeason("errors.too_large"));
      return;
    }
    setSaving(true);
    const result = await UpdateMatch(
      organisationId,
      match.seasonId,
      match.eventId,
      fd,
      locale,
    );
    setSaving(false);
    if (result.status !== "success") {
      toast.error(result.error);
      return;
    }
    toast.success(t("saved"));
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-[1.5rem] border border-neutral-100 p-6">
      <div className="flex flex-col gap-4 min-w-0">
        {match.season && (
          <Link
            href={`/events/season/${slugify(match.season.name, match.season.seasonId)}`}
            className="inline-flex items-center gap-2 text-[1.3rem] leading-6 text-primary-500 hover:underline w-fit"
          >
            {t("part_of", { season: match.season.name })}
            <ArrowRight2 size="14" color="#E45B00" />
          </Link>
        )}
        <div className="flex items-center gap-4 min-w-0 flex-wrap">
          <TeamCrest
            name={match.homeTeamName}
            logoUrl={match.homeTeamLogoUrl}
            size={44}
          />
          <span className="font-medium text-[1.6rem] text-deep-100">
            {match.homeTeamName}
          </span>
          <span className="text-[1.3rem] font-primary font-bold text-neutral-500">
            {t("vs")}
          </span>
          <span className="font-medium text-[1.6rem] text-deep-100">
            {match.awayTeamName}
          </span>
          <TeamCrest
            name={match.awayTeamName}
            logoUrl={match.awayTeamLogoUrl}
            size={44}
          />
          {match.round && (
            <span className="text-[1.3rem] text-neutral-600">
              · {match.round}
            </span>
          )}
        </div>
      </div>

      {canEdit && (
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) {
              setValue(fromMatch(match));
              setErrors({});
            }
          }}
        >
          <DialogTrigger asChild>
            <ButtonPill type="button" className="w-fit">
              <Edit2 size="16" color="#737c8a" variant="Bulk" />
              {t("edit_teams")}
            </ButtonPill>
          </DialogTrigger>
          <ModalShell
            title={t("edit_teams_title")}
            className="lg:w-[64rem] max-w-[64rem]"
          >
            <div className="flex flex-col gap-8 pt-8 overflow-y-auto">
              <MatchFields value={value} onChange={setValue} errors={errors} />
              <div className="flex gap-4">
                <DialogClose asChild>
                  <ButtonPrimary className="flex-1 bg-neutral-100 text-deep-100 hover:bg-neutral-200">
                    {t("cancel")}
                  </ButtonPrimary>
                </DialogClose>
                <ButtonPrimary
                  className="flex-1"
                  disabled={saving}
                  onClick={save}
                >
                  {t("save")}
                </ButtonPrimary>
              </div>
            </div>
          </ModalShell>
        </Dialog>
      )}
    </div>
  );
}
