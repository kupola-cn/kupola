package models

import "time"

// Inventory 库存
type Inventory struct {
	ID         uint       `json:"id" gorm:"primaryKey"`
	OrgID      uint       `json:"org_id" gorm:"not null;index"`
	MaterialID uint       `json:"material_id" gorm:"not null;index"`
	BatchNo    string     `json:"batch_no" gorm:"size:50"`
	Quantity   int        `json:"quantity" gorm:"default:0"`
	ExpiryDate *time.Time `json:"expiry_date"`
	Location   string     `json:"location" gorm:"size:100;comment:存放位置"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`

	Org      *Organization `json:"org,omitempty" gorm:"foreignKey:OrgID"`
	Material *Material     `json:"material,omitempty" gorm:"foreignKey:MaterialID"`
}

func (Inventory) TableName() string {
	return "inventories"
}
