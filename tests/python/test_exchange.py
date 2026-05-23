# tests/python/test_exchange.py
import unittest
from unittest.mock import patch, MagicMock
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
import server

class TestGetExchangeRate(unittest.TestCase):
    @patch('server.yf')
    def test_returns_rate_from_regularMarketPrice(self, mock_yf):
        mock_ticker = MagicMock()
        mock_ticker.info = {'regularMarketPrice': 5.12}
        mock_yf.Ticker.return_value = mock_ticker

        result = server.get_exchange_rate('USDBRL')
        self.assertEqual(result['pair'], 'USDBRL')
        self.assertAlmostEqual(result['rate'], 5.12)
        mock_yf.Ticker.assert_called_with('USDBRL=X')

    @patch('server.yf')
    def test_falls_back_to_previousClose(self, mock_yf):
        mock_ticker = MagicMock()
        mock_ticker.info = {'regularMarketPrice': None, 'previousClose': 5.08}
        mock_yf.Ticker.return_value = mock_ticker

        result = server.get_exchange_rate('USDBRL')
        self.assertAlmostEqual(result['rate'], 5.08)

    @patch('server.yf')
    def test_returns_error_on_no_price(self, mock_yf):
        mock_ticker = MagicMock()
        mock_ticker.info = {}
        mock_yf.Ticker.return_value = mock_ticker

        result = server.get_exchange_rate('USDBRL')
        self.assertEqual(result.get('code'), 'ERROR')

if __name__ == '__main__':
    unittest.main()
