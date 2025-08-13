import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import styles from './LineChart.module.css';
import { FadeLoader } from 'react-spinners';
import { useTradeStore } from '../../store/tradeStore';
import { parsePrice } from '../../utils/parsePrice';

interface Trade {
    tokenId: bigint;
    amount: bigint;
    cost: bigint;
    price: number;
    timestamp: number;
    type: 'mint' | 'burn';
}

interface Props {
    coin?: any;
    trades: Trade[];
    interval?: number;
    tokenId?: any;
    width?: any;
    height?: any;
    lineColor?: any;
}

// Helper function to convert RGB to Hex
function rgbToHex(rgb: string): string {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return '';
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}
const hexToRgba = (hex: any, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function getValidColor(color: string, defaultColor: string = '#1c67a8'): string {
    if (!color) {
        return defaultColor
    }
    const hexColor = color.startsWith('rgb') ? rgbToHex(color) : color;
    if (!hexColor || !/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
        return defaultColor;
    }

    let r = parseInt(hexColor.slice(1, 3), 16) / 255;
    let g = parseInt(hexColor.slice(3, 5), 16) / 255;
    let b = parseInt(hexColor.slice(5, 7), 16) / 255;

    const linearize = (value: number) => value;
    const R = linearize(r);
    const G = linearize(g);
    const B = linearize(b);

    let luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;
    const minLuminance = 0.25;
    const maxLuminance = 0.75;

    if (luminance < minLuminance || luminance > maxLuminance) {
        // Calculate scaling factor to adjust luminance
        const targetLuminance = (minLuminance + maxLuminance) / 2; // Aim for middle of range
        const currentLuminance = luminance;

        if (currentLuminance === 0) {
            return defaultColor; // Avoid division by zero
        }

        const scale = targetLuminance / currentLuminance;

        // Apply scaling to RGB values
        r = Math.min(1, Math.max(0, r * scale));
        g = Math.min(1, Math.max(0, g * scale));
        b = Math.min(1, Math.max(0, b * scale));

        // Recalculate luminance to ensure it's within bounds
        const newR = linearize(r);
        const newG = linearize(g);
        const newB = linearize(b);
        luminance = 0.2126 * newR + 0.7152 * newG + 0.0722 * newB;

        // If still out of bounds, fall back to default
        if (luminance < minLuminance || luminance > maxLuminance) {
            return defaultColor;
        }

        // Convert back to hex
        const toHex = (value: number) => {
            const hex = Math.round(value * 255).toString(16).padStart(2, '0');
            return hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    return hexColor;
}

export default function LineChart({
    coin,
    trades,
    interval = 3600,
    width,
    height,
}: Props) {
    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
    const [selectedInterval, setSelectedInterval] = useState(interval);
    const [isChartInitialized, setIsChartInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const { setTrades } = useTradeStore();
    const [hexColor, setHexColor] = useState('');
    const [showSparseDataWarning, setShowSparseDataWarning] = useState(false);

    // Set mounted state and initialize color
    useEffect(() => {
        setIsMounted(true);
        const c = getValidColor(coin.dominantColor);
        setHexColor(c);
    }, [coin.dominantColor]);

    const debounce = (func: () => void, wait: number) => {
        let timeout: NodeJS.Timeout;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(func, wait);
        };
    };

    const aggregateBuckets = (trades: Trade[], interval: number) => {
        const buckets: Record<number, { total: number; count: number }> = {};
        trades.forEach((trade) => {
            if (!isFinite(trade.price)) return;
            const bucket = Math.floor(trade.timestamp / interval) * interval;
            if (!buckets[bucket]) {
                buckets[bucket] = { total: trade.price, count: 1 };
            } else {
                buckets[bucket].total += trade.price;
                buckets[bucket].count += 1;
            }
        });
        return buckets;
    };

    const processDataForChart = (data: { time: number; value: number }[]) => {
        const uniqueData = new Map<number, number>();

        data.forEach(item => {
            uniqueData.set(item.time, item.value);
        });

        return Array.from(uniqueData.entries())
            .map(([time, value]) => ({ time, value }))
            .sort((a, b) => a.time - b.time);
    };

    const updateChartData = useCallback(
        (trades: Trade[], interval: number) => {
            setIsLoading(true);
            if (!lineSeriesRef.current) {
                setIsLoading(false);
                return;
            }

            if (!trades || trades.length === 0) {
                setShowSparseDataWarning(false);
                if (coin.price) {
                    const now: any = Math.floor(Date.now() / 1000);
                    const bucket: any = interval === -1 ? now : Math.floor(now / interval) * interval;
                    const currentPrice: number = parsePrice(coin.price);

                    const data: any = [{ time: bucket, value: currentPrice }];

                    const processedData: any = processDataForChart(data);
                    lineSeriesRef.current.setData(processedData);
                    areaSeriesRef.current?.setData(processedData);

                    if (!width && !height) {
                        lineSeriesRef.current.setMarkers([
                            {
                                time: bucket,
                                position: 'aboveBar',
                                color: '#2196f3',
                                shape: 'circle',
                                text: `${currentPrice.toFixed(7)}`,
                                size: 0,
                            },
                        ]);
                    }

                    chartRef.current?.timeScale().fitContent();
                    setIsLoading(false);
                    return;
                } else {
                    lineSeriesRef.current.setData([]);
                    lineSeriesRef.current.setMarkers([]);
                    setIsLoading(false);
                    return;
                }
            }

            if (interval === -1) {
                setShowSparseDataWarning(false);

                const allTimeData = trades
                    .filter((trade) => isFinite(trade.price))
                    .map((trade) => ({ time: trade.timestamp, value: trade.price }));

                let processedData: any = processDataForChart(allTimeData);

                const currentPrice: number = Number(coin.price);

                if (currentPrice !== null) {
                    const maxPrice = processedData.length > 0 ? Math.max(...processedData.map((d: any) => d.value)) : -Infinity;

                    if (processedData.length === 0 || currentPrice > maxPrice || currentPrice >= processedData[processedData.length - 1].value) {
                        if (processedData.length > 0 && processedData[processedData.length - 1].time === Math.floor(Date.now() / 1000)) {
                            processedData[processedData.length - 1] = {
                                time: Math.floor(Date.now() / 1000),
                                value: currentPrice,
                            };
                        } else {
                            processedData.push({
                                time: Math.floor(Date.now() / 1000),
                                value: currentPrice,
                            });
                        }
                    }
                }

                if (processedData.length === 0) {
                    lineSeriesRef.current.setData([]);
                    lineSeriesRef.current.setMarkers([]);
                    setIsLoading(false);
                    return;
                }

                const high = Math.max(...processedData.map((d: any) => d.value));
                const low = Math.min(...processedData.map((d: any) => d.value));

                const highPoints = processedData.filter((d: any) => d.value === high);
                const lowPoints = processedData.filter((d: any) => d.value === low);
                const highPoint = highPoints[highPoints.length - 1];
                const lowPoint = lowPoints[lowPoints.length - 1];
                const currentPoint = processedData[processedData.length - 1];

                lineSeriesRef.current.setData(processedData);
                areaSeriesRef.current?.setData(processedData);

                const markers: any[] = [];

                if (!width && !height && highPoint && currentPrice !== null && highPoint !== currentPrice) {
                    markers.push({
                        time: highPoint.time,
                        position: 'aboveBar',
                        color: '#26a69a',
                        shape: 'arrowUp',
                        text: `${high.toFixed(7)}`,
                        size: 0,
                    });
                }

                if (!width && !height && lowPoint && currentPrice !== null) {
                    markers.push({
                        time: lowPoint.time,
                        position: 'belowBar',
                        color: '#ef5350',
                        shape: 'arrowDown',
                        text: `${low.toFixed(7)}`,
                        size: 0,
                    });
                }

                if (!width && !height && currentPoint && currentPrice !== null) {
                    markers.push({
                        time: currentPoint.time,
                        position: 'aboveBar',
                        color: '#2196f3',
                        shape: 'circle',
                        text: `${currentPrice.toFixed(7)}`,
                        size: 0,
                    });
                }

                markers.sort((a, b) => a.time - b.time);
                lineSeriesRef.current.setMarkers(markers);
                chartRef.current?.timeScale().fitContent();
                setIsLoading(false);
                return;
            }

            const buckets = aggregateBuckets(trades, interval);
            if (Object.keys(buckets).length < 2 && interval !== -1) {
                setShowSparseDataWarning(true);
                updateChartData(trades, -1);
                return;
            } else {
                setShowSparseDataWarning(false);
            }

            const data = Object.entries(buckets)
                .map(([timeStr, bucketData]) => ({
                    time: Number(timeStr),
                    value: bucketData.total / bucketData.count,
                }));

            if (coin.price && data.length > 0) {
                const now = Math.floor(Date.now() / 1000);
                const currentBucket = Math.floor(now / interval) * interval;
                const currentPrice: number = Number(coin.price);

                data.push({ time: currentBucket, value: currentPrice });
            }

            const processedData: any = processDataForChart(data);

            if (processedData.length === 0) {
                lineSeriesRef.current.setData([]);
                lineSeriesRef.current.setMarkers([]);
                setIsLoading(false);
                return;
            }

            const high = Math.max(...processedData.map((d: any) => d.value));
            const low = Math.min(...processedData.map((d: any) => d.value));
            const highPoint = processedData.find((d: any) => d.value === high);
            const lowPoint = processedData.find((d: any) => d.value === low);
            const currentPoint = processedData[processedData.length - 1];

            lineSeriesRef.current.setData(processedData);
            areaSeriesRef.current?.setData(processedData);

            const markers: any[] = [];
            const currentPrice: number = Number(coin.price);

            if (!width && !height && highPoint && currentPrice !== high) {
                markers.push({
                    time: highPoint.time,
                    position: 'aboveBar',
                    color: '#26a69a',
                    shape: 'none',
                    text: `${high.toFixed(7)}`,
                    size: 0,
                });
            }

            if (!width && !height && lowPoint && currentPrice !== low) {
                markers.push({
                    time: lowPoint.time,
                    position: 'belowBar',
                    color: '#ef5350',
                    shape: 'none',
                    text: `${low.toFixed(6)}`,
                    size: 0,
                });
            }

            if (!width && !height && currentPoint && currentPrice) {
                markers.push({
                    time: currentPoint.time,
                    position: 'aboveBar',
                    color: '#2196f3',
                    shape: 'none',
                    text: `${currentPrice.toFixed(6)}`,
                    size: 0,
                });
            }

            markers.sort((a, b) => a.time - b.time);
            lineSeriesRef.current.setMarkers(markers);
            chartRef.current?.timeScale().fitContent();
            setIsLoading(false);
        },
        [coin.price, width, height, trades, selectedInterval]
    );

    // Chart initialization effect - only run when DOM is ready
    useEffect(() => {
        if (!isMounted || typeof window === 'undefined' || !chartContainerRef.current || !hexColor) {
            return;
        }

        const container = chartContainerRef.current;

        // Double-check container exists and is mounted in DOM
        if (!container || !container.parentNode) {
            return;
        }

        import('lightweight-charts')
            .then(({ createChart }) => {

                // Triple-check container still exists after async import
                if (!chartContainerRef.current || !container) {
                    return;
                }

                const chartOptions = {
                    width: container.clientWidth,
                    height: container.clientHeight, // instead of hardcoding 400
                    layout: {
                        background: { color: 'transparent' },
                        textColor: '#171717',
                    },
                    grid: {
                        vertLines: { visible: false },
                        horzLines: { visible: false },
                    },
                    timeScale: {
                        timeVisible: !width && !height ? false : false,
                        secondsVisible: !width && !height ? true : false,
                        borderColor: '#1c67a8',
                        barSpacing: 1,
                        fixLeftEdge: true,
                        fixRightEdge: false,
                        minBarSpacing: 1,
                        rightOffset: 2,
                        lockVisibleTimeRangeOnResize: true,
                        visible: width || height ? false : true,
                    },
                    rightPriceScale: {
                        visible: false,
                    },
                    handleScroll: false,
                    handleScale: false,
                };

                const chart = createChart(container, chartOptions);

                const lineSeries = chart.addLineSeries({
                    color: hexColor,
                    lineWidth: 1,
                    priceLineVisible: !width && !height,
                    priceFormat: {
                        type: 'price',
                        precision: 8,
                        minMove: 0.0000001,
                    },
                });

                const areaSeries = chart.addAreaSeries({
                    topColor: hexToRgba(hexColor || '#1c67a8', 0.4),
                    bottomColor: hexToRgba(hexColor || '#1c67a8', 0.0),
                    lineColor: hexColor ? hexColor : '#1c67a8',
                    lineWidth: 2,
                    priceLineVisible: false,
                    priceFormat: {
                        type: 'price',
                        precision: 8,
                        minMove: 0.0000001,
                    },
                });

                chartRef.current = chart;
                areaSeriesRef.current = areaSeries;
                lineSeriesRef.current = lineSeries;

                let resizeObserver: ResizeObserver | null = null;

                const debouncedResize = debounce(() => {
                    if (chartContainerRef.current) {
                        chart.applyOptions({
                            width: chartContainerRef.current.clientWidth,
                            height: chartContainerRef.current.clientHeight,
                        });
                    }
                }, 200);

                resizeObserver = new ResizeObserver(debouncedResize);
                resizeObserver.observe(container);


                chart.timeScale().fitContent();
                setIsChartInitialized(true);
                updateChartData(trades, selectedInterval);

                if (coin?.tokenId) {
                    setTrades(coin.tokenId.toString(), [...trades]);
                }

                // Cleanup function
                return () => {
                    if (resizeObserver) {
                        resizeObserver.disconnect();
                    }
                    if (chart) {
                        chart.remove();
                    }
                    chartRef.current = null;
                    lineSeriesRef.current = null;
                    areaSeriesRef.current = null;
                    setIsChartInitialized(false);
                };
            })
            .catch((err) => {
                console.error('Failed to load lightweight-charts:', err);
                setIsLoading(false);
            });
    }, [isMounted, hexColor, width, height, trades, selectedInterval, coin?.tokenId, coin.price, setTrades]);

    // Update series colors when hexColor changes
    useEffect(() => {
        if (lineSeriesRef.current && areaSeriesRef.current && hexColor) {
            lineSeriesRef.current.applyOptions({
                color: hexColor,
            });
            areaSeriesRef.current.applyOptions({
                topColor: hexToRgba(hexColor || '#1c67a8', 0.4),
                bottomColor: hexToRgba(hexColor || '#1c67a8', 0.0),
                lineColor: hexColor ? hexColor : '#1c67a8',
            });
        }
    }, [hexColor]);

    const getAvailableIntervals = useCallback(() => {
        if (!trades || trades.length === 0) {
            return [{ label: 'All', value: -1 }];
        }

        const now = Math.floor(Date.now() / 1000);
        const oldestTrade = Math.min(...trades.map((t) => t.timestamp));
        const timeSpan = now - oldestTrade;

        const allIntervals = [
            { label: '1H', value: 3600, minTimeSpan: 3600 },
            { label: '1D', value: 86400, minTimeSpan: 86400 },
            { label: '1M', value: 2592000, minTimeSpan: 2592000 },
            { label: '1Y', value: 31536000, minTimeSpan: 31536000 },
            { label: 'All', value: -1, minTimeSpan: 0 },
        ];

        const filteredByTime = allIntervals.filter(
            (interval) => interval.value === -1 || timeSpan >= interval.minTimeSpan * 2
        );

        const filteredByBuckets = filteredByTime.filter((interval) => {
            if (interval.value === -1) return true;
            const buckets = aggregateBuckets(trades, interval.value);
            return Object.keys(buckets).length >= 2;
        });

        return filteredByBuckets.length > 0 ? filteredByBuckets : [{ label: 'All', value: -1 }];
    }, [trades]);

    const availableIntervals = useMemo(() => getAvailableIntervals(), [trades]);

    useEffect(() => {
        if (!isChartInitialized) return;

        const isSelectedAvailable = availableIntervals.some((i) => i.value === selectedInterval);

        if (!isSelectedAvailable) {
            const fallback = availableIntervals.find((i) => i.value === -1) || availableIntervals.slice(-1)[0];
            setSelectedInterval(fallback.value);
            return;
        }

        updateChartData(trades, selectedInterval);
    }, [trades, coin.price, updateChartData, isChartInitialized, availableIntervals, selectedInterval]);

    const intervalOptions = getAvailableIntervals();

    return (
        <div className={styles.container}>
            {!isLoading && (
                <>
                    <div className={styles.controls}>
                        {!width && !height && (
                            <div className={styles.assetInfo}>
                                {!isLoading ? (
                                    <>
                                        <p className={styles.symbol}>{coin?.symbol}</p>
                                        <p className={styles.price}>
                                            {coin.price ? `$${coin.price.toString()} ETH` : '—'}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <FadeLoader />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    {width && height ? (
                        <div ref={chartContainerRef} className={styles.chartContainerNS} style={{ width: width, height: height, pointerEvents: 'none' }} />
                    ) : (
                        <div ref={chartContainerRef} className={styles.chartContainer} />
                    )}



                    {!width && !height && showSparseDataWarning && (
                        <div className={styles.sparseDataWarning}>
                            <p>Data too sparse for selected interval. Showing all trades.</p>
                        </div>
                    )}

                    {!width && !height && !isLoading && trades.length === 0 && (
                        <div className={styles.noDataOverlay}>
                            <p>No trades available for this token.</p>
                        </div>
                    )}
                </>
            )}
            {!width && !height &&
                (
                    <div className={styles.intervalButtonGroup}>
                        {intervalOptions.map((option) => (
                            <button
                                key={option.value}
                                className={`${styles.intervalButton} ${selectedInterval === option.value ? styles.active : ''}`}
                                onClick={() => setSelectedInterval(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )
            }
        </div>
    );
}