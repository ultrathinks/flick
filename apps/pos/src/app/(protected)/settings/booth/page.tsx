"use client";

import { Page } from "@/shared/ui";
import { BoothScreen } from "@/widgets/app-shell";
import { BoothSettings } from "@/widgets/booth-settings";

export default function BoothSettingsPage() {
  return (
    <BoothScreen tab="settings">
      {(booth) => (
        <Page title="부스 설정" description="부스 정보를 관리하세요.">
          <BoothSettings booth={booth} />
        </Page>
      )}
    </BoothScreen>
  );
}
