"""
Tests for scraper adapters: investidor10, statusinvest, fundamentus.

All tests use local HTML/JSON fixtures to avoid real HTTP calls.
"""
from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

FIXTURES = Path(__file__).parent / "fixtures"


# ── Helpers ──────────────────────────────────────────────────────────────────

def _make_response(content: bytes) -> MagicMock:
    """Create a mock urlopen context-manager response returning *content*."""
    mock_resp = MagicMock()
    mock_resp.read.return_value = content
    mock_resp.__enter__ = lambda s: s
    mock_resp.__exit__ = MagicMock(return_value=False)
    return mock_resp


# ── investidor10 adapter ──────────────────────────────────────────────────────

class TestInvestidor10:

    def test_parses_sample_html(self):
        """fetch_net_income returns NetIncomeEntry list when company ID found."""
        from api.adapters.investidor10 import fetch_net_income

        html_bytes = (FIXTURES / "investidor10_sample.html").read_bytes()
        api_bytes = (FIXTURES / "investidor10_api_sample.json").read_bytes()

        # Two sequential urlopen calls: first for the page, second for the API
        responses = [_make_response(html_bytes), _make_response(api_bytes)]

        with patch("urllib.request.urlopen", side_effect=responses):
            result = fetch_net_income("PETR4")

        assert isinstance(result, list)
        # fixture has years 2024, 2023, 2022, 2021, 2020; only >= 2021 included
        assert len(result) == 4
        assert result[0].year == 2024
        assert result[-1].year == 2021
        # Verify all entries have the expected attributes
        for entry in result:
            assert hasattr(entry, "year")
            assert hasattr(entry, "netIncome")
            assert isinstance(entry.year, int)
            assert isinstance(entry.netIncome, float)

    def test_sorted_most_recent_first(self):
        """Result is sorted descending by year."""
        from api.adapters.investidor10 import fetch_net_income

        html_bytes = (FIXTURES / "investidor10_sample.html").read_bytes()
        api_bytes = (FIXTURES / "investidor10_api_sample.json").read_bytes()
        responses = [_make_response(html_bytes), _make_response(api_bytes)]

        with patch("urllib.request.urlopen", side_effect=responses):
            result = fetch_net_income("PETR4")

        years = [e.year for e in result]
        assert years == sorted(years, reverse=True)

    def test_returns_empty_on_network_error(self):
        """Returns [] when urlopen raises an exception."""
        from api.adapters.investidor10 import fetch_net_income

        with patch("urllib.request.urlopen", side_effect=Exception("network error")):
            result = fetch_net_income("PETR4")

        assert result == []

    def test_returns_empty_when_company_id_not_found(self):
        """Returns [] when the page has no recognizable company ID."""
        from api.adapters.investidor10 import fetch_net_income

        no_id_html = b"<html><body><h1>No ID here</h1></body></html>"
        with patch("urllib.request.urlopen", return_value=_make_response(no_id_html)):
            result = fetch_net_income("XXXX3")

        assert result == []

    def test_excludes_years_before_2021(self):
        """Years < 2021 in the API JSON are filtered out."""
        from api.adapters.investidor10 import fetch_net_income

        html_bytes = (FIXTURES / "investidor10_sample.html").read_bytes()
        api_bytes = (FIXTURES / "investidor10_api_sample.json").read_bytes()
        responses = [_make_response(html_bytes), _make_response(api_bytes)]

        with patch("urllib.request.urlopen", side_effect=responses):
            result = fetch_net_income("PETR4")

        for entry in result:
            assert entry.year >= 2021


# ── statusinvest adapter ─────────────────────────────────────────────────────

class TestStatusInvest:

    def test_parses_sample_html(self):
        """fetch_fii_extras returns a non-empty dict from the fixture."""
        from api.adapters.statusinvest import fetch_fii_extras

        sample_html = (FIXTURES / "statusinvest_sample.html").read_bytes()

        with patch("urllib.request.urlopen", return_value=_make_response(sample_html)):
            result = fetch_fii_extras("HGLG11")

        assert isinstance(result, dict)
        assert len(result) > 0

    def test_parses_segmento(self):
        """fetch_fii_extras extracts segmento from fixture HTML."""
        from api.adapters.statusinvest import fetch_fii_extras

        sample_html = (FIXTURES / "statusinvest_sample.html").read_bytes()

        with patch("urllib.request.urlopen", return_value=_make_response(sample_html)):
            result = fetch_fii_extras("HGLG11")

        assert result.get("segmento") == "Logística"

    def test_parses_ffo_yield(self):
        """fetch_fii_extras extracts FFO Yield as a decimal fraction."""
        from api.adapters.statusinvest import fetch_fii_extras

        sample_html = (FIXTURES / "statusinvest_sample.html").read_bytes()

        with patch("urllib.request.urlopen", return_value=_make_response(sample_html)):
            result = fetch_fii_extras("HGLG11")

        assert "ffoYield" in result
        assert abs(result["ffoYield"] - 0.0912) < 0.0001

    def test_parses_vacancia(self):
        """fetch_fii_extras extracts vacancia as a decimal fraction."""
        from api.adapters.statusinvest import fetch_fii_extras

        sample_html = (FIXTURES / "statusinvest_sample.html").read_bytes()

        with patch("urllib.request.urlopen", return_value=_make_response(sample_html)):
            result = fetch_fii_extras("HGLG11")

        assert "vacancia" in result
        assert abs(result["vacancia"] - 0.032) < 0.001

    def test_returns_empty_on_network_error(self):
        """Returns {} when urlopen raises an exception."""
        from api.adapters.statusinvest import fetch_fii_extras

        with patch("urllib.request.urlopen", side_effect=Exception("network error")):
            result = fetch_fii_extras("HGLG11")

        assert result == {}

    def test_strips_sa_suffix(self):
        """Ticker with .SA suffix is handled (url uses lowercase without .SA)."""
        from api.adapters.statusinvest import fetch_fii_extras

        sample_html = (FIXTURES / "statusinvest_sample.html").read_bytes()

        with patch("urllib.request.urlopen", return_value=_make_response(sample_html)) as mock_open:
            fetch_fii_extras("HGLG11.SA")
            call_args = mock_open.call_args
            # The Request object's full_url should not contain ".SA"
            req = call_args[0][0]
            assert ".sa" not in req.full_url.lower()


# ── _normalize_segmento ───────────────────────────────────────────────────────

class TestNormalizeSegmento:

    def test_logistica(self):
        from api.adapters.statusinvest import _normalize_segmento
        assert _normalize_segmento("Logística") == "Logística"
        assert _normalize_segmento("Logístico") == "Logística"

    def test_shoppings(self):
        from api.adapters.statusinvest import _normalize_segmento
        assert _normalize_segmento("Shoppings") == "Shoppings"
        assert _normalize_segmento("Shopping Centers") == "Shoppings"

    def test_lajes_corp(self):
        from api.adapters.statusinvest import _normalize_segmento
        assert _normalize_segmento("Lajes Corporativas") == "Lajes Corp."
        assert _normalize_segmento("Escritórios") == "Lajes Corp."

    def test_papel_cri(self):
        from api.adapters.statusinvest import _normalize_segmento
        assert _normalize_segmento("Papel/CRI") == "Papel/CRI"
        assert _normalize_segmento("Recebíveis Imobiliários") == "Papel/CRI"

    def test_residencial(self):
        from api.adapters.statusinvest import _normalize_segmento
        assert _normalize_segmento("Residencial") == "Residencial"
        assert _normalize_segmento("Habitacional") == "Residencial"

    def test_case_insensitive(self):
        from api.adapters.statusinvest import _normalize_segmento
        assert _normalize_segmento("SHOPPINGS") == "Shoppings"
        assert _normalize_segmento("LOGÍSTICA") == "Logística"

    def test_unknown_returns_none(self):
        from api.adapters.statusinvest import _normalize_segmento
        assert _normalize_segmento("xyz_unknown") is None
        assert _normalize_segmento("") is None
        assert _normalize_segmento("DataCenter") is None

    def test_hibrido(self):
        from api.adapters.statusinvest import _normalize_segmento
        assert _normalize_segmento("Híbrido") == "Híbrido"
        assert _normalize_segmento("FOF") == "Híbrido"
        assert _normalize_segmento("Fundo de Fundos") == "Híbrido"


# ── fundamentus adapter ───────────────────────────────────────────────────────

class TestFundamentus:

    def test_parses_sample_html(self):
        """fetch_fii_extras parses the table fixture and finds HGLG11."""
        from api.adapters.fundamentus import fetch_fii_extras

        # Reset module-level cache so this test is independent
        import api.adapters.fundamentus as _mod
        _mod._cache = None
        _mod._cache_ts = 0.0

        sample_html = (FIXTURES / "fundamentus_sample.html").read_bytes()
        # fundamentus reads latin-1; our fixture is ASCII-compatible
        sample_latin1 = sample_html  # bytes passed as-is; decode in adapter

        with patch("urllib.request.urlopen", return_value=_make_response(sample_latin1)):
            result = fetch_fii_extras("HGLG11")

        assert isinstance(result, dict)
        assert "ffoYield" in result
        assert abs(result["ffoYield"] - 0.0912) < 0.0001

    def test_parses_vacancia(self):
        """fetch_fii_extras returns vacancia for HGLG11 from fixture."""
        from api.adapters.fundamentus import fetch_fii_extras

        import api.adapters.fundamentus as _mod
        _mod._cache = None
        _mod._cache_ts = 0.0

        sample_html = (FIXTURES / "fundamentus_sample.html").read_bytes()

        with patch("urllib.request.urlopen", return_value=_make_response(sample_html)):
            result = fetch_fii_extras("HGLG11")

        assert "vacancia" in result
        assert abs(result["vacancia"] - 0.032) < 0.001

    def test_parses_num_imoveis(self):
        """fetch_fii_extras returns numImoveis for HGLG11 from fixture."""
        from api.adapters.fundamentus import fetch_fii_extras

        import api.adapters.fundamentus as _mod
        _mod._cache = None
        _mod._cache_ts = 0.0

        sample_html = (FIXTURES / "fundamentus_sample.html").read_bytes()

        with patch("urllib.request.urlopen", return_value=_make_response(sample_html)):
            result = fetch_fii_extras("HGLG11")

        assert result.get("numImoveis") == 15

    def test_returns_empty_for_missing_ticker(self):
        """fetch_fii_extras returns {} for a ticker not in the table."""
        from api.adapters.fundamentus import fetch_fii_extras

        import api.adapters.fundamentus as _mod
        _mod._cache = None
        _mod._cache_ts = 0.0

        sample_html = (FIXTURES / "fundamentus_sample.html").read_bytes()

        with patch("urllib.request.urlopen", return_value=_make_response(sample_html)):
            result = fetch_fii_extras("ZZNOTFOUND11")

        assert result == {}

    def test_returns_empty_on_network_error(self):
        """Returns {} when urlopen raises an exception."""
        from api.adapters.fundamentus import fetch_fii_extras

        import api.adapters.fundamentus as _mod
        _mod._cache = None
        _mod._cache_ts = 0.0

        with patch("urllib.request.urlopen", side_effect=Exception("network error")):
            result = fetch_fii_extras("HGLG11")

        assert result == {}

    def test_uses_cache_on_second_call(self):
        """The HTTP call is made only once; second call uses the cache."""
        from api.adapters.fundamentus import fetch_fii_extras

        import api.adapters.fundamentus as _mod
        _mod._cache = None
        _mod._cache_ts = 0.0

        sample_html = (FIXTURES / "fundamentus_sample.html").read_bytes()

        with patch("urllib.request.urlopen", return_value=_make_response(sample_html)) as mock_open:
            fetch_fii_extras("HGLG11")
            fetch_fii_extras("XPML11")
            assert mock_open.call_count == 1

    def test_sa_suffix_stripped(self):
        """Ticker HGLG11.SA is treated same as HGLG11."""
        from api.adapters.fundamentus import fetch_fii_extras

        import api.adapters.fundamentus as _mod
        _mod._cache = None
        _mod._cache_ts = 0.0

        sample_html = (FIXTURES / "fundamentus_sample.html").read_bytes()

        with patch("urllib.request.urlopen", return_value=_make_response(sample_html)):
            result = fetch_fii_extras("HGLG11.SA")

        assert "ffoYield" in result
