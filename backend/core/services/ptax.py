import requests
import time
from datetime import datetime, timedelta
from decimal import Decimal
from django.conf import settings

# Per-currency cache: { "USD": {"compra": ..., "venda": ..., "fetched_at": ...}, ... }
_cache: dict[str, dict] = {}

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
        base_url = settings.PTAX_API_URL
        today = datetime.now()
        start_date = (today - timedelta(days=7)).strftime("%m-%d-%Y")
        end_date = today.strftime("%m-%d-%Y")

        if currency == "USD":
            url = (
                base_url + "/CotacaoDolarPeriodo(dataInicial=@di,dataFinalCotacao=@df)"
                "?@di='" + start_date + "'&@df='" + end_date + "'"
                "&$format=json&$top=1&$orderby=dataHoraCotacao%20desc"
            )
        else:
            url = (
                base_url + "/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@di,dataFinalCotacao=@df)"
                "?@moeda='" + CURRENCY_CODES[currency] + "'"
                "&@di='" + start_date + "'&@df='" + end_date + "'"
                "&$format=json&$top=1&$orderby=dataHoraCotacao%20desc"
            )

        settings.LOG.info("Fetching PTAX rate for " + currency + " (" + start_date + " to " + end_date + ")")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        values = data.get("value", [])

        if not values:
            settings.LOG.warning("PTAX API returned empty response for " + currency)
            return cached if cached and cached.get("compra") else None

        latest = values[0]
        result = {
            "compra": Decimal(str(latest["cotacaoCompra"])),
            "venda": Decimal(str(latest["cotacaoVenda"])),
            "data_hora": latest.get("dataHoraCotacao", ""),
            "fetched_at": now,
        }
        _cache[currency] = result
        settings.LOG.info(
            "PTAX " + currency + " rates: compra=" + str(result["compra"]) + ", venda=" + str(result["venda"])
        )
        return result
    except Exception as e:  # noqa: BLE001
        settings.LOG.error("Failed to fetch PTAX rate for " + currency + ": " + str(e))
        return cached if cached and cached.get("compra") else None
