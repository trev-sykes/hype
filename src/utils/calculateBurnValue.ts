/**
 * Calculate ETH value of burning `amount` tokens at current `totalSupply`
 * Based on the bonding curve formula from Solidity contract:
 * value = amount * BASE_PRICE + SLOPE * (amount * (totalSupply - 1) - (amount * (amount - 1)) / 2)
 */
const BASE_PRICE = 1e-6; // 0.000001 ETH, from contract (1e12 wei = 1e-6 ETH)
const SLOPE = 0.0000005; // 5e-7 ETH

export function calculateBurnValue(amount: number, totalSupply: number): number {
    if (amount === 0 || totalSupply === 0 || amount > totalSupply) return 0;

    // Apply formula carefully
    const part1 = amount * BASE_PRICE;
    const part2 = SLOPE * (amount * (totalSupply - 1) - (amount * (amount - 1)) / 2);

    return part1 + part2;
}
