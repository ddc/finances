import requests
import time
from datetime import datetime
from decimal import Decimal
from django.conf import settings

# Per-currency cache: { "USD": {"compra": ..., "venda": ..., "fetched_at": ...}, ... }
_cache: dict[str, dict] = {}

# BCB currency codes for the CotacaoMoedaDia endpoint
CURRENCY_CODES = {
    "USD": "USD",
    "EUR": "EUR",
    "GBP": "GBP",
    "CAD": "CAD",
    "AUD": "AUD",
}


def get_ptax_rate(currency: str = "USD"):
    currency = currency.upper()
    if currency not in CURRENCY_CODES:
        return None

    now = time.time()
    cached = _cache.get(currency)
    if cached and cached.get("compra") is not None and (now - cached["fetched_at"]) < settings.PTAX_CACHE_TTL_SECONDS:
        return cached

    try:
        today = datetime.now().strftime("%m-%d-%Y")

        base_url = settings.PTAX_API_URL
        if currency == "USD":
            url = f"{base_url}/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='{today}'&$format=json"
        else:
            url = (
                f"{base_url}/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)"
                f"?@moeda='{CURRENCY_CODES[currency]}'&@dataCotacao='{today}'&$format=json"
            )

        settings.LOG.info(f"Fetching PTAX rate for {currency} on {today}")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        values = data.get("value", [])
        if not values:
            settings.LOG.warning(f"PTAX API returned empty response for {currency}")
            return cached if cached and cached.get("compra") else None

        latest = values[-1]
        result = {
            "compra": Decimal(str(latest["cotacaoCompra"])),
            "venda": Decimal(str(latest["cotacaoVenda"])),
            "fetched_at": now,
        }
        _cache[currency] = result
        settings.LOG.info(f"PTAX {currency} rates updated: compra={result['compra']}, venda={result['venda']}")
        return result
    except Exception as e:  # noqa: BLE001
        settings.LOG.error(f"Failed to fetch PTAX rate for {currency}: {e}")
        return cached if cached and cached.get("compra") else None
