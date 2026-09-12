"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Image from "next/image";
import { Raffle } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import Separator from "@/components/shared/Separator";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { ButtonNeutral, ButtonPrimary } from "@/components/shared/buttons";
import LocationPicker, {
  SelectedLocation,
} from "@/components/shared/LocationPicker";
import {
  CheckField,
  ImageField,
  ListField,
  RepeatCard,
  Section,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/shared/form/ActivityFormControls";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpdateRaffleAsAdminAction } from "@/actions/ActivityEdit";

type PrizeDraft = {
  title: string;
  description: string;
  /** The key of the picture this prize already has, carried through untouched. */
  imageKey: string | null;
  imageUrl: string | null;
  /** A replacement the admin just picked. Wins over imageKey when present. */
  file: File | null;
};

/** An ISO timestamp trimmed to what <input type="datetime-local"> accepts. */
function toLocalInput(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 16);
}

export default function EditRaffleForm({
  raffle,
  entriesSold,
}: {
  raffle: Raffle & { prizes?: RafflePrizeLike[] };
  entriesSold: number;
}) {
  const t = useTranslations("Activities.edit");
  const tr = useTranslations("Activities.edit.raffle");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const hasSales = entriesSold > 0;

  const [title, setTitle] = useState(raffle.title ?? "");
  const [description, setDescription] = useState(raffle.description ?? "");
  const [tags, setTags] = useState<string[]>(raffle.activityTags ?? []);
  const [ticketPrice, setTicketPrice] = useState(String(raffle.ticketPrice ?? 0));
  const [currency, setCurrency] = useState(raffle.currency ?? "HTG");
  const [absorbFees, setAbsorbFees] = useState(Boolean(raffle.absorbFees));
  const [unlimited, setUnlimited] = useState(raffle.totalTicketsLimit === null);
  const [totalTickets, setTotalTickets] = useState(
    raffle.totalTicketsLimit ? String(raffle.totalTicketsLimit) : "",
  );
  const [salesStartAt, setSalesStartAt] = useState(
    toLocalInput(raffle.salesStartAt),
  );
  const [salesEndAt, setSalesEndAt] = useState(toLocalInput(raffle.salesEndAt));
  const [drawAt, setDrawAt] = useState(toLocalInput(raffle.drawAt));
  const [timezone, setTimezone] = useState(raffle.timezone ?? "");
  const [drawMode, setDrawMode] = useState(raffle.drawMode ?? "automatic");
  const [location, setLocation] = useState<SelectedLocation | null>(
    raffle.location ?? null,
  );
  const [cover, setCover] = useState<File | null>(null);

  const [prizes, setPrizes] = useState<PrizeDraft[]>(() =>
    (raffle.prizes ?? [])
      .slice()
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      .map((prize) => ({
        title: prize.title ?? "",
        description: prize.description ?? "",
        imageKey: prize.imageKey ?? null,
        imageUrl: prize.imageUrl ?? null,
        file: null,
      })),
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const materialChanges = useMemo(() => {
    const drawMoved =
      toLocalInput(raffle.drawAt) !== drawAt && drawAt.length > 0;
    return [
      title !== raffle.title && t("changes.name"),
      description !== raffle.description && t("changes.description"),
      Boolean(cover) && t("changes.image"),
      drawMoved && tr("changes.draw_date"),
    ].filter(Boolean) as string[];
  }, [title, description, cover, drawAt, raffle, t, tr]);

  function updatePrize(index: number, patch: Partial<PrizeDraft>) {
    setPrizes((prev) =>
      prev.map((prize, i) => (i === index ? { ...prize, ...patch } : prize)),
    );
  }

  function addPrize() {
    setPrizes((prev) => [
      ...prev,
      { title: "", description: "", imageKey: null, imageUrl: null, file: null },
    ]);
  }

  function removePrize(index: number) {
    setPrizes((prev) => prev.filter((_, i) => i !== index));
  }

  function localProblems(): string[] {
    const problems: string[] = [];
    if (title.trim().length < 10) problems.push(tr("errors.title"));
    if (description.trim().length < 20) problems.push(t("errors.description", { count: description.length }));
    if (!salesStartAt || !salesEndAt || !drawAt)
      problems.push(tr("errors.dates"));
    if (salesEndAt && drawAt && salesEndAt > drawAt)
      problems.push(tr("errors.sales_after_draw"));
    if (prizes.length === 0) problems.push(tr("errors.prizes"));
    if (!unlimited) {
      const total = Number(totalTickets);
      if (!Number.isFinite(total) || total <= 0)
        problems.push(tr("errors.total_tickets"));
      else if (total < prizes.length)
        problems.push(tr("errors.total_below_prizes"));
    }
    for (const [index, prize] of prizes.entries()) {
      if (!prize.title.trim())
        problems.push(tr("errors.prize_title", { number: index + 1 }));
      // Every prize needs a picture: it carries the reveal on the draw stage,
      // so a prize without one is a blank card. The API refuses it too.
      if (!prize.file && !prize.imageKey)
        problems.push(tr("errors.prize_image", { number: index + 1 }));
    }
    return problems;
  }

  function handleSubmitClick() {
    const problems = localProblems();
    if (problems.length > 0) {
      toast.error(problems[0]);
      return;
    }
    setConfirmOpen(true);
  }

  async function handleConfirmedSave() {
    setConfirmOpen(false);
    setIsSaving(true);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("activityTags", JSON.stringify(tags));
    formData.append("ticketPrice", String(Number(ticketPrice || 0)));
    formData.append("currency", currency);
    formData.append("absorbFees", JSON.stringify(absorbFees));
    formData.append("unlimited", JSON.stringify(unlimited));
    if (!unlimited) formData.append("totalTickets", String(Number(totalTickets)));
    formData.append("salesStartAt", salesStartAt);
    formData.append("salesEndAt", salesEndAt);
    formData.append("drawAt", drawAt);
    if (timezone) formData.append("timezone", timezone);
    formData.append("drawMode", drawMode);
    if (location) formData.append("location", JSON.stringify(location));
    if (cover) formData.append("cover", cover);

    /**
     * A prize keeps its existing picture by sending back the key it already
     * has; a replacement goes as `prizeImage_<index>`, positional because a
     * newly added prize has no id to be addressed by. The API only honours a
     * key that genuinely belongs to this raffle.
     */
    formData.append(
      "prizes",
      JSON.stringify(
        prizes.map((prize) => ({
          title: prize.title.trim(),
          ...(prize.description.trim()
            ? { description: prize.description.trim() }
            : {}),
          ...(!prize.file && prize.imageKey ? { imageKey: prize.imageKey } : {}),
        })),
      ),
    );
    prizes.forEach((prize, index) => {
      if (prize.file) formData.append(`prizeImage_${index}`, prize.file);
    });

    try {
      const result = await UpdateRaffleAsAdminAction({
        raffleId: raffle.raffleId,
        formData,
        accessToken: session?.user.accessToken ?? "",
        locale,
      });

      if ("error" in result) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        toast.error(result.error);
        return;
      }

      toast.success(t("saved"));
      if (result.supersededRevisions > 0)
        toast.info(t("superseded", { count: result.supersededRevisions }));

      router.push(`/activities/raffle/${raffle.raffleId}`);
      router.refresh();
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 flex-1 min-h-0 overflow-y-auto">
      <BackButton text={t("back")} />

      <div className="flex flex-col gap-2">
        <h2 className="font-primary leading-12 font-medium text-[2.6rem]">
          {tr("title")}
        </h2>
        <p className="text-[1.4rem] leading-8 text-neutral-600">
          {t("subtitle", { name: raffle.title })}
        </p>
      </div>

      {/* A raffle has no entry-return flow, so entrants get told but are not
          given a way out. Said plainly, because it is the one place an admin
          edit here is less recoverable than the same edit on an event. */}
      <div className="rounded-[1.4rem] bg-orange-50 border border-orange-200 p-6 flex flex-col gap-2">
        <p className="text-[1.4rem] leading-8 text-orange-700 font-medium">
          {t("notice.title")}
        </p>
        <p className="text-[1.3rem] leading-8 text-orange-700">
          {hasSales ? tr("notice.with_sales", { count: entriesSold }) : tr("notice.no_sales")}
        </p>
      </div>

      <Section title={t("sections.details")}>
        <TextField
          label={tr("fields.title")}
          value={title}
          onChange={setTitle}
          error={fieldErrors.title}
        />
        <TextAreaField
          label={t("fields.description")}
          value={description}
          onChange={setDescription}
          error={fieldErrors.description}
          hint={t("fields.description_hint", { count: description.length })}
        />
        <ListField
          label={t("fields.tags")}
          value={tags}
          onChange={setTags}
          placeholder={t("fields.tags_placeholder")}
        />
        <ImageField
          label={tr("fields.cover")}
          file={cover}
          onChange={setCover}
          keepLabel={t("fields.image_keep")}
          replaceLabel={t("fields.image_new")}
        />
        <div>
          <span className="text-[1.3rem] font-medium leading-8 text-neutral-700 pb-2 block">
            {t("fields.map")}
          </span>
          <LocationPicker value={location} onChange={setLocation} />
        </div>
      </Section>

      <Separator />

      <Section title={tr("sections.entries")}>
        {hasSales && (
          <p className="text-[1.3rem] leading-8 text-neutral-600">
            {tr("frozen", { currency: raffle.currency })}
          </p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TextField
            label={tr("fields.price", { currency })}
            type="number"
            min={0}
            value={ticketPrice}
            onChange={setTicketPrice}
            error={fieldErrors.ticketPrice}
            disabled={hasSales}
          />
          <SelectField
            label={tr("fields.currency")}
            value={currency}
            onChange={setCurrency}
            options={[
              { value: "HTG", label: "HTG" },
              { value: "USD", label: "USD" },
            ]}
            error={fieldErrors.currency}
          />
        </div>
        <CheckField
          label={tr("fields.absorb_fees")}
          checked={absorbFees}
          onChange={setAbsorbFees}
        />
        <CheckField
          label={tr("fields.unlimited")}
          checked={unlimited}
          onChange={setUnlimited}
        />
        {!unlimited && (
          <TextField
            label={tr("fields.total_tickets")}
            type="number"
            min={prizes.length}
            value={totalTickets}
            onChange={setTotalTickets}
            error={fieldErrors.totalTickets}
            disabled={hasSales}
          />
        )}
      </Section>

      <Separator />

      <Section title={tr("sections.schedule")}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TextField
            label={tr("fields.sales_start")}
            type="datetime-local"
            value={salesStartAt}
            onChange={setSalesStartAt}
            error={fieldErrors.salesStartAt}
          />
          <TextField
            label={tr("fields.sales_end")}
            type="datetime-local"
            value={salesEndAt}
            onChange={setSalesEndAt}
            error={fieldErrors.salesEndAt}
          />
          <TextField
            label={tr("fields.draw_at")}
            type="datetime-local"
            value={drawAt}
            onChange={setDrawAt}
            error={fieldErrors.drawAt}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TextField
            label={t("fields.timezone")}
            value={timezone}
            onChange={setTimezone}
            hint={tr("fields.timezone_hint")}
          />
          <SelectField
            label={tr("fields.draw_mode")}
            value={drawMode}
            onChange={(value) => setDrawMode(value as "automatic" | "manual")}
            options={[
              { value: "automatic", label: tr("fields.draw_automatic") },
              { value: "manual", label: tr("fields.draw_manual") },
            ]}
          />
        </div>
      </Section>

      <Separator />

      <Section
        title={tr("sections.prizes")}
        action={
          <button
            type="button"
            onClick={addPrize}
            className="text-[1.3rem] leading-8 text-primary-500 font-medium cursor-pointer shrink-0"
          >
            {tr("actions.add_prize")}
          </button>
        }
      >
        {/* Rank is what an entrant was playing for, so the order here is the
            order of the prizes — moving one is a real change, not a reshuffle. */}
        <p className="text-[1.3rem] leading-8 text-neutral-600">
          {tr("prizes_hint")}
        </p>
        {prizes.map((prize, index) => (
          <RepeatCard
            key={index}
            title={tr("fields.prize", { number: index + 1 })}
            removeLabel={t("actions.remove")}
            onRemove={prizes.length > 1 ? () => removePrize(index) : undefined}
          >
            <TextField
              label={tr("fields.prize_title")}
              value={prize.title}
              onChange={(value) => updatePrize(index, { title: value })}
            />
            <TextField
              label={tr("fields.prize_description")}
              value={prize.description}
              onChange={(value) => updatePrize(index, { description: value })}
            />
            <div className="flex items-end gap-6 flex-wrap">
              {prize.imageUrl && !prize.file && (
                <Image
                  src={prize.imageUrl}
                  alt={prize.title || `Prize ${index + 1}`}
                  width={80}
                  height={80}
                  className="rounded-[1rem] object-cover w-20 h-20"
                />
              )}
              <ImageField
                label={tr("fields.prize_image")}
                file={prize.file}
                onChange={(file) => updatePrize(index, { file })}
                keepLabel={
                  prize.imageKey
                    ? tr("fields.prize_image_keep")
                    : tr("fields.prize_image_required")
                }
                replaceLabel={t("fields.image_new")}
              />
            </div>
          </RepeatCard>
        ))}
      </Section>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 pb-16">
        <ButtonNeutral
          className="w-full lg:flex-1"
          onClick={() => router.push(`/activities/raffle/${raffle.raffleId}`)}
        >
          {t("actions.cancel")}
        </ButtonNeutral>
        <ButtonPrimary
          className="w-full lg:flex-1"
          disabled={isSaving}
          onClick={handleSubmitClick}
        >
          {isSaving ? <LoadingCircleSmall /> : t("actions.save")}
        </ButtonPrimary>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle className="font-primary font-medium text-[2rem] leading-10 text-black">
            {t("confirm.title")}
          </DialogTitle>
          <div className="flex flex-col gap-4">
            <p className="text-[1.4rem] leading-8 text-neutral-600">
              {t("confirm.body", { name: raffle.title })}
            </p>
            {materialChanges.length > 0 && (
              <div className="rounded-[1.2rem] bg-neutral-100 p-4">
                <p className="text-[1.3rem] leading-8 text-neutral-700 font-medium">
                  {t("confirm.changing")}
                </p>
                <ul className="list-disc pl-8">
                  {materialChanges.map((change) => (
                    <li
                      key={change}
                      className="text-[1.3rem] leading-8 text-neutral-600"
                    >
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hasSales && materialChanges.length > 0 && (
              <p className="text-[1.3rem] leading-8 text-orange-700">
                {tr("confirm.entrants", { count: entriesSold })}
              </p>
            )}
          </div>
          <DialogFooter className="flex gap-6 pt-8">
            <DialogClose asChild>
              <ButtonNeutral className="flex-1">
                {t("actions.cancel")}
              </ButtonNeutral>
            </DialogClose>
            <ButtonPrimary
              className="flex-1"
              disabled={isSaving}
              onClick={handleConfirmedSave}
            >
              {isSaving ? <LoadingCircleSmall /> : t("confirm.cta")}
            </ButtonPrimary>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Only the prize fields this form reads — the shared type carries far more. */
type RafflePrizeLike = {
  rank?: number;
  title?: string;
  description?: string | null;
  imageKey?: string | null;
  imageUrl?: string | null;
};
