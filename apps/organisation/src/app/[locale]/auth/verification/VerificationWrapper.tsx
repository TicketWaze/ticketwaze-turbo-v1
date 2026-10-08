"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  Bank,
  Building,
  Car,
  Clock,
  Lovely,
  Personalcard,
  ShieldTick,
  User,
  UserOctagon,
  Warning2,
} from "iconsax-reactjs";
import { usePermission } from "@/hooks/usePermission";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  AuthError,
  AuthHeading,
  AuthItem,
  AuthScreen,
  AuthStatus,
  ChoiceCards,
  SigningIn,
  StatusIcon,
  StepFooter,
  backPillClass,
} from "@/components/auth/AuthParts";
import KycUploadTile, { type UploadState } from "@/components/auth/KycUploadTile";
import KycSelfieCapture from "@/components/auth/KycSelfieCapture";
import KycSkipDialog from "@/components/auth/KycSkipDialog";
import successBadge from "@/assets/images/auth/success-badge.png";
import {
  KYC_DOCUMENT_ACCEPT,
  KYC_MAX_FILE_BYTES,
  KYC_PHOTO_ACCEPT,
  clearCachedKyc,
  fetchKycStatus,
  identityKinds,
  isPhotoKind,
  organisationKinds,
  submitKyc,
  uploadKycFile,
  type KycFileKind,
  type KycIdDocumentType,
  type KycOrganisationType,
  type KycState,
} from "@/lib/kyc";

// Organisation KYC (not in Figma; built from the auth screens). Step 3/3 of
// organizer sign-up (?onboarding=1) and reachable any time from the dashboard
// banner and the locked create/withdraw screens. Optional: skipping warns that
// creating activities and withdrawing stay locked.

type Step = "type" | "id" | "identity" | "documents" | "submitted" | "created";

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.22, ease: "easeInOut" as const },
};

export default function VerificationWrapper({
  onboarding,
}: {
  onboarding: boolean;
}) {
  const t = useTranslations("Auth.kyc");
  const tFlow = useTranslations("Auth.flow");
  const locale = useLocale();
  const { data: session } = useSession();
  const { can } = usePermission();
  const organisationId = session?.activeOrganisation?.organisationId;
  const accessToken = session?.user?.accessToken;

  const [kyc, setKyc] = useState<KycState | null | undefined>(undefined);
  const [step, setStep] = useState<Step>("type");
  const [orgType, setOrgType] = useState<KycOrganisationType | null>(null);
  const [idType, setIdType] = useState<KycIdDocumentType | null>(null);
  const [uploads, setUploads] = useState<
    Partial<Record<KycFileKind, UploadState>>
  >({});
  const [stepError, setStepError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);

  useEffect(() => {
    if (!organisationId || !accessToken) return;
    // The status changes here; the dashboard banner re-reads it afterwards.
    clearCachedKyc();
    let cancelled = false;
    fetchKycStatus(organisationId, accessToken, locale).then((state) => {
      if (!cancelled) setKyc(state);
    });
    return () => {
      cancelled = true;
    };
  }, [organisationId, accessToken, locale]);

  const docs = useMemo(
    () => (orgType ? organisationKinds(orgType) : { required: [], optional: [] }),
    [orgType],
  );
  const needsDocuments = docs.required.length + docs.optional.length > 0;
  const flow: Step[] = needsDocuments
    ? ["type", "id", "identity", "documents"]
    : ["type", "id", "identity"];

  function finishWithoutSubmitting() {
    if (onboarding) setStep("created");
    else window.location.href = `/${locale}/analytics`;
  }

  // Each step starts at its top, going forward or back: the auth panel
  // (<main>) is what scrolls, and it keeps its position across steps otherwise.
  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  // Account Created → dashboard, as at the end of Figma's sign-up.
  useEffect(() => {
    if (step !== "created") return;
    const id = setTimeout(() => {
      window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/analytics`;
    }, 1500);
    return () => clearTimeout(id);
  }, [step, locale]);

  async function pick(kind: KycFileKind, file: File) {
    const accept = (isPhotoKind(kind) ? KYC_PHOTO_ACCEPT : KYC_DOCUMENT_ACCEPT).split(",");
    if (!accept.includes(file.type)) {
      setUploads((u) => ({ ...u, [kind]: { status: "error", file, message: t("upload.errors.type") } }));
      return;
    }
    if (file.size > KYC_MAX_FILE_BYTES) {
      setUploads((u) => ({ ...u, [kind]: { status: "error", file, message: t("upload.errors.size") } }));
      return;
    }
    if (!organisationId || !accessToken) return;
    setStepError("");
    setUploads((u) => ({ ...u, [kind]: { status: "uploading", file } }));
    const result = await uploadKycFile({ organisationId, accessToken, locale, kind, file });
    setUploads((u) => ({
      ...u,
      [kind]: result.ok
        ? { status: "done", file, key: result.key }
        : {
            status: "error",
            file,
            message:
              result.code === "KYC_STORAGE_UNAVAILABLE"
                ? t("upload.errors.storage")
                : result.code === "KYC_FILE_TYPE"
                ? t("upload.errors.type")
                : result.code === "KYC_FILE_SIZE"
                  ? t("upload.errors.size")
                  : t("upload.errors.failed"),
          },
    }));
  }

  const done = (kind: KycFileKind) => uploads[kind]?.status === "done";
  const busy = Object.values(uploads).some((u) => u?.status === "uploading");

  function next() {
    setStepError("");
    if (step === "identity" && idType && !identityKinds(idType).every(done)) {
      setStepError(t("errors.missing"));
      return;
    }
    const i = flow.indexOf(step);
    if (i < flow.length - 1) setStep(flow[i + 1]);
    else void submit();
  }

  function back() {
    setStepError("");
    const i = flow.indexOf(step);
    if (i > 0) setStep(flow[i - 1]);
    else if (!onboarding) window.location.href = `/${locale}/analytics`;
  }

  async function submit() {
    if (!orgType || !idType || !organisationId || !accessToken) return;
    const kinds = [...identityKinds(idType), ...docs.required];
    if (!kinds.every(done)) {
      setStepError(t("errors.missing"));
      return;
    }
    const files = [...kinds, ...docs.optional.filter(done)].map((kind) => {
      const upload = uploads[kind] as Extract<UploadState, { status: "done" }>;
      return { kind, key: upload.key, filename: upload.file.name };
    });
    setSubmitting(true);
    const result = await submitKyc({
      organisationId,
      accessToken,
      locale,
      organisationType: orgType,
      idDocumentType: idType,
      files,
    });
    setSubmitting(false);
    if (result.ok) setStep("submitted");
    else if (result.code === "KYC_ALREADY_SUBMITTED") {
      toast.info(t("errors.already"));
      setKyc((k) => (k ? { ...k, status: "pending" } : k));
    } else toast.error(t("errors.generic"));
  }

  // ── Footer: 3/3 of sign-up during onboarding, a Back pill otherwise ──────
  const canGoBack = flow.indexOf(step) > 0;
  const footer = onboarding ? (
    <StepFooter step={3} total={3} onBack={canGoBack ? back : undefined} />
  ) : (
    <button type="button" onClick={back} className={backPillClass}>
      {tFlow("back")}
    </button>
  );

  const actions = (canContinue: boolean, isLast: boolean) => (
    <div className="w-full flex flex-col gap-6 items-center">
      <AuthError message={stepError} />
      <AuthItem>
        <ButtonPrimary
          onClick={next}
          disabled={!canContinue || busy || submitting}
          className="w-full h-[6rem] active:scale-[0.98]"
        >
          {submitting ? <LoadingCircleSmall /> : isLast ? t("submit") : t("continue")}
        </ButtonPrimary>
      </AuthItem>
      <AuthItem className="flex justify-center">
        <button
          type="button"
          onClick={() => (onboarding ? setSkipOpen(true) : finishWithoutSubmitting())}
          className="text-[1.5rem] leading-8 text-neutral-600 hover:text-primary-500 transition-colors"
        >
          {onboarding ? t("skip") : t("not_now")}
        </button>
      </AuthItem>
    </div>
  );

  const tile = (kind: KycFileKind, optional = false) => {
    // The selfie is the face alone, taken with the camera.
    if (kind === "selfie") {
      return (
        <AuthItem key={kind}>
          <KycSelfieCapture
            label={t("kinds.selfie.label")}
            hint={t("kinds.selfie.hint")}
            state={uploads.selfie ?? { status: "idle" }}
            onCapture={(file) => pick("selfie", file)}
          />
        </AuthItem>
      );
    }
    const labelKey = kind === "id_front" && idType === "passport" ? "passport_front" : kind;
    return (
      <AuthItem key={kind}>
        <KycUploadTile
          label={t(`kinds.${labelKey}.label`)}
          hint={t.has(`kinds.${labelKey}.hint`) ? t(`kinds.${labelKey}.hint`) : undefined}
          formats={t(isPhotoKind(kind) ? "upload.photo_hint" : "upload.doc_hint")}
          accept={isPhotoKind(kind) ? KYC_PHOTO_ACCEPT : KYC_DOCUMENT_ACCEPT}
          optional={optional}
          state={uploads[kind] ?? { status: "idle" }}
          onPick={(file) => pick(kind, file)}
        />
      </AuthItem>
    );
  };

  // ── Gates: loading, not the owner, already pending/approved ─────────────
  let gate: React.ReactNode = null;
  if (kyc === undefined || !session) {
    gate = (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingCircleSmall />
      </div>
    );
  } else if (!can("organisation.manage")) {
    gate = (
      <AuthScreen centered>
        <AuthStatus
          visual={<StatusIcon icon={UserOctagon} />}
          title={t("owner_only.title")}
          description={t("owner_only.description")}
        />
      </AuthScreen>
    );
  } else if (
    (kyc?.status === "pending" || kyc?.status === "approved") &&
    step !== "submitted" &&
    step !== "created"
  ) {
    const approved = kyc.status === "approved";
    gate = (
      <AuthScreen
        centered
        footer={
          <a href={`/${locale}/analytics`} className={backPillClass}>
            {tFlow("back")}
          </a>
        }
      >
        <AuthStatus
          visual={<StatusIcon icon={approved ? ShieldTick : Clock} />}
          title={t(approved ? "approved.title" : "pending.title")}
          description={t(approved ? "approved.description" : "pending.description")}
        />
      </AuthScreen>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full">
      <KycSkipDialog
        open={skipOpen}
        onOpenChange={setSkipOpen}
        onSkip={() => {
          setSkipOpen(false);
          finishWithoutSubmitting();
        }}
      />
      {gate ?? (
        <AnimatePresence mode="wait" initial={false}>
          {step === "type" && (
            <motion.div key="type" {...slide} className="w-full h-full">
              <AuthScreen footer={footer}>
                <div className="flex flex-col gap-16 items-center w-full">
                  <AuthHeading title={t("type.title")} description={t("type.description")} />
                  {kyc?.status === "rejected" && (
                    <AuthItem>
                      <div className="flex gap-4 items-start rounded-[2rem] bg-[#FFF1F1] border border-failure/30 p-6">
                        <Warning2 size={22} variant="Bulk" color="#E53935" className="shrink-0" />
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-[1.5rem] text-deep-100">
                            {t("rejected.title")}
                          </span>
                          {kyc.rejectionReason && (
                            <span className="text-[1.4rem] text-neutral-700">
                              {t("rejected.reason", { reason: kyc.rejectionReason })}
                            </span>
                          )}
                          <span className="text-[1.4rem] text-neutral-700">
                            {t("rejected.description")}
                          </span>
                        </div>
                      </div>
                    </AuthItem>
                  )}
                  <ChoiceCards
                    value={orgType}
                    onChange={(v) => {
                      setOrgType(v);
                      setStepError("");
                    }}
                    options={[
                      { key: "individual", Icon: User, title: t("type.individual.title"), description: t("type.individual.description") },
                      { key: "business", Icon: Building, title: t("type.business.title"), description: t("type.business.description") },
                      { key: "ngo", Icon: Lovely, title: t("type.ngo.title"), description: t("type.ngo.description") },
                      { key: "public", Icon: Bank, title: t("type.public.title"), description: t("type.public.description") },
                    ]}
                  />
                  {actions(Boolean(orgType), false)}
                </div>
              </AuthScreen>
            </motion.div>
          )}

          {step === "id" && (
            <motion.div key="id" {...slide} className="w-full h-full">
              <AuthScreen footer={footer}>
                <div className="flex flex-col gap-16 items-center w-full">
                  <AuthHeading title={t("id.title")} description={t("id.description")} />
                  <ChoiceCards
                    value={idType}
                    onChange={setIdType}
                    options={[
                      { key: "passport", Icon: Personalcard, title: t("id.passport.title"), description: t("id.passport.description") },
                      { key: "id_card", Icon: UserOctagon, title: t("id.id_card.title"), description: t("id.id_card.description") },
                      { key: "drivers_licence", Icon: Car, title: t("id.drivers_licence.title"), description: t("id.drivers_licence.description") },
                    ]}
                  />
                  {actions(Boolean(idType), false)}
                </div>
              </AuthScreen>
            </motion.div>
          )}

          {step === "identity" && idType && (
            <motion.div key="identity" {...slide} className="w-full h-full">
              <AuthScreen footer={footer}>
                <div className="flex flex-col gap-16 items-center w-full">
                  <AuthHeading title={t("identity.title")} description={t("identity.description")} />
                  <div className="w-full flex flex-col gap-8">
                    {identityKinds(idType).map((kind) => tile(kind))}
                  </div>
                  {actions(identityKinds(idType).every(done), !needsDocuments)}
                </div>
              </AuthScreen>
            </motion.div>
          )}

          {step === "documents" && (
            <motion.div key="documents" {...slide} className="w-full h-full">
              <AuthScreen footer={footer}>
                <div className="flex flex-col gap-16 items-center w-full">
                  <AuthHeading title={t("documents.title")} description={t("documents.description")} />
                  <div className="w-full flex flex-col gap-8">
                    {docs.required.map((kind) => tile(kind))}
                    {docs.optional.map((kind) => tile(kind, true))}
                  </div>
                  {actions(docs.required.every(done), true)}
                </div>
              </AuthScreen>
            </motion.div>
          )}

          {step === "submitted" && (
            <motion.div key="submitted" {...slide} className="w-full h-full">
              <AuthScreen centered>
                <AuthStatus
                  visual={<StatusIcon icon={Clock} />}
                  title={t("submitted.title")}
                  description={t("submitted.description")}
                >
                  <ButtonPrimary
                    onClick={() =>
                      onboarding
                        ? setStep("created")
                        : (window.location.href = `/${locale}/analytics`)
                    }
                    className="w-full h-[6rem] active:scale-[0.98]"
                  >
                    {onboarding ? t("continue") : t("submitted.dashboard")}
                  </ButtonPrimary>
                </AuthStatus>
              </AuthScreen>
            </motion.div>
          )}

          {step === "created" && (
            <motion.div key="created" {...slide} className="w-full h-full">
              <AuthScreen centered>
                <AuthStatus
                  image={successBadge}
                  title={tFlow("created.title")}
                  description={tFlow("created.description")}
                >
                  <SigningIn />
                </AuthStatus>
              </AuthScreen>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
