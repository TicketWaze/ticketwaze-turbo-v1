import { BackBone } from "./ActivityDetailSkeleton";
import { Bone, SkeletonPage, TextBone } from "./Skeleton";

/** One ticket-class card of the first checkout step: name, blurb, price, − n +. */
function OptionCard() {
  return (
    <div className="border border-neutral-100 rounded-[15px] p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <TextBone line="h-10" className="w-32 h-[1.6rem]" strong />
        <TextBone className="w-20 h-4" />
      </div>
      <TextBone line="h-12" className="w-3/4 h-[1.3rem]" />
      <TextBone line="h-12" className="w-28 h-[1.8rem]" strong />
      <div className="flex bg-neutral-100 items-center justify-between py-4 px-6 rounded-[10px]">
        <TextBone line="h-12" className="w-24" />
        <div className="flex items-center gap-4">
          <Bone round className="w-14 h-14" strong />
          <Bone className="w-6 h-[1.4rem]" strong />
          <Bone round className="w-14 h-14" strong />
        </div>
      </div>
    </div>
  );
}

/** A form field: label line + the 6rem grey rounded input. */
function FieldBone() {
  return (
    <div className="flex flex-col gap-3">
      <TextBone className="w-28" />
      <Bone className="h-[6rem] w-full" />
    </div>
  );
}

/**
 * The checkout flows (event, raffle, sale, restaurant table): back + title,
 * the step on the left and the summary ticket on the right, the step footer
 * pinned under them. `form` swaps the ticket cards for form fields (the
 * reservation request); `footer={false}` for flows without the step bar.
 */
export default function CheckoutSkeleton({
  variant = "tickets",
  footer = true,
}: {
  variant?: "tickets" | "form";
  footer?: boolean;
}) {
  return (
    <SkeletonPage>
      <div className="h-full min-h-0 flex flex-col">
        <div className="shrink-0 flex flex-col gap-4">
          <BackBone />
          <TextBone line="h-12 mb-4" className="h-[2.6rem] w-[24rem] max-w-full" strong />
        </div>
        <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden lg:grid lg:grid-cols-[29fr_23fr] lg:grid-rows-1 gap-8">
          {variant === "tickets" ? (
            <div className="flex flex-col gap-8">
              <OptionCard />
              <OptionCard />
            </div>
          ) : (
            <div className="flex flex-col lg:grid lg:grid-cols-2 lg:items-start gap-10 lg:col-span-2">
              <div className="flex flex-col gap-8">
                <FieldBone />
                <FieldBone />
                <FieldBone />
              </div>
              <div className="flex flex-col gap-8">
                <FieldBone />
                <Bone className="h-[16rem] w-full rounded-[15px]" />
              </div>
            </div>
          )}
          {variant === "tickets" && (
            <div className="hidden lg:flex flex-col min-h-0 lg:p-4 lg:pt-0">
              {/* The summary ticket keeps its artwork's proportions. */}
              <Bone className="w-full max-w-[46rem] mx-auto aspect-[461/681] rounded-[15px]" />
            </div>
          )}
        </div>
        {footer && (
          <div className="hidden lg:flex shrink-0 mt-3 mb-4 py-4 px-6 border border-neutral-100 rounded-[40px] items-center justify-between">
            <div className="flex gap-3 items-center">
              <Bone className="w-48 h-2" strong />
              <Bone className="w-48 h-2" />
              <Bone className="w-48 h-2" />
            </div>
            <Bone className="w-[13.3rem] h-[6rem]" strong />
          </div>
        )}
      </div>
    </SkeletonPage>
  );
}

/**
 * The centred single-column pages (reservation details, payment results):
 * an icon disc, a title, a sentence, then a ruled card of label/value rows.
 */
export function ReceiptSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <SkeletonPage>
      <div className="flex flex-col gap-10 py-8 w-full max-w-[520px] mx-auto">
        <div className="flex flex-col items-center gap-6 py-8">
          <Bone round className="w-28 h-28" strong />
          <TextBone line="h-12" className="h-[2.6rem] w-[24rem] max-w-full" strong />
          <TextBone className="w-[30rem] max-w-full" />
        </div>
        <div className="p-8 rounded-[15px] border border-neutral-100 flex flex-col gap-6">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-6">
              <TextBone className="w-24" />
              <TextBone className={i % 2 ? "w-32" : "w-40"} strong />
            </div>
          ))}
        </div>
        <Bone className="h-[5rem] w-full" strong />
      </div>
    </SkeletonPage>
  );
}

/**
 * The payment result screen (PurchaseSuccess): the 150px badge, a big title,
 * a sentence, and the "taking you to your tickets" line — which `status`
 * fills with real text while the payment is being confirmed.
 */
export function ResultSkeleton({ status }: { status?: string }) {
  return (
    <SkeletonPage label={status}>
      <div className="flex-1 flex flex-col items-center justify-center gap-16 text-center px-6 py-16 min-h-[60vh]">
        <Bone round className="w-[150px] h-[150px]" />
        <div className="flex flex-col items-center gap-6 w-full max-w-[45rem]">
          <TextBone line="h-14" className="h-[3.2rem] w-[28rem] max-w-full" strong />
          <div className="flex flex-col items-center w-full">
            <TextBone line="h-10" className="h-[1.6rem] w-full" />
            <TextBone line="h-10" className="h-[1.6rem] w-2/3" />
          </div>
        </div>
        {status ? (
          <p aria-live="polite" className="text-[1.6rem] leading-10 text-neutral-600">
            {status}
          </p>
        ) : (
          <TextBone line="h-10" className="h-[1.6rem] w-[22rem]" />
        )}
      </div>
    </SkeletonPage>
  );
}
