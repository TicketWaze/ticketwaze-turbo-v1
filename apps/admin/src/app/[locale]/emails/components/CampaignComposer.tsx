"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, TickCircle } from "iconsax-reactjs";
import { Input, TextArea } from "@/components/shared/Inputs";
import { ButtonPrimary, ButtonSecondary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import UnauthorizedView from "@/components/shared/UnauthorizedView";
import CampaignEditor from "@/components/shared/CampaignEditor";
import { usePermissions } from "@/hooks/usePermissions";
import {
  CreateCampaignAction,
  PreviewAudienceAction,
  PreviewCampaignAction,
  SendCampaignAction,
  SendTestCampaignAction,
  UpdateCampaignAction,
  UploadCampaignImageAction,
} from "@/actions/Campaign";

/**
 * THE THREE-STEP COMPOSER: write, choose who, then look at it and send.
 *
 * THE DRAFT IS SAVED SERVER-SIDE AT EVERY STEP BOUNDARY, not held in state
 * until the end. Writing an email is slow work — a closed tab, an expired
 * session or a mis-clicked Back button between step one and step three would
 * otherwise throw away twenty minutes of writing, and that is exactly the kind
 * of loss nobody reports as a bug and everybody remembers.
 *
 * The consequence is that a campaign row exists from the moment step one is
 * left, in `draft` status. Drafts are inert: they have no recipients, they are
 * the only status that can be edited or deleted, and nothing is sent until the
 * button on step three is pressed.
 */

type Step = 1 | 2 | 3;

export interface ExistingCampaign {
  emailCampaignId: string;
  name: string;
  subjectFr: string;
  subjectEn: string | null;
  bodyFr: string;
  bodyEn: string | null;
  toAllUsers: boolean;
  toAllOrganisations: boolean;
  manualEmails: string[];
}

interface Props {
  accessToken: string;
  /** Present when an existing draft is being resumed. */
  campaign?: ExistingCampaign;
}

interface Breakdown {
  users: number;
  organisations: number;
  manual: number;
  duplicates: number;
  optedOut: number;
  total: number;
}

export default function CampaignComposer({ accessToken, campaign }: Props) {
  const t = useTranslations("Emails");
  const locale = useLocale();
  const router = useRouter();
  const { can, isLoading: permissionsLoading } = usePermissions();

  const auth = { accessToken, locale };

  const [step, setStep] = useState<Step>(1);
  const [campaignId, setCampaignId] = useState<string | null>(
    campaign?.emailCampaignId ?? null,
  );

  // Step 1 — content
  const [name, setName] = useState(campaign?.name ?? "");
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  const [subjectFr, setSubjectFr] = useState(campaign?.subjectFr ?? "");
  const [subjectEn, setSubjectEn] = useState(campaign?.subjectEn ?? "");
  const [bodyFr, setBodyFr] = useState(campaign?.bodyFr ?? "");
  const [bodyEn, setBodyEn] = useState(campaign?.bodyEn ?? "");

  // Step 2 — audience
  const [toAllUsers, setToAllUsers] = useState(campaign?.toAllUsers ?? false);
  const [toAllOrganisations, setToAllOrganisations] = useState(
    campaign?.toAllOrganisations ?? false,
  );
  const [manualEmails, setManualEmails] = useState(
    (campaign?.manualEmails ?? []).join(", "),
  );
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const [isCounting, setIsCounting] = useState(false);

  // Step 3 — preview and send
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLocale, setPreviewLocale] = useState<"fr" | "en">("fr");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);

  const hasBody = Boolean(bodyFr.replace(/<[^>]*>/g, "").trim());
  const hasAudience =
    toAllUsers || toAllOrganisations || manualEmails.trim().length > 0;

  /* ── Step 1 ──────────────────────────────────────────────────────────────── */

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);
    const result = await UploadCampaignImageAction(formData, auth);
    if ("error" in result) throw new Error(result.error);
    return result.url;
  }

  /**
   * Writes the draft and advances.
   *
   * Creates on the first call and updates on every one after — which is why
   * `campaignId` is state rather than a prop: stepping back to one and forward
   * again must not leave a trail of abandoned drafts behind it.
   */
  async function saveDraft(): Promise<boolean> {
    setIsSaving(true);
    try {
      const body = {
        name: name.trim() || subjectFr.trim(),
        subjectFr: subjectFr.trim(),
        subjectEn: subjectEn.trim() || undefined,
        bodyFr,
        bodyEn: bodyEn.replace(/<[^>]*>/g, "").trim() ? bodyEn : undefined,
        toAllUsers,
        toAllOrganisations,
        manualEmails,
      };

      const result = campaignId
        ? await UpdateCampaignAction(campaignId, body, auth)
        : await CreateCampaignAction(body, auth);

      if ("error" in result) {
        toast.error(result.error);
        return false;
      }
      setCampaignId(result.campaign.emailCampaignId);
      return true;
    } finally {
      setIsSaving(false);
    }
  }

  async function goToStep2() {
    if (!subjectFr.trim()) {
      toast.error(t("compose.errors.subjectRequired"));
      return;
    }
    if (!hasBody) {
      toast.error(t("compose.errors.bodyRequired"));
      return;
    }
    if (await saveDraft()) setStep(2);
  }

  /* ── Step 2 ──────────────────────────────────────────────────────────────── */

  const refreshAudience = useCallback(async () => {
    if (!toAllUsers && !toAllOrganisations && !manualEmails.trim()) {
      setBreakdown(null);
      setInvalidEmails([]);
      return;
    }
    setIsCounting(true);
    const result = await PreviewAudienceAction(
      { toAllUsers, toAllOrganisations, manualEmails },
      auth,
    );
    setIsCounting(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setBreakdown(result.breakdown);
    setInvalidEmails(result.invalidEmails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toAllUsers, toAllOrganisations, manualEmails, accessToken, locale]);

  /**
   * Recounts as the selection changes, debounced.
   *
   * The count is a real query over every account, so firing it per keystroke in
   * the address box would put the whole users table behind every character the
   * admin types.
   */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (step !== 2) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void refreshAudience(), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [step, refreshAudience]);

  async function goToStep3() {
    if (!hasAudience) {
      toast.error(t("compose.errors.audienceRequired"));
      return;
    }
    if (breakdown && breakdown.total === 0) {
      toast.error(t("compose.errors.audienceEmpty"));
      return;
    }
    if (!(await saveDraft())) return;
    setStep(3);
    void loadPreview(previewLocale);
  }

  /* ── Step 3 ──────────────────────────────────────────────────────────────── */

  async function loadPreview(which: "fr" | "en") {
    setIsPreviewing(true);
    const result = await PreviewCampaignAction(
      {
        subjectFr: subjectFr.trim(),
        subjectEn: subjectEn.trim() || undefined,
        bodyFr,
        bodyEn: bodyEn.replace(/<[^>]*>/g, "").trim() ? bodyEn : undefined,
        locale: which,
      },
      auth,
    );
    setIsPreviewing(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setPreviewHtml(result.html);
    setPreviewSubject(result.subject);
  }

  async function handleSendTest() {
    if (!campaignId) return;
    setIsTesting(true);
    const result = await SendTestCampaignAction(
      campaignId,
      { locale: previewLocale },
      auth,
    );
    setIsTesting(false);
    if ("error" in result) toast.error(result.error);
    else toast.success(t("preview.testSent"));
  }

  async function handleSend() {
    if (!campaignId) return;
    setIsSending(true);
    const result = await SendCampaignAction(campaignId, auth);
    setIsSending(false);
    if ("error" in result) {
      toast.error(result.error);
      setConfirmSend(false);
      return;
    }
    toast.success(t("preview.queued", { count: result.totalRecipients }));
    router.push(`/emails/${campaignId}`);
  }

  /* ── Render ──────────────────────────────────────────────────────────────── */

  if (permissionsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <LoadingCircleSmall />
      </div>
    );
  }
  if (!can("campaigns.create")) return <UnauthorizedView />;

  const steps: { number: Step; label: string }[] = [
    { number: 1, label: t("compose.steps.content") },
    { number: 2, label: t("compose.steps.recipients") },
    { number: 3, label: t("compose.steps.preview") },
  ];

  return (
    <div className="overflow-y-scroll flex flex-col gap-8 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => (step === 1 ? router.push("/emails") : setStep((step - 1) as Step))}
          className="flex items-center gap-2 text-[1.4rem] leading-8 text-neutral-600 hover:text-primary-500 cursor-pointer transition-colors w-fit"
        >
          <ArrowLeft size="18" />
          {step === 1 ? t("compose.backToList") : t("compose.back")}
        </button>
        <h3 className="font-medium font-primary text-[2.6rem] leading-12 text-black">
          {campaign ? t("compose.editTitle") : t("compose.title")}
        </h3>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-4 border-b border-neutral-100 pb-8">
        {steps.map(({ number, label }, index) => (
          <div key={number} className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`w-[2.8rem] h-[2.8rem] rounded-full flex items-center justify-center text-[1.3rem] font-medium ${
                  step === number
                    ? "bg-primary-500 text-white"
                    : step > number
                      ? "bg-primary-50 text-primary-500"
                      : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {step > number ? <TickCircle size="16" variant="Bold" /> : number}
              </span>
              <span
                className={`text-[1.4rem] leading-8 ${
                  step >= number
                    ? "text-neutral-900 font-medium"
                    : "text-neutral-500"
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <span className="w-12 h-[1px] bg-neutral-200 hidden lg:block" />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: content ── */}
      {step === 1 && (
        <div className="flex flex-col gap-8 max-w-[900px]">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          >
            {t("compose.fields.name")}
          </Input>
          <p className="text-[1.3rem] leading-6 text-neutral-500 -mt-6 px-8">
            {t("compose.fields.nameHint")}
          </p>

          {/* Language tabs. French is what everyone gets unless English exists. */}
          <div className="flex items-center gap-2 p-2 bg-neutral-100 rounded-[3rem] w-fit">
            {(["fr", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                className={`px-8 py-[0.6rem] rounded-[3rem] text-[1.4rem] leading-8 font-medium cursor-pointer transition-colors ${
                  language === code
                    ? "bg-white text-primary-500 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {t(`compose.language.${code}`)}
                {code === "en" && !bodyEn.replace(/<[^>]*>/g, "").trim() && (
                  <span className="text-neutral-400"> · {t("compose.language.optional")}</span>
                )}
              </button>
            ))}
          </div>

          {language === "en" && (
            <p className="text-[1.3rem] leading-6 text-neutral-500 -mt-4">
              {t("compose.language.fallbackHint")}
            </p>
          )}

          <Input
            value={language === "fr" ? subjectFr : subjectEn}
            onChange={(e) =>
              language === "fr"
                ? setSubjectFr(e.target.value)
                : setSubjectEn(e.target.value)
            }
            maxLength={200}
          >
            {t("compose.fields.subject")}
          </Input>

          <div className="flex flex-col gap-3">
            <label className="text-[1.4rem] leading-8 text-neutral-700 font-medium">
              {t("compose.fields.body")}
            </label>
            <CampaignEditor
              // Remounted per language so the two bodies never share an undo
              // history — undoing in English must not reach into the French one.
              key={language}
              value={language === "fr" ? bodyFr : bodyEn}
              onChange={language === "fr" ? setBodyFr : setBodyEn}
              placeholder={t("compose.fields.bodyPlaceholder")}
              onUploadImage={uploadImage}
              t={t as never}
            />
          </div>

          <div className="flex justify-end">
            <ButtonPrimary onClick={goToStep2} disabled={isSaving}>
              {isSaving ? <LoadingCircleSmall /> : t("compose.next")}
            </ButtonPrimary>
          </div>
        </div>
      )}

      {/* ── Step 2: recipients ── */}
      {step === 2 && (
        <div className="flex flex-col gap-8 max-w-[900px]">
          <div className="flex flex-col gap-4">
            <label className="text-[1.4rem] leading-8 text-neutral-700 font-medium">
              {t("recipients.groups")}
            </label>

            <label className="flex items-start gap-4 p-8 rounded-[10px] bg-neutral-100 cursor-pointer">
              <input
                type="checkbox"
                checked={toAllUsers}
                onChange={(e) => setToAllUsers(e.target.checked)}
                className="mt-2 w-[1.8rem] h-[1.8rem] accent-primary-500 cursor-pointer"
              />
              <span className="flex flex-col gap-1">
                <span className="text-[1.5rem] leading-8 font-medium text-deep-200">
                  {t("recipients.allUsers")}
                </span>
                <span className="text-[1.3rem] leading-6 text-neutral-600">
                  {t("recipients.allUsersHint")}
                </span>
              </span>
            </label>

            <label className="flex items-start gap-4 p-8 rounded-[10px] bg-neutral-100 cursor-pointer">
              <input
                type="checkbox"
                checked={toAllOrganisations}
                onChange={(e) => setToAllOrganisations(e.target.checked)}
                className="mt-2 w-[1.8rem] h-[1.8rem] accent-primary-500 cursor-pointer"
              />
              <span className="flex flex-col gap-1">
                <span className="text-[1.5rem] leading-8 font-medium text-deep-200">
                  {t("recipients.allOrganisations")}
                </span>
                <span className="text-[1.3rem] leading-6 text-neutral-600">
                  {t("recipients.allOrganisationsHint")}
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[1.4rem] leading-8 text-neutral-700 font-medium">
              {t("recipients.manual")}
            </label>
            <TextArea
              value={manualEmails}
              onChange={(e) => setManualEmails(e.target.value)}
            >
              {t("recipients.manual")}
            </TextArea>
            <p className="text-[1.3rem] leading-6 text-neutral-500">
              {t("recipients.manualHint")}{" "}
              <span className="text-neutral-400">
                {t("recipients.manualPlaceholder")}
              </span>
            </p>
            {invalidEmails.length > 0 && (
              <p className="text-[1.3rem] leading-6 text-failure">
                {t("recipients.invalid", {
                  emails: invalidEmails.slice(0, 5).join(", "),
                  count: invalidEmails.length,
                })}
              </p>
            )}
          </div>

          {/* Live count */}
          <div className="flex flex-col gap-4 p-8 rounded-[10px] border border-neutral-200">
            <div className="flex items-center justify-between">
              <span className="text-[1.4rem] leading-8 text-neutral-700 font-medium">
                {t("recipients.summary")}
              </span>
              {isCounting && <LoadingCircleSmall />}
            </div>
            {breakdown ? (
              <div className="flex flex-col gap-2">
                <p className="font-primary font-medium text-[2.4rem] leading-12 text-black">
                  {t("recipients.total", { count: breakdown.total })}
                </p>
                <p className="text-[1.3rem] leading-6 text-neutral-600">
                  {t("recipients.breakdown", {
                    users: breakdown.users,
                    organisations: breakdown.organisations,
                    manual: breakdown.manual,
                  })}
                </p>
                {(breakdown.duplicates > 0 || breakdown.optedOut > 0) && (
                  <p className="text-[1.3rem] leading-6 text-neutral-500">
                    {t("recipients.excluded", {
                      duplicates: breakdown.duplicates,
                      optedOut: breakdown.optedOut,
                    })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[1.4rem] leading-8 text-neutral-500">
                {t("recipients.nothingSelected")}
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <ButtonSecondary onClick={() => setStep(1)}>
              {t("compose.back")}
            </ButtonSecondary>
            <ButtonPrimary onClick={goToStep3} disabled={isSaving || isCounting}>
              {isSaving ? <LoadingCircleSmall /> : t("compose.next")}
            </ButtonPrimary>
          </div>
        </div>
      )}

      {/* ── Step 3: preview and send ── */}
      {step === 3 && (
        <div className="flex flex-col gap-8 max-w-[900px]">
          <div className="flex flex-col gap-4 p-8 rounded-[10px] bg-primary-50/60">
            <p className="text-[1.5rem] leading-8 text-deep-200 font-medium">
              {t("preview.aboutToSend", { count: breakdown?.total ?? 0 })}
            </p>
            <p className="text-[1.3rem] leading-6 text-neutral-600">
              {t("preview.aboutToSendHint")}
            </p>
          </div>

          {/* Language switcher — only when both were written. */}
          {bodyEn.replace(/<[^>]*>/g, "").trim() && (
            <div className="flex items-center gap-2 p-2 bg-neutral-100 rounded-[3rem] w-fit">
              {(["fr", "en"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setPreviewLocale(code);
                    void loadPreview(code);
                  }}
                  className={`px-8 py-[0.6rem] rounded-[3rem] text-[1.4rem] leading-8 font-medium cursor-pointer transition-colors ${
                    previewLocale === code
                      ? "bg-white text-primary-500 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {t(`compose.language.${code}`)}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <span className="text-[1.3rem] leading-6 text-neutral-500">
              {t("preview.subjectLabel")}
            </span>
            <p className="text-[1.6rem] leading-8 font-medium text-deep-200">
              {previewSubject || subjectFr}
            </p>
          </div>

          <div className="rounded-[10px] border border-neutral-200 overflow-hidden bg-neutral-100">
            {isPreviewing || previewHtml === null ? (
              <div className="h-[600px] flex items-center justify-center">
                <LoadingCircleSmall />
              </div>
            ) : (
              /**
               * A sandboxed iframe, not `dangerouslySetInnerHTML`.
               *
               * The preview is a full HTML document with its own `<style>`
               * blocks; injecting it into the page would leak those styles into
               * the admin app and let the campaign's own CSS reformat the
               * dashboard around it. The sandbox also means the preview cannot
               * run anything, which matters because the body is HTML that
               * arrived from an editor and, sometimes, from a paste.
               */
              <iframe
                title={t("preview.iframeTitle")}
                sandbox=""
                srcDoc={previewHtml}
                className="w-full h-[700px] bg-white"
              />
            )}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <ButtonSecondary onClick={() => setStep(2)}>
              {t("compose.back")}
            </ButtonSecondary>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <ButtonSecondary onClick={handleSendTest} disabled={isTesting}>
                {isTesting ? <LoadingCircleSmall /> : t("preview.sendTest")}
              </ButtonSecondary>

              {can("campaigns.send") ? (
                confirmSend ? (
                  <div className="flex items-center gap-4">
                    <ButtonSecondary onClick={() => setConfirmSend(false)}>
                      {t("preview.cancel")}
                    </ButtonSecondary>
                    <ButtonPrimary onClick={handleSend} disabled={isSending}>
                      {isSending ? (
                        <LoadingCircleSmall />
                      ) : (
                        t("preview.confirmSend", {
                          count: breakdown?.total ?? 0,
                        })
                      )}
                    </ButtonPrimary>
                  </div>
                ) : (
                  /* Two clicks to send. A campaign cannot be recalled, and the
                     button sits next to "send test" — the two are one tab-stop
                     apart and mean very different things. */
                  <ButtonPrimary onClick={() => setConfirmSend(true)}>
                    {t("preview.send")}
                  </ButtonPrimary>
                )
              ) : (
                <p className="text-[1.3rem] leading-6 text-neutral-500 max-w-[280px]">
                  {t("preview.noSendPermission")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
