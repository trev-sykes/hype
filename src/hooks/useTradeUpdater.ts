import { useTradeStore } from '../store/tradeStore';
import { useEffect } from 'react';
import request, { gql } from 'graphql-request';
import type { Trade } from '../types/trade';

const url = import.meta.env.VITE_GRAPHQL_URL;
const headers = { Authorization: 'Bearer {api-key}' };

const INCREMENTAL_QUERY = gql`
  query GetNewTrades($since: Int!) {
    burneds(where: { blockTimestamp_gt: $since }) {
      id
      tokenId
      amount
      refund
      blockTimestamp
    }
    minteds(where: { blockTimestamp_gt: $since }) {
      id
      tokenId
      amount
      cost
      blockTimestamp
    }
  }
`;

function parseTrades(data: any): Trade[] {
    const WEI_IN_ETH = 1e18;
    const mints = data.minteds.map((m: any) => {
        const cost = Number(m.cost ?? 0);
        const amount = Number(m.amount || 1);
        return {
            tokenId: BigInt(m.tokenId).toString(),
            amount: BigInt(m.amount).toString(),
            cost: BigInt(cost).toString(),
            price: (cost / WEI_IN_ETH) / amount,
            timestamp: Number(m.blockTimestamp ?? 0),
            type: 'mint',
        };
    });

    const burns = data.burneds.map((b: any) => {
        const refund = Number(b.refund ?? 0);
        const amount = Number(b.amount || 1);
        return {
            tokenId: BigInt(b.tokenId).toString(),
            amount: BigInt(b.amount).toString(),
            cost: BigInt(refund).toString(),
            price: (refund / WEI_IN_ETH) / amount,
            timestamp: Number(b.blockTimestamp ?? 0),
            type: 'burn',
        };
    });

    return [...mints, ...burns].sort((a, b) => a.timestamp - b.timestamp);
}

export function useTradeUpdater() {
    const appendTrade = useTradeStore((s) => s.appendTrade);
    const getLatestTimestamp = useTradeStore((s) => s.getLatestTimestamp);

    useEffect(() => {
        const interval = setInterval(async () => {
            const since = Number(getLatestTimestamp('all'));
            const now = Math.floor(Date.now() / 1000); // current UNIX timestamp in seconds

            // console.log(`[TradeUpdater] Checking for new trades since timestamp: ${since}, current time: ${now}`);

            if (since >= now) {
                // console.log('[TradeUpdater] No new trades expected, skipping fetch.');
                return;
            }

            try {
                // console.log('[TradeUpdater] Fetching new trades from GraphQL API...');
                const result = await request(url, INCREMENTAL_QUERY, { since }, headers);
                const newTrades = parseTrades(result);

                if (newTrades.length > 0) {
                    // console.log(`[TradeUpdater] Received ${newTrades.length} new trades, updating store...`);
                    newTrades.forEach((trade) => {
                        appendTrade('all', trade);
                    });
                } else {
                    // console.log('[TradeUpdater] No new trades returned from API.');
                }
            } catch (e) {
                console.error('[TradeUpdater] Error fetching new trades', e);
            }
        }, 10_000); // every 10 seconds

        return () => clearInterval(interval);
    }, []);
}
