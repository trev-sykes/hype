
import { useAccount, useBalance, WagmiProvider } from 'wagmi'
import { config } from './wagmi'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import About from './pages/dashboard/about/About'
import DashboardLayout from './layout/dashboardLayout/DashboardLayout'
import { DashboardHome } from './pages/dashboard/dashboardHome/DashboardHome'
import CreateTokenForm from './pages/dashboard/create/CreateTokenForm'
import { ExploreGrid } from './pages/dashboard/explore/ExploreGrid'
import { TradePage } from './pages/dashboard/trade/TradePage'
import { CoinInfo } from './pages/dashboard/coinInfo/CoinInfo'
import { ScrollToTop } from './hooks/useScrollToTop'
import { useTradeUpdater } from './hooks/useTradeUpdater'
import { useTokenCreationUpdater } from './hooks/useNewTokenCreationUpdater'
import { useTokens } from './hooks/useTokens'
import { useUserTokenBalance } from './hooks/useUserBalance'
import { useAllTrades } from './hooks/useTokenActivity'
import { useTradeStore } from './store/tradeStore'
import { Portfolio } from './pages/dashboard/portfolio/Portfolio'
import { BuySell } from './pages/dashboard/buySell/BuySell'
import { useEffect } from 'react'
import { useTokenStore } from './store/allTokensStore'
import { useTokensRefresh } from './hooks/useTokensRefresh'
import { useTokenImageChecker } from './hooks/useTokenImageChecker'



export default function App() {
  useTradeUpdater();
  useTokenCreationUpdater();
  useTokenImageChecker()
  const queryClient = new QueryClient();
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <InnerApp />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function InnerApp() {
  const { tokens, fetchStaticMetadata, loading } = useTokensRefresh();
  const { fetchNextPage, hasNextPage, fetchAllPrices } = useTokens();
  const { setTokens } = useTokenStore();
  const trades = useAllTrades();
  const { setTrades } = useTradeStore();
  const { refetchBalance, tokenBalance }: any = useUserTokenBalance();
  const { address } = useAccount();
  const balance = useBalance({ address });
  useEffect(() => {
    setTrades('all', trades);
  }, [trades])
  useEffect(() => {
    setTokens(tokens);
  }, [tokens])
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* <Route path="/" element={<LandingPage />} /> */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardHome tokens={tokens} trades={trades} />} />
          <Route
            path="/account"
            element={
              <Portfolio
                tokens={tokens}
              />
            }
          />
          <Route
            path="/explore"
            element={
              <ExploreGrid
                tokens={tokens}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                loading={loading}
                fetchStaticMetadata={fetchStaticMetadata}
                fetchAllPrices={fetchAllPrices}
              />
            }
          />
          <Route path="/create" element={<CreateTokenForm />} />
          <Route path="/about" element={<About />} />
          <Route path='/trade/:tokenId' element={
            <BuySell
              balance={balance} />
          } />
          <Route path="/explore/:tokenId" element={<CoinInfo />} />
          <Route path="/explore/:tokenId/trade"
            element={
              <TradePage
                refetchBalance={refetchBalance}
                tokenBalance={tokenBalance}
                address={address}
                balance={balance}
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
