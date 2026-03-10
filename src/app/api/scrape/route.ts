import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { prisma } from '@/lib/prisma';
import { DateTime } from 'luxon';

const OPENINSIDER_URL = 'http://openinsider.com/screener?s=&o=&pl=&ph=&ll=&lh=&fd=1&fdr=&td=1&tdr=&fdlyl=&fdlyh=&daysago=&xp=1&vl=&vh=&ocl=&och=&sic1=-1&sicl=100&sich=9999&grp=0&nfl=&nfh=&nil=&nih=&nol=&noh=&v2l=&v2h=&oc2l=&oc2h=&sortcol=8&cnt=100&page=1';

export async function GET() {
  try {
    const response = await fetch(OPENINSIDER_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch OpenInsider: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const rows = $('table.tinytable tbody tr').toArray();

    // Parse records and limit to top 20
    const records = rows.slice(0, 20).map((row) => {
      const cols = $(row).find('td');

      const filingDateStr = $(cols[1]).text().trim();
      const tradeDateStr = $(cols[2]).text().trim();
      const ticker = $(cols[3]).text().trim();
      const companyName = $(cols[4]).text().trim();
      const insiderName = $(cols[5]).text().trim();
      const title = $(cols[6]).text().trim();
      const tradeType = $(cols[7]).text().trim();
      const priceStr = $(cols[8]).text().trim().replace('$', '').replace(/,/g, '');
      const qtyStr = $(cols[9]).text().trim().replace(/,/g, '');
      const ownedStr = $(cols[10]).text().trim().replace(/,/g, '');
      const deltaOwn = $(cols[11]).text().trim();
      const valueStr = $(cols[12]).text().trim().replace('$', '').replace(/,/g, '');

      // Parse dates properly (OpenInsider format is roughly "2024-05-10 16:35:05" Eastern Time)
      const filingDate = DateTime.fromFormat(filingDateStr, 'yyyy-MM-dd HH:mm:ss', { zone: 'America/New_York' }).toJSDate();
      const tradeDate = DateTime.fromFormat(tradeDateStr, 'yyyy-MM-dd', { zone: 'America/New_York' }).toJSDate();

      return {
        filingDate,
        tradeDate,
        ticker,
        companyName,
        insiderName,
        title,
        tradeType,
        price: parseFloat(priceStr) || 0,
        qty: parseInt(qtyStr, 10) || 0,
        owned: parseInt(ownedStr, 10) || 0,
        deltaOwn,
        value: parseFloat(valueStr) || 0,
      };
    });

    // Save to database
    let savedCount = 0;
    for (const record of records) {
      try {
        await prisma.tradeRecord.create({
          data: record,
        });
        savedCount++;
      } catch (err: any) {
        // Ignore unique constraint violations (we already scraped this record)
        if (err.code !== 'P2002') {
          console.error('Error saving record:', err);
        }
      }
    }

    return NextResponse.json({ success: true, count: savedCount, message: `Successfully scraped and saved ${savedCount} new records.` });
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
