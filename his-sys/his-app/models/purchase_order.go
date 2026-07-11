package models

import "time"

// PurchaseOrder 采购订单
type PurchaseOrder struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	OrgID       uint      `json:"org_id" gorm:"not null;index"`
	SupplierID  uint      `json:"supplier_id" gorm:"not null;index"`
	OrderNo     string    `json:"order_no" gorm:"size:50;uniqueIndex;not null"`
	Status      int       `json:"status" gorm:"default:0;comment:0=draft 1=submitted 2=approved 3=received"`
	TotalAmount float64   `json:"total_amount" gorm:"default:0"`
	CreatedBy   uint      `json:"created_by"`
	Remark      string    `json:"remark" gorm:"size:255"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Org      *Organization `json:"org,omitempty" gorm:"foreignKey:OrgID"`
	Supplier *Supplier     `json:"supplier,omitempty" gorm:"foreignKey:SupplierID"`
	Creator  *User         `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Items    []PurchaseItem `json:"items,omitempty" gorm:"foreignKey:OrderID"`
}

func (PurchaseOrder) TableName() string {
	return "purchase_orders"
}

// PurchaseItem 采购明细
type PurchaseItem struct {
	ID         uint    `json:"id" gorm:"primaryKey"`
	OrderID    uint    `json:"order_id" gorm:"not null;index"`
	MaterialID uint    `json:"material_id" gorm:"not null;index"`
	Quantity   int     `json:"quantity" gorm:"not null"`
	UnitPrice  float64 `json:"unit_price" gorm:"not null"`
	Amount     float64 `json:"amount" gorm:"not null"`

	Material *Material `json:"material,omitempty" gorm:"foreignKey:MaterialID"`
}

func (PurchaseItem) TableName() string {
	return "purchase_items"
}
