import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PieChart as PieChartIcon, TrendingUp, DollarSign, LogOut } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

interface Portfolio {
  id: string;
  total_value: number;
  last_updated: string;
}

interface StockHolding {
  id: string;
  symbol: string;
  shares: number;
  current_price: number;
  purchase_price: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<StockHolding[]>([]);

  useEffect(() => {
    fetchPortfolioData();
  }, [user]);

  const fetchPortfolioData = async () => {
    if (!user) return;

    const { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .order('last_updated', { ascending: false })
      .limit(1);

    if (portfolioError) {
      console.error('Error fetching portfolio:', portfolioError);
      return;
    }

    const portfolioData = portfolios?.[0];
    
    if (portfolioData) {
      setPortfolio(portfolioData);
      
      const { data: holdingsData } = await supabase
        .from('stock_holdings')
        .select('*')
        .eq('portfolio_id', portfolioData.id);
      
      if (holdingsData) {
        setHoldings(holdingsData);
      }
    }
  };

  const totalValue = holdings.reduce(
    (sum, holding) => sum + holding.shares * holding.current_price,
    0
  );

  const topPerformer = holdings.length > 0 
    ? holdings.reduce((best, current) => {
        const currentReturn = (current.current_price - current.purchase_price) / current.purchase_price;
        const bestReturn = (best.current_price - best.purchase_price) / best.purchase_price;
        return currentReturn > bestReturn ? current : best;
      }, holdings[0])
    : null;

  const pieChartData = {
    labels: holdings.map(h => h.symbol),
    datasets: [
      {
        data: holdings.map(h => h.shares * h.current_price),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#EC4899',
          '#6366F1',
          '#14B8A6',
        ],
        borderWidth: 1,
      },
    ],
  };

  const profitLossData = {
    labels: holdings.map(h => h.symbol),
    datasets: [
      {
        label: 'Profit/Loss ($)',
        data: holdings.map(h => (h.current_price - h.purchase_price) * h.shares),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Portfolio Distribution of all the stock holdings',
      },
    },
  };

  const profitLossOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Profit/Loss by Stock',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold">Portfolio Tracker</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={signOut}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Portfolio Value
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${totalValue.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Top Performer
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {topPerformer ? (
                        <>
                          {topPerformer.symbol}{' '}
                          <span className={`text-sm ${
                            ((topPerformer.current_price - topPerformer.purchase_price) / topPerformer.purchase_price) > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            ({(((topPerformer.current_price - topPerformer.purchase_price) / topPerformer.purchase_price) * 100).toFixed(2)}%)
                          </span>
                        </>
                      ) : (
                        'N/A'
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PieChartIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Holdings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {holdings.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Portfolio Distribution</h3>
            <div className="aspect-square">
              <Pie data={pieChartData} options={chartOptions} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Profit/Loss Analysis</h3>
            <div className="aspect-square">
              <Line data={profitLossData} options={profitLossOptions} />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Your Holdings</h2>
            <Link
              to="/portfolio"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Manage Portfolio
            </Link>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit/Loss
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holdings.map((holding) => {
                  const profitLoss = (holding.current_price - holding.purchase_price) * holding.shares;
                  const profitLossPercent = ((holding.current_price - holding.purchase_price) / holding.purchase_price) * 100;
                  
                  return (
                    <tr key={holding.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {holding.symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {holding.shares}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${holding.purchase_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${holding.current_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${(holding.shares * holding.current_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`${profitLoss > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${Math.abs(profitLoss).toFixed(2)}
                          <span className="ml-1">
                            ({profitLossPercent > 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}