import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './DashboardHome.module.css';
import { ONE_WEEK_SECONDS } from '../../../constants';
import type { Token } from '../../../types/token';
import { timeAgoExplore } from '../../../utils/formatTimeAgo';
import { getEthBalance } from '../../../hooks/useProtocolBalance';
import { ETHBackedTokenMinterAddress } from '../../../services/ETHBackedTokenMinter';
const aboutLines = [
    '> ETH-backed tokens',
    '> Unique bonding curves',
    '> Transparent creator fees',
    '> Mint & burn freely',
    '> self-contained economies',
];
export const DashboardHome = ({ tokens, trades }: any) => {
    const [ethBalance, setEthBalance] = useState<string | null>(null);
    const tokenRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
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
        .sort((a: any, b: any) => parseInt(b.blockTimestamp) - parseInt(a.blockTimestamp))
        .filter((token: any) => {
            const created = parseInt(token.blockTimestamp);
            const nowSeconds = Math.floor(Date.now() / 1000);
            return nowSeconds - created <= ONE_WEEK_SECONDS;
        })
        .slice(0, 10);

    // Only showing relevant parts where classNames are added/changed

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>Hype</h1>
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
                <p>tvl = <span className={styles.statItem}>{ethBalance !== null ? `${ethBalance} ETH` : 'Loading...'}</span></p>
                <p>coins = <span className={styles.statItem}>{tokens?.length ?? 'Loading...'}</span></p>
                <p>trades = <span className={styles.statItem}>{trades?.length ?? 'Loading...'}</span></p>
            </div>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>New Coins:</h3>
                <div className={styles.newTokenContainer}>
                    {newestTokens.map((coin: Token) => {
                        const createdTimestamp = Number(coin.blockTimestamp);
                        return (
                            <Link
                                to={`/explore/${coin.tokenId}`}
                                key={coin.tokenId}
                                className={styles.newTokenCard}
                                onClick={() => {
                                    const id = coin.tokenId.toString();
                                    const el = tokenRefs.current.get(id);
                                    if (el) {
                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={styles.newTokenContent}>
                                    {!coin.imageUrl ? (
                                        <div className={styles.imageFallback}></div>
                                    ) : (
                                        <img
                                            loading="lazy"
                                            src={coin.imageUrl}
                                            alt={coin.name || 'Coin'}
                                            className={styles.newTokenImage}
                                        />
                                    )}
                                    <div className={styles.newTokenNameSide}>
                                        {coin.symbol} <span className={styles.timeAgo}>{timeAgoExplore(createdTimestamp)}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
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
