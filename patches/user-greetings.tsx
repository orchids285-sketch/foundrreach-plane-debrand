/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
// plane types
import { useTranslation } from "@plane/i18n";
import type { IUser } from "@plane/types";
// hooks
import { useCurrentTime } from "@/hooks/use-current-time";

export interface IUserGreetingsView {
  user: IUser;
}

// Wrapped in a client-only mount check: rendering `currentTime` during SSR
// and again on hydration causes a hydration mismatch (React error #418),
// since the server's clock and the client's clock differ by milliseconds.
// We render an invisible placeholder until mount, then swap in the greeting.
export function UserGreetingsView(props: IUserGreetingsView) {
  const { user } = props;
  const { currentTime } = useCurrentTime();
  const { t } = useTranslation();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="my-6 flex flex-col items-center" suppressHydrationWarning>
        <h2 className="text-center text-20 font-semibold">&nbsp;</h2>
        <h5 className="flex items-center gap-2 font-medium text-placeholder">&nbsp;</h5>
      </div>
    );
  }

  const hour = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    hour: "numeric",
  }).format(currentTime);

  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(currentTime);

  const weekDay = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(currentTime);

  const timeString = new Intl.DateTimeFormat("en-US", {
    timeZone: user?.user_timezone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).format(currentTime);

  const greeting = parseInt(hour, 10) < 12 ? "morning" : parseInt(hour, 10) < 18 ? "afternoon" : "evening";

  return (
    <div className="my-6 flex flex-col items-center">
      <h2 className="text-center text-20 font-semibold">
        {t("good")} {t(greeting)}, {user?.first_name} {user?.last_name}
      </h2>
      <h5 className="flex items-center gap-2 font-medium text-placeholder">
        <div>{greeting === "morning" ? "🌤️" : greeting === "afternoon" ? "🌥️" : "🌙️"}</div>
        <div>
          {weekDay}, {date} {timeString}
        </div>
      </h5>
    </div>
  );
}
