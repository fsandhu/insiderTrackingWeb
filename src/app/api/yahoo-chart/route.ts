import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const range = searchParams.get('range') || '1mo';
  
  // Determine appropriate interval based on range
  let interval = '1d';
  if (range === '1d' || range === '5d') {
    interval = '5m';
  } else if (range === '1mo') {
    interval = '1d';
  } else if (range === '6mo' || range === '1y') {
    interval = '1d';
  }

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    // Fetch data based on range
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}`;
    console.log(`Fetching Yahoo chart for: ${ticker}`);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Yahoo Finance API error (${res.status}):`, text);
      return NextResponse.json(
        { error: 'Failed to fetch from Yahoo Finance' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    const timestamps = result.timestamp || [];
    const closePrices = result.indicators?.quote?.[0]?.close || [];

    // Combine timestamps and prices into an array of objects for Recharts
    const chartData = timestamps.map((timestamp: number, index: number) => {
      // Create a readable date for tooltips based on interval
      const dateObj = new Date(timestamp * 1000);
      let dateStr = '';
      
      if (interval === '5m') {
        dateStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else {
        dateStr = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: range === '1y' ? '2-digit' : undefined
        });
      }

      return {
        date: dateStr,
        price: closePrices[index],
      };
    }).filter((item: any) => item.price !== null); // Filter out any null prices

    return NextResponse.json({ 
      data: chartData,
      meta: {
        chartPreviousClose: result.meta?.chartPreviousClose || null
      }
    });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching chart data' },
      { status: 500 }
    );
  }
}
