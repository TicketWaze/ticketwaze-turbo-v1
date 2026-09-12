"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Restaurant } from "@ticketwaze/typescript-config";
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
  LABEL_CLASS,
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
import { UpdateRestaurantAsAdminAction } from "@/actions/ActivityEdit";

const ESTABLISHMENT_TYPES = [
  "restaurant",
  "bar",
  "cafe",
  "lounge",
  "club",
  "bakery",
  "food_truck",
] as const;

/** 0 = Sunday .. 6 = Saturday, matching the API's `dayOfWeek`. */
const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type DayRow = { open: boolean; opensAt: string; closesAt: string };

/** The column stores 'HH:mm:ss'; <input type="time"> wants 'HH:mm'. */
function toTimeInput(value: string): string {
  return (value ?? "").slice(0, 5);
}

export default function EditRestaurantForm({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  const t = useTranslations("Activities.edit");
  const tv = useTranslations("Activities.edit.venue");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const [name, setName] = useState(restaurant.name ?? "");
  const [description, setDescription] = useState(restaurant.description ?? "");
  const [establishmentType, setEstablishmentType] = useState<string>(
    restaurant.establishmentType ?? "restaurant",
  );
  const [cuisineTypes, setCuisineTypes] = useState<string[]>(
    restaurant.cuisineTypes ?? [],
  );
  const [priceRange, setPriceRange] = useState(
    String(restaurant.priceRange ?? 1),
  );

  const [address, setAddress] = useState(restaurant.address ?? "");
  const [city, setCity] = useState(restaurant.city ?? "");
  const [state, setState] = useState(restaurant.state ?? "");
  const [country, setCountry] = useState(restaurant.country ?? "");
  const [location, setLocation] = useState<SelectedLocation | null>(
    restaurant.location ?? null,
  );
  const [locationNotes, setLocationNotes] = useState(
    restaurant.locationNotes ?? "",
  );
  const [timezone, setTimezone] = useState(restaurant.timezone ?? "");

  const [phone, setPhone] = useState(restaurant.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(restaurant.whatsapp ?? "");
  const [email, setEmail] = useState(restaurant.email ?? "");
  const [website, setWebsite] = useState(restaurant.website ?? "");

  const [acceptsReservations, setAcceptsReservations] = useState(
    Boolean(restaurant.acceptsReservations),
  );
  const [acceptsOnlinePayment, setAcceptsOnlinePayment] = useState(
    Boolean(restaurant.acceptsOnlinePayment),
  );
  const [offersDelivery, setOffersDelivery] = useState(
    Boolean(restaurant.offersDelivery),
  );
  const [offersTakeout, setOffersTakeout] = useState(
    Boolean(restaurant.offersTakeout),
  );
  const [absorbFees, setAbsorbFees] = useState(Boolean(restaurant.absorbFees));

  const [deliveryPhone, setDeliveryPhone] = useState(
    restaurant.deliveryPhone ?? "",
  );
  const [deliveryZones, setDeliveryZones] = useState<string[]>(
    restaurant.deliveryZones ?? [],
  );
  const [deliveryFee, setDeliveryFee] = useState(
    restaurant.deliveryFee != null ? String(restaurant.deliveryFee) : "",
  );
  const [minimumOrder, setMinimumOrder] = useState(
    restaurant.minimumOrder != null ? String(restaurant.minimumOrder) : "",
  );
  const [deliveryEstimatedMinutes, setDeliveryEstimatedMinutes] = useState(
    restaurant.deliveryEstimatedMinutes != null
      ? String(restaurant.deliveryEstimatedMinutes)
      : "",
  );

  const [reservationFee, setReservationFee] = useState(
    String(restaurant.reservationFee ?? 0),
  );
  const [reservationFeeCurrency, setReservationFeeCurrency] = useState(
    restaurant.reservationFeeCurrency ?? "HTG",
  );
  const [minPartySize, setMinPartySize] = useState(
    String(restaurant.minPartySize ?? 1),
  );
  const [maxPartySize, setMaxPartySize] = useState(
    String(restaurant.maxPartySize ?? 12),
  );
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(
    String(restaurant.slotIntervalMinutes ?? 30),
  );
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState(
    String(restaurant.defaultDurationMinutes ?? 90),
  );
  const [leadTimeMinutes, setLeadTimeMinutes] = useState(
    String(restaurant.leadTimeMinutes ?? 60),
  );
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(
    String(restaurant.maxAdvanceDays ?? 30),
  );
  const [maxCoversPerSlot, setMaxCoversPerSlot] = useState(
    String(restaurant.maxCoversPerSlot ?? 20),
  );
  const [holdMinutes, setHoldMinutes] = useState(
    String(restaurant.holdMinutes ?? 15),
  );

  const [amenities, setAmenities] = useState<string[]>(
    restaurant.amenities ?? [],
  );
  const [dietaryOptions, setDietaryOptions] = useState<string[]>(
    restaurant.dietaryOptions ?? [],
  );
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>(
    restaurant.languagesSpoken ?? [],
  );
  const [inPersonPaymentMethods, setInPersonPaymentMethods] = useState<string[]>(
    restaurant.inPersonPaymentMethods ?? [],
  );
  const [servesAlcohol, setServesAlcohol] = useState(
    Boolean(restaurant.servesAlcohol),
  );
  const [dressCode, setDressCode] = useState(restaurant.dressCode ?? "");
  const [seatingCapacity, setSeatingCapacity] = useState(
    restaurant.seatingCapacity != null ? String(restaurant.seatingCapacity) : "",
  );

  const [alwaysOpen, setAlwaysOpen] = useState(Boolean(restaurant.alwaysOpen));
  /**
   * One row per weekday, always seven, because the API replaces hours wholesale
   * and the ABSENCE of a day is the closed state. A partial list would silently
   * close whatever it left out.
   */
  const [days, setDays] = useState<DayRow[]>(() =>
    DAY_KEYS.map((_, index) => {
      const row = (restaurant.hours ?? []).find(
        (hour) => hour.dayOfWeek === index,
      );
      return row
        ? {
            open: true,
            opensAt: toTimeInput(row.opensAt),
            closesAt: toTimeInput(row.closesAt),
          }
        : { open: false, opensAt: "09:00", closesAt: "22:00" };
    }),
  );

  const [cover, setCover] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function updateDay(index: number, patch: Partial<DayRow>) {
    setDays((prev) =>
      prev.map((day, i) => (i === index ? { ...day, ...patch } : day)),
    );
  }

  function localProblems(): string[] {
    const problems: string[] = [];
    if (name.trim().length < 2) problems.push(tv("errors.name"));
    if (description.trim().length < 20)
      problems.push(t("errors.description", { count: description.length }));
    if (!address.trim()) problems.push(t("errors.address"));
    const min = Number(minPartySize);
    const max = Number(maxPartySize);
    if (min > max) problems.push(tv("errors.party_size"));
    if (acceptsReservations && Number(reservationFee) <= 0)
      problems.push(tv("errors.reservation_fee"));
    for (const [index, day] of days.entries()) {
      if (day.open && (!day.opensAt || !day.closesAt))
        problems.push(tv("errors.hours", { day: tv(`days.${DAY_KEYS[index]}`) }));
    }
    // The API requires 3–5 when the gallery is sent at all; sending fewer would
    // be refused after the upload rather than before it.
    if (gallery.length > 0 && (gallery.length < 3 || gallery.length > 5))
      problems.push(tv("errors.gallery"));
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
    const put = (key: string, value: string) => {
      if (value !== "") formData.append(key, value);
    };

    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("establishmentType", establishmentType);
    formData.append("cuisineTypes", JSON.stringify(cuisineTypes));
    put("priceRange", String(Number(priceRange)));

    formData.append("address", address.trim());
    formData.append("city", city.trim());
    formData.append("state", state.trim());
    formData.append("country", country.trim());
    if (location) formData.append("location", JSON.stringify(location));
    put("locationNotes", locationNotes.trim());
    put("timezone", timezone.trim());

    put("phone", phone.trim());
    put("whatsapp", whatsapp.trim());
    put("email", email.trim());
    put("website", website.trim());

    formData.append("acceptsReservations", JSON.stringify(acceptsReservations));
    formData.append(
      "acceptsOnlinePayment",
      JSON.stringify(acceptsOnlinePayment),
    );
    formData.append("offersDelivery", JSON.stringify(offersDelivery));
    formData.append("offersTakeout", JSON.stringify(offersTakeout));
    formData.append("absorbFees", JSON.stringify(absorbFees));
    formData.append("alwaysOpen", JSON.stringify(alwaysOpen));
    formData.append("servesAlcohol", JSON.stringify(servesAlcohol));

    put("deliveryPhone", deliveryPhone.trim());
    formData.append("deliveryZones", JSON.stringify(deliveryZones));
    put("deliveryFee", deliveryFee);
    put("minimumOrder", minimumOrder);
    put("deliveryEstimatedMinutes", deliveryEstimatedMinutes);

    put("reservationFee", reservationFee);
    put("reservationFeeCurrency", reservationFeeCurrency);
    put("minPartySize", minPartySize);
    put("maxPartySize", maxPartySize);
    put("slotIntervalMinutes", slotIntervalMinutes);
    put("defaultDurationMinutes", defaultDurationMinutes);
    put("leadTimeMinutes", leadTimeMinutes);
    put("maxAdvanceDays", maxAdvanceDays);
    put("maxCoversPerSlot", maxCoversPerSlot);
    put("holdMinutes", holdMinutes);

    formData.append("amenities", JSON.stringify(amenities));
    formData.append("dietaryOptions", JSON.stringify(dietaryOptions));
    formData.append("languagesSpoken", JSON.stringify(languagesSpoken));
    formData.append(
      "inPersonPaymentMethods",
      JSON.stringify(inPersonPaymentMethods),
    );
    put("dressCode", dressCode.trim());
    put("seatingCapacity", seatingCapacity);

    // Only the days actually open are sent — a missing day IS closed.
    formData.append(
      "hours",
      JSON.stringify(
        days
          .map((day, index) => ({ ...day, dayOfWeek: index }))
          .filter((day) => day.open)
          .map((day) => ({
            dayOfWeek: day.dayOfWeek,
            opensAt: day.opensAt,
            closesAt: day.closesAt,
          })),
      ),
    );

    if (cover) formData.append("cover", cover);
    // Omitted entirely when untouched: sending it replaces the gallery wholesale.
    for (const file of gallery) formData.append("images", file);

    try {
      const result = await UpdateRestaurantAsAdminAction({
        restaurantId: restaurant.restaurantId,
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
      router.push(`/activities/restaurant/${restaurant.restaurantId}`);
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
          {tv("title")}
        </h2>
        <p className="text-[1.4rem] leading-8 text-neutral-600">
          {t("subtitle", { name: restaurant.name })}
        </p>
      </div>

      <div className="rounded-[1.4rem] bg-orange-50 border border-orange-200 p-6 flex flex-col gap-2">
        <p className="text-[1.4rem] leading-8 text-orange-700 font-medium">
          {t("notice.title")}
        </p>
        {/* A venue sells no dated ticket, so there is no cohort of buyers this
            edit could invalidate — but the URL is on printed QR codes. */}
        <p className="text-[1.3rem] leading-8 text-orange-700">
          {tv("notice.body")}
        </p>
      </div>

      <Section title={t("sections.details")}>
        <TextField
          label={tv("fields.name")}
          value={name}
          onChange={setName}
          error={fieldErrors.name}
          hint={tv("fields.name_hint")}
        />
        <TextAreaField
          label={t("fields.description")}
          value={description}
          onChange={setDescription}
          error={fieldErrors.description}
          hint={t("fields.description_hint", { count: description.length })}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SelectField
            label={tv("fields.establishment_type")}
            value={establishmentType}
            onChange={setEstablishmentType}
            options={ESTABLISHMENT_TYPES.map((type) => ({
              value: type,
              label: tv(`establishment.${type}`),
            }))}
          />
          <SelectField
            label={tv("fields.price_range")}
            value={priceRange}
            onChange={setPriceRange}
            options={[1, 2, 3, 4].map((level) => ({
              value: String(level),
              label: "$".repeat(level),
            }))}
          />
        </div>
        <ListField
          label={tv("fields.cuisine_types")}
          value={cuisineTypes}
          onChange={setCuisineTypes}
          placeholder={tv("fields.cuisine_placeholder")}
        />
        <ImageField
          label={tv("fields.cover")}
          file={cover}
          onChange={setCover}
          keepLabel={t("fields.image_keep")}
          replaceLabel={t("fields.image_new")}
        />
        <ImageField
          label={tv("fields.gallery")}
          multiple
          onFilesChange={setGallery}
          keepLabel={tv("fields.gallery_keep")}
          replaceLabel={tv("fields.gallery_replace", { count: gallery.length })}
        />
      </Section>

      <Separator />

      <Section title={t("sections.venue")}>
        <TextField
          label={t("fields.address")}
          value={address}
          onChange={setAddress}
          error={fieldErrors.address}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TextField label={t("fields.city")} value={city} onChange={setCity} />
          <TextField
            label={t("fields.state")}
            value={state}
            onChange={setState}
          />
          <TextField
            label={t("fields.country")}
            value={country}
            onChange={setCountry}
          />
        </div>
        <TextField
          label={tv("fields.location_notes")}
          value={locationNotes}
          onChange={setLocationNotes}
          hint={tv("fields.location_notes_hint")}
        />
        <TextField
          label={t("fields.timezone")}
          value={timezone}
          onChange={setTimezone}
        />
        <div>
          <span className={LABEL_CLASS}>{t("fields.map")}</span>
          <LocationPicker value={location} onChange={setLocation} />
        </div>
      </Section>

      <Separator />

      <Section title={tv("sections.contact")}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TextField
            label={tv("fields.phone")}
            value={phone}
            onChange={setPhone}
          />
          <TextField
            label={tv("fields.whatsapp")}
            value={whatsapp}
            onChange={setWhatsapp}
          />
          <TextField
            label={tv("fields.email")}
            type="email"
            value={email}
            onChange={setEmail}
            error={fieldErrors.email}
          />
          <TextField
            label={tv("fields.website")}
            value={website}
            onChange={setWebsite}
            error={fieldErrors.website}
          />
        </div>
      </Section>

      <Separator />

      <Section title={tv("sections.services")}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CheckField
            label={tv("fields.accepts_reservations")}
            checked={acceptsReservations}
            onChange={setAcceptsReservations}
          />
          <CheckField
            label={tv("fields.accepts_online_payment")}
            checked={acceptsOnlinePayment}
            onChange={setAcceptsOnlinePayment}
          />
          <CheckField
            label={tv("fields.offers_delivery")}
            checked={offersDelivery}
            onChange={setOffersDelivery}
          />
          <CheckField
            label={tv("fields.offers_takeout")}
            checked={offersTakeout}
            onChange={setOffersTakeout}
          />
          <CheckField
            label={tv("fields.serves_alcohol")}
            checked={servesAlcohol}
            onChange={setServesAlcohol}
          />
          <CheckField
            label={tv("fields.absorb_fees")}
            checked={absorbFees}
            onChange={setAbsorbFees}
          />
        </div>

        {offersDelivery && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TextField
              label={tv("fields.delivery_phone")}
              value={deliveryPhone}
              onChange={setDeliveryPhone}
            />
            <TextField
              label={tv("fields.delivery_fee")}
              type="number"
              min={0}
              value={deliveryFee}
              onChange={setDeliveryFee}
            />
            <TextField
              label={tv("fields.minimum_order")}
              type="number"
              min={0}
              value={minimumOrder}
              onChange={setMinimumOrder}
            />
            <TextField
              label={tv("fields.delivery_minutes")}
              type="number"
              min={0}
              value={deliveryEstimatedMinutes}
              onChange={setDeliveryEstimatedMinutes}
            />
            <ListField
              label={tv("fields.delivery_zones")}
              value={deliveryZones}
              onChange={setDeliveryZones}
            />
          </div>
        )}
      </Section>

      <Separator />

      <Section title={tv("sections.reservations")}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TextField
            label={tv("fields.reservation_fee")}
            type="number"
            min={0}
            value={reservationFee}
            onChange={setReservationFee}
            error={fieldErrors.reservationFee}
          />
          <SelectField
            label={tv("fields.reservation_fee_currency")}
            value={reservationFeeCurrency}
            onChange={setReservationFeeCurrency}
            options={[
              { value: "HTG", label: "HTG" },
              { value: "USD", label: "USD" },
            ]}
          />
          <TextField
            label={tv("fields.min_party")}
            type="number"
            min={1}
            value={minPartySize}
            onChange={setMinPartySize}
          />
          <TextField
            label={tv("fields.max_party")}
            type="number"
            min={1}
            value={maxPartySize}
            onChange={setMaxPartySize}
          />
          <TextField
            label={tv("fields.slot_interval")}
            type="number"
            min={5}
            value={slotIntervalMinutes}
            onChange={setSlotIntervalMinutes}
          />
          <TextField
            label={tv("fields.default_duration")}
            type="number"
            min={15}
            value={defaultDurationMinutes}
            onChange={setDefaultDurationMinutes}
          />
          <TextField
            label={tv("fields.lead_time")}
            type="number"
            min={0}
            value={leadTimeMinutes}
            onChange={setLeadTimeMinutes}
          />
          <TextField
            label={tv("fields.max_advance_days")}
            type="number"
            min={1}
            value={maxAdvanceDays}
            onChange={setMaxAdvanceDays}
          />
          <TextField
            label={tv("fields.max_covers")}
            type="number"
            min={1}
            value={maxCoversPerSlot}
            onChange={setMaxCoversPerSlot}
          />
          <TextField
            label={tv("fields.hold_minutes")}
            type="number"
            min={1}
            value={holdMinutes}
            onChange={setHoldMinutes}
          />
        </div>
      </Section>

      <Separator />

      <Section title={tv("sections.hours")}>
        <CheckField
          label={tv("fields.always_open")}
          checked={alwaysOpen}
          onChange={setAlwaysOpen}
        />
        {!alwaysOpen &&
          days.map((day, index) => (
            <div
              key={DAY_KEYS[index]}
              className="flex flex-col lg:flex-row lg:items-end gap-4 rounded-[1.4rem] border border-neutral-200 p-6"
            >
              <div className="lg:w-56">
                <CheckField
                  label={tv(`days.${DAY_KEYS[index]}`)}
                  checked={day.open}
                  onChange={(open) => updateDay(index, { open })}
                />
              </div>
              {day.open && (
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <TextField
                    label={tv("fields.opens_at")}
                    type="time"
                    value={day.opensAt}
                    onChange={(value) => updateDay(index, { opensAt: value })}
                  />
                  <TextField
                    label={tv("fields.closes_at")}
                    type="time"
                    value={day.closesAt}
                    onChange={(value) => updateDay(index, { closesAt: value })}
                  />
                </div>
              )}
            </div>
          ))}
      </Section>

      <Separator />

      <Section title={tv("sections.extras")}>
        <ListField
          label={tv("fields.amenities")}
          value={amenities}
          onChange={setAmenities}
        />
        <ListField
          label={tv("fields.dietary_options")}
          value={dietaryOptions}
          onChange={setDietaryOptions}
        />
        <ListField
          label={tv("fields.languages")}
          value={languagesSpoken}
          onChange={setLanguagesSpoken}
        />
        <ListField
          label={tv("fields.payment_methods")}
          value={inPersonPaymentMethods}
          onChange={setInPersonPaymentMethods}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TextField
            label={tv("fields.dress_code")}
            value={dressCode}
            onChange={setDressCode}
          />
          <TextField
            label={tv("fields.seating_capacity")}
            type="number"
            min={0}
            value={seatingCapacity}
            onChange={setSeatingCapacity}
          />
        </div>
      </Section>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 pb-16">
        <ButtonNeutral
          className="w-full lg:flex-1"
          onClick={() =>
            router.push(`/activities/restaurant/${restaurant.restaurantId}`)
          }
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
              {t("confirm.body", { name: restaurant.name })}
            </p>
            {gallery.length > 0 && (
              <p className="text-[1.3rem] leading-8 text-orange-700">
                {tv("confirm.gallery", { count: gallery.length })}
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
