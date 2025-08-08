export function calculateTokenPrice(basePrice: string | null | undefined, slope: string | null | undefined, totalSupply: string | null | undefined): number | null {
    try {
        if (!basePrice || !slope || !totalSupply) {
            console.warn("calculateTokenPrice: Missing input(s)", { basePrice, slope, totalSupply });
            return null;
        }

        // Validate that inputs can be converted to BigInt safely
        const base = BigInt(basePrice);
        const slopePerToken = BigInt(slope);
        const supply = BigInt(totalSupply);

        const priceWei = base + slopePerToken * supply;
        const priceEth = Number(priceWei) / 1e18;

        return priceEth;
    } catch (error) {
        console.warn("calculateTokenPrice: Error converting to BigInt or calculating price", error, { basePrice, slope, totalSupply });
        return null;
    }
}
