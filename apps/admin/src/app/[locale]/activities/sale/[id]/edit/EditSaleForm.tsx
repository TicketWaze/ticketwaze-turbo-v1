"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Sale } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import Separator from "@/components/shared/Separator";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { ButtonNeutral, ButtonPrimary } from "@/components/shared/buttons";
import {
  CheckField,
  ImageField,
  ListField,
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
import { UpdateSaleAsAdminAction } from "@/actions/ActivityEdit";

export default function EditSaleForm({
  sale,
  copiesSold,
}: {
  sale: Sale;
  copiesSold: number;
}) {
  const t = useTranslations("Activities.edit");
  const ts = useTranslations("Activities.edit.sale");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const hasSales = copiesSold > 0;

  const [title, setTitle] = useState(sale.title ?? "");
  const [description, setDescription] = useState(sale.description ?? "");
  const [tags, setTags] = useState<string[]>(sale.activityTags ?? []);
  const [price, setPrice] = useState(String(sale.price ?? 0));
  const [currency, setCurrency] = useState(sale.currencyCode ?? "HTG");
  const [absorbFees, setAbsorbFees] = useState(Boolean(sale.absorbFees));
  const [cover, setCover] = useState<File | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const materialChanges = useMemo(
    () =>
      [
        title !== sale.title && t("changes.name"),
        description !== sale.description && t("changes.description"),
        Boolean(cover) && t("changes.image"),
      ].filter(Boolean) as string[],
    [title, description, cover, sale, t],
  );

  function localProblems(): string[] {
    const problems: string[] = [];
    if (title.trim().length < 10) problems.push(ts("errors.title"));
    if (description.trim().length < 20)
      problems.push(t("errors.description", { count: description.length }));
    const value = Number(price);
    if (!Number.isFinite(value) || value <= 0) problems.push(ts("errors.price"));
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
    formData.append("price", String(Number(price)));
    formData.append("currency", currency);
    formData.append("absorbFees", JSON.stringify(absorbFees));
    if (cover) formData.append("cover", cover);

    try {
      const result = await UpdateSaleAsAdminAction({
        saleId: sale.saleId,
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
      router.push(`/activities/sale/${sale.saleId}`);
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
          {ts("title")}
        </h2>
        <p className="text-[1.4rem] leading-8 text-neutral-600">
          {t("subtitle", { name: sale.title })}
        </p>
      </div>

      {/* The one thing this form deliberately cannot do, said before an admin
          goes looking for it. */}
      <div className="rounded-[1.4rem] bg-orange-50 border border-orange-200 p-6 flex flex-col gap-2">
        <p className="text-[1.4rem] leading-8 text-orange-700 font-medium">
          {t("notice.title")}
        </p>
        <p className="text-[1.3rem] leading-8 text-orange-700">
          {ts("notice.file")}
        </p>
      </div>

      <Section title={t("sections.details")}>
        <TextField
          label={ts("fields.title")}
          value={title}
          onChange={setTitle}
          error={fieldErrors.title}
          hint={hasSales ? ts("fields.title_slug_frozen") : undefined}
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
          label={ts("fields.cover")}
          file={cover}
          onChange={setCover}
          keepLabel={t("fields.image_keep")}
          replaceLabel={t("fields.image_new")}
        />
      </Section>

      <Separator />

      <Section title={ts("sections.pricing")}>
        {hasSales && (
          <p className="text-[1.3rem] leading-8 text-neutral-600">
            {ts("frozen", { currency: sale.currencyCode, count: copiesSold })}
          </p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TextField
            label={ts("fields.price", { currency })}
            type="number"
            min={0}
            value={price}
            onChange={setPrice}
            error={fieldErrors.price}
          />
          <SelectField
            label={ts("fields.currency")}
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
          label={ts("fields.absorb_fees")}
          checked={absorbFees}
          onChange={setAbsorbFees}
        />
      </Section>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 pb-16">
        <ButtonNeutral
          className="w-full lg:flex-1"
          onClick={() => router.push(`/activities/sale/${sale.saleId}`)}
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
              {t("confirm.body", { name: sale.title })}
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
