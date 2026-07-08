"use client";

import { Page } from "@/shared/ui";
import { BoothScreen } from "@/widgets/app-shell";
import { AddProductForm, BoothDashboard } from "@/widgets/booth-dashboard";

export default function MenuPage() {
  return (
    <BoothScreen tab="menu">
      {(booth) => (
        <Page title="메뉴 관리" actions={<AddProductForm boothId={booth.id} />}>
          <BoothDashboard booth={booth} />
        </Page>
      )}
    </BoothScreen>
  );
}
