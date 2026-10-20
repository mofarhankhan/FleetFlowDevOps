from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


STATUSES = ["Pending", "Processing", "In Transit", "Delivered", "Cancelled"]


class ShipmentCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    origin: str = Field(min_length=2, max_length=180)
    destination: str = Field(min_length=2, max_length=180)
    status: str = "Pending"
    shipment_date: date = Field(default_factory=date.today)
    expected_delivery: date | None = None
    freight_cost: float = Field(default=0, ge=0)
    notes: str | None = Field(default=None, max_length=2000)


class ShipmentStatusUpdate(BaseModel):
    status: str


class ShipmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tracking_number: str
    customer_name: str
    origin: str
    destination: str
    status: str
    shipment_date: date
    expected_delivery: date | None
    freight_cost: float
    notes: str | None
    created_at: datetime | None = None


class InventoryCreate(BaseModel):
    sku: str = Field(min_length=2, max_length=40)
    name: str = Field(min_length=2, max_length=140)
    category: str = Field(default="General", min_length=2, max_length=80)
    quantity: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=10, ge=0)
    unit_price: float = Field(default=0, ge=0)


class InventoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=140)
    category: str | None = Field(default=None, min_length=2, max_length=80)
    quantity: int | None = Field(default=None, ge=0)
    reorder_level: int | None = Field(default=None, ge=0)
    unit_price: float | None = Field(default=None, ge=0)


class InventoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sku: str
    name: str
    category: str
    quantity: int
    reorder_level: int
    unit_price: float
    updated_at: datetime | None = None
