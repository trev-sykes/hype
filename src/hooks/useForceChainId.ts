// useEnforceChain.ts
import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useSwitchChain } from 'wagmi'

export function useEnforceChain(requiredChainId: 1) {
    const { isConnected, chainId } = useAccount()
    const { chains, switchChain, error } = useSwitchChain()

    useEffect(() => {
        if (!isConnected || chainId === undefined) return

        if (chainId !== requiredChainId) {
            switchChain({ chainId: requiredChainId })
        }
    }, [isConnected, chainId, requiredChainId, switchChain])

    return {
        isCorrectChain: chainId === requiredChainId,
        error,
        availableChains: chains,
    }
}

