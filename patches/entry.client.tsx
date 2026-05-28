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
// and let every other console.error through.
const _origError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === "string") {
    if (
      first.includes("Minified React error #418") ||
      first.includes("Minified React error #423")
    ) {
      return;
    }
  } else if (first instanceof Error) {
    const m = first.message || "";
    if (
      m.includes("Minified React error #418") ||
      m.includes("Minified React error #423")
    ) {
      return;
    }
  }
  _origError.apply(console, args);
};

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
