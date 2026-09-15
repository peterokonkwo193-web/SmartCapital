import { useContext } from "react";
import { LiveMarketContext } from "@/hooks/live-market-context";

export function useLiveMarket() {
  const ctx = useContext(LiveMarketContext);
  if (!ctx) {
    throw new Error("useLiveMarket must be used within a LiveMarketProvider");
  }
  return ctx;
}
