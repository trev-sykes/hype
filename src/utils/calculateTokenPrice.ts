import { BASE_PRICE, SLOPE } from "../constants";
export function calculateTokenPrice(totalSupply: string | null | undefined): number | null {
    try {
        if (!totalSupply) {
            console.warn("calculateTokenPrice: Missing input(s)", { totalSupply });
            return null;
        }

        // Validate that inputs can be converted to BigInt safely
        const base = BigInt(BASE_PRICE);
        const slopePerToken = BigInt(SLOPE);
        const supply = BigInt(totalSupply);

        const priceWei = base + slopePerToken * supply;
        const priceEth = Number(priceWei) / 1e18;

        return priceEth;
    } catch (error) {
        console.warn("calculateTokenPrice: Error converting to BigInt or calculating price", error, { BASE_PRICE, SLOPE, totalSupply });
        return null;
    }
}
