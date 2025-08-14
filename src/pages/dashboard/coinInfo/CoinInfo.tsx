import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCoinStore } from '../../../store/coinStore';
import { useTokenActivity } from '../../../hooks/useTokenActivity';
import TransparentCandlestickChart from '../../../components/chart/LineChart';
import { BackButton } from '../../../components/button/back/BackButton';
import { useUserTokenBalance } from '../../../hooks/useUserBalance';
import styles from './CoinInfo.module.css';
import { useParams } from 'react-router-dom';
import { useScrollDirection } from '../../../hooks/useScrollDirection';
import { useTokenStore } from '../../../store/allTokensStore';
import { fetchETHPrice } from "../../../api/fetchETHPrice"
import { formatEther } from 'viem';
import { EtherSymbol } from 'ethers';
const valueOfTokens = (totalSupply: any, balance: any) => {
    const basePrice = 0.000001;
    const slope = 0.0000005;

    // Refund formula for burning `balance` tokens from current supply `supply`
    const value = balance * basePrice + (slope * balance * (2 * totalSupply - balance - 1)) / 2;
    return value;
}

export const CoinInfo: React.FC = () => {
    const { balanceEth } = useUserTokenBalance();
    const [imageLoaded, setImageLoaded] = useState<boolean | null>(null);
    const [activeTab, setActiveTab] = useState<'balance' | 'insights'>('balance');
    const [showCTA, setShowCTA] = useState(true);
    const [isImageToggled, setIsImageToggled] = useState<boolean>(false);
    const [ethPriceUSD, setEthPriceUSD] = useState<any>(null);
    const { getTokenById } = useTokenStore();
    const { setCoin } = useCoinStore();
    const { tokenId }: any = useParams<{ tokenId: string }>();
    const coin: any = getTokenById(tokenId);
    const trades = useTokenActivity(tokenId);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const isScrollingUp = useScrollDirection();
    useEffect(() => {
        async function getEthPrice() {
            try {
                const price = await fetchETHPrice();
                setEthPriceUSD(price);
            } catch (error) {
                console.error('Failed to fetch ETH price:', error);
            }
        }
        getEthPrice();
    }, []);
    useEffect(() => {
        if (tokenId) {
            const token: any = getTokenById(tokenId);
            setCoin(token);
        }
    }, [tokenId]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                const nearBottom = entry.isIntersecting;
                const scrolledDownFar = window.scrollY > 100;

                // Show CTA if near bottom or scrolling up and not near top
                const shouldShow = nearBottom || (isScrollingUp && scrolledDownFar);

                setShowCTA(shouldShow);
            },
            {
                root: null,
                threshold: 0.1,
            }
        );

        if (bottomRef.current) observer.observe(bottomRef.current);

        return () => {
            if (bottomRef.current) observer.unobserve(bottomRef.current);
        };
    }, [isScrollingUp]);
    const totalSupply: any = coin.totalSupply ?? 0;
    const burnEthValue = valueOfTokens(totalSupply, balanceEth);
    const burnUsdValue = burnEthValue * ethPriceUSD;
    const marketCapValueEth = valueOfTokens(totalSupply, totalSupply);
    const marketCapValueUsd = marketCapValueEth * ethPriceUSD;
    if (!coin) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading coin data...</p>
            </div>
        );
    }
    const handleImageToggle = () => {
        setIsImageToggled(prev => !prev);
    }
    useEffect(() => {
        if (isImageToggled) {
            // Disable scroll
            document.body.style.overflow = 'hidden';
        } else {
            // Re-enable scroll
            document.body.style.overflow = '';
        }

        // Clean up on unmount (in case component unmounts while fullscreen)
        return () => {
            document.body.style.overflow = '';
        };
    }, [isImageToggled]);

    const currentPriceEth = Number(coin.price);

    const BASE_PRICE = 1e12;
    const SLOPE = 5e11;
    const ETH_TO_WEI = 1e18;

    function calculateTotalSupply(currentPriceEth: number): number {
        const currentPriceWei = currentPriceEth * ETH_TO_WEI;
        if (currentPriceWei < BASE_PRICE) return 0;
        return Math.floor((currentPriceWei - BASE_PRICE) / SLOPE);
    }
    const totalSupplyUpdated = calculateTotalSupply(Number(coin.price));
    const currentPriceUSD = ethPriceUSD ? currentPriceEth * ethPriceUSD : null;
    const marketCapUSD =
        currentPriceUSD !== null
            ? totalSupplyUpdated * currentPriceUSD
            : null;
    return (
        <div className={styles.container}>
            {isImageToggled && (
                <div className={styles.fullScreen} onClick={handleImageToggle}>
                    <div className={styles.circleWrapper}>
                        <img
                            src={coin.imageUrl}
                            alt={coin.symbol}
                            className={styles.fullScreenImage}
                        />
                    </div>
                </div>
            )}
            <BackButton />
            <div className={styles.chartWrapper}>
                <TransparentCandlestickChart coin={coin} trades={trades} interval={300} tokenId={coin.tokenId} />
            </div>

            <div className={styles.tabBar}>
                <button
                    className={`${styles.tab} ${activeTab === 'balance' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('balance')}
                >
                    Balance
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'insights' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('insights')}
                >
                    Insights
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'balance' && (
                    <div className={styles.balanceTab}>
                        <div className={styles.balanceRow}>
                            {imageLoaded === null && <div className={styles.imagePlaceholder}></div>}
                            {imageLoaded === false && (
                                <div className={styles.imageFallback}>{coin.symbol}</div>
                            )}
                            <div className={`${styles.imageContainer}`}>
                                <img
                                    src={coin.imageUrl}
                                    alt={coin.symbol}
                                    className={`${styles.tokenImage} ${imageLoaded !== true ? styles.hidden : ''}`}
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => setImageLoaded(false)}
                                    onClick={() => { handleImageToggle() }}
                                />
                            </div>
                            <div className={styles.balanceInfo}>
                                <p className={styles.balanceAmount}>
                                    {balanceEth} {coin.symbol}
                                </p>
                                {balanceEth > 0 && (
                                    <p className={styles.ethValue}>
                                        ≈ {burnEthValue?.toFixed(7)} ETH
                                        {ethPriceUSD !== null && balanceEth !== undefined && (
                                            <> (~${burnUsdValue.toFixed(2)})</>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'insights' && (
                    <div className={styles.insightsTab}>
                        <div className={styles.tokenHeader}>
                            <div className={styles.tokenIdentity}>About {coin.name}</div>
                            <div className={styles.tokenTitle}>Description</div>
                            {coin.description && <p className={styles.description}>{coin.description}</p>}
                        </div>
                        <div className={styles.metaGrid}>
                            <div className={styles.tokenIdentity}>Stats</div>
                            <div>
                                <label>Current Price</label>
                                <span>
                                    {currentPriceEth.toFixed(7)}{" "}{EtherSymbol}
                                    {currentPriceUSD !== null && (
                                        <> (~${currentPriceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</>
                                    )}
                                </span>
                            </div>
                            <div>
                                <label>Market Cap</label>
                                <span>
                                    {parseFloat(formatEther(coin.reserve)).toFixed(7)}{" "}{EtherSymbol}
                                    {marketCapUSD !== null && (
                                        <> (~${marketCapValueUsd.toFixed(2)})</>
                                    )}
                                </span>
                            </div>
                            <div>
                                <label>Total Supply</label>
                                <span>{totalSupplyUpdated.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className={styles.ctaWrapper}>
                <Link
                    to={`/trade/${coin.tokenId}`}
                    className={`${styles.tradeButton} ${!showCTA ? styles.ctaHidden : ''}`}
                >
                    Buy & Sell
                </Link>
                <Link
                    to={`/explore/${coin.tokenId}/trade`}
                    className={`${styles.tradeButton} ${!showCTA ? styles.ctaHidden : ''}`}
                >
                    Trade
                </Link>
            </div>
            <div ref={bottomRef} style={{ height: '1px' }} />
        </div>
    );
};
