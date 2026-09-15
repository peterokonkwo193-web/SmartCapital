import type { AllocationSlice, ChartRange, PortfolioPosition, PricePoint } from "@/types";
import { walkSeries } from "@/data/random";

const HISTORY_DAYS = 400;
const START_VALUE = 100000;

const dailySeries = walkSeries("portfolio-performance", HISTORY_DAYS, START_VALUE, 0.013);
const benchmarkSeries = walkSeries("benchmark-spx", HISTORY_DAYS, START_VALUE, 0.009);
const intradaySeries = walkSeries("portfolio-intraday", 48, dailySeries[dailySeries.length - 2], 0.004);

const RANGE_DAYS: Record<ChartRange, number> = {
  "1D": 0,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 182,
  "1Y": 365,
  ALL: HISTORY_DAYS,
};

export function getPortfolioPerformance(range: ChartRange): PricePoint[] {
  if (range === "1D") {
    const now = new Date();
    return intradaySeries.map((value, i) => {
      const date = new Date(now);
      date.setMinutes(date.getMinutes() - (intradaySeries.length - i) * 30);
      return { date: date.toISOString(), value, benchmark: value * 0.997 };
    });
  }

  const days = Math.min(RANGE_DAYS[range], HISTORY_DAYS);
  const slice = dailySeries.slice(HISTORY_DAYS - days);
  const benchSlice = benchmarkSeries.slice(HISTORY_DAYS - days);
  const today = new Date();

  return slice.map((value, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (slice.length - i));
    return { date: date.toISOString(), value, benchmark: benchSlice[i] };
  });
}

export const CURRENT_PORTFOLIO_VALUE = dailySeries[dailySeries.length - 1];
export const PREVIOUS_CLOSE_VALUE = dailySeries[dailySeries.length - 2];
export const TODAY_CHANGE_PERCENT = ((CURRENT_PORTFOLIO_VALUE - PREVIOUS_CLOSE_VALUE) / PREVIOUS_CLOSE_VALUE) * 100;
export const PRACTICE_BALANCE = 0;

export const ALLOCATION: AllocationSlice[] = [
  { label: "Stocks", percent: 42, colorVar: "var(--color-chart-1)" },
  { label: "ETFs", percent: 20, colorVar: "var(--color-chart-2)" },
  { label: "Crypto", percent: 15, colorVar: "var(--color-chart-3)" },
  { label: "Bonds", percent: 13, colorVar: "var(--color-chart-4)" },
  { label: "Cash", percent: 10, colorVar: "var(--color-chart-5)" },
];

export const DEMO_POSITIONS: PortfolioPosition[] = [
  { symbol: "AAPL", quantity: 42, avgCost: 198.4, currentPrice: 227 },
  { symbol: "NVDA", quantity: 68, avgCost: 108.2, currentPrice: 134 },
  { symbol: "MSFT", quantity: 24, avgCost: 389.1, currentPrice: 421 },
  { symbol: "SPY", quantity: 30, avgCost: 512.6, currentPrice: 561 },
  { symbol: "BTC", quantity: 0.42, avgCost: 58900, currentPrice: 64200 },
  { symbol: "ETH", quantity: 3.1, avgCost: 2890, currentPrice: 3180 },
  { symbol: "GLD", quantity: 40, avgCost: 214.5, currentPrice: 232 },
  { symbol: "AGG", quantity: 120, avgCost: 99.8, currentPrice: 98 },
];
