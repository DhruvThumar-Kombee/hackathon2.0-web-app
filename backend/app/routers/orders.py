from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from opentelemetry import trace
import logging

from ..database import get_db
from ..models import Order, Product

router = APIRouter()
tracer = trace.get_tracer(__name__)
logger = logging.getLogger(__name__)

@router.post("/")
def create_order(user_id: int, product_id: int, quantity: int, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("orders.create") as span:
        span.set_attribute("order.user_id", user_id)
        span.set_attribute("order.product_id", product_id)

        with tracer.start_as_current_span("orders.validate_product"):
            product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")
            if product.stock < quantity:
                logger.warning("ORDER_FAILED_STOCK", extra={"product_id": product_id, "requested": quantity, "available": product.stock})
                raise HTTPException(status_code=400, detail="Insufficient stock")

        total_price = product.price * quantity

        with tracer.start_as_current_span("orders.db_insert"):
            order = Order(user_id=user_id, product_id=product_id,
                          quantity=quantity, total_price=total_price)
            product.stock -= quantity
            db.add(order)
            db.commit()
            db.refresh(order)

        logger.info("ORDER_CREATED", extra={"order_id": order.id, "total": total_price, "product_id": product_id})
        span.set_attribute("order.id", order.id)
        span.set_attribute("order.total", total_price)
        return {"id": order.id, "total_price": total_price, "status": order.status}

@router.get("/")
def list_orders(page: int = Query(1, ge=1), size: int = Query(10), db: Session = Depends(get_db)):
    with tracer.start_as_current_span("orders.list"):
        total = db.query(Order).count()
        orders = db.query(Order).offset((page-1)*size).limit(size).all()
        return {"items": [{"id": o.id, "user_id": o.user_id, "total_price": o.total_price, "status": o.status} for o in orders],
                "total": total, "page": page}
