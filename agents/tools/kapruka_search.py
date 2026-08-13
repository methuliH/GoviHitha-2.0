"""Kapruka search link generator."""
from __future__ import annotations

from urllib.parse import quote_plus


def kapruka_link(product_name: str) -> str:
    """Return a Kapruka search URL for the given product name."""
    return f"https://www.kapruka.com/search?q={quote_plus(product_name)}"
