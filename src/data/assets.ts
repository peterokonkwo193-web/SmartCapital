import type { Asset, AssetCategory } from "@/types";
import { mulberry32, walkSeries } from "@/data/random";

interface AssetSeed {
  symbol: string;
  name: string;
  category: AssetCategory;
  basePrice: number;
  volatility: number;
  sector?: string;
  description: string;
  riskLevel: Asset["riskLevel"];
}

const SEEDS: AssetSeed[] = [
  // Stocks
  { symbol: "AAPL", name: "Apple Inc.", category: "stocks", basePrice: 227, volatility: 0.018, sector: "Technology", riskLevel: "Moderate", description: "Designs and sells consumer electronics, software, and digital services, including the iPhone, Mac, and App Store ecosystem." },
  { symbol: "MSFT", name: "Microsoft Corp.", category: "stocks", basePrice: 421, volatility: 0.016, sector: "Technology", riskLevel: "Moderate", description: "Develops enterprise software, cloud infrastructure (Azure), and productivity platforms including Windows and Microsoft 365." },
  { symbol: "GOOGL", name: "Alphabet Inc.", category: "stocks", basePrice: 172, volatility: 0.02, sector: "Technology", riskLevel: "Moderate", description: "Parent company of Google, operating search, advertising, cloud computing, and consumer hardware businesses." },
  { symbol: "AMZN", name: "Amazon.com Inc.", category: "stocks", basePrice: 186, volatility: 0.022, sector: "Consumer Discretionary", riskLevel: "Moderate", description: "Operates global e-commerce marketplaces alongside AWS cloud infrastructure and logistics services." },
  { symbol: "NVDA", name: "NVIDIA Corp.", category: "stocks", basePrice: 134, volatility: 0.032, sector: "Technology", riskLevel: "High", description: "Designs graphics processors and AI accelerator chips used in gaming, data centers, and machine learning workloads." },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", category: "stocks", basePrice: 218, volatility: 0.015, sector: "Financials", riskLevel: "Moderate", description: "Global financial services firm offering investment banking, asset management, and consumer banking." },
  { symbol: "JNJ", name: "Johnson & Johnson", category: "stocks", basePrice: 156, volatility: 0.011, sector: "Healthcare", riskLevel: "Low", description: "Diversified healthcare company producing pharmaceuticals and medical devices." },
  { symbol: "XOM", name: "Exxon Mobil Corp.", category: "stocks", basePrice: 118, volatility: 0.019, sector: "Energy", riskLevel: "Moderate", description: "Integrated energy company engaged in oil and gas exploration, refining, and chemical manufacturing." },
  { symbol: "TSLA", name: "Tesla Inc.", category: "stocks", basePrice: 248, volatility: 0.038, sector: "Consumer Discretionary", riskLevel: "Very High", description: "Manufactures electric vehicles, battery storage systems, and solar energy products." },
  { symbol: "PG", name: "Procter & Gamble Co.", category: "stocks", basePrice: 168, volatility: 0.01, sector: "Consumer Staples", riskLevel: "Low", description: "Consumer packaged-goods company producing household, personal care, and hygiene brands." },

  // Crypto
  { symbol: "BTC", name: "Bitcoin", category: "crypto", basePrice: 64200, volatility: 0.035, riskLevel: "Very High", description: "The first and largest cryptocurrency by market capitalization, operating on a decentralized proof-of-work network." },
  { symbol: "ETH", name: "Ethereum", category: "crypto", basePrice: 3180, volatility: 0.04, riskLevel: "Very High", description: "A programmable blockchain network supporting smart contracts and decentralized applications." },
  { symbol: "SOL", name: "Solana", category: "crypto", basePrice: 142, volatility: 0.055, riskLevel: "Very High", description: "A high-throughput blockchain platform designed for decentralized apps and marketplaces." },
  { symbol: "BNB", name: "BNB", category: "crypto", basePrice: 578, volatility: 0.04, riskLevel: "Very High", description: "Native token of the BNB Chain ecosystem, used for transaction fees and platform utility." },
  { symbol: "XRP", name: "XRP", category: "crypto", basePrice: 0.58, volatility: 0.05, riskLevel: "Very High", description: "Digital asset used on a payment network designed for fast cross-border settlement." },
  { symbol: "ADA", name: "Cardano", category: "crypto", basePrice: 0.44, volatility: 0.048, riskLevel: "Very High", description: "A proof-of-stake blockchain platform focused on peer-reviewed protocol development." },
  { symbol: "DOGE", name: "Dogecoin", category: "crypto", basePrice: 0.14, volatility: 0.065, riskLevel: "Very High", description: "A peer-to-peer digital currency that originated as an internet meme and is used for tipping and payments." },
  { symbol: "AVAX", name: "Avalanche", category: "crypto", basePrice: 27, volatility: 0.058, riskLevel: "Very High", description: "A layer-1 blockchain platform supporting custom, interoperable subnetworks." },

  // ETFs
  { symbol: "SPY", name: "SPDR S&P 500 ETF", category: "etfs", basePrice: 561, volatility: 0.012, riskLevel: "Moderate", description: "Tracks the S&P 500 Index, offering diversified exposure to large-cap U.S. equities." },
  { symbol: "QQQ", name: "Invesco QQQ Trust", category: "etfs", basePrice: 481, volatility: 0.017, riskLevel: "Moderate", description: "Tracks the Nasdaq-100 Index, concentrated in large-cap technology and growth companies." },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", category: "etfs", basePrice: 274, volatility: 0.012, riskLevel: "Moderate", description: "Provides exposure to the entire U.S. equity market across large, mid, and small-cap stocks." },
  { symbol: "AGG", name: "iShares Core U.S. Aggregate Bond ETF", category: "etfs", basePrice: 98, volatility: 0.004, riskLevel: "Low", description: "Tracks a broad index of investment-grade U.S. bonds, offering fixed-income diversification." },
  { symbol: "GLD", name: "SPDR Gold Shares", category: "etfs", basePrice: 232, volatility: 0.011, riskLevel: "Moderate", description: "Designed to track the price of gold bullion, offering exposure without physical storage." },
  { symbol: "VNQ", name: "Vanguard Real Estate ETF", category: "etfs", basePrice: 92, volatility: 0.015, riskLevel: "Moderate", description: "Provides exposure to U.S. real estate investment trusts (REITs) across property sectors." },

  // Commodities
  { symbol: "XAU", name: "Gold", category: "commodities", basePrice: 2415, volatility: 0.011, riskLevel: "Moderate", description: "Precious metal widely held as a store of value and hedge against inflation and currency risk." },
  { symbol: "XAG", name: "Silver", category: "commodities", basePrice: 28.4, volatility: 0.021, riskLevel: "High", description: "Precious and industrial metal used in electronics, solar panels, and as an investment asset." },
  { symbol: "WTI", name: "Crude Oil (WTI)", category: "commodities", basePrice: 78.6, volatility: 0.024, riskLevel: "High", description: "Benchmark price for U.S. light sweet crude oil, sensitive to global supply and demand shifts." },
  { symbol: "NG", name: "Natural Gas", category: "commodities", basePrice: 2.31, volatility: 0.033, riskLevel: "High", description: "Benchmark price for U.S. natural gas, used for heating, electricity generation, and industry." },
  { symbol: "HG", name: "Copper", category: "commodities", basePrice: 4.42, volatility: 0.019, riskLevel: "High", description: "Industrial metal used broadly in construction and electronics, often viewed as an economic bellwether." },

  // Indices
  { symbol: "SPX", name: "S&P 500", category: "indices", basePrice: 5580, volatility: 0.011, riskLevel: "Moderate", description: "Tracks 500 of the largest publicly traded U.S. companies, widely used as a benchmark for the broad market." },
  { symbol: "IXIC", name: "NASDAQ Composite", category: "indices", basePrice: 17800, volatility: 0.015, riskLevel: "Moderate", description: "Tracks nearly all stocks listed on the Nasdaq exchange, weighted toward technology companies." },
  { symbol: "DJI", name: "Dow Jones Industrial Average", category: "indices", basePrice: 40100, volatility: 0.01, riskLevel: "Moderate", description: "Price-weighted index tracking 30 large, established U.S. companies across industries." },
  { symbol: "RUT", name: "Russell 2000", category: "indices", basePrice: 2085, volatility: 0.017, riskLevel: "High", description: "Tracks 2,000 small-cap U.S. companies, often used as a gauge of domestic economic health." },
  { symbol: "VIX", name: "CBOE Volatility Index", category: "indices", basePrice: 14.2, volatility: 0.09, riskLevel: "Very High", description: "Measures the market's expectation of 30-day forward volatility derived from S&P 500 options pricing." },
];

function buildAsset(seed: AssetSeed): Asset {
  const series = walkSeries(seed.symbol, 90, seed.basePrice, seed.volatility);
  const price = series[series.length - 1];
  const prevDay = series[series.length - 2] ?? price;
  const changePercent24h = ((price - prevDay) / prevDay) * 100;
  const rand = mulberry32(`${seed.symbol}-meta`);
  const marketCap =
    seed.category === "commodities" || seed.category === "indices"
      ? 0
      : price * (5_000_000 + rand() * 2_000_000_000);
  const volume24h = price * (200_000 + rand() * 40_000_000);

  return {
    symbol: seed.symbol,
    name: seed.name,
    category: seed.category,
    price,
    changePercent24h,
    marketCap,
    volume24h,
    sparkline: series.slice(-24),
    sector: seed.sector,
    description: seed.description,
    riskLevel: seed.riskLevel,
  };
}

export const ASSETS: Asset[] = SEEDS.map(buildAsset);

export function getAssetBySymbol(symbol: string): Asset | undefined {
  return ASSETS.find((asset) => asset.symbol.toLowerCase() === symbol.toLowerCase());
}

export function getAssetsByCategory(category: AssetCategory | "all"): Asset[] {
  if (category === "all") return ASSETS;
  return ASSETS.filter((asset) => asset.category === category);
}

export function getAssetPriceHistory(symbol: string, points = 180): { date: string; value: number }[] {
  const seed = SEEDS.find((s) => s.symbol === symbol);
  const asset = getAssetBySymbol(symbol);
  if (!seed || !asset) return [];

  const series = walkSeries(`${symbol}-history`, points, seed.basePrice * 0.82, seed.volatility * 0.85);
  // Anchor the series to the asset's current live price so the chart's most
  // recent point matches the price shown elsewhere, preserving the walk's shape.
  const scale = asset.price / series[series.length - 1];
  const scaledSeries = series.map((value) => value * scale);

  const today = new Date();
  return scaledSeries.map((value, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (points - i));
    return { date: date.toISOString(), value };
  });
}

export const ASSET_MAP: Record<string, Asset> = Object.fromEntries(ASSETS.map((a) => [a.symbol, a]));

export function searchAssets(query: string): Asset[] {
  const q = query.trim().toLowerCase();
  if (!q) return ASSETS;
  return ASSETS.filter((a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
}

export type { AssetCategory } from "@/types";

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  stocks: "Stocks",
  crypto: "Crypto",
  etfs: "ETFs",
  commodities: "Commodities",
  indices: "Indices",
};

