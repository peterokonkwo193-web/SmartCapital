import type { Asset, PaperOrder } from "@/types";

export interface PositionCalculation {
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  change24h: number;
  dailyValueChange: number;
}

export interface PortfolioSummary {
  cashBalance: number;
  positionsValue: number;
  totalPortfolioValue: number;
  totalCostBasis: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  totalRealizedPnL: number;
  dailyChangeAmount: number;
  dailyChangePercent: number;
  overallReturnPercent: number;
  openPositionsCount: number;
}

export const INITIAL_BALANCE = 0;

interface RunningLot {
  quantity: number;
  avgCost: number;
}

/**
 * Replays filled orders chronologically per symbol using average-cost accounting,
 * so open-position cost basis and realized P&L are always derived from the same
 * pass over the same data — never computed independently.
 */
function replayOrders(orders: PaperOrder[]): { lots: Map<string, RunningLot>; totalRealizedPnL: number } {
  const filledOrders = orders
    .filter((o) => o.status === "filled")
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const lots = new Map<string, RunningLot>();
  let totalRealizedPnL = 0;

  for (const order of filledOrders) {
    const lot = lots.get(order.symbol) ?? { quantity: 0, avgCost: 0 };

    if (order.side === "buy") {
      const newQuantity = lot.quantity + order.quantity;
      lot.avgCost = newQuantity > 0 ? (lot.quantity * lot.avgCost + order.quantity * order.price) / newQuantity : 0;
      lot.quantity = newQuantity;
    } else {
      const sellQuantity = Math.min(order.quantity, lot.quantity);
      totalRealizedPnL += sellQuantity * (order.price - lot.avgCost);
      lot.quantity = Math.max(0, lot.quantity - order.quantity);
      if (lot.quantity <= 0.000001) lot.avgCost = 0;
    }

    lots.set(order.symbol, lot);
  }

  return { lots, totalRealizedPnL };
}

/**
 * Calculates position level metrics based on filled orders and current asset market prices.
 */
export function calculatePositions(
  orders: PaperOrder[],
  assetMap: Map<string, Asset> | Record<string, Asset>,
): PositionCalculation[] {
  const { lots } = replayOrders(orders);

  const result: PositionCalculation[] = [];
  const getAsset = (sym: string): Asset | undefined =>
    assetMap instanceof Map ? assetMap.get(sym) : assetMap[sym];

  for (const [symbol, lot] of lots.entries()) {
    if (lot.quantity <= 0.000001) continue;

    const asset = getAsset(symbol);
    const currentPrice = asset?.price ?? lot.avgCost;
    const marketValue = lot.quantity * currentPrice;
    const totalCost = lot.quantity * lot.avgCost;
    const unrealizedPnL = marketValue - totalCost;
    const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;
    const change24h = asset?.changePercent24h ?? 0;
    const previousDayPrice = currentPrice / (1 + change24h / 100);
    const dailyValueChange = lot.quantity * (currentPrice - previousDayPrice);

    result.push({
      symbol,
      quantity: lot.quantity,
      avgCost: lot.avgCost,
      currentPrice,
      marketValue,
      totalCost,
      unrealizedPnL,
      unrealizedPnLPercent,
      change24h,
      dailyValueChange,
    });
  }

  return result;
}

/**
 * Calculates portfolio summary metrics given cash balance, orders, and current asset prices.
 */
export function calculatePortfolioSummary(
  cashBalance: number,
  orders: PaperOrder[],
  assetMap: Map<string, Asset> | Record<string, Asset>,
  initialDeposit: number = INITIAL_BALANCE,
): PortfolioSummary {
  const positions = calculatePositions(orders, assetMap);

  let positionsValue = 0;
  let totalCostBasis = 0;
  let totalUnrealizedPnL = 0;
  let dailyChangeAmount = 0;

  for (const pos of positions) {
    positionsValue += pos.marketValue;
    totalCostBasis += pos.totalCost;
    totalUnrealizedPnL += pos.unrealizedPnL;
    dailyChangeAmount += pos.dailyValueChange;
  }

  const { totalRealizedPnL } = replayOrders(orders);

  const totalPortfolioValue = cashBalance + positionsValue;
  const totalUnrealizedPnLPercent = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;
  const previousPortfolioValue = totalPortfolioValue - dailyChangeAmount;
  const dailyChangePercent = previousPortfolioValue > 0 ? (dailyChangeAmount / previousPortfolioValue) * 100 : 0;
  const overallReturnPercent = initialDeposit > 0 ? ((totalPortfolioValue - initialDeposit) / initialDeposit) * 100 : 0;

  return {
    cashBalance,
    positionsValue,
    totalPortfolioValue,
    totalCostBasis,
    totalUnrealizedPnL,
    totalUnrealizedPnLPercent,
    totalRealizedPnL,
    dailyChangeAmount,
    dailyChangePercent,
    overallReturnPercent,
    openPositionsCount: positions.length,
  };
}
