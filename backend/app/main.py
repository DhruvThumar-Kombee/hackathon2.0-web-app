from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry import metrics as otel_metrics
from contextlib import asynccontextmanager
import time, logging

from .database import engine, Base, SessionLocal
from .models import User, Product
from .utils.logger import setup_logging
from .middleware.telemetry import setup_telemetry
from .routers import auth, products, orders, anomalies

setup_logging()
logger = logging.getLogger(__name__)

def seed_data():
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            logger.info("SEEDING_DATA")
            demo_products = [
                Product(name="Neural Core X1", price=125000, category="Processing", stock=5, description="High-performance AI processing unit"),
                Product(name="Quantum Flux Capacitor", price=450000, category="Energy", stock=2, description="Stabilizes temporal anomalies"),
                Product(name="Bio-Data Bridge", price=85000, category="Connectivity", stock=12, description="Direct neural interface module"),
                Product(name="Void Shield Generator", price=890000, category="Defense", stock=1, description="Phase-shift protective barrier"),
                Product(name="Isotope Battery", price=12000, category="Energy", stock=50, description="Long-lasting compact power cell"),
                Product(name="Optic Sensory Array", price=34000, category="Sensing", stock=8, description="Multi-spectral vision enhancement"),
                Product(name="Cryo-Storage Unit", price=156000, category="Storage", stock=3, description="Sub-zero artifact preservation"),
                Product(name="Nano-Repair Swarm", price=210000, category="Maintenance", stock=4, description="Autonomous structure restoration drones"),
            ]
            db.bulk_save_objects(demo_products)
            db.commit()
            logger.info("SEEDING_COMPLETED", extra={"count": len(demo_products)})
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_data()
    logger.info("APPLICATION_STARTED", extra={"event": "startup"})
    yield
    logger.info("APPLICATION_SHUTDOWN", extra={"event": "shutdown"})

app = FastAPI(title="Hackathon API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Setup OTel BEFORE routes
tracer = setup_telemetry(app, engine)

# Expose /metrics for Prometheus
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# Business metrics
meter = otel_metrics.get_meter("hackathon.business")
login_failures_counter  = meter.create_counter("login_failures_total",  description="Login failures")
active_users_gauge      = meter.create_gauge("active_users_total",       description="Active users")
order_value_histogram   = meter.create_histogram("order_value",          description="Order value distribution")

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = float(f"{(time.time() - start) * 1000:.2f}")
    level = "warning" if response.status_code >= 400 else "info"
    # Track active users (simplified as unique IPs for demo)
    active_users_gauge.set(1, {"client_ip": request.client.host if request.client else "unknown"})
    
    if response.status_code == 401 and "/login" in request.url.path:
        login_failures_counter.add(1, {"method": request.method})

    getattr(logger, level)("HTTP_REQUEST", extra={
        "method":      request.method,
        "path":        request.url.path,
        "status_code": response.status_code,
        "duration_ms": duration_ms,
        "client_ip":   request.client.host if request.client else "unknown"
    })
    return response

from .routers import auth, products, orders, anomalies

# ... existing imports ...

app.include_router(auth.router,     prefix="/api/auth",     tags=["auth"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(orders.router,   prefix="/api/orders",   tags=["orders"])
app.include_router(anomalies.router, prefix="/api/anomalies", tags=["anomalies"])

@app.get("/health")
def health():
    return {"status": "healthy", "service": "hackathon-api"}
