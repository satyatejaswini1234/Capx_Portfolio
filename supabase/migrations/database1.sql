/*
  # Portfolio Tracker Schema

  1. New Tables
    - `portfolios`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `total_value` (numeric)
      - `last_updated` (timestamp)
      
    - `stock_holdings`
      - `id` (uuid, primary key)
      - `portfolio_id` (uuid, references portfolios)
      - `symbol` (text)
      - `shares` (numeric)
      - `purchase_price` (numeric)
      - `current_price` (numeric)
      - `last_updated` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations
*/

-- Create portfolios table
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    total_value NUMERIC DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create stock holdings table
CREATE TABLE stock_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    shares NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    current_price NUMERIC NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_holdings ENABLE ROW LEVEL SECURITY;

-- Policies for portfolios
CREATE POLICY "Users can view own portfolio"
    ON portfolios FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own portfolio"
    ON portfolios FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio"
    ON portfolios FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio"
    ON portfolios FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for stock holdings
CREATE POLICY "Users can view own holdings"
    ON stock_holdings FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM portfolios
        WHERE portfolios.id = stock_holdings.portfolio_id
        AND portfolios.user_id = auth.uid()
    ));

CREATE POLICY "Users can create holdings in own portfolio"
    ON stock_holdings FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM portfolios
        WHERE portfolios.id = stock_holdings.portfolio_id
        AND portfolios.user_id = auth.uid()
    ));

CREATE POLICY "Users can update own holdings"
    ON stock_holdings FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM portfolios
        WHERE portfolios.id = stock_holdings.portfolio_id
        AND portfolios.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete own holdings"
    ON stock_holdings FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM portfolios
        WHERE portfolios.id = stock_holdings.portfolio_id
        AND portfolios.user_id = auth.uid()
    ));