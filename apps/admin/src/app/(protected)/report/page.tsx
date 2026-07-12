import { Page } from "@/shared/ui";
import { ReportBoard } from "@/widgets/report-board";

export default function ReportPage() {
  return (
    <Page title="리포트" description="행사 정산·환급·분쟁 대비 리포트">
      <ReportBoard />
    </Page>
  );
}
