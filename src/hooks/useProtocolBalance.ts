import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

// Create a client for Ethereum mainnet
const client = createPublicClient({
    chain: mainnet,
    transport: http(),
})

export async function getEthBalance(address: `0x${string}`) {
    const balance = await client.getBalance({ address })
    return balance
}
