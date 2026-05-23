# tests/python/test_cdi.py
import unittest
from unittest.mock import patch, MagicMock
import json
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
import server

class TestGetCdiData(unittest.TestCase):
    @patch('server.urllib.request.urlopen')
    def test_returns_accumulated_rate(self, mock_urlopen):
        data = [
            {"data": "02/01/2024", "valor": "0.04"},
            {"data": "03/01/2024", "valor": "0.04"},
            {"data": "04/01/2024", "valor": "0.04"},
        ]
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(data).encode()
        mock_urlopen.return_value.__enter__ = lambda s: mock_resp
        mock_urlopen.return_value.__exit__ = MagicMock(return_value=False)

        result = server.get_cdi_data('2024-01-02', '2024-01-04')

        self.assertAlmostEqual(result['accumulated'], 0.0012, places=4)
        self.assertEqual(result['days'], 3)

    @patch('server.urllib.request.urlopen', side_effect=Exception('timeout'))
    def test_fallback_on_error(self, mock_urlopen):
        result = server.get_cdi_data('2024-01-01', '2025-01-01')
        self.assertIn('accumulated', result)
        self.assertTrue(result.get('fallback'))

    def test_default_dates_do_not_crash(self):
        with patch('server.urllib.request.urlopen', side_effect=Exception('offline')):
            result = server.get_cdi_data()
        self.assertIn('accumulated', result)

if __name__ == '__main__':
    unittest.main()
