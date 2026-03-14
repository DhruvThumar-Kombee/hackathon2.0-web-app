import logging
import sys
import os

def check_backend():
    print("--- Backend Health Check ---")
    
    # 1. Check Python version
    print(f"Python version: {sys.version}")
    
    # 2. Check imports
    critical_imports = [
        "fastapi",
        "sqlalchemy",
        "psycopg2",
        "opentelemetry",
        "opentelemetry.trace",
        "prometheus_fastapi_instrumentator",
        "pythonjsonlogger"
    ]
    
    for imp in critical_imports:
        try:
            __import__(imp)
            print(f"✅ Import successful: {imp}")
        except ImportError as e:
            print(f"❌ Import FAILED: {imp} - {e}")
            return False

    # 3. Check environment
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        print(f"✅ DATABASE_URL is set")
    else:
        print(f"⚠️  DATABASE_URL is not set (will default to localhost/db)")

    print("--- Backend health check PASSED ---")
    return True

if __name__ == "__main__":
    if check_backend():
        sys.exit(0)
    else:
        sys.exit(1)
