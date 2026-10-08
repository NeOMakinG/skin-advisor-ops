import { z } from "zod";
import { Account, type BalancePoint } from "@/schemas/account";

// Twelve months ending September 2026, oldest first.
function history(balances: number[]): BalancePoint[] {
  return balances.map((balance, i) => {
    const month = ((9 + i) % 12) + 1;
    const year = 9 + i >= 12 ? 2026 : 2025;
    return { month: `${year}-${String(month).padStart(2, "0")}`, balance };
  });
}

// Fictional accounts for a small operations team. Balances are in major units.
export const accounts = z.array(Account).parse([
  {
    id: "acc_001",
    name: "Northwind Payroll",
    ownerId: "usr_001",
    type: "checking",
    status: "active",
    currency: "USD",
    balance: 184_320.55,
    creditLimit: null,
    openedAt: "2021-03-15",
    history: history([
      142_100, 151_800, 139_400, 160_250, 158_900, 171_300, 166_800, 175_400, 169_950, 181_200,
      178_600, 184_320.55,
    ]),
  },
  {
    id: "acc_002",
    name: "Harbor Reserve",
    ownerId: "usr_001",
    type: "savings",
    status: "active",
    currency: "USD",
    balance: 412_000,
    creditLimit: null,
    openedAt: "2019-11-02",
    history: history([
      350_000, 355_000, 360_000, 365_000, 372_000, 378_000, 384_000, 390_000, 396_000, 402_000,
      407_000, 412_000,
    ]),
  },
  {
    id: "acc_003",
    name: "Fleet Fuel Card",
    ownerId: "usr_002",
    type: "credit",
    status: "active",
    currency: "USD",
    balance: 23_480.1,
    creditLimit: 50_000,
    openedAt: "2022-06-20",
    history: history([
      18_200, 21_400, 19_900, 24_300, 26_100, 22_800, 25_600, 27_900, 24_100, 22_300, 21_750,
      23_480.1,
    ]),
  },
  {
    id: "acc_004",
    name: "Lisbon Office Operating",
    ownerId: "usr_002",
    type: "checking",
    status: "active",
    currency: "EUR",
    balance: 61_745.9,
    creditLimit: null,
    openedAt: "2023-01-09",
    history: history([
      48_300, 52_900, 50_100, 55_700, 58_200, 54_600, 59_800, 62_400, 60_100, 63_900, 62_300,
      61_745.9,
    ]),
  },
  {
    id: "acc_005",
    name: "Vendor Escrow",
    ownerId: "usr_001",
    type: "checking",
    status: "frozen",
    currency: "USD",
    balance: 75_000,
    creditLimit: null,
    openedAt: "2024-08-01",
    history: history([
      75_000, 75_000, 75_000, 75_000, 75_000, 75_000, 75_000, 75_000, 75_000, 75_000, 75_000,
      75_000,
    ]),
  },
  {
    id: "acc_006",
    name: "Travel Expenses",
    ownerId: "usr_003",
    type: "credit",
    status: "active",
    currency: "GBP",
    balance: 8_912.4,
    creditLimit: 15_000,
    openedAt: "2022-10-12",
    history: history([
      6_100, 7_300, 5_800, 9_200, 11_400, 8_700, 7_900, 10_300, 12_100, 9_600, 8_200, 8_912.4,
    ]),
  },
  {
    id: "acc_007",
    name: "Legacy Merchant",
    ownerId: "usr_003",
    type: "checking",
    status: "closed",
    currency: "USD",
    balance: 0,
    creditLimit: null,
    openedAt: "2017-05-23",
    history: history([12_400, 9_800, 7_200, 5_100, 3_600, 2_200, 1_100, 400, 0, 0, 0, 0]),
  },
  {
    id: "acc_008",
    name: "Tax Provision",
    ownerId: "usr_002",
    type: "savings",
    status: "active",
    currency: "EUR",
    balance: 96_500,
    creditLimit: null,
    openedAt: "2020-02-14",
    history: history([
      61_000, 65_500, 70_000, 74_500, 79_000, 83_500, 88_000, 92_500, 97_000, 101_500, 92_000,
      96_500,
    ]),
  },
]);
