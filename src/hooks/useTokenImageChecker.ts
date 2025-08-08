import { useEffect, useRef } from 'react';
import { useTokenStore } from '../store/allTokensStore';
import { convertToIpfsUrl, extractCid, IPFS_GATEWAYS } from '../utils/ipfs';
import { fetchMetaDataFromBlockchain } from '../lib/metadata/fetchMetadata';

const THROTTLE_MS = 10000; // 10 seconds

async function fetchImageUrlFromUri(uri: string): Promise<string | null> {
    if (!uri) return null;

    const cid = extractCid(uri);
    const cacheKey = `ipfs_image_${cid}`;

    // Try cached imageUrl first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed?.imageUrl) {
                console.log('[IPFS CACHE] Using cached imageUrl for:', cid);
                return parsed.imageUrl;
            }
        } catch (e) {
            console.warn('[IPFS CACHE] Failed to parse cached data:', e);
        }
    }

    // Try all IPFS gateways one by one
    for (const gateway of IPFS_GATEWAYS) {
        const url = `${gateway}${cid}`;
        try {
            console.log(`[IPFS FETCH] Trying URL: ${url}`);
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) {
                console.warn(`[IPFS FETCH] Non-OK status ${res.status} from ${url}`);
                continue;
            }

            const metadata = await res.json();
            if (metadata?.image) {
                // Convert image URI to full gateway URL
                const imageUrl = convertToIpfsUrl(metadata.image, gateway);
                console.log(`[IPFS FETCH] Found image for CID ${cid}: ${imageUrl}`);

                // Cache image URL
                localStorage.setItem(cacheKey, JSON.stringify({ imageUrl }));

                return imageUrl;
            } else {
                console.warn(`[IPFS FETCH] No image field in metadata from ${url}`);
            }
        } catch (err: any) {
            console.warn(`[IPFS FETCH] Fetch error from ${url}:`, err.message);
        }
    }

    console.warn(`[IPFS FETCH] All gateways failed for CID: ${cid}`);
    return null;
}

export function useTokenImageChecker() {
    const { tokens, setTokens } = useTokenStore();
    const lastRunRef = useRef<number>(0);
    const processingRef = useRef<boolean>(false);

    useEffect(() => {
        const updateTokens = async () => {
            const now = Date.now();

            if (processingRef.current) {
                console.log('⏳ Already processing, skipping this run.');
                return;
            }

            if (now - lastRunRef.current < THROTTLE_MS) {
                console.log('⏱️ Throttled. Skipping run.');
                return;
            }

            processingRef.current = true;
            lastRunRef.current = now;

            // Step 1: Fix tokens that have URI but missing imageUrl
            const tokensWithUriMissingImage = tokens.filter(
                token => typeof token.uri === 'string' && token.uri.trim() !== '' && !token.imageUrl
            );

            console.log(`🔍 Found ${tokensWithUriMissingImage.length} tokens missing imageUrl with valid URI.`);

            const tokensAfterImageFix = await Promise.all(
                tokens.map(async token => {
                    if (token.uri && !token.imageUrl) {
                        const imageUrl = await fetchImageUrlFromUri(token.uri);
                        if (imageUrl) {
                            console.log(`✅ Updated imageUrl for token ${token.tokenId}`);
                            return { ...token, imageUrl };
                        } else {
                            console.warn(`⚠️ Failed to update imageUrl from URI for token ${token.tokenId}`);
                        }
                    }
                    return token;
                })
            );

            // Step 2: Fix tokens missing both uri and imageUrl
            const tokensMissingUri = tokensAfterImageFix.filter(
                token => !token.uri && !token.imageUrl
            );

            console.log(`🧵 Found ${tokensMissingUri.length} tokens missing both uri and imageUrl.`);

            if (tokensMissingUri.length > 0) {
                try {
                    const rawMetadata = await fetchMetaDataFromBlockchain(0, tokens.length);
                    console.log(`📦 Fetched ${rawMetadata.length} raw metadata entries.`);

                    const tokensAfterMetadataFix = tokensAfterImageFix.map(token => {
                        if (!token.uri && !token.imageUrl) {
                            const refreshed = rawMetadata.find(
                                (m: any) => m.tokenId.toString() === token.tokenId
                            );

                            if (refreshed) {
                                const newUri = refreshed.uri ?? null;
                                const newImage = refreshed.image ? convertToIpfsUrl(refreshed.image) : null;

                                console.log(`🔁 Refreshed token ${token.tokenId} — uri: ${!!newUri}, image: ${!!newImage}`);

                                return {
                                    ...token,
                                    uri: newUri,
                                    imageUrl: newImage,
                                };
                            }
                        }
                        return token;
                    });

                    setTokens(tokensAfterMetadataFix);
                } catch (err) {
                    console.error('❌ Error refetching metadata for missing-uri tokens:', err);
                    setTokens(tokensAfterImageFix); // fallback to first stage if step 2 fails
                }
            } else {
                setTokens(tokensAfterImageFix); // no second-stage fix needed
            }

            processingRef.current = false;
        };

        if (tokens.length > 0) {
            updateTokens();
        }
    }, [tokens, setTokens]);
}
