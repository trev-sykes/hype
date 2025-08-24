import type { Trade } from "../types/trade";

export function calculatePriceChange(trades: Trade[], tokenId: string, periodHours = 24) {
    if (!trades || !trades.length) return null;

    const tokenTrades = trades.filter((t: any) => t.tokenId === tokenId);
    // console.log(`[calculatePriceChange] tokenTrades for ${tokenId}:`, tokenTrades);

    if (!tokenTrades.length) return null;

    const now = Date.now() / 1000; // current timestamp in seconds
    const cutoff = now - periodHours * 60 * 60; // period in seconds
    // console.log(`[calculatePriceChange] now: ${now}, cutoff (${periodHours}h ago): ${cutoff}`);

    // Find the last trade before cutoff
    const oldTrade = [...tokenTrades].reverse().find(t => Number(t.timestamp) <= cutoff) || tokenTrades[0];
    // console.log(`[calculatePriceChange] oldTrade (before cutoff):`, oldTrade);

    // Most recent trade
    const latestTrade = tokenTrades[tokenTrades.length - 1];
    // console.log(`[calculatePriceChange] latestTrade:`, latestTrade);

    if (!oldTrade || !latestTrade) {
        // console.log(`[calculatePriceChange] Could not calculate change: missing old or latest trade`);
        return null;
    }

    const percentChange = ((latestTrade.price - oldTrade.price) / oldTrade.price) * 100;
    // console.log(`[calculatePriceChange] ${periodHours}h percentChange:`, percentChange);

    return percentChange;
}
