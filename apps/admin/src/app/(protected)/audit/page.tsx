import { Page } from "@/shared/ui";
import { AuditTrail } from "@/widgets/audit-trail";

export default function AuditPage() {
  return (
    <Page title="감사 로그">
      <AuditTrail />
    </Page>
  );
}
