from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from opentelemetry import trace
from pydantic import BaseModel, Field
from typing import Optional
import logging, time, random

from ..database import get_db
from ..models import Product

router = APIRouter()
tracer = trace.get_tracer(__name__)
logger = logging.getLogger(__name__)

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1)
    price: float = Field(..., gt=0)
    category: str
    description: Optional[str] = ""
    stock: int = Field(0, ge=0)

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    category: Optional[str] = None
    description: Optional[str] = None

# ── ANOMALY FLAGS (flip these for Phase 4) ──
INJECT_DELAY      = False   # adds 2s artificial delay
INJECT_SLOW_QUERY = False   # uses LIKE on unindexed column
INJECT_RANDOM_500 = False   # throws 500 errors randomly

@router.get("/")
def list_products(
    page:     int   = Query(1, ge=1),
    size:     int   = Query(10, ge=1, le=100),
    category: str   = Query(None),
    search:   str   = Query(None),
    db: Session = Depends(get_db)
):
    with tracer.start_as_current_span("products.list") as span:
        span.set_attribute("pagination.page", page)
        span.set_attribute("pagination.size", size)
        if category: span.set_attribute("filter.category", category)
        if search:   span.set_attribute("filter.search", search)

        # ANOMALY: random 500 errors
        if INJECT_RANDOM_500 and random.random() < 0.3:
            logger.error("ANOMALY_RANDOM_500", extra={"endpoint": "/products"})
            raise HTTPException(status_code=500, detail="Random server error injected")

        # ANOMALY: artificial delay
        if INJECT_DELAY:
            with tracer.start_as_current_span("products.artificial_delay"):
                logger.warning("ANOMALY_DELAY_ACTIVE", extra={"delay_ms": 2000})
                time.sleep(2)

        with tracer.start_as_current_span("products.build_query"):
            query = db.query(Product).filter(Product.is_active == True)
            if category:
                query = query.filter(Product.category == category)
            if search:
                if INJECT_SLOW_QUERY:
                    # ANOMALY: full description scan — no index
                    with tracer.start_as_current_span("products.slow_query_LIKE"):
                        logger.warning("ANOMALY_SLOW_QUERY", extra={"type": "LIKE_full_scan"})
                        query = query.filter(Product.description.like(f"%{search}%"))
                else:
                    query = query.filter(Product.name.ilike(f"%{search}%"))

        with tracer.start_as_current_span("products.db_count"):
            total = query.count()

        with tracer.start_as_current_span("products.db_fetch"):
            items = query.offset((page - 1) * size).limit(size).all()

        with tracer.start_as_current_span("products.serialize"):
            result = [{"id": p.id, "name": p.name, "price": p.price,
                       "category": p.category, "stock": p.stock} for p in items]

        logger.info("PRODUCTS_LISTED", extra={"count": len(result), "total": total})
        span.set_attribute("result.count", len(result))
        span.set_attribute("result.total", total)

        return {"items": result, "total": total, "page": page,
                "size": size, "pages": max(1, (total + size - 1) // size)}

@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("products.get_one") as span:
        span.set_attribute("product.id", product_id)
        product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        logger.info("PRODUCT_VIEWED", extra={"product_id": product_id})
        return {"id": product.id, "name": product.name, "price": product.price,
                "category": product.category, "stock": product.stock, "description": product.description}

@router.post("/")
def create_product(req: ProductCreate, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("products.create") as span:
        span.set_attribute("product.name", req.name)

        with tracer.start_as_current_span("products.db_insert"):
            product = Product(
                name=req.name, 
                price=req.price, 
                category=req.category,
                description=req.description, 
                stock=req.stock
            )
            db.add(product)
            db.commit()
            db.refresh(product)

        logger.info("PRODUCT_CREATED", extra={"product_id": product.id, "name": req.name, "price": req.price})
        span.set_attribute("product.id", product.id)
        return {"id": product.id, "name": product.name, "price": product.price}

@router.put("/{product_id}")
def update_product(product_id: int, req: ProductUpdate, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("products.update") as span:
        span.set_attribute("product.id", product_id)
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        update_data = req.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(product, key, value)
            
        db.commit()
        logger.info("PRODUCT_UPDATED", extra={"product_id": product_id})
        return {"message": "Updated", "id": product_id}

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("products.delete") as span:
        span.set_attribute("product.id", product_id)
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        product.is_active = False
        db.commit()
        logger.info("PRODUCT_DELETED", extra={"product_id": product_id})
        return {"message": "Deleted"}
