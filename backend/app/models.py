from datetime import date, datetime
from sqlalchemy import Date, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tracking_number: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(120), index=True)
    origin: Mapped[str] = mapped_column(String(180))
    destination: Mapped[str] = mapped_column(String(180))
    status: Mapped[str] = mapped_column(String(30), default="Pending", index=True)
    shipment_date: Mapped[date] = mapped_column(Date, default=date.today)
    expected_delivery: Mapped[date | None] = mapped_column(Date, nullable=True)
    freight_cost: Mapped[float] = mapped_column(Float, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sku: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(140), index=True)
    category: Mapped[str] = mapped_column(String(80), default="General")
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    reorder_level: Mapped[int] = mapped_column(Integer, default=10)
    unit_price: Mapped[float] = mapped_column(Float, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
