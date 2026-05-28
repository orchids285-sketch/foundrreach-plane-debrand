/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

// Plane v1.3.1 has known SSR/CSR mismatches (time-based greeting, theme flash)
// that fire React error #418 and #423 in console on every page load. React
// recovers via client-render automatically (per #423 spec) and the app works
// fine — but the console spam is noisy. We swallow only these two error codes
// at three layers: console.error, window 'error' events, and unhandledrejection.

function isReactHydrationNoise(msg: string): boolean {
  return (
    msg.includes("Minified React error #418") ||
    msg.includes("Minified React error #423")
  );
}

const _origError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === "string" && isReactHydrationNoise(first)) return;
  if (first instanceof Error && isReactHydrationNoise(first.message || "")) return;
  _origError.apply(console, args);
};

if (typeof window !== "undefined") {
  window.addEventListener(
    "error",
    (event) => {
      const msg =
        event.message || (event.error && (event.error as Error).message) || "";
      if (isReactHydrationNoise(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg =
      typeof reason === "string"
        ? reason
        : (reason && (reason as Error).message) || "";
    if (isReactHydrationNoise(msg)) {
      event.preventDefault();
    }
  });
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
