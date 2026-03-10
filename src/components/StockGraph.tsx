'use client';

import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface ChartDataPoint {
  date: string;
  price: number;
}

interface StockGraphProps {
  ticker: string;
}

export function StockGraph({ ticker }: StockGraphProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [meta, setMeta] = useState<{ chartPreviousClose: number | null }>({ chartPreviousClose: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPercent, setShowPercent] = useState(true);
  const [timeframe, setTimeframe] = useState('1d');

  const timeframes = [
    { label: '1D', value: '1d' },
    { label: '5D', value: '5d' },
    { label: '1M', value: '1mo' },
    { label: '6M', value: '6mo' },
    { label: '1Y', value: '1y' },
  ];

  useEffect(() => {
    let isMounted = true;

    async function fetchChartData() {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch(`/api/yahoo-chart?ticker=${ticker}&range=${timeframe}`);
        if (!res.ok) {
          throw new Error('Failed to fetch');
        }
        const json = await res.json();
        if (isMounted && json.data) {
          setData(json.data);
          if (json.meta) {
            setMeta(json.meta);
          }
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchChartData();

    return () => {
      isMounted = false;
    };
  }, [ticker, timeframe]);

  const referencePrice = meta.chartPreviousClose !== null && meta.chartPreviousClose !== undefined 
    ? meta.chartPreviousClose 
    : (data.length > 0 ? data[0].price : 0);

  const lineColor = useMemo(() => {
    if (data.length < 1) return '#888gray';
    const lastPrice = data[data.length - 1].price;
    // Green for up, Red for down relative to reference price
    return lastPrice >= referencePrice ? '#10b981' : '#ef4444'; 
  }, [data, referencePrice]);

  if (loading) {
    return <div className="stock-graph-skeleton animate-pulse" style={{ height: '40px', width: '100%', backgroundColor: 'var(--surface-color)', borderRadius: '4px' }}></div>;
  }

  if (error || data.length === 0) {
    return <div style={{ height: '40px', display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Graph unavailable</div>;
  }

  // Calculate domain to add some padding to the graph
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1;

  const lastPrice = data[data.length - 1]?.price || 0;
  
  // To avoid calculating when there's no data
  if (data.length === 0) return null;

  const isPositive = lastPrice >= referencePrice;
  const perfAbs = lastPrice - referencePrice;
  const perfPct = referencePrice > 0 ? (perfAbs / referencePrice) * 100 : 0;

  const displayValue = showPercent 
    ? `${isPositive ? '+' : ''}${perfPct.toFixed(2)}%`
    : `${isPositive ? '+$' : '-$'}${Math.abs(perfAbs).toFixed(2)}`;

  return (
    <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem', justifyContent: 'flex-end' }}>
        {timeframes.map((tf) => (
          <button
            key={tf.value}
            onClick={(e) => {
              e.preventDefault();
              setTimeframe(tf.value);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.7rem',
              fontWeight: timeframe === tf.value ? 700 : 500,
              padding: '0.1rem 0.3rem',
              color: timeframe === tf.value ? 'var(--text-main)' : 'var(--text-muted)',
              borderRadius: '4px',
              backgroundColor: timeframe === tf.value ? 'var(--accent)' : 'transparent',
              transition: 'all 0.2s ease'
            }}
          >
            {tf.label}
          </button>
        ))}
      </div>
      <div className="stock-graph-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ height: '40px', flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <YAxis domain={[minPrice - padding, maxPrice + padding]} hide />
              <Line
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <button 
          onClick={(e) => {
            e.preventDefault();
            setShowPercent(!showPercent);
          }}
          className="perf-toggle-btn"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: lineColor,
            fontWeight: 600,
            fontSize: '0.85rem',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            backgroundColor: `${lineColor}1A`, // 10% opacity
            minWidth: '65px',
            textAlign: 'center',
            transition: 'background-color 0.2s',
          }}
          title="Click to toggle % / $"
        >
          {displayValue}
        </button>
      </div>
    </div>
  );
}
