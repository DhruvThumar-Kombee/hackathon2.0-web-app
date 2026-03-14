from fastapi import APIRouter
from . import products

router = APIRouter()

@router.post("/toggle-delay")
def toggle_delay(enabled: bool):
    products.INJECT_DELAY = enabled
    return {"inject_delay": products.INJECT_DELAY}

@router.post("/toggle-slow-query")
def toggle_slow_query(enabled: bool):
    products.INJECT_SLOW_QUERY = enabled
    return {"inject_slow_query": products.INJECT_SLOW_QUERY}

@router.post("/toggle-errors")
def toggle_errors(enabled: bool):
    products.INJECT_RANDOM_500 = enabled
    return {"inject_random_500": products.INJECT_RANDOM_500}

@router.get("/status")
def get_status():
    return {
        "inject_delay": products.INJECT_DELAY,
        "inject_slow_query": products.INJECT_SLOW_QUERY,
        "inject_random_500": products.INJECT_RANDOM_500
    }
