import type { EducationArticle } from "@/types";

export const EDUCATION_ARTICLES: EducationArticle[] = [
  {
    slug: "stocks",
    title: "Stocks",
    tagline: "Ownership stakes in publicly traded companies.",
    whatItIs:
      "A stock represents a share of ownership in a company. When you buy shares, you own a small piece of that business, including a claim on its future earnings and assets, proportional to how many shares you hold.",
    howItWorks: [
      "Companies issue shares to raise capital, either through an initial public offering (IPO) or subsequent offerings.",
      "Shares trade on exchanges (like the NYSE or Nasdaq), where buyers and sellers set prices through continuous bidding.",
      "Prices move based on company performance, industry trends, macroeconomic data, and overall investor sentiment.",
      "Some companies distribute a portion of profits to shareholders as dividends; others reinvest earnings into growth.",
    ],
    types: [
      { name: "Common Stock", description: "Standard shares with voting rights and variable dividends dependent on company performance." },
      { name: "Preferred Stock", description: "Shares with a fixed dividend and priority over common stock in the event of liquidation, but typically no voting rights." },
      { name: "Growth Stocks", description: "Shares in companies expected to grow revenue and earnings faster than the market average, often reinvesting profits instead of paying dividends." },
      { name: "Value Stocks", description: "Shares that appear inexpensive relative to fundamentals such as earnings or book value." },
      { name: "Dividend Stocks", description: "Shares in established companies that regularly distribute a portion of profits to shareholders." },
    ],
    benefits: [
      "Potential for capital appreciation as company value grows over time.",
      "Some stocks provide income through regular dividend payments.",
      "High liquidity — most exchange-listed shares can be bought or sold quickly during market hours.",
      "Partial ownership gives shareholders a claim on company assets and, for common stock, voting rights.",
    ],
    risks: [
      "Share prices can be volatile and may decline significantly over short periods.",
      "Company-specific risk: poor management decisions or weak earnings can permanently impair value.",
      "Market risk: broad downturns can affect even fundamentally strong companies.",
      "No guaranteed returns — unlike a savings account, stock investments can lose value, including the possibility of losing your entire investment.",
    ],
    terminology: [
      { term: "Market Capitalization", definition: "The total market value of a company's outstanding shares (share price × number of shares)." },
      { term: "P/E Ratio", definition: "Price-to-earnings ratio; a company's share price divided by its earnings per share, used to gauge relative valuation." },
      { term: "Dividend Yield", definition: "Annual dividend payments expressed as a percentage of the current share price." },
      { term: "Volatility", definition: "The degree and frequency with which an asset's price fluctuates over time." },
      { term: "Bull / Bear Market", definition: "Extended periods of generally rising (bull) or falling (bear) prices across the market." },
    ],
    considerations: [
      "Research is essential — understand a company's business model, financial health, and competitive position before investing.",
      "Diversification across sectors and company sizes can help reduce single-company risk.",
      "Time horizon matters — short-term trading carries different risks than long-term holding.",
      "Past performance does not guarantee future results.",
    ],
    faq: [
      { question: "Do I need a lot of money to start investing in stocks?", answer: "Many brokerages allow fractional share purchases, meaning you can start with a relatively small amount, though costs and minimums vary by platform." },
      { question: "How is a stock's price determined?", answer: "Prices are set continuously by supply and demand in the open market, influenced by earnings, news, macroeconomic conditions, and investor sentiment." },
      { question: "What's the difference between trading and investing?", answer: "Trading typically involves shorter holding periods aiming to profit from price movements, while investing generally involves longer holding periods based on a company's fundamentals." },
    ],
  },
  {
    slug: "crypto",
    title: "Cryptocurrency",
    tagline: "Digital assets built on decentralized blockchain networks.",
    whatItIs:
      "Cryptocurrency is a digital asset secured by cryptography and typically recorded on a distributed ledger called a blockchain. Unlike traditional currencies, most cryptocurrencies are not issued or backed by a central bank or government.",
    howItWorks: [
      "Transactions are verified and recorded by a distributed network of computers rather than a central authority.",
      "Most networks use a consensus mechanism (such as proof-of-work or proof-of-stake) to validate transactions and secure the ledger.",
      "Assets are held in digital wallets, controlled by private cryptographic keys — losing these keys typically means losing access to the funds.",
      "Prices are determined on exchanges through continuous global trading and are influenced heavily by sentiment, regulation, and liquidity.",
    ],
    types: [
      { name: "Store-of-Value Assets", description: "Assets like Bitcoin, often discussed as a potential hedge against inflation or currency debasement, though this remains debated among economists." },
      { name: "Smart Contract Platforms", description: "Blockchains such as Ethereum or Solana that support programmable applications beyond simple payments." },
      { name: "Stablecoins", description: "Tokens designed to maintain a stable value, typically pegged to a fiat currency like the U.S. dollar." },
      { name: "Utility Tokens", description: "Tokens that grant access to a specific platform's features, services, or fee discounts." },
    ],
    benefits: [
      "24/7 global market access without traditional exchange hours.",
      "Potential for significant appreciation during periods of strong adoption or demand.",
      "Programmable, transparent settlement enabled by blockchain infrastructure.",
      "Portfolio diversification, given historically low correlation with some traditional assets (though this can change during market stress).",
    ],
    risks: [
      "Extremely high volatility — prices can swing dramatically within hours or days.",
      "Regulatory uncertainty varies significantly by jurisdiction and can change quickly.",
      "Security risk: exchange hacks, scams, and lost private keys can result in permanent loss of funds.",
      "Many projects carry high failure risk, and some tokens have little to no underlying value or utility.",
    ],
    terminology: [
      { term: "Blockchain", definition: "A distributed, append-only ledger that records transactions across a network of computers." },
      { term: "Wallet", definition: "Software or hardware used to store the private keys that control access to crypto assets." },
      { term: "Market Cap", definition: "Circulating supply multiplied by current price — a common (though imperfect) measure of a crypto asset's size." },
      { term: "Gas Fee", definition: "A fee paid to network validators to process a transaction or smart contract execution." },
      { term: "Cold Storage", definition: "Keeping private keys offline, away from internet-connected devices, to reduce hacking risk." },
    ],
    considerations: [
      "Position sizing matters — given the volatility, many investors treat crypto as a smaller portion of a diversified portfolio.",
      "Understand custody — self-custody offers control but removes safety nets available with regulated custodians.",
      "Be cautious of guaranteed-return offers; legitimate crypto investments carry real, uncapped downside risk.",
      "Regulatory treatment (including taxation) differs by country and can change.",
    ],
    faq: [
      { question: "Is cryptocurrency legal?", answer: "Legal status varies by country and continues to evolve. Always confirm current regulations in your jurisdiction." },
      { question: "Can I lose more than I invest?", answer: "For spot holdings, losses are generally limited to your invested amount. Leveraged or margin crypto products can carry additional risk of loss beyond your initial investment." },
      { question: "What determines a cryptocurrency's price?", answer: "Prices are driven by supply and demand on exchanges, shaped by adoption trends, technological developments, regulation, and broader market sentiment." },
    ],
  },
  {
    slug: "bonds",
    title: "Bonds",
    tagline: "Debt instruments that pay investors fixed or variable interest.",
    whatItIs:
      "A bond is a loan made by an investor to a borrower — typically a government or corporation. In exchange, the issuer agrees to pay periodic interest (the coupon) and return the principal at a set maturity date.",
    howItWorks: [
      "An issuer sells bonds to raise capital, promising to repay the face value at maturity along with periodic interest payments.",
      "Bond prices move inversely to interest rates: when rates rise, existing bond prices generally fall, and vice versa.",
      "Credit rating agencies assess an issuer's ability to repay debt, which influences the interest rate the issuer must offer.",
      "Bonds can be held to maturity for predictable income or traded on secondary markets before maturity.",
    ],
    types: [
      { name: "Government Bonds", description: "Issued by national governments (such as U.S. Treasuries), generally considered among the lowest-risk fixed-income instruments." },
      { name: "Municipal Bonds", description: "Issued by state or local governments, often with tax advantages depending on jurisdiction." },
      { name: "Corporate Bonds", description: "Issued by companies to fund operations or expansion, with yields reflecting the issuer's credit risk." },
      { name: "High-Yield Bonds", description: "Corporate bonds with lower credit ratings that offer higher interest to compensate for greater default risk." },
    ],
    benefits: [
      "Generally lower volatility than equities, particularly for high-quality government and investment-grade bonds.",
      "Predictable income through scheduled interest payments.",
      "Can help diversify a portfolio and offset equity market volatility.",
      "Return of principal at maturity, assuming the issuer does not default.",
    ],
    risks: [
      "Interest rate risk — rising rates can reduce the market value of existing bonds.",
      "Credit/default risk — an issuer may fail to make interest or principal payments.",
      "Inflation risk — fixed payments can lose purchasing power over time if inflation rises.",
      "Liquidity risk — some bonds, especially corporate or municipal issues, can be harder to sell quickly at a fair price.",
    ],
    terminology: [
      { term: "Coupon Rate", definition: "The fixed annual interest rate a bond pays, expressed as a percentage of face value." },
      { term: "Yield to Maturity", definition: "The total return anticipated if a bond is held until it matures, accounting for price, coupon, and time." },
      { term: "Face Value", definition: "The amount the bond issuer agrees to repay the holder at maturity." },
      { term: "Duration", definition: "A measure of a bond's price sensitivity to changes in interest rates." },
      { term: "Credit Rating", definition: "An assessment (e.g., AAA to D) of an issuer's creditworthiness by rating agencies." },
    ],
    considerations: [
      "Match bond duration to your time horizon and liquidity needs.",
      "Diversify across issuers and credit qualities rather than concentrating in a single bond.",
      "Understand how rising or falling rate environments affect bond values before you invest.",
      "Higher yields typically signal higher risk — compare yield against credit quality, not in isolation.",
    ],
    faq: [
      { question: "Are bonds risk-free?", answer: "No investment is entirely risk-free. Government bonds from stable issuers are generally low-risk, but all bonds carry some interest rate, inflation, or credit risk." },
      { question: "Why do bond prices fall when interest rates rise?", answer: "Existing bonds with lower fixed coupons become less attractive compared to newly issued bonds at higher rates, so their market price adjusts downward." },
      { question: "What's the difference between yield and coupon rate?", answer: "The coupon rate is fixed at issuance, while yield reflects the bond's current return based on its market price, which can differ from face value." },
    ],
  },
  {
    slug: "etfs",
    title: "ETFs",
    tagline: "Exchange-traded funds that bundle many assets into one tradable share.",
    whatItIs:
      "An exchange-traded fund (ETF) is a pooled investment vehicle that holds a basket of assets — such as stocks, bonds, or commodities — and trades on an exchange throughout the day, similar to an individual stock.",
    howItWorks: [
      "An ETF provider assembles a portfolio of underlying assets, often designed to track a specific index or theme.",
      "Shares of the ETF are created and redeemed by authorized participants, which helps keep the ETF's market price aligned with its underlying asset value.",
      "Investors buy and sell ETF shares on an exchange during trading hours, at continuously updated prices.",
      "Most ETFs charge an annual expense ratio, deducted from fund assets, covering management and operational costs.",
    ],
    types: [
      { name: "Index ETFs", description: "Track a benchmark index, such as the S&P 500, offering broad, low-cost market exposure." },
      { name: "Sector ETFs", description: "Focus on a specific industry or sector, such as technology, energy, or healthcare." },
      { name: "Bond ETFs", description: "Hold a diversified basket of fixed-income securities, offering bond exposure with stock-like tradability." },
      { name: "Commodity ETFs", description: "Track the price of a commodity or basket of commodities, such as gold or oil, often via futures contracts or physical holdings." },
      { name: "Thematic ETFs", description: "Concentrate on a specific investment theme or trend, such as clean energy or automation." },
    ],
    benefits: [
      "Instant diversification across many holdings in a single trade.",
      "Generally lower expense ratios compared to actively managed mutual funds.",
      "Intraday liquidity — shares trade throughout market hours, unlike traditional mutual funds priced once daily.",
      "Transparency — most ETFs disclose their holdings on a regular, often daily, basis.",
    ],
    risks: [
      "Market risk — an ETF's value moves with its underlying holdings, so broad declines still affect the fund.",
      "Tracking error — a fund's performance may deviate slightly from its stated benchmark.",
      "Concentration risk — sector or thematic ETFs can be more volatile due to narrower diversification.",
      "Liquidity of the underlying assets can affect trading costs, particularly for niche or lower-volume ETFs.",
    ],
    terminology: [
      { term: "Expense Ratio", definition: "The annual fee, expressed as a percentage of assets, charged by the fund to cover management costs." },
      { term: "NAV", definition: "Net Asset Value — the per-share value of the fund's underlying holdings." },
      { term: "Tracking Error", definition: "The difference between an ETF's performance and that of its target index." },
      { term: "Creation/Redemption", definition: "The process authorized participants use to create or redeem ETF shares, helping keep market price aligned with NAV." },
      { term: "AUM", definition: "Assets Under Management — the total market value of assets a fund holds." },
    ],
    considerations: [
      "Check what index or strategy an ETF tracks — similarly named funds can have different underlying methodologies.",
      "Compare expense ratios; small differences compound significantly over long holding periods.",
      "Watch trading volume and bid-ask spreads, especially for niche or lower-liquidity ETFs.",
      "An ETF's diversification reduces single-holding risk but does not eliminate overall market risk.",
    ],
    faq: [
      { question: "How are ETFs different from mutual funds?", answer: "ETFs trade throughout the day on exchanges at market-determined prices, while traditional mutual funds are priced and traded once per day at their end-of-day NAV." },
      { question: "Do ETFs pay dividends?", answer: "Many ETFs pass through dividends or interest earned by their underlying holdings, typically distributed periodically to shareholders." },
      { question: "Can an ETF's price differ from its underlying holdings' value?", answer: "Temporary discrepancies can occur, but the creation/redemption mechanism generally keeps market price close to net asset value." },
    ],
  },
];

export function getEducationArticle(slug: string): EducationArticle | undefined {
  return EDUCATION_ARTICLES.find((article) => article.slug === slug);
}
