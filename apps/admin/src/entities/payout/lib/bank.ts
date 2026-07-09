export interface BankMeta {
  code: string;
  name: string;
  aliases: string[];
  color: string;
  short: string;
  format?: (digits: string) => string;
}

function group(sizes: number[]) {
  return (digits: string) => {
    const parts: string[] = [];
    let cursor = 0;
    for (const size of sizes) {
      if (cursor >= digits.length) {
        break;
      }
      parts.push(digits.slice(cursor, cursor + size));
      cursor += size;
    }
    if (cursor < digits.length) {
      parts.push(digits.slice(cursor));
    }
    return parts.join("-");
  };
}

export const BANKS: BankMeta[] = [
  {
    code: "toss",
    name: "토스뱅크",
    aliases: ["토스", "toss"],
    color: "#0064ff",
    short: "토스",
    format: group([4, 4, 4]),
  },
  {
    code: "kakao",
    name: "카카오뱅크",
    aliases: ["카카오", "kakao"],
    color: "#ffcd00",
    short: "kakao",
    format: group([4, 2, 7]),
  },
  {
    code: "kbank",
    name: "케이뱅크",
    aliases: ["케이", "kbank", "k뱅크"],
    color: "#00b8b0",
    short: "K",
  },
  {
    code: "kb",
    name: "국민은행",
    aliases: ["국민", "kb국민", "kb"],
    color: "#ffbc00",
    short: "KB",
  },
  {
    code: "shinhan",
    name: "신한은행",
    aliases: ["신한", "shinhan"],
    color: "#0046ff",
    short: "신한",
  },
  {
    code: "woori",
    name: "우리은행",
    aliases: ["우리", "woori"],
    color: "#0067ac",
    short: "우리",
  },
  {
    code: "hana",
    name: "하나은행",
    aliases: ["하나", "keb", "hana"],
    color: "#008485",
    short: "하나",
  },
  {
    code: "nh",
    name: "농협은행",
    aliases: ["농협", "nh", "단위농협"],
    color: "#00a651",
    short: "NH",
  },
  {
    code: "ibk",
    name: "기업은행",
    aliases: ["기업", "ibk"],
    color: "#0066b3",
    short: "IBK",
  },
  {
    code: "sc",
    name: "SC제일은행",
    aliases: ["제일", "sc", "standard"],
    color: "#0f8c3b",
    short: "SC",
  },
  {
    code: "busan",
    name: "부산은행",
    aliases: ["부산", "busan"],
    color: "#e60012",
    short: "부산",
  },
  {
    code: "daegu",
    name: "대구은행",
    aliases: ["대구", "imbank", "iM뱅크", "daegu"],
    color: "#0086cb",
    short: "대구",
  },
];

const FALLBACK: BankMeta = {
  code: "unknown",
  name: "은행",
  aliases: [],
  color: "#8b95a1",
  short: "?",
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s|은행|bank/g, "");
}

export function resolveBank(bankName: string): BankMeta {
  const target = normalize(bankName);
  if (!target) {
    return FALLBACK;
  }
  for (const bank of BANKS) {
    const keys = [bank.name, bank.code, ...bank.aliases].map(normalize);
    if (keys.some((key) => key && (key === target || target.includes(key)))) {
      return bank;
    }
  }
  return FALLBACK;
}

export function formatAccountNumber(bankName: string, accountNumber: string) {
  const digits = accountNumber.replace(/[^0-9]/g, "");
  if (!digits) {
    return accountNumber;
  }
  const bank = resolveBank(bankName);
  if (bank.format) {
    return bank.format(digits);
  }
  return group([4, 4, 4, 4])(digits);
}
