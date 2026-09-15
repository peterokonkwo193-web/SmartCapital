import { createContext } from "react";

import type { OrderSide, OrderType, PaperOrder } from "@/types";

interface PaperTradingContextValue {
  orders: PaperOrder[];
  balance: number;
  loading: boolean;
  placeOrder: (order: { symbol: string; side: OrderSide; type: OrderType; quantity: number; price: number }) => Promise<void>;
  closePosition: (symbol: string, currentPrice: number) => Promise<void>;
  addPracticeFunds: (amount: number) => Promise<void>;
  resetPracticeBalance: (targetBalance?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const PaperTradingContext = createContext<PaperTradingContextValue | undefined>(undefined);

export { PaperTradingContext, type PaperTradingContextValue };
