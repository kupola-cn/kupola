package models

import "time"

// Supplier 供应商
type Supplier struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"size:100;not null"`
	Contact   string    `json:"contact" gorm:"size:50"`
	Phone     string    `json:"phone" gorm:"size:20"`
	Address   string    `json:"address" gorm:"size:255"`
	LicenseNo string    `json:"license_no" gorm:"size:100;comment:经营许可证号"`
	Status    int       `json:"status" gorm:"default:1"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Supplier) TableName() string {
	return "suppliers"
}
