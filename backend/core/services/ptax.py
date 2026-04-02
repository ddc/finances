import requests
import time
from datetime import datetime
from decimal import Decimal
from django.conf import settings

_cache = {"compra": None, "venda": None, "fetched_at": 0.0}


def get_ptax_rate():
    now = time.time()
    if _cache["compra"] is not None and (now - _cache["fetched_at"]) < settings.PTAX_CACHE_TTL_SECONDS:
        return _cache
    try:
        today = datetime.now().strftime("%m-%d-%Y")
        url = f"{settings.PTAX_API_URL}(dataCotacao=@dataCotacao)?@dataCotacao='{today}'&$format=json"
        settings.LOG.info(f"Fetching PTAX rate for {today}")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        values = data.get("value", [])
        if not values:
            settings.LOG.warning("PTAX API returned empty response")
            return _cache if _cache["compra"] else None
        latest = values[-1]
        _cache["compra"] = Decimal(str(latest["cotacaoCompra"]))
        _cache["venda"] = Decimal(str(latest["cotacaoVenda"]))
        _cache["fetched_at"] = now
        settings.LOG.info(f"PTAX rates updated: compra={_cache['compra']}, venda={_cache['venda']}")
        return _cache
    except Exception as e:  # noqa: BLE001
        settings.LOG.error(f"Failed to fetch PTAX rate: {e}")
        return _cache if _cache["compra"] else None
