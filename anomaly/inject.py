import time, sys

BASE_URL = "http://localhost:8000"

def set_anomaly(name, value):
    # This script would ideally wrap a call to an internal endpoint or just be a reference
    # For this hackathon, we manually edit products.py toggles as instructed.
    print(f"To inject {name}={value}, edit backend/app/routers/products.py")

if __name__ == "__main__":
    print("Anomaly injection script - use to trigger scenarios")
    # Example usage:
    # set_anomaly("INJECT_DELAY", True)
