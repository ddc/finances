import requests
import time
from datetime import datetime
from decimal import Decimal
from django.conf import settings

_cache = {"rate": None, "fetched_at": 0.0}


def get_ptax_rate():
    now = time.time()
    if _cache["rate"] is not None and (now - _cache["fetched_at"]) < settings.PTAX_CACHE_TTL_SECONDS:
        return _cache["rate"]
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
            return _cache["rate"]
        rate = Decimal(str(values[-1]["cotacaoVenda"]))
        _cache["rate"] = rate
        _cache["fetched_at"] = now
        settings.LOG.info(f"PTAX rate updated: {rate}")
        return rate
    except Exception as e:  # noqa: BLE001
        settings.LOG.error(f"Failed to fetch PTAX rate: {e}")
        return _cache["rate"]
