import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { EtherSymbol } from 'ethers';
import styles from './DashboardHome.module.css';
import { ONE_WEEK_SECONDS } from '../../../constants';
// import { timeAgoExplore } from '../../../utils/formatTimeAgo';
import { getEthBalance } from '../../../hooks/useProtocolBalance';
import { ETHBackedTokenMinterAddress } from '../../../services/ETHBackedTokenMinter';
import Logo from '../../../components/logo/Logo';
const aboutLines = [
    '> ETH-backed tokens',
    '> Unique bonding curves',
    '> Transparent creator fees',
    '> Mint & burn freely',
    '> self-contained economies',
];
export const DashboardHome = ({ tokens, trades }: any) => {
    const [ethBalance, setEthBalance] = useState<string | null>(null);
    useEffect(() => {
        async function fetchBalance() {
            try {
                const balanceBigInt = await getEthBalance(ETHBackedTokenMinterAddress);
                // Convert balance from wei (bigint) to ETH string with decimals
                const balanceEth = (Number(balanceBigInt) / 1e18).toFixed(4);
                setEthBalance(balanceEth);
            } catch (error) {
                console.error('Failed to fetch ETH balance:', error);
            }
        }
        fetchBalance();
    }, [ETHBackedTokenMinterAddress]);

    const newestTokens = tokens
        .filter((token: any) => {
            const timestamp = token.blockTimestamp || token.priceLastFetchedAt;
            return timestamp && !isNaN(parseInt(timestamp));
        })
        .sort((a: any, b: any) => {
            const aTimestamp = a.blockTimestamp ? parseInt(a.blockTimestamp) : parseInt(a.priceLastFetchedAt);
            const bTimestamp = b.blockTimestamp ? parseInt(b.blockTimestamp) : parseInt(b.priceLastFetchedAt);
            // convert ms to seconds
            return bTimestamp / 1000 - aTimestamp / 1000;
        })
        .filter((token: any) => {
            const created = token.blockTimestamp
                ? parseInt(token.blockTimestamp)
                : Math.floor(parseInt(token.priceLastFetchedAt) / 1000);
            const nowSeconds = Math.floor(Date.now() / 1000);
            return nowSeconds - created <= ONE_WEEK_SECONDS;
        })
        .slice(0, 10);
    // --- NEW: Sliding logic ---
    const [selectedIndex, setSelectedIndex] = useState(0);
    const SLIDE_DURATION = 5000; // 5 seconds per token

    // Auto-slide effect
    useEffect(() => {
        const interval = setInterval(() => {
            setSelectedIndex((prevIndex) => (prevIndex + 1) % newestTokens.length);
        }, SLIDE_DURATION);
        return () => clearInterval(interval);
    }, [newestTokens.length]);

    // Manual click to select token
    const handleClick = useCallback(
        (index: number) => {
            if (index !== selectedIndex) setSelectedIndex(index);
        },
        [selectedIndex]
    );


    // Only showing relevant parts where classNames are added/changed

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>Hype<span><Logo background={true} size={'4rem'} /></span></h1>
                <p className={styles.subtitle}>Bonding Curve Marketplace</p>
                <div className={styles.aboutText}>
                    {aboutLines.map((line, index) => (
                        <p
                            key={index}
                            className={styles.aboutLine}
                            style={{ animationDelay: `${index * 0.3}s` }}
                        >
                            {line}
                        </p>
                    ))}

                </div>
            </header>
            <div className={styles.stats}>
                <p>tvl = <span className={styles.statItem}>{ethBalance !== null ? `${ethBalance} ${EtherSymbol}` : 'Loading...'}</span></p>
                <p>coins = <span className={styles.statItem}>{tokens?.length ?? 'Loading...'}</span></p>
                <p>trades = <span className={styles.statItem}>{trades?.length ?? 'Loading...'}</span></p>
            </div>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>New Coins:</h3>
                <div className={styles.slidingTokenCard}>
                    {newestTokens.length > 0 && (
                        <div
                            className={styles.newTokenCard}
                        >
                            <div className={styles.newTokenContent}>
                                {!newestTokens[selectedIndex].imageUrl ? (
                                    <Link
                                        to={`/explore/${newestTokens[selectedIndex].tokenId}`}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className={styles.imageFallback}></div>
                                    </Link>
                                ) : (
                                    <Link
                                        to={`/explore/${newestTokens[selectedIndex].tokenId}`}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img
                                            loading="lazy"
                                            src={newestTokens[selectedIndex].imageUrl}
                                            alt={newestTokens[selectedIndex].name || 'Coin'}
                                            className={styles.newTokenImage}
                                        />
                                    </Link>
                                )}
                                <div className={styles.newTokenNameSide}>
                                    {newestTokens[selectedIndex].symbol}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.indicatorContainer}>
                        {newestTokens.map((_: any, index: any) => (
                            <div
                                key={index}
                                onClick={() => handleClick(index)}
                                className={`${styles.indicator} ${selectedIndex === index ? styles.activeIndicator : ''
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.actionsSection}>
                <div className={styles.actions}>
                    <Link to="/explore" className={`${styles.ctaButton} ${styles.primary}`}>
                        Explore
                    </Link>
                </div>
            </section>
        </div>
    );

};
