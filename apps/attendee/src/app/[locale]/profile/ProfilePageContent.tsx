"use client";
import { TopBar } from "@/components/Layouts/Topbars";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import ProfileImage from "./ProfileImage";
import FormatDate from "@/lib/FormatDate";
import { UpdateUserProfile } from "@/actions/userActions";
import { toast } from "sonner";
import { User, UserAnalytic } from "@ticketwaze/typescript-config";
import { ButtonPrimary } from "@/components/shared/buttons";
import { Input } from "@/components/shared/Inputs";
import DeleteAccountModal from "./DeleteAccountModal";
import ReferralDialog from "./ReferralDialog";
import { useSession } from "next-auth/react";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { ArrowDown2, Calendar } from "iconsax-reactjs";
import countries from "@/lib/Countries";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileData {
  firstName: string;
  lastName: string;
  username: string;
  address: string;
  country: string;
  state: string;
  city: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: string;
}
type ProfileErrors = Partial<Record<keyof ProfileData, string>>;

const USERNAME_PATTERN = /^@?[a-zA-Z0-9_.]{3,30}$/;
const GENDERS = ["male", "female", "non-binary", "undisclosed"] as const;
const ease = [0.22, 1, 0.36, 1] as const;
const selectTriggerClass =
  "bg-neutral-100 cursor-pointer rounded-[3rem] px-8 border-none w-full data-[size=default]:h-[6rem] text-[1.5rem] text-deep-200 leading-8 shadow-none";

function fromUser(user: User): ProfileData {
  const u = user as User & {
    username?: string | null;
    address?: string | null;
  };
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    username: u.username ?? "",
    address: u.address ?? "",
    // Haiti until the user picks another country.
    country: user.country || "Haiti",
    state: user.state ?? "",
    city: user.city ?? "",
    dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : "",
    gender: user.gender ?? "",
  };
}

export default function ProfilePageContent({
  analytics,
  user,
  startEditing = false,
}: {
  analytics: UserAnalytic;
  user: User;
  startEditing?: boolean;
}) {
  const t = useTranslations("Profile");
  const tSetup = useTranslations("Auth.flow.setup");
  const locale = useLocale();
  const { data: session, update } = useSession();

  // Figma: the page reads as a summary; "Edit profile" unlocks the fields
  // and turns into "Save changes".
  const [editing, setEditing] = useState(startEditing);
  const [saved, setSaved] = useState(() => fromUser(user));
  const [data, setData] = useState(saved);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const states = countries.find((c) => c.name === data.country)?.state ?? [];
  const cities = states.find((s) => s.name === data.state)?.cities ?? [];
  const isDirty = JSON.stringify(data) !== JSON.stringify(saved);

  function setField<K extends keyof ProfileData>(field: K, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): ProfileErrors {
    const e: ProfileErrors = {};
    if (data.firstName.trim().length < 2)
      e.firstName = t("errors.firstname_length");
    if (data.lastName.trim().length < 2)
      e.lastName = t("errors.lastname_length");
    // Optional for accounts made before usernames existed, but once given it
    // has to be a valid one.
    if (data.username.trim() && !USERNAME_PATTERN.test(data.username.trim()))
      e.username = tSetup("errors.username");
    return e;
  }

  async function onSave() {
    if (!isDirty) {
      setEditing(false);
      return;
    }
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setIsSubmitting(true);
    const body = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      ...(data.username.trim() && {
        username: data.username.trim().toLowerCase(),
      }),
      address: data.address.trim() || null,
      ...(data.country && { country: data.country }),
      ...(data.state && { state: data.state }),
      ...(data.city && { city: data.city }),
      ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
      ...(data.gender && { gender: data.gender }),
    };
    const results = await UpdateUserProfile(
      session?.user.accessToken ?? "",
      body,
      locale,
    );
    setIsSubmitting(false);
    if (results.status !== "success") {
      if ("code" in results && results.code === "USERNAME_TAKEN") {
        setErrors({ username: tSetup("errors.username_taken") });
      } else {
        toast.error(
          ("message" in results && results.message) ||
            ("error" in results && results.error) ||
            "Something went wrong",
        );
      }
      return;
    }
    setSaved(data);
    setEditing(false);
    toast.success(t("updated"));
    update({
      user: { firstName: body.firstName, lastName: body.lastName },
    });
  }

  const dobLabel = saved.dateOfBirth
    ? saved.dateOfBirth.split("-").reverse().join(" / ")
    : "";
  const genderLabel = (g: string) =>
    (GENDERS as readonly string[]).includes(g) ? tSetup(`genders.${g}`) : g;

  return (
    <>
      <TopBar title={t("title")}>
        <div className="flex items-center gap-4">
          <ReferralDialog />
          <ButtonPrimary
            onClick={editing ? onSave : () => setEditing(true)}
            disabled={isSubmitting}
            className="min-w-[13.2rem] active:scale-95 transition-transform"
          >
            {isSubmitting ? (
              <LoadingCircleSmall />
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={editing ? "save" : "edit"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {editing ? t("save") : t("edit")}
                </motion.span>
              </AnimatePresence>
            )}
          </ButtonPrimary>
        </div>
      </TopBar>
      <div
        className={
          "flex flex-col gap-16 w-full lg:w-212 mx-auto lg:overflow-y-scroll lg:overflow-x-hidden lg:h-full"
        }
      >
        <ProfileImage user={user} />
        <section className="flex flex-col gap-8">
          <span className="font-medium text-[1.8rem] mb-4 leading-10 text-deep-100">
            {t("personal")}
          </span>
          <AnimatePresence mode="wait" initial={false}>
            {editing ? (
              <motion.form
                key="edit"
                id="edit-profile"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  onSave();
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease }}
                className="flex flex-col gap-8"
              >
                <div className="flex flex-col lg:flex-row gap-8 w-full">
                  <Input
                    className="w-full lg:flex-1"
                    value={data.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
                    autoComplete="given-name"
                    error={errors.firstName}
                    autoFocus
                  >
                    {t("placeholders.firstname")}
                  </Input>
                  <Input
                    className="w-full lg:flex-1"
                    value={data.lastName}
                    onChange={(e) => setField("lastName", e.target.value)}
                    autoComplete="family-name"
                    error={errors.lastName}
                  >
                    {t("placeholders.lastname")}
                  </Input>
                </div>
                {/* The email is the login, so it is not edited here. */}
                <Input defaultValue={user.email} disabled readOnly>
                  {t("placeholders.email")}
                </Input>
                <Input
                  value={data.username}
                  onChange={(e) => setField("username", e.target.value)}
                  autoCapitalize="none"
                  autoComplete="username"
                  error={errors.username}
                >
                  {tSetup("username")}
                </Input>
                <Input
                  value={data.address}
                  onChange={(e) => setField("address", e.target.value)}
                  autoComplete="street-address"
                >
                  {tSetup("address")}
                </Input>
                <Select
                  value={data.country}
                  onValueChange={(v) =>
                    setData((prev) => ({
                      ...prev,
                      country: v,
                      state: "",
                      city: "",
                    }))
                  }
                >
                  <SelectTrigger
                    aria-label={tSetup("country")}
                    className={selectTriggerClass}
                  >
                    <SelectValue placeholder={tSetup("country")} />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-100 text-[1.4rem]">
                    {countries.map((c) => (
                      <SelectItem
                        key={c.name}
                        value={c.name}
                        className="text-[1.4rem] text-deep-100"
                      >
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-8">
                  <div className="flex-1 min-w-0">
                    <Select
                      value={data.state}
                      disabled={!data.country}
                      onValueChange={(v) =>
                        setData((prev) => ({ ...prev, state: v, city: "" }))
                      }
                    >
                      <SelectTrigger
                        aria-label={tSetup("state")}
                        className={selectTriggerClass}
                      >
                        <SelectValue placeholder={tSetup("state")} />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-100 text-[1.4rem]">
                        {states.map((s) => (
                          <SelectItem
                            key={s.name}
                            value={s.name}
                            className="text-[1.4rem] text-deep-100"
                          >
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Select
                      value={data.city}
                      disabled={!data.state}
                      onValueChange={(v) => setField("city", v)}
                    >
                      <SelectTrigger
                        aria-label={tSetup("city")}
                        className={selectTriggerClass}
                      >
                        <SelectValue placeholder={tSetup("city")} />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-100 text-[1.4rem]">
                        {cities.map((city) => (
                          <SelectItem
                            key={city}
                            value={city}
                            className="text-[1.4rem] text-deep-100"
                          >
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Input
                  type="date"
                  value={data.dateOfBirth}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setField("dateOfBirth", e.target.value)}
                >
                  {tSetup("dob")}
                </Input>
                <Select
                  value={data.gender}
                  onValueChange={(v) => setField("gender", v)}
                >
                  <SelectTrigger
                    aria-label={tSetup("gender")}
                    className={selectTriggerClass}
                  >
                    <SelectValue placeholder={tSetup("gender")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-[1.4rem]">
                    <SelectGroup>
                      <SelectLabel className="text-[1.3rem] text-neutral-500">
                        {tSetup("genders.title")}
                      </SelectLabel>
                      {GENDERS.map((g) => (
                        <SelectItem
                          key={g}
                          value={g}
                          className="text-[1.4rem] text-deep-100"
                        >
                          {tSetup(`genders.${g}`)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {/* Lets Enter submit from any field. */}
                <button type="submit" className="hidden" />
              </motion.form>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease }}
                className="flex flex-col gap-8"
              >
                <div className="flex flex-col lg:flex-row gap-8 w-full">
                  <ReadField
                    className="w-full lg:flex-1"
                    label={t("placeholders.firstname")}
                    value={saved.firstName}
                  />
                  <ReadField
                    className="w-full lg:flex-1"
                    label={t("placeholders.lastname")}
                    value={saved.lastName}
                  />
                </div>
                <ReadField label={t("placeholders.email")} value={user.email} />
                <ReadField
                  label={tSetup("username")}
                  value={saved.username && `@${saved.username}`}
                />
                <ReadField label={tSetup("address")} value={saved.address} />
                <ReadField
                  label={tSetup("country")}
                  value={saved.country}
                  select
                />
                <div className="flex gap-8">
                  <ReadField
                    className="flex-1 min-w-0"
                    label={tSetup("state")}
                    value={saved.state}
                    select
                  />
                  <ReadField
                    className="flex-1 min-w-0"
                    label={tSetup("city")}
                    value={saved.city}
                    select
                  />
                </div>
                <ReadField
                  label={tSetup("dob")}
                  value={dobLabel}
                  icon={<Calendar size={20} color="#ABB0B9" variant="Bulk" />}
                />
                <ReadField
                  label={tSetup("gender")}
                  value={saved.gender && genderLabel(saved.gender)}
                  select
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        <section className="flex flex-col gap-10">
          <span className="font-medium text-[1.8rem] leading-10 text-deep-100">
            {t("event.title")}
          </span>
          <StatRow
            label={t("event.attended")}
            value={analytics.eventAttended}
          />
          <StatRow
            label={t("event.tickets")}
            value={analytics.ticketPurchased}
          />
          <StatRow label={t("event.missed")} value={analytics.eventMissed} />
        </section>
        <section className="flex flex-col gap-10">
          <span className="font-medium text-[1.8rem] leading-10 text-deep-100">
            {t("account.title")}
          </span>
          <div className="flex items-center justify-between">
            <span className="font-normal text-[1.6rem] leading-[22.5px] text-neutral-600">
              {t("account.created")}
            </span>
            <span className="text-[1.6rem] font-medium leading-8 text-deep-100">
              {FormatDate(user.createdAt, locale, "local")}
            </span>
          </div>
          <DeleteAccountModal />
        </section>
        <div></div>
      </div>
    </>
  );
}

/**
 * Figma's read-only field: the same pill as an input, value in light grey,
 * with a chevron or icon where the edit control has one.
 */
function ReadField({
  label,
  value,
  select,
  icon,
  className,
}: {
  label: string;
  value?: string | null;
  select?: boolean;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-label={label}
      className={`shrink-0 bg-neutral-50 rounded-[5rem] h-[6rem] px-8 flex items-center justify-between gap-4 text-[1.5rem] leading-8 ${className ?? ""}`}
    >
      <span
        className={`truncate ${value ? "text-neutral-500" : "text-neutral-400"}`}
      >
        {value || label}
      </span>
      {select && <ArrowDown2 size={16} color="#ABB0B9" variant="Bold" />}
      {icon}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-normal text-[1.6rem] leading-[22.5px] text-neutral-600">
        {label}
      </span>
      <span className="text-[1.6rem] font-medium leading-8 text-deep-100">
        {value}
      </span>
    </div>
  );
}
