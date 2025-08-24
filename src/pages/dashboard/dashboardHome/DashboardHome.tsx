import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { EtherSymbol } from 'ethers';
import { fetchETHPrice } from '../../../api/fetchETHPrice';
import styles from './DashboardHome.module.css';
import { ONE_MONTH_SECONDS } from '../../../constants';
import { getEthBalance } from '../../../hooks/useProtocolBalance';
import { ETHBackedTokenMinterAddress, ETHBackedTokenMinterABI } from '../../../services/ETHBackedTokenMinter';
import { usePublicClient, useGasPrice, useAccount } from 'wagmi';
import Logo from '../../../components/logo/Logo';
import { encodeFunctionData } from 'viem';
import { BarLoader } from 'react-spinners';

const aboutLines = [
    ' ETH-backed tokens',
    ' Unique bonding curves',
    ' Transparent creator fees',
    ' Mint & burn freely',
    ' self-contained economies',
];

export const DashboardHome = ({ tokens, trades }: any) => {
    const { address } = useAccount();
    const [ethPrice, setEthPrice] = useState<any>(null);
    const [ethBalance, setEthBalance] = useState<string | null>(null);
    const [createGasCost, setCreateGasCost] = useState<string | null>(null);

    const [loaderTimedOut, setLoaderTimedOut] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setLoaderTimedOut(true);
        }, 5000); // 5 seconds fallback

        return () => clearTimeout(timeout);
    }, []);


    const publicClient = usePublicClient();
    const { data: gasPrice } = useGasPrice();
    useEffect(() => {
        async function fetchBalance() {
            try {
                const balanceBigInt = await getEthBalance(ETHBackedTokenMinterAddress);
                const balanceEth = (Number(balanceBigInt) / 1e18).toFixed(4);
                setEthBalance(balanceEth);
            } catch (error) {
                console.error('Failed to fetch ETH balance:', error);
            }
        }
        async function getEthPrice() {
            try {
                const price = await fetchETHPrice();
                setEthPrice(price);
            } catch (err: any) {
                console.error("Error fetching eth price ", err.message);
            }
        }

        async function estimateCreateTokenCost() {
            if (!gasPrice || !address) return;
            try {
                const data = encodeFunctionData({
                    abi: ETHBackedTokenMinterABI,
                    functionName: 'createToken',
                    args: ["MyToken", "MTK", "ipfs://dummyhash"],
                });

                const gasEstimate = await publicClient.estimateGas({
                    account: address,
                    to: ETHBackedTokenMinterAddress,
                    data,
                });

                const gasCostEth = Number(gasEstimate * gasPrice) / 1e18;
                setCreateGasCost(gasCostEth.toFixed(6));
            } catch (err) {
                console.error("Failed to estimate createToken gas:", err);
            }
        }
        fetchBalance();
        getEthPrice();
        estimateCreateTokenCost();
    }, [gasPrice, publicClient, address]);

    const newestTokens = tokens
        .filter((token: any) => {
            const timestamp = token.blockTimestamp || token.priceLastFetchedAt;
            return timestamp && !isNaN(parseInt(timestamp));
        })
        .sort((a: any, b: any) => {
            const aTimestamp = a.blockTimestamp ? parseInt(a.blockTimestamp) : parseInt(a.priceLastFetchedAt);
            const bTimestamp = b.blockTimestamp ? parseInt(b.blockTimestamp) : parseInt(b.priceLastFetchedAt);
            return bTimestamp / 1000 - aTimestamp / 1000;
        })
        .filter((token: any) => {
            const created = token.blockTimestamp
                ? parseInt(token.blockTimestamp)
                : Math.floor(parseInt(token.priceLastFetchedAt) / 1000);
            const nowSeconds = Math.floor(Date.now() / 1000);
            return nowSeconds - created <= ONE_MONTH_SECONDS;
        })
        .slice(0, 10);

    const [selectedIndex, setSelectedIndex] = useState(0);
    const SLIDE_DURATION = 5000;

    useEffect(() => {
        const interval = setInterval(() => {
            setSelectedIndex((prevIndex) => (prevIndex + 1) % newestTokens.length);
        }, SLIDE_DURATION);
        return () => clearInterval(interval);
    }, [newestTokens.length]);

    const handleClick = useCallback(
        (index: number) => {
            if (index !== selectedIndex) setSelectedIndex(index);
        },
        [selectedIndex]
    );

    const createGasCostUsd = ethPrice && createGasCost
        ? (parseFloat(createGasCost) * ethPrice).toFixed(2)
        : null;

    const ethBalanceUsd = ethPrice && ethBalance
        ? (parseFloat(ethBalance) * ethPrice).toFixed(2)
        : null;

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>Hype<span><Logo background={true} size={'4rem'} /></span></h1>
                <p className={styles.subtitle}>Token Marketplace</p>
                <div className={styles.aboutText}>
                    {aboutLines.map((line, index) => (
                        <p key={index} className={styles.aboutLine} style={{ animationDelay: `${index * 0.7}s` }}>
                            {line}
                        </p>
                    ))}
                </div>
            </header>

            <div className={styles.stats}>
                {createGasCost && ethPrice ? (
                    <>
                        <p>eth = <span className={styles.statItem}>${ethPrice}</span></p>
                        <p>
                            create ={' '}
                            <span className={styles.statItem}>
                                {`$${createGasCostUsd}`}
                            </span>
                        </p>
                    </>
                ) : loaderTimedOut ? null : (
                    <BarLoader />
                )}
            </div>



            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>New Coins:</h3>
                <div className={styles.slidingTokenCard}>
                    {newestTokens.length > 0 && (
                        <div className={styles.newTokenCard}>
                            <div className={styles.newTokenContent}>
                                {!newestTokens[selectedIndex].imageUrl ? (
                                    <Link to={`/explore/${newestTokens[selectedIndex].tokenId}`} style={{ cursor: 'pointer' }}>
                                        <div className={styles.imageFallback}></div>
                                    </Link>
                                ) : (
                                    <Link to={`/explore/${newestTokens[selectedIndex].tokenId}`} style={{ cursor: 'pointer' }}>
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
                                    <div className={styles.indicatorContainer}>
                                        {newestTokens.map((_: any, index: any) => (
                                            <div
                                                key={index}
                                                onClick={() => handleClick(index)}
                                                className={`${styles.indicator} ${selectedIndex === index ? styles.activeIndicator : ''}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </section>
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Stats:</h3>
                <p>tvl ={' '}
                    <span className={styles.statItem}>
                        {ethBalance !== null ? `${ethBalance} ${EtherSymbol} ($${ethBalanceUsd != null ? ethBalanceUsd : ''})` : 'Loading...'}
                    </span>
                </p>
                <p>coins ={' '}
                    <span className={styles.statItem}>
                        {tokens?.length ?? 'Loading...'}
                    </span>
                </p>
                <p>trades ={' '}
                    <span className={styles.statItem}>
                        {trades?.length ?? 'Loading...'}
                    </span>
                </p>
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
