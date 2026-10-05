"use client";
import React, { useState } from "react";

/**
 * Renders its dialog only once it has been opened, then keeps it mounted so
 * the close animation still plays. Paired with `next/dynamic`, the dialog's
 * code (and whatever heavy library it pulls in) is downloaded on first open
 * instead of with the page — on a slow connection, most visits never open it.
 */
export default function MountOnOpen({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);
  return opened ? children : null;
}
