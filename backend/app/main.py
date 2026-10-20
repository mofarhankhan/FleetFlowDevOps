import os
import secrets
from datetime import date, timedelta
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from .models import InventoryItem, Shipment
from .schemas import (
    InventoryCreate, InventoryOut, InventoryUpdate, ShipmentCreate,
    ShipmentOut, ShipmentStatusUpdate, STATUSES,
)

app = FastAPI(
    title="FleetFlow Logistics API",
    description="REST API for shipment operations, tracking, dashboard metrics, and inventory.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def make_tracking_number(db: Session) -> str:
    while True:
        candidate = f"FF-{secrets.randbelow(900000) + 100000}"
        if db.scalar(select(Shipment.id).where(Shipment.tracking_number == candidate)) is None:
            return candidate


def seed_database(db: Session) -> None:
    if db.scalar(select(func.count(InventoryItem.id))) == 0:
        db.add_all([
            InventoryItem(sku="ELEC-100", name="Wireless Barcode Scanner", category="Electronics", quantity=42, reorder_level=12, unit_price=79.99),
            InventoryItem(sku="PACK-210", name="Heavy-Duty Shipping Carton", category="Packaging", quantity=180, reorder_level=40, unit_price=2.50),
            InventoryItem(sku="SAFE-330", name="Protective Work Gloves", category="Safety", quantity=8, reorder_level=15, unit_price=11.25),
            InventoryItem(sku="LABEL-410", name="Thermal Shipping Labels", category="Packaging", quantity=24, reorder_level=20, unit_price=8.75),
            InventoryItem(sku="PAL-500", name="Reusable Shipping Pallet", category="Warehouse", quantity=65, reorder_level=15, unit_price=18.00),
        ])
        db.commit()

    if db.scalar(select(func.count(Shipment.id))) == 0:
        today = date.today()
        demo = [
            Shipment(tracking_number="FF-10001", customer_name="Northstar Retail", origin="Delhi, India", destination="Jaipur, India", status="In Transit", shipment_date=today - timedelta(days=1), expected_delivery=today + timedelta(days=1), freight_cost=1850, notes="Handle cartons with care."),
            Shipment(tracking_number="FF-10002", customer_name="Urban Home Supplies", origin="Mumbai, India", destination="Pune, India", status="Processing", shipment_date=today, expected_delivery=today + timedelta(days=2), freight_cost=950, notes="Warehouse dispatch pending."),
            Shipment(tracking_number="FF-10003", customer_name="BluePeak Electronics", origin="Bengaluru, India", destination="Hyderabad, India", status="Delivered", shipment_date=today - timedelta(days=4), expected_delivery=today - timedelta(days=2), freight_cost=2400, notes="Delivered to receiving dock."),
        ]
        db.add_all(demo)
        db.commit()


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    with next(get_db()) as db:
        seed_database(db)


@app.get("/health", tags=["System"])
def health(db: Session = Depends(get_db)):
    db.execute(select(1))
    return {"status": "ok", "database": "connected", "application": "FleetFlow"}


@app.get("/dashboard", tags=["Dashboard"])
def dashboard(db: Session = Depends(get_db)):
    total_shipments = db.scalar(select(func.count(Shipment.id))) or 0
    in_transit = db.scalar(select(func.count(Shipment.id)).where(Shipment.status == "In Transit")) or 0
    delivered = db.scalar(select(func.count(Shipment.id)).where(Shipment.status == "Delivered")) or 0
    pending = db.scalar(select(func.count(Shipment.id)).where(Shipment.status.in_(["Pending", "Processing"]))) or 0
    inventory_count = db.scalar(select(func.count(InventoryItem.id))) or 0
    low_stock = db.scalar(select(func.count(InventoryItem.id)).where(InventoryItem.quantity <= InventoryItem.reorder_level)) or 0
    revenue = db.scalar(select(func.coalesce(func.sum(Shipment.freight_cost), 0)).where(Shipment.status != "Cancelled")) or 0
    recent = db.scalars(select(Shipment).order_by(Shipment.created_at.desc(), Shipment.id.desc()).limit(5)).all()
    return {
        "total_shipments": total_shipments,
        "in_transit": in_transit,
        "delivered": delivered,
        "pending": pending,
        "inventory_items": inventory_count,
        "low_stock_items": low_stock,
        "freight_value": round(float(revenue), 2),
        "recent_shipments": [ShipmentOut.model_validate(item).model_dump(mode="json") for item in recent],
    }


@app.get("/shipments", response_model=list[ShipmentOut], tags=["Shipments"])
def list_shipments(
    search: str = Query(default="", max_length=120),
    status: str = Query(default="", max_length=30),
    db: Session = Depends(get_db),
):
    stmt = select(Shipment)
    if search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(or_(
            Shipment.tracking_number.ilike(term),
            Shipment.customer_name.ilike(term),
            Shipment.origin.ilike(term),
            Shipment.destination.ilike(term),
        ))
    if status:
        if status not in STATUSES:
            raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(STATUSES)}")
        stmt = stmt.where(Shipment.status == status)
    return db.scalars(stmt.order_by(Shipment.created_at.desc(), Shipment.id.desc())).all()


@app.post("/shipments", response_model=ShipmentOut, status_code=201, tags=["Shipments"])
def create_shipment(payload: ShipmentCreate, db: Session = Depends(get_db)):
    if payload.status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(STATUSES)}")
    if payload.expected_delivery and payload.expected_delivery < payload.shipment_date:
        raise HTTPException(status_code=400, detail="Expected delivery cannot be before shipment date.")
    item = Shipment(tracking_number=make_tracking_number(db), **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.get("/shipments/{shipment_id}", response_model=ShipmentOut, tags=["Shipments"])
def get_shipment(shipment_id: int, db: Session = Depends(get_db)):
    item = db.get(Shipment, shipment_id)
    if not item:
        raise HTTPException(status_code=404, detail="Shipment not found.")
    return item


@app.patch("/shipments/{shipment_id}/status", response_model=ShipmentOut, tags=["Shipments"])
def update_shipment_status(shipment_id: int, payload: ShipmentStatusUpdate, db: Session = Depends(get_db)):
    if payload.status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(STATUSES)}")
    item = db.get(Shipment, shipment_id)
    if not item:
        raise HTTPException(status_code=404, detail="Shipment not found.")
    item.status = payload.status
    db.commit()
    db.refresh(item)
    return item


@app.get("/tracking/{tracking_number}", response_model=ShipmentOut, tags=["Tracking"])
def track_shipment(tracking_number: str, db: Session = Depends(get_db)):
    item = db.scalar(select(Shipment).where(Shipment.tracking_number == tracking_number.upper().strip()))
    if not item:
        raise HTTPException(status_code=404, detail="No shipment found for that tracking number.")
    return item


@app.get("/inventory", response_model=list[InventoryOut], tags=["Inventory"])
def list_inventory(
    search: str = Query(default="", max_length=120),
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
):
    stmt = select(InventoryItem)
    if search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(or_(InventoryItem.sku.ilike(term), InventoryItem.name.ilike(term), InventoryItem.category.ilike(term)))
    if low_stock_only:
        stmt = stmt.where(InventoryItem.quantity <= InventoryItem.reorder_level)
    return db.scalars(stmt.order_by(InventoryItem.name.asc())).all()


@app.post("/inventory", response_model=InventoryOut, status_code=201, tags=["Inventory"])
def create_inventory_item(payload: InventoryCreate, db: Session = Depends(get_db)):
    item = InventoryItem(**{**payload.model_dump(), "sku": payload.sku.strip().upper()})
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That SKU already exists.")
    db.refresh(item)
    return item


@app.patch("/inventory/{item_id}", response_model=InventoryOut, tags=["Inventory"])
def update_inventory_item(item_id: int, payload: InventoryUpdate, db: Session = Depends(get_db)):
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@app.delete("/inventory/{item_id}", status_code=204, tags=["Inventory"])
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    db.delete(item)
    db.commit()
    return None
