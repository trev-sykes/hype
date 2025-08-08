import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
    chains: [mainnet],
    connectors: [
        injected(),
        walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
    ],
    transports: {
        [mainnet.id]: http(),
    },

})

declare module 'wagmi' {
    interface Register {
        config: typeof config
    }
}
