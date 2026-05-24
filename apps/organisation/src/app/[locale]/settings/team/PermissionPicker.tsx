"use client";

import { useTranslations } from "next-intl";
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  PRESET_PERMISSIONS,
} from "@/lib/permissionConfig";

interface PermissionPickerProps {
  availablePermissions: string[];
  selected: string[];
  onChange: (permissions: string[]) => void;
}

const PRESET_KEYS = Object.keys(PRESET_PERMISSIONS);

export default function PermissionPicker({
  availablePermissions,
  selected,
  onChange,
}: PermissionPickerProps) {
  const t = useTranslations("Settings.team");

  // If the API hasn't returned a whitelist, show every known permission
  const whitelist =
    availablePermissions.length > 0 ? new Set(availablePermissions) : null;

  const selectedSet = new Set(selected);

  function isVisible(key: string) {
    return whitelist === null || whitelist.has(key);
  }

  function toggle(key: string) {
    if (selectedSet.has(key)) {
      onChange(selected.filter((p) => p !== key));
    } else {
      onChange([...selected, key]);
    }
  }

  function applyPreset(preset: string) {
    const presetPerms = PRESET_PERMISSIONS[preset].filter(isVisible);
    if (presetPerms.length === 0) return;
    const isExact =
      presetPerms.length === selected.length &&
      presetPerms.every((p) => selectedSet.has(p));
    onChange(isExact ? [] : presetPerms);
  }

  function isPresetActive(preset: string) {
    const presetPerms = PRESET_PERMISSIONS[preset].filter(isVisible);
    return (
      presetPerms.length > 0 &&
      presetPerms.length === selected.length &&
      presetPerms.every((p) => selectedSet.has(p))
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Preset shortcuts */}
      <div className="flex flex-col gap-2">
        <p className="text-[1.2rem] font-medium text-neutral-400 uppercase tracking-wide">
          {t("preset")}
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_KEYS.map((preset) => {
            const active = isPresetActive(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`px-6 py-[.6rem] rounded-full border-2 text-[1.3rem] font-medium transition-all duration-200 cursor-pointer ${
                  active
                    ? "bg-primary-500 border-primary-500 text-white"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-primary-300 hover:text-primary-500"
                }`}
              >
                {t(`presets.${preset}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped permission boxes */}
      <div className="flex flex-col gap-5">
        {Object.entries(PERMISSION_GROUPS).map(([group, keys]) => {
          const visible = keys.filter(isVisible);
          if (visible.length === 0) return null;

          return (
            <div key={group} className="flex flex-col gap-2">
              <p className="text-[1.2rem] font-semibold text-neutral-400 uppercase tracking-wide">
                {t(`groups.${group}`)}
              </p>
              <div className="flex flex-wrap gap-2">
                {visible.map((key) => {
                  const isSelected = selectedSet.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(key)}
                      className={`px-5 py-[.6rem] rounded-[10px] border-2 text-[1.3rem] leading-6 font-medium transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-100"
                      }`}
                    >
                      {PERMISSION_LABELS[key] ?? key}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-[1.2rem] text-neutral-400">
          {selected.length} {t("permissionsSelected")}
        </p>
      )}
    </div>
  );
}
