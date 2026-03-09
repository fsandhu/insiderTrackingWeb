'use client';

import { useEffect, useState } from 'react';

// Type definition for our TradeRecord
type TradeRecord = {
  id: number;
  filingDate: string;
  tradeDate: string;
  ticker: string;
  companyName: string;
  insiderName: string;
  title: string;
  tradeType: string;
  price: number;
  qty: number;
  owned: number;
  deltaOwn: string;
  value: number;
};

import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const [records, setRecords] = useState<TradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);

  // Default to today's date formatted as YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const fetchRecords = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/records?date=${date}`);
      const data = await res.json();
      if (data.records) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(selectedDate);
  }, [selectedDate]);

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const res = await fetch('/api/scrape');
      const data = await res.json();
      alert(data.message || 'Scraping finished!');
      // Refresh the current view
      fetchRecords(selectedDate);
    } catch (err) {
      alert('Error triggering scrape');
      console.error(err);
    } finally {
      setIsScraping(false);
    }
  };

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <main className="container">
      <header>
        <div className="title-group">
          <h1>Insider Tracker</h1>
          <p>Top 20 daily insider trades from OpenInsider</p>
        </div>

        <div className="controls">
          <div className="date-picker-group">
            <div className="tooltip-container">
              <span className="date-label">SEC Form 4 filing date</span>
              <span className="tooltip-text">
                SEC Form 4 is a public report filed when insiders buy or sell their own stock. It must be filed within two business days of the transaction.
              </span>
            </div>
            <input
              type="date"
              className="date-picker"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button
            className="btn"
            onClick={handleScrape}
            disabled={isScraping}
          >
            {isScraping ? 'Scraping...' : 'Force Scrape Now'}
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="loading">Loading records...</div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          No records found for {selectedDate}.
          Try changing the date or running a scrape.
        </div>
      ) : (
        <div className="records-grid">
          {records.map((record) => {
            const isPurchase = record.tradeType.toLowerCase().includes('purchase');

            return (
              <article key={record.id} className="record-card">
                <div className="card-header">
                  <div>
                    <a
                      href={`https://finance.yahoo.com/quote/${record.ticker}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ticker"
                    >
                      {record.ticker}
                    </a>
                    <div className="company">{record.companyName}</div>
                  </div>
                  <span className={`trade-type ${isPurchase ? 'purchase' : 'sale'}`}>
                    {record.tradeType}
                  </span>
                </div>

                <div className="card-body">
                  <div className="data-group">
                    <span className="data-label">Value</span>
                    <span className="data-value large">{formatMoney(record.value)}</span>
                  </div>
                  <div className="data-group">
                    <span className="data-label">Price</span>
                    <span className="data-value">{formatMoney(record.price)}</span>
                  </div>
                  <div className="data-group">
                    <span className="data-label">Qty</span>
                    <span className="data-value">{record.qty.toLocaleString()}</span>
                  </div>
                  <div className="data-group">
                    <span className="data-label">Δ Own</span>
                    <span className={`data-value ${record.deltaOwn.includes('+') ? 'text-success' : ''}`}>
                      {record.deltaOwn}
                    </span>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="insider-info">
                    <span className="data-label">Insider</span>
                    <span className="insider-name">{record.insiderName} ({record.title})</span>
                  </div>
                  <div className="insider-info" style={{ alignItems: 'flex-end' }}>
                    <span className="data-label">Trade Date</span>
                    <span>{new Date(record.tradeDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <footer className="page-bottom-controls">
        <ThemeToggle />
      </footer>
    </main>
  );
}
