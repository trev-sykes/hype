import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useTokenStore } from '../store/allTokensStore';
import { fetchMetaDataFromBlockchain } from '../lib/metadata/fetchMetadata';
import { fetchTokenIds } from '../lib/metadata/fetchTokenIds';
import { sanitizeTokensForStorage, toStringOrNull } from '../utils/sanitizeTokenForStorage';
import { convertToIpfsUrl } from '../utils/ipfs';
import { calculateTokenPrice } from '../utils/calculateTokenPrice';
import { enrichTokens } from '../utils/enrichTokens';

const REFRESH_INTERVAL_MS = 60 * 60 * 10000; // 1 hour

async function fetchImageUrlFromUri(uri: string): Promise<string | null> {
    try {
        // Convert ipfs:// URI to HTTP URL (your existing util)
        const url = convertToIpfsUrl(uri);
        const response = await fetch(url);
        if (!response.ok) {
            console.warn('Failed to fetch metadata JSON from:', url);
            return null;
        }
        const metadata = await response.json();
        if (metadata.image) {
            return convertToIpfsUrl(metadata.image);
        }
        return null;
    } catch (error) {
        console.error('Error fetching image URL from metadata URI:', error);
        return null;
    }
}



export function useTokensRefresh(tokenId?: string) {
    const { tokens, hydrated, setTokens, clearTokens } = useTokenStore();
    const isFetchingRef = useRef(false);
    const [loading, setLoading] = useState(false);

    const shouldFetchInitial = !isFetchingRef && hydrated && tokens.length === 0 && !tokenId;

    const fetchStaticMetadata = useCallback(async (source = "unknown") => {
        console.log(`[${source}] Starting metadata fetch...`);
        if (isFetchingRef.current) {
            console.log(`[${source}] Fetch already in progress, skipping.`);
            return;
        }

        isFetchingRef.current = true;
        setLoading(true);

        try {
            console.log(`[${source}] Fetching token IDs...`);
            const tokenIds = await fetchTokenIds();
            console.log(`[${source}] Token IDs fetched:`, tokenIds);

            console.log(`[${source}] Fetching metadata from blockchain...`);
            const rawMetadata = await fetchMetaDataFromBlockchain(0, tokenIds.length);
            console.log(`[${source}] Raw metadata fetched:`, rawMetadata);

            console.log(`[${source}] Mapping and transforming token data...`);
            const formattedTokens = await Promise.all(
                rawMetadata.map(async (token: any, index: number) => {
                    const basePrice = toStringOrNull(token.basePrice);
                    const slope = toStringOrNull(token.slope);
                    const totalSupply = toStringOrNull(token.totalSupply);

                    const price = calculateTokenPrice(token.basePrice?.toString(), slope, totalSupply);

                    let imageUrl = token.image ? convertToIpfsUrl(token.image) : null;

                    // If no image URL from token.image, try fetching from URI metadata JSON
                    if (!imageUrl && token.uri) {
                        imageUrl = await fetchImageUrlFromUri(token.uri);
                    }

                    return {
                        tokenId: token.tokenId.toString(),
                        name: token.name,
                        symbol: token.symbol,
                        blockTimestamp: token.blockTimestamp,
                        uri: token.uri ?? null,
                        description: token.description ?? null,
                        imageUrl,
                        basePrice,
                        slope,
                        reserve: toStringOrNull(token.reserve),
                        totalSupply,
                        price,
                        percentChange: token.percentChange ?? null,
                        priceLastFetchedAt: Date.now(),
                        needsPriceUpdate: false,
                    };
                })
            );

            console.log(`[${source}] Enriching tokens...`);
            const enrichedTokens: any = await enrichTokens(tokens, formattedTokens, rawMetadata, setTokens);

            console.log(`[${source}] Sanitizing tokens...`);
            const sanitizedTokens: any = sanitizeTokensForStorage(enrichedTokens);

            console.log(`[${source}] Setting tokens to store...`);
            setTokens(sanitizedTokens);

        } catch (error) {
            console.warn(`[${source}] Issue fetching static metadata:`, error);
        } finally {
            isFetchingRef.current = false;
            setLoading(false);
            console.log(`[${source}] Metadata fetch complete.`);
        }
    }, [setTokens, tokens]);

    // Initial fetch if empty
    useEffect(() => {
        if (shouldFetchInitial) {
            fetchStaticMetadata("initial fetch");
        }
    }, [shouldFetchInitial, fetchStaticMetadata]);

    // Background refetch every interval
    useEffect(() => {
        const interval = setInterval(() => {
            if (hydrated && !tokenId) {
                fetchStaticMetadata("interval refresh from useTokensRefresh");
            }
        }, REFRESH_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [hydrated, tokenId, fetchStaticMetadata]);

    // Token filtering if tokenId is provided
    const filteredTokens = useMemo(() => {
        if (!tokenId) return tokens;
        return tokens.filter(t => t.tokenId === tokenId);
    }, [tokens, tokenId]);

    return {
        tokens: filteredTokens,
        loading,
        clearTokens,
        fetchStaticMetadata,
    };
}
