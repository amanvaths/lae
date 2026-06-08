export type PaymentMethod =
  | "Bank Transfer"
  | "Wise"
  | "SEPA"
  | "UPI"
  | "PayPal"
  | "Revolut"
  | "On-chain";

export const methodColor: Record<PaymentMethod, string> = {
  "Bank Transfer": "#34d399",
  Wise: "#48bcff",
  SEPA: "#a78bfa",
  UPI: "#f5c33b",
  PayPal: "#60a5fa",
  Revolut: "#22d3ee",
  "On-chain": "#1e9bff",
};

export type Offer = {
  id: string;
  name: string;
  initial: string;
  color: string;
  orders: number;
  completion: number;
  online: boolean;
  pro: boolean;
  price: number; // fiat per LAE
  available: number; // LAE
  min: number; // fiat
  max: number; // fiat
  methods: PaymentMethod[];
  releaseMin: number; // avg release minutes
};

export const offers: Offer[] = [
  {
    id: "1",
    name: "CryptoWhale.eth",
    initial: "C",
    color: "#1e9bff",
    orders: 4821,
    completion: 99.6,
    online: true,
    pro: true,
    price: 0.8392,
    available: 248_300,
    min: 50,
    max: 25_000,
    methods: ["Bank Transfer", "Wise", "On-chain"],
    releaseMin: 4,
  },
  {
    id: "2",
    name: "NodeRunner",
    initial: "N",
    color: "#8b5cf6",
    orders: 2190,
    completion: 99.1,
    online: true,
    pro: true,
    price: 0.8405,
    available: 91_500,
    min: 100,
    max: 12_000,
    methods: ["SEPA", "Revolut"],
    releaseMin: 6,
  },
  {
    id: "3",
    name: "satoshigirl",
    initial: "S",
    color: "#34d399",
    orders: 871,
    completion: 98.4,
    online: true,
    pro: false,
    price: 0.8378,
    available: 42_120,
    min: 20,
    max: 6_000,
    methods: ["UPI", "PayPal"],
    releaseMin: 9,
  },
  {
    id: "4",
    name: "DeFiDesk",
    initial: "D",
    color: "#f5c33b",
    orders: 6402,
    completion: 99.8,
    online: true,
    pro: true,
    price: 0.8419,
    available: 512_700,
    min: 250,
    max: 80_000,
    methods: ["Bank Transfer", "Wise", "SEPA"],
    releaseMin: 3,
  },
  {
    id: "5",
    name: "0xMaverick",
    initial: "0",
    color: "#22d3ee",
    orders: 333,
    completion: 97.9,
    online: false,
    pro: false,
    price: 0.8361,
    available: 18_900,
    min: 30,
    max: 3_500,
    methods: ["Revolut", "On-chain"],
    releaseMin: 12,
  },
  {
    id: "6",
    name: "LedgerLayla",
    initial: "L",
    color: "#a78bfa",
    orders: 1577,
    completion: 99.3,
    online: true,
    pro: true,
    price: 0.8431,
    available: 134_400,
    min: 100,
    max: 20_000,
    methods: ["PayPal", "Wise", "Bank Transfer"],
    releaseMin: 5,
  },
  {
    id: "7",
    name: "chainmonk",
    initial: "C",
    color: "#60a5fa",
    orders: 209,
    completion: 96.5,
    online: true,
    pro: false,
    price: 0.8347,
    available: 9_750,
    min: 15,
    max: 1_800,
    methods: ["UPI"],
    releaseMin: 15,
  },
  {
    id: "8",
    name: "StakeQueen",
    initial: "S",
    color: "#f472b6",
    orders: 3914,
    completion: 99.5,
    online: true,
    pro: true,
    price: 0.8444,
    available: 301_200,
    min: 200,
    max: 50_000,
    methods: ["Bank Transfer", "SEPA", "On-chain"],
    releaseMin: 4,
  },
];

export const fiats = ["USD", "EUR", "GBP", "INR", "AED"] as const;
export type Fiat = (typeof fiats)[number];

// rough fiat multipliers relative to USD price baked into the offers
export const fiatRate: Record<Fiat, { symbol: string; mult: number }> = {
  USD: { symbol: "$", mult: 1 },
  EUR: { symbol: "€", mult: 0.92 },
  GBP: { symbol: "£", mult: 0.79 },
  INR: { symbol: "₹", mult: 83.2 },
  AED: { symbol: "د.إ", mult: 3.67 },
};
