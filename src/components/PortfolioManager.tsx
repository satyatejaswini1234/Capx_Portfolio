import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getStockQuote } from '../lib/finnhub';
import { useAuth } from '../contexts/AuthContext';
import { Plus, ArrowLeft, Trash2, Edit2, Check, X } from 'lucide-react';

interface StockHolding {
  id: string;
  symbol: string;
  shares: number;
  purchase_price: number;
  current_price: number;
}

interface EditingHolding {
  id: string;
  symbol: string;
  shares: string;
  purchase_price: string;
}

export default function PortfolioManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [newHolding, setNewHolding] = useState({
    symbol: '',
    shares: '',
    purchase_price: '',
  });
  const [editingHolding, setEditingHolding] = useState<EditingHolding | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
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

      const portfolio = portfolios?.[0];

      if (portfolio) {
        setPortfolioId(portfolio.id);
        const { data: holdings } = await supabase
          .from('stock_holdings')
          .select('*')
          .eq('portfolio_id', portfolio.id);
        
        if (holdings) {
          setHoldings(holdings);
        }
      } else {
        const { data: newPortfolio } = await supabase
          .from('portfolios')
          .insert([{ 
            user_id: user.id,
            total_value: 0,
            last_updated: new Date().toISOString()
          }])
          .select()
          .single();

        if (newPortfolio) {
          setPortfolioId(newPortfolio.id);
          setHoldings([]);
        }
      }
    };

    fetchPortfolio();
  }, [user]);

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioId) return;

    setIsLoading(true);
    setError(null);

    try {
      const quote = await getStockQuote(newHolding.symbol.toUpperCase());
      
      const { data, error } = await supabase
        .from('stock_holdings')
        .insert([
          {
            portfolio_id: portfolioId,
            symbol: newHolding.symbol.toUpperCase(),
            shares: parseFloat(newHolding.shares),
            purchase_price: parseFloat(newHolding.purchase_price),
            current_price: quote.currentPrice,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setHoldings([...holdings, data]);
        setNewHolding({ symbol: '', shares: '', purchase_price: '' });

        const newTotalValue = holdings.reduce(
          (sum, holding) => sum + holding.shares * holding.current_price,
          0
        ) + (parseFloat(newHolding.shares) * quote.currentPrice);

        await supabase
          .from('portfolios')
          .update({ 
            total_value: newTotalValue,
            last_updated: new Date().toISOString()
          })
          .eq('id', portfolioId);
      }
    } catch (error) {
      console.error('Error adding holding:', error);
      setError('Failed to add holding. Please check the symbol and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (holding: StockHolding) => {
    setEditingHolding({
      id: holding.id,
      symbol: holding.symbol,
      shares: holding.shares.toString(),
      purchase_price: holding.purchase_price.toString(),
    });
  };

  const handleCancelEdit = () => {
    setEditingHolding(null);
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingHolding || !portfolioId) return;

    try {
      const quote = await getStockQuote(editingHolding.symbol.toUpperCase());
      
      const { data, error } = await supabase
        .from('stock_holdings')
        .update({
          symbol: editingHolding.symbol.toUpperCase(),
          shares: parseFloat(editingHolding.shares),
          purchase_price: parseFloat(editingHolding.purchase_price),
          current_price: quote.currentPrice,
        })
        .eq('id', editingHolding.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setHoldings(holdings.map(h => h.id === editingHolding.id ? data : h));
        setEditingHolding(null);

        const newTotalValue = holdings
          .map(h => h.id === editingHolding.id ? data : h)
          .reduce((sum, h) => sum + h.shares * h.current_price, 0);

        await supabase
          .from('portfolios')
          .update({ 
            total_value: newTotalValue,
            last_updated: new Date().toISOString()
          })
          .eq('id', portfolioId);
      }
    } catch (error) {
      console.error('Error updating holding:', error);
      setError('Failed to update holding. Please try again.');
    }
  };

  const handleDeleteHolding = async (id: string) => {
    try {
      const holdingToDelete = holdings.find(h => h.id === id);
      if (!holdingToDelete || !portfolioId) return;

      await supabase.from('stock_holdings').delete().eq('id', id);
      
      const updatedHoldings = holdings.filter((holding) => holding.id !== id);
      setHoldings(updatedHoldings);

      const newTotalValue = updatedHoldings.reduce(
        (sum, holding) => sum + holding.shares * holding.current_price,
        0
      );

      await supabase
        .from('portfolios')
        .update({ 
          total_value: newTotalValue,
          last_updated: new Date().toISOString()
        })
        .eq('id', portfolioId);
    } catch (error) {
      console.error('Error deleting holding:', error);
      setError('Failed to delete holding. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Add New Holding</h2>
          <form onSubmit={handleAddHolding} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={newHolding.symbol}
                onChange={(e) =>
                  setNewHolding({ ...newHolding, symbol: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shares
              </label>
              <input
                type="number"
                step="0.01"
                value={newHolding.shares}
                onChange={(e) =>
                  setNewHolding({ ...newHolding, shares: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price
              </label>
              <input
                type="number"
                step="0.01"
                value={newHolding.purchase_price}
                onChange={(e) =>
                  setNewHolding({ ...newHolding, purchase_price: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full px-4 py-2 rounded-md flex items-center justify-center ${
                  isLoading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 transition duration-200'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Add Holding
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                      {editingHolding?.id === holding.id ? (
                        <input
                          type="text"
                          value={editingHolding.symbol}
                          onChange={(e) => setEditingHolding({
                            ...editingHolding,
                            symbol: e.target.value
                          })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        holding.symbol
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingHolding?.id === holding.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingHolding.shares}
                          onChange={(e) => setEditingHolding({
                            ...editingHolding,
                            shares: e.target.value
                          })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        holding.shares
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingHolding?.id === holding.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingHolding.purchase_price}
                          onChange={(e) => setEditingHolding({
                            ...editingHolding,
                            purchase_price: e.target.value
                          })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        `$${holding.purchase_price.toFixed(2)}`
                      )}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {editingHolding?.id === holding.id ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditClick(holding)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteHolding(holding.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}