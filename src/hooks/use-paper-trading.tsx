import { useContext } from "react";

import { PaperTradingContext, type PaperTradingContextValue } from "@/hooks/paper-trading-context";

function usePaperTrading(): PaperTradingContextValue {
  const ctx = useContext(PaperTradingContext);
  if (!ctx) throw new Error("usePaperTrading must be used within a PaperTradingProvider.");
  return ctx;
}

export { usePaperTrading };
