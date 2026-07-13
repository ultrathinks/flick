import { Workbook, type Worksheet } from "exceljs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveBank } from "@/entities/payout/lib/bank.ts";
import {
  type AdminPayout,
  adminPayoutSchema,
} from "@/entities/payout/model/types.ts";
import { type Report, reportSchema } from "@/entities/report/model/types.ts";
import { readAccessToken, rotateSession } from "@/shared/auth/server";
import { API_INTERNAL_BASE_URL } from "@/shared/config";

const EXPORT_TYPES = ["analytics", "accounts", "ledger"] as const;
type ExportType = (typeof EXPORT_TYPES)[number];

const MONEY_FORMAT = "₩#,##0";
const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const FILENAMES: Record<ExportType, string> = {
  analytics: "행사리포트.xlsx",
  accounts: "환급계좌.xlsx",
  ledger: "거래원장.xlsx",
};

const payoutListSchema = z.array(adminPayoutSchema);

function isExportType(value: string): value is ExportType {
  return (EXPORT_TYPES as readonly string[]).includes(value);
}

async function resolveToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return readAccessToken(cookieStore) ?? (await rotateSession(cookieStore));
}

async function fetchJson<T>(
  schema: z.ZodType<T>,
  path: string,
  token: string,
): Promise<T> {
  const response = await fetch(`${API_INTERNAL_BASE_URL}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`upstream ${path} failed with ${response.status}`);
  }
  return schema.parse(await response.json());
}

interface ColumnSpec {
  header: string;
  width: number;
  money?: boolean;
}

function addSheet<T>(
  workbook: Workbook,
  name: string,
  columns: ColumnSpec[],
  rows: T[],
  toRow: (row: T, index: number) => (string | number | null)[],
): Worksheet {
  const sheet = workbook.addWorksheet(name);
  const header = sheet.addRow(columns.map((column) => column.header));
  header.font = { bold: true };
  columns.forEach((column, index) => {
    const worksheetColumn = sheet.getColumn(index + 1);
    worksheetColumn.width = column.width;
    if (column.money) {
      worksheetColumn.numFmt = MONEY_FORMAT;
    }
  });
  rows.forEach((row, index) => {
    sheet.addRow(toRow(row, index));
  });
  return sheet;
}

function buildSummarySheet(
  workbook: Workbook,
  summary: Report["summary"],
): void {
  const sheet = workbook.addWorksheet("요약");
  const header = sheet.addRow(["항목", "값"]);
  header.font = { bold: true };
  sheet.getColumn(1).width = 26;
  sheet.getColumn(2).width = 20;

  const moneyRows: [string, number][] = [
    ["실충전", summary.totalCharged],
    ["구매 총액", summary.totalRevenue],
    ["기부액 (기본금 제외)", summary.totalDonation],
    ["환급 대상 총액", summary.refundableTotal],
    ["미등록 환급 총액", summary.unregisteredTotal],
    ["검산 (잔액-원장)", summary.reconciliation],
  ];
  for (const [label, value] of moneyRows) {
    const row = sheet.addRow([label, value]);
    row.getCell(2).numFmt = MONEY_FORMAT;
  }

  const countRows: [string, number][] = [
    ["사용자 수", summary.userCount],
    ["주문 수", summary.orderCount],
    ["미등록 계좌 수", summary.unregisteredCount],
  ];
  for (const [label, value] of countRows) {
    sheet.addRow([label, value]);
  }
}

function buildAnalytics(report: Report): Workbook {
  const workbook = new Workbook();

  buildSummarySheet(workbook, report.summary);

  addSheet(
    workbook,
    "부스랭킹",
    [
      { header: "순위", width: 8 },
      { header: "부스명", width: 28 },
      { header: "매출", width: 18, money: true },
    ],
    report.boothRanking,
    (row, index) => [index + 1, row.name, row.revenue],
  );

  addSheet(
    workbook,
    "메뉴별",
    [
      { header: "부스명", width: 24 },
      { header: "메뉴", width: 28 },
      { header: "수량", width: 10 },
      { header: "매출", width: 18, money: true },
    ],
    report.menuSales,
    (row) => [row.boothName, row.menuName, row.quantity, row.revenue],
  );

  return workbook;
}

function buildAccounts(payouts: AdminPayout[], report: Report): Workbook {
  const workbook = new Workbook();

  addSheet(
    workbook,
    "등록",
    [
      { header: "이름", width: 14 },
      { header: "학번", width: 12 },
      { header: "환급액", width: 16, money: true },
      { header: "은행", width: 16 },
      { header: "계좌번호", width: 24 },
      { header: "예금주", width: 14 },
    ],
    payouts,
    (row) => [
      row.name,
      row.studentNumber,
      row.availableAmount,
      resolveBank(row.bankName).name,
      row.accountNumber,
      row.accountHolder,
    ],
  );

  addSheet(
    workbook,
    "미등록",
    [
      { header: "이름", width: 14 },
      { header: "학번", width: 12 },
      { header: "환급예정액", width: 16, money: true },
    ],
    report.unregistered,
    (row) => [row.name, row.studentNumber, row.amount],
  );

  return workbook;
}

function buildLedger(report: Report): Workbook {
  const workbook = new Workbook();

  addSheet(
    workbook,
    "거래원장",
    [
      { header: "시각", width: 24 },
      { header: "이름", width: 14 },
      { header: "학번", width: 12 },
      { header: "유형", width: 12 },
      { header: "금액", width: 16, money: true },
    ],
    report.ledger,
    (row) => [
      row.createdAt.toISOString(),
      row.userName,
      row.studentNumber,
      row.type,
      row.amount,
    ],
  );

  return workbook;
}

async function buildWorkbook(
  type: ExportType,
  token: string,
): Promise<Workbook> {
  if (type === "accounts") {
    const [report, payouts] = await Promise.all([
      fetchJson(reportSchema, "report", token),
      fetchJson(payoutListSchema, "payouts", token),
    ]);
    return buildAccounts(payouts, report);
  }
  const report = await fetchJson(reportSchema, "report", token);
  return type === "analytics" ? buildAnalytics(report) : buildLedger(report);
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ type: string }> },
): Promise<NextResponse> {
  const { type } = await ctx.params;
  if (!isExportType(type)) {
    return new NextResponse(null, { status: 404 });
  }

  const token = await resolveToken();
  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 },
    );
  }

  const workbook = await buildWorkbook(type, token);
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = encodeURIComponent(FILENAMES[type]);

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
