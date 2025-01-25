import { toast } from 'react-hot-toast';

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export async function getStockPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(
      `${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    const data = await response.json();
    return data.c; // Current price
  } catch (error) {
    console.error('Error fetching stock price:', error);
    throw error;
  }
}

export async function getStockQuote(symbol: string) {
  try {
    const [quoteResponse, companyResponse] = await Promise.all([
      fetch(`${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      fetch(`${BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`)
    ]);

    const quoteData = await quoteResponse.json();
    const companyData = await companyResponse.json();

    return {
      currentPrice: quoteData.c,
      change: quoteData.d,
      percentChange: quoteData.dp,
      highPrice: quoteData.h,
      lowPrice: quoteData.l,
      openPrice: quoteData.o,
      previousClose: quoteData.pc,
      stockName: companyData.name || symbol
    };
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    throw error;
  }
}

// Auto-update prices every 5 minutes
let updateInterval: number | null = null;

export function startPriceUpdates(updateCallback: () => Promise<void>) {
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  // Initial update
  updateCallback();

  // Set up 5-minute interval
  updateInterval = window.setInterval(async () => {
    try {
      await updateCallback();
      toast.success('Stock prices updated');
    } catch (error) {
      toast.error('Failed to update stock prices');
    }
  }, 5 * 60 * 1000); // 5 minutes

  return () => {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  };
}