"""
Tests for api/services/fii_service.py — the segmento classification (investidor10
Tipo de Fundo overrides ANBIMA Segmento) and the fundamentus-before-statusinvest
enrichment priority.
"""
from unittest.mock import patch
from api.models import FIIData
from api.services.fii_service import get_fii


def _fii(**overrides):
    base = dict(ticker="MXRF11", name="Maxi Renda", price=9.67)
    base.update(overrides)
    return FIIData(**base)


def test_tipo_papel_forces_segmento_papel_cri_even_if_segmento_raw_differs():
    with patch("api.services.fii_service.cache_get", return_value=None), \
         patch("api.services.fii_service.cache_set"), \
         patch("api.services.fii_service.yf_adapter.fetch_fii", return_value=_fii()), \
         patch("api.services.fii_service.inv10_adapter.fetch_fii_classification",
               return_value={"tipo": "Papel", "segmentoRaw": "Híbrido"}), \
         patch("api.services.fii_service.fu_adapter.fetch_fii_extras", return_value={}), \
         patch("api.services.fii_service.si_adapter.fetch_fii_extras", return_value={}):
        fii = get_fii("MXRF11")

    assert fii.segmento == "Papel/CRI"


def test_tipo_outro_falls_back_to_normalized_segmento_raw():
    with patch("api.services.fii_service.cache_get", return_value=None), \
         patch("api.services.fii_service.cache_set"), \
         patch("api.services.fii_service.yf_adapter.fetch_fii", return_value=_fii(ticker="KNCA11")), \
         patch("api.services.fii_service.inv10_adapter.fetch_fii_classification",
               return_value={"tipo": "Outro", "segmentoRaw": "Fiagros"}), \
         patch("api.services.fii_service.fu_adapter.fetch_fii_extras", return_value={}), \
         patch("api.services.fii_service.si_adapter.fetch_fii_extras", return_value={}):
        fii = get_fii("KNCA11")

    assert fii.segmento == "Fiagro"


def test_classification_unavailable_leaves_segmento_for_fundamentus_fallback():
    with patch("api.services.fii_service.cache_get", return_value=None), \
         patch("api.services.fii_service.cache_set"), \
         patch("api.services.fii_service.yf_adapter.fetch_fii", return_value=_fii(ticker="HGLG11")), \
         patch("api.services.fii_service.inv10_adapter.fetch_fii_classification", return_value={}), \
         patch("api.services.fii_service.fu_adapter.fetch_fii_extras",
               return_value={"segmento": "Logística", "ffoYield": 0.0647}), \
         patch("api.services.fii_service.si_adapter.fetch_fii_extras", return_value={}):
        fii = get_fii("HGLG11")

    assert fii.segmento == "Logística"
    assert fii.ffoYield == 0.0647


def test_fundamentus_takes_priority_over_statusinvest():
    with patch("api.services.fii_service.cache_get", return_value=None), \
         patch("api.services.fii_service.cache_set"), \
         patch("api.services.fii_service.yf_adapter.fetch_fii", return_value=_fii(ticker="HGLG11")), \
         patch("api.services.fii_service.inv10_adapter.fetch_fii_classification", return_value={}), \
         patch("api.services.fii_service.fu_adapter.fetch_fii_extras",
               return_value={"vacancia": 0.0323}) as mock_fu, \
         patch("api.services.fii_service.si_adapter.fetch_fii_extras",
               return_value={"vacancia": 0.5}) as mock_si:
        fii = get_fii("HGLG11")

    assert fii.vacancia == 0.0323
    mock_fu.assert_called_once()
    mock_si.assert_called_once()  # still called for other still-missing fields


def test_statusinvest_fills_whatever_fundamentus_still_misses():
    with patch("api.services.fii_service.cache_get", return_value=None), \
         patch("api.services.fii_service.cache_set"), \
         patch("api.services.fii_service.yf_adapter.fetch_fii", return_value=_fii(ticker="HGLG11")), \
         patch("api.services.fii_service.inv10_adapter.fetch_fii_classification", return_value={}), \
         patch("api.services.fii_service.fu_adapter.fetch_fii_extras", return_value={}), \
         patch("api.services.fii_service.si_adapter.fetch_fii_extras",
               return_value={"pvp": 0.91}):
        fii = get_fii("HGLG11")

    assert fii.pvp == 0.91


def test_cache_hit_skips_all_adapters():
    cached = _fii(segmento="Papel/CRI").model_dump()
    with patch("api.services.fii_service.cache_get", return_value=cached), \
         patch("api.services.fii_service.yf_adapter.fetch_fii") as mock_yf, \
         patch("api.services.fii_service.inv10_adapter.fetch_fii_classification") as mock_inv10, \
         patch("api.services.fii_service.fu_adapter.fetch_fii_extras") as mock_fu, \
         patch("api.services.fii_service.si_adapter.fetch_fii_extras") as mock_si:
        fii = get_fii("MXRF11")

    assert fii.segmento == "Papel/CRI"
    mock_yf.assert_not_called()
    mock_inv10.assert_not_called()
    mock_fu.assert_not_called()
    mock_si.assert_not_called()
