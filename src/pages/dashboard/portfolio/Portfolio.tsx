import React, { useState } from 'react';
import type { Token } from '../../../types/token';
import { useUserTokenBalances } from '../../../hooks/useUserBalances';
import { useBalanceStore } from '../../../store/balancesStore';
import { PortfolioBalanceCard } from '../../../components/portfolioBalanceCard/PortfolioBalanceCard';
import styles from './Portfolio.module.css';
import { useWidth } from '../../../hooks/useWidth';
import { ScrollToTopButton } from '../../../components/button/scrollToTop/ScrollToTopButton';
import Logo from '../../../components/logo/Logo';

interface MyPortfolioProps {
    tokens: Token[];
    ethPrice: any;
}

const valueOfTokens = (totalSupply: any, balance: any) => {
    const basePrice = 0.000001;
    const slope = 0.0000005;

    // Refund formula for burning `balance` tokens from current supply `supply`
    const value = balance * basePrice + (slope * balance * (2 * totalSupply - balance - 1)) / 2;
    return value;
}


export const Portfolio: React.FC<MyPortfolioProps> = ({ tokens, ethPrice }) => {
    const [sortBy, setSortBy] = useState<'value' | 'balance' | 'name'>('value');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const width = useWidth();
    const tokenIds = tokens.map((t) => t.tokenId);
    const { balances, loading, error, refetch } = useUserTokenBalances(tokens, tokenIds);
    const hydrated = useBalanceStore((s) => s.hydrated);
    const portfolioTokens = balances
        .filter((b) => b.balance && b.balance > 0)
        .map((b) => ({ ...b, ...tokens.find((t) => t.tokenId === b.tokenId) }))
        .sort((a, b) => {
            switch (sortBy) {
                case 'value':
                    return (b.totalValueUsd ?? b.totalValueEth ?? 0) - (a.totalValueUsd ?? a.totalValueEth ?? 0);
                case 'balance':
                    return parseFloat(b.formatted || '0') - parseFloat(a.formatted || '0');
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                default:
                    return 0;
            }
        });
    const portfolioTokensWithBurnValue = portfolioTokens.map(token => {
        // Assume token has totalSupply field; if not, you need to fetch it
        const totalSupply: any = token.totalSupply ?? 0;
        const balance = Number(token.balance) || 0;

        const burnEthValue = valueOfTokens(totalSupply, balance);
        const burnUsdValue = burnEthValue * ethPrice;

        return {
            ...token,
            burnValueEth: burnEthValue,
            burnValueUsd: burnUsdValue,
        };
    });
    const totalBurnUsd = portfolioTokensWithBurnValue.reduce((acc, t) => acc + (t.burnValueUsd ?? 0), 0);
    if (!hydrated || loading) {
        return (
            <div className={styles.centeredBox}>
                <div className={styles.spinner}></div>
                <p>Loading portfolio...</p>
            </div>
        );
    }
    const totalEthAmount = portfolioTokens.reduce((accumulator: number, token: any) => {
        const totalSupply = token.totalSupply ?? 0;
        const balance = Number(token.balance) || 0;
        const burnEthValue = valueOfTokens(totalSupply, balance);
        return accumulator + burnEthValue;
    }, 0);

    if (error) {
        return (
            <div className={styles.centeredBox}>
                <h3>Error</h3>
                <p>{error.message}</p>
                <button onClick={refetch} className={styles.retryBtn}>Try Again</button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.logoWrapper}>
                <Logo background={true} size={'8rem'} />
            </div>
            <div className={styles.totalBalanceBox}>
                <h2>Dashboard</h2>
                <div className={styles.balanceValue}>
                    {totalBurnUsd > 0
                        ? `$${(totalBurnUsd.toFixed(2)).toString()}`
                        : `Ξ ${totalEthAmount.toFixed(7).toString()}`
                    }
                </div>
                {totalBurnUsd > 0 && (
                    <div className={styles.ethValue}>Ξ {totalEthAmount.toFixed(7)}</div>
                )}
            </div>

            <div className={styles.portfolioControls}>
                <div className={styles.controlsGroup}>
                    <label>Sort</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                        <option value="value">Value</option>
                        <option value="balance">Balance</option>
                        <option value="name">Name</option>
                    </select>
                </div>
                {width > 600 &&
                    <div className={styles.controlsGroup}>
                        <button
                            className={viewMode === 'grid' ? styles.activeView : ''}
                            onClick={() => setViewMode('grid')}
                        >⊞</button>
                        <button
                            className={viewMode === 'list' ? styles.activeView : ''}
                            onClick={() => setViewMode('list')}
                        >☰</button>
                    </div>
                }
                <button className={styles.refreshBtn} onClick={refetch}>↻</button>
            </div>

            {portfolioTokens.length === 0 ? (
                <div className={styles.centeredBox}>
                    <p>No tokens in your portfolio yet.</p>
                </div>
            ) : (
                <div className={`${styles.portfolioGrid} ${styles[viewMode]}`}>
                    {portfolioTokens.map((token: any) => {
                        const totalSupply: any = token.totalSupply ?? 0;
                        const balance = Number(token.balance) || 0;
                        const burnEthValue = valueOfTokens(totalSupply, balance);
                        const burnUsdValue = burnEthValue * ethPrice;
                        console.log(`
                            totalSupply: ${totalSupply}
                            balance: ${balance}
                            burnEthValue: ${burnEthValue}
                            burnUsdValue: ${burnUsdValue}
                          `);

                        return (
                            <PortfolioBalanceCard
                                coin={token}
                                key={token.tokenId}
                                tokenId={token.tokenId}
                                name={token.name}
                                symbol={token.symbol}
                                balance={token.formatted}
                                totalValueEth={burnEthValue}
                                totalValueUsd={burnUsdValue}
                            />
                        )
                    })}
                </div>
            )}
            <ScrollToTopButton />
        </div>
    );
};
