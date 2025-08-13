export function convertToIpfsUrl(uri: string, gateway = 'https://ipfs.io/ipfs/') {
    // console.log('[convertToIpfsUrl] Received URI:', uri);
    if (!uri) {
        console.warn('[convertToIpfsUrl] URI is null or undefined');
        return null;
    }

    let hash = uri;

    if (uri.startsWith('ipfs://')) {
        hash = uri.slice(7);
        // console.log('[convertToIpfsUrl] Removed ipfs:// prefix:', hash);
    }
    if (hash.startsWith('ipfs/')) {
        hash = hash.slice(5);
        // console.log('[convertToIpfsUrl] Removed ipfs/ prefix:', hash);
    }

    const fullUrl = `${gateway}${hash}`;
    // console.log('[convertToIpfsUrl] Constructed URL:', fullUrl);
    return fullUrl;
}

export const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
];

export function extractCid(uri: string): string {
    // console.log('[extractCid] Extracting CID from:', uri);
    const cid = uri
        .replace(/^ipfs:\/\/ipfs\//, '')
        .replace(/^ipfs:\/\//, '')
        .replace(/^ipfs\//, '')
        .replace(/^https?:\/\/[^/]+\/ipfs\//, '');
    // console.log('[extractCid] Extracted CID:', cid);
    return cid;
}

function fetchWithTimeout(resource: string, options = {}, timeout = 15000) {
    // console.log('[fetchWithTimeout] Fetching:', resource, 'with timeout:', timeout);
    return new Promise<Response>((resolve, reject) => {
        const controller = new AbortController();
        const id = setTimeout(() => {
            controller.abort();
            console.warn('[fetchWithTimeout] Request timed out:', resource);
        }, timeout);

        fetch(resource, { ...options, signal: controller.signal })
            .then(resolve)
            .catch(reject)
            .finally(() => clearTimeout(id));
    });
}

async function fetchWithBackoff(url: string, retries = 3, delay = 1000, timeout = 5000): Promise<Response> {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            // console.log(`[fetchWithBackoff] Attempt ${attempt + 1} to fetch: ${url}`);
            const res = await fetchWithTimeout(url, { cache: "no-store" }, timeout);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            // console.log(`[fetchWithBackoff] Success on attempt ${attempt + 1} for ${url}`);
            return res;
        } catch (err: any) {
            console.warn(`[fetchWithBackoff] Attempt ${attempt + 1} failed for ${url}:`, err.message);
            if (attempt === retries - 1) {
                console.error('[fetchWithBackoff] All attempts failed. Throwing error.');
                throw err;
            }
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
        }
    }
    throw new Error('[fetchWithBackoff] Reached unreachable code');
}

export async function fetchIpfsMetadata(uri: string): Promise<any | null> {
    // console.log('[fetchIpfsMetadata] Fetching metadata for URI:', uri);
    const cid = extractCid(uri);
    const cacheKey = `ipfs_${cid}`;

    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            // console.log('[fetchIpfsMetadata] Found cached data for:', cacheKey);
            try {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.image) {
                    // console.log('[fetchIpfsMetadata] Returning cached metadata');
                    return parsed;
                } else {
                    console.warn('[fetchIpfsMetadata] Cached data is invalid or missing image field');
                }
            } catch (err: any) {
                console.warn('[fetchIpfsMetadata] Error parsing cache:', err.message);
            }
        }
    } catch (err: any) {
        console.warn('[fetchIpfsMetadata] Error accessing localStorage:', err.message);
    }

    for (const gateway of IPFS_GATEWAYS) {
        const url = `${gateway}${cid}`;
        // console.log('[fetchIpfsMetadata] Trying gateway:', gateway);
        try {
            const res = await fetchWithBackoff(url);
            const json = await res.json();
            // console.log('[fetchIpfsMetadata] Received response JSON:', json);

            if (json && json.image) {
                // console.log('[fetchIpfsMetadata] Metadata has image. Caching and returning.');
                localStorage.setItem(cacheKey, JSON.stringify(json));
                return json;
            } else {
                console.warn('[fetchIpfsMetadata] Metadata missing image field:', json);
            }
        } catch (err: any) {
            console.warn(`[fetchIpfsMetadata] Error fetching from ${gateway}:`, err.message);
        }
    }

    console.warn('[fetchIpfsMetadata] All gateways failed. Returning null.');
    return null;
}
