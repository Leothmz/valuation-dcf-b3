# tests/python/test_history.py
import unittest
from unittest.mock import patch, MagicMock
import json, sys, os
import pandas as pd
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
import server

def _make_hist(prices_by_date):
    idx = pd.to_datetime(list(prices_by_date.keys()))
    df = pd.DataFrame({'Close': list(prices_by_date.values())}, index=idx)
    return df

class TestGetPortfolioHistory(unittest.TestCase):
    @patch('server.yf')
    def test_returns_price_for_requested_date(self, mock_yf):
        mock_yf.download.return_value = _make_hist({'2024-01-15': 34.20, '2024-01-16': 35.00})
        result = server.get_portfolio_history(['WEGE3'], ['2024-01-15'])
        self.assertAlmostEqual(result['WEGE3']['2024-01-15'], 34.20, places=1)

    @patch('server.yf')
    def test_uses_next_trading_day_when_exact_date_missing(self, mock_yf):
        mock_yf.download.return_value = _make_hist({'2024-01-16': 35.00})
        result = server.get_portfolio_history(['WEGE3'], ['2024-01-15'])
        self.assertAlmostEqual(result['WEGE3']['2024-01-15'], 35.00, places=1)

    @patch('server.yf')
    def test_returns_none_when_no_history(self, mock_yf):
        mock_yf.download.return_value = pd.DataFrame()
        result = server.get_portfolio_history(['WEGE3'], ['2024-01-15'])
        self.assertIsNone(result['WEGE3']['2024-01-15'])

    def test_empty_input_returns_empty(self):
        result = server.get_portfolio_history([], [])
        self.assertEqual(result, {})

if __name__ == '__main__':
    unittest.main()
