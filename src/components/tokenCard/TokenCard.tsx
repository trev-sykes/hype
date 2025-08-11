import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './TokenCard.module.css';
import { useCoinStore } from '../../store/coinStore';
import { useWidth } from '../../hooks/useWidth';
import { getDominantColor } from '../../utils/colorTheif';
import TransparentCandlestickChart from '../chart/LineChart';
import { useTokenStore } from '../../store/allTokensStore';
import { useTokenActivity } from '../../hooks/useTokenActivity';
import clsx from 'clsx'; // optional utility for combining classNames
interface TokenCardProps {
    coin: any;
    loadState?: boolean | null;
}

export const TokenCard: React.FC<TokenCardProps> = ({ coin, loadState }) => {
    const { setCoin } = useCoinStore();
    const updateToken = useTokenStore(state => state.updateToken);
    const { hasDominantColorBeenSet, markDominantColorAsSet } = useTokenStore();
    const width = useWidth();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const hasRunMap = useRef<Record<string, boolean>>({});
    const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
    const prevPriceRef = useRef<number | null>(null);
    // useEffect(() => {
    //     console.log("COIN", coin);
    // }, [coin])
    useEffect(() => {
        const alreadySet = hasDominantColorBeenSet(coin.tokenId);
        const hasRun = hasRunMap.current[coin.tokenId];

        if (
            !coin.dominantColor &&
            coin.imageUrl &&
            !imageError &&
            (imageLoaded || loadState === true) &&
            !alreadySet &&
            !hasRun
        ) {
            hasRunMap.current[coin.tokenId] = true;

            getDominantColor(coin.imageUrl)
                .then((color) => {
                    updateToken(coin.tokenId, { dominantColor: color });
                    markDominantColorAsSet(coin.tokenId);
                })
                .catch((err) => {
                    console.error('Dominant color error:', err);
                    markDominantColorAsSet(coin.tokenId);
                });
        }
    }, [
        coin.tokenId,
        coin.imageUrl,
        imageLoaded,
        loadState,
        imageError,
        hasDominantColorBeenSet,
        markDominantColorAsSet,
        updateToken
    ]);

    // Use the actual trades or empty array, but don't default to a constant
    const trades = useTokenActivity(coin.tokenId);

    // Handle image loading locally if no loadState is provided
    useEffect(() => {
        if (loadState !== undefined) {
            setImageLoaded(loadState === true);
            setImageError(loadState === false);
        } else if (coin.imageUrl && coin.imageUrl !== '') {
            setImageLoaded(false);
            setImageError(false);

            const img = new Image();
            img.src = coin.imageUrl;

            img.onload = () => {
                setImageLoaded(true);
                setImageError(false);
            };

            img.onerror = () => {
                setImageLoaded(false);
                setImageError(true);
            };
        }
    }, [coin.imageUrl, loadState]);
    useEffect(() => {
        const prevPrice = prevPriceRef.current;
        const currentPrice = coin.price;

        if (prevPrice != null && currentPrice != null && prevPrice !== currentPrice) {
            setPriceDirection(currentPrice > prevPrice ? 'up' : 'down');

            // Reset after animation duration
            setTimeout(() => {
                setPriceDirection(null);
            }, 1000);
        }

        prevPriceRef.current = currentPrice;
    }, [coin.price]);
    const renderImageContent = () => {
        if (!coin.imageUrl || coin.imageUrl === '') {
            return <div className={styles.imageFallback}>{coin.symbol}</div>;
        }

        if (loadState !== undefined) {
            if (loadState === null) {
                return (
                    <div className={styles.imageLoading}>
                        <div className={styles.loadingSpinner}></div>
                    </div>
                );
            } else if (loadState === false) {
                return <div className={styles.imageFallback}>{coin.symbol}</div>;
            } else {
                return (
                    <img
                        loading="lazy"
                        src={coin.imageUrl}
                        alt={coin.name || 'Coin'}
                        className={styles.coinImage}
                    />
                );
            }
        }

        if (imageError) {
            return <div className={styles.imageFallback}>{coin.symbol}</div>;
        }

        if (!imageLoaded) {
            return (
                <div className={styles.imageLoading}>
                    <div className={styles.loadingSpinner}></div>
                </div>
            );
        }

        return (
            <img
                loading="lazy"
                src={coin.imageUrl}
                alt={coin.name || 'Coin'}
                className={styles.coinImage}
            />
        );
    };

    return (
        <Link
            to={`/explore/${coin.tokenId}`}
            className={clsx(
                styles.coinCard,
                priceDirection === 'up' && styles.priceChangeUp,
                priceDirection === 'down' && styles.priceChangeDown
            )}
            onClick={() => {
                setCoin(coin);
            }}
        >
            <div className={styles.imageContainer}>
                {renderImageContent()}
            </div>

            <div className={styles.tokenDetails}>
                {width > 640 && (
                    <h4>{coin.name.length > 7 ? `${coin.name.slice(0, 7)}..` : coin.name}</h4>
                )}
                <div className={styles.symbolText}>
                    {coin.symbol.length < 8 ? coin.symbol : coin.symbol.slice(0, 8)}
                </div>
            </div>

            <div className={styles.chartContainer}>
                <TransparentCandlestickChart
                    coin={coin}
                    trades={trades}
                    height={50}
                    width={'100%'}
                />
            </div>

            <div className={styles.priceSection}>
                <p>
                    <span className={styles.priceValue}>
                        {coin.price != null ? coin.price.toString() : 'N/A'}
                    </span>
                </p>
            </div>

        </Link >
    );
};