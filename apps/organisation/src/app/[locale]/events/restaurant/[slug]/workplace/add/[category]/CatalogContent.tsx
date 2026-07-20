"use client";
import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { AddCircle, Edit2, Trash } from "iconsax-reactjs";
import { Restaurant } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ButtonPrimary, ButtonRed } from "@/components/shared/buttons";
import TopBar from "@/components/shared/TopBar";
import BackButton from "@/components/shared/BackButton";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  CreateCatalogItem,
  UpdateCatalogItem,
  DeleteItem,
  ToggleItemAvailability,
} from "@/actions/MenuActions";
import type { CatalogItem } from "../../types";

const inputClass =
  "bg-neutral-100 w-full rounded-[1.5rem] p-6 text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[1.4rem] font-medium text-neutral-700">
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * Everything the venue serves in this category, and the one button that adds
 * more. No photos: getting the catalogue entered is the job, and making someone
 * shoot every plate first is how that job never gets done.
 */
export default function CatalogContent({
  restaurant,
  category,
  items,
}: {
  restaurant: Restaurant;
  category: "food" | "drink";
  items: CatalogItem[];
}) {
  const t = useTranslations("Events.workplace");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.user.accessToken ?? "";
  const orgId = restaurant.organisationId;
  const restId = restaurant.restaurantId;

  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<{ error?: string }>) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result?.error) {
      toast.error(result.error);
      return false;
    }
    toast.success(t("saved"));
    router.refresh();
    return true;
  }

  const addTrigger = (
    <ButtonPrimary className="py-[7.5px] flex items-center gap-3">
      <AddCircle size="20" color="#fff" variant="Bulk" />
      {t(`add_${category}`)}
    </ButtonPrimary>
  );

  return (
    <div className="flex flex-col gap-8 overflow-y-scroll pb-12">
      <BackButton text={t("back")} />
      <TopBar title={t(`yours_${category}`)}>
        <ItemDialog
          trigger={addTrigger}
          title={t(`add_${category}`)}
          busy={busy}
          category={category}
          currency={restaurant.reservationFeeCurrency}
          onSubmit={(payload) =>
            run(() => CreateCatalogItem(orgId, restId, token, locale, payload))
          }
        />
      </TopBar>

      {items.length === 0 ? (
        <EmptyState
          message={t(`no_items_${category}`)}
          action={
            <ItemDialog
              trigger={addTrigger}
              title={t(`add_${category}`)}
              busy={busy}
              category={category}
              currency={restaurant.reservationFeeCurrency}
              onSubmit={(payload) =>
                run(() =>
                  CreateCatalogItem(orgId, restId, token, locale, payload),
                )
              }
            />
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-100 border border-neutral-100 rounded-[15px] px-6">
          {items.map((item) => (
            <li key={item.itemId} className="flex items-start gap-4 py-6">
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-4">
                  <span
                    className={`text-[1.5rem] font-medium leading-8 text-deep-100 ${
                      item.isAvailable ? "" : "opacity-50"
                    }`}
                  >
                    {item.name}
                  </span>
                  <span className="text-[1.5rem] font-medium leading-8 text-primary-500 shrink-0">
                    {formatMoney(
                      item.currency === "USD" ? item.usdPrice : item.price,
                      item.currency,
                      locale,
                    )}
                  </span>
                </div>
                {item.description && (
                  <p className="text-[1.3rem] leading-7 text-neutral-600">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* The nightly 86'd switch — one tap, no dialog. */}
                <label
                  title={t("available")}
                  className={`relative inline-block h-10 w-16 shrink-0 rounded-full bg-neutral-600 transition has-checked:bg-success ${
                    busy ? "opacity-50" : "cursor-pointer"
                  }`}
                >
                  <input
                    className="peer sr-only"
                    type="checkbox"
                    checked={item.isAvailable}
                    disabled={busy}
                    onChange={(e) =>
                      run(() =>
                        ToggleItemAvailability(
                          orgId,
                          restId,
                          item.itemId,
                          token,
                          locale,
                          e.target.checked,
                        ),
                      )
                    }
                  />
                  <span className="absolute inset-y-0 start-0 m-1 size-8 rounded-full bg-white transition-all peer-checked:start-7" />
                </label>
                <ItemDialog
                  trigger={
                    <button
                      type="button"
                      className="w-12 h-12 cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center"
                    >
                      <Edit2 size="16" color="#737C8A" variant="Bulk" />
                    </button>
                  }
                  title={t("edit_item")}
                  busy={busy}
                  category={category}
                  currency={restaurant.reservationFeeCurrency}
                  initial={item}
                  onSubmit={(payload) =>
                    run(() =>
                      UpdateCatalogItem(
                        orgId,
                        restId,
                        item.itemId,
                        token,
                        locale,
                        payload,
                      ),
                    )
                  }
                />
                <ConfirmDelete
                  busy={busy}
                  onConfirm={() =>
                    run(() =>
                      DeleteItem(orgId, restId, item.itemId, token, locale),
                    )
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Name, description and price are all required. The entry is what a guest reads
 * on the public page and what a server picks off a list mid-service; a bare
 * price helps neither of them.
 */
function ItemDialog({
  trigger,
  title,
  busy,
  category,
  currency,
  initial,
  onSubmit,
}: {
  trigger: React.ReactNode;
  title: string;
  busy: boolean;
  category: "food" | "drink";
  currency: string;
  initial?: CatalogItem;
  onSubmit: (payload: {
    name: string;
    description: string;
    price: number;
    currency: "HTG" | "USD";
    category: "food" | "drink";
  }) => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(
    initial
      ? String(initial.currency === "USD" ? initial.usdPrice : initial.price)
      : "",
  );
  const [itemCurrency, setItemCurrency] = useState<"HTG" | "USD">(
    (initial?.currency as "HTG" | "USD") ?? (currency as "HTG" | "USD") ?? "HTG",
  );
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) return setError(t("errors.name"));
    if (!description.trim()) return setError(t("errors.description"));
    const numericPrice = Number(price);
    if (!price.trim() || !Number.isFinite(numericPrice) || numericPrice < 0) {
      return setError(t("errors.price"));
    }
    setError("");

    const ok = await onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: numericPrice,
      currency: itemCurrency,
      category,
    });
    if (ok) closeRef.current?.click();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-xl lg:w-208">
        <DialogHeader>
          <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">Catalog item</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4 max-h-[60vh] overflow-y-auto">
          <Field label={t("item_name")}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder={t(`item_name_placeholder_${category}`)}
            />
          </Field>
          <Field label={t("description")}>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="flex gap-4">
            <div className="flex-1">
              <Field label={t("price")}>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label={t("currency")}>
                <div className="flex gap-4">
                  {(["HTG", "USD"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setItemCurrency(c)}
                      className={`px-8 py-3 rounded-[30px] text-[1.4rem] leading-8 font-medium transition-colors cursor-pointer ${
                        itemCurrency === c
                          ? "bg-primary-500 text-white"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>
          {error && <span className="text-[1.2rem] text-failure">{error}</span>}
        </div>
        <DialogFooter>
          <ButtonPrimary className="w-full" disabled={busy} onClick={submit}>
            {busy ? <LoadingCircleSmall /> : t("save")}
          </ButtonPrimary>
          <DialogClose ref={closeRef} className="sr-only" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDelete({
  busy,
  onConfirm,
}: {
  busy: boolean;
  onConfirm: () => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");
  const closeRef = React.useRef<HTMLButtonElement>(null);

  async function confirm() {
    const ok = await onConfirm();
    if (ok) closeRef.current?.click();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-12 h-12 cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center"
        >
          <Trash size="16" color="#DE0028" variant="Bulk" />
        </button>
      </DialogTrigger>
      <DialogContent className="w-xl lg:w-208">
        <DialogHeader>
          <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary">
            {t("delete_item")}
          </DialogTitle>
          <DialogDescription className="sr-only">Delete</DialogDescription>
        </DialogHeader>
        <p className="text-[1.5rem] leading-8 text-neutral-600 py-4">
          {t("delete_item_warning")}
        </p>
        <DialogFooter>
          <ButtonRed className="w-full" disabled={busy} onClick={confirm}>
            {busy ? <LoadingCircleSmall /> : t("delete")}
          </ButtonRed>
          <DialogClose ref={closeRef} className="sr-only" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({
  message,
  action,
}: {
  message: string;
  action: React.ReactNode;
}) {
  return (
    <div className="w-[330px] lg:w-[460px] mx-auto flex flex-col items-center justify-center gap-[5rem] py-20">
      <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100">
        <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200">
          <AddCircle size="50" color="#0d0d0d" variant="Bulk" />
        </div>
      </div>
      <p className="text-[1.8rem] leading-[25px] text-neutral-600 text-center max-w-[330px] lg:max-w-[422px]">
        {message}
      </p>
      {action}
    </div>
  );
}
