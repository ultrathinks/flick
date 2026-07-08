"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { AuthGate } from "@/features/auth-gate";
import { Button, Page } from "@/shared/ui";
import { BoothScreen } from "@/widgets/app-shell";
import { KioskManager } from "@/widgets/kiosk-manager";

export default function KiosksPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <AuthGate>
      <BoothScreen tab="kiosks">
        {(booth) => (
          <Page
            title="키오스크"
            actions={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                키오스크 추가
              </Button>
            }
          >
            <KioskManager
              booth={booth}
              createOpen={createOpen}
              onCreateOpenChange={setCreateOpen}
            />
          </Page>
        )}
      </BoothScreen>
    </AuthGate>
  );
}
