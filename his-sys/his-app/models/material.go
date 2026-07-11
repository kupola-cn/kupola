package models

import "time"

// Material 耗材目录
type Material struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	Name           string    `json:"name" gorm:"size:100;not null"`
	Code           string    `json:"code" gorm:"size:50;uniqueIndex;not null"`
	Spec           string    `json:"spec" gorm:"size:100;comment:规格型号"`
	Unit           string    `json:"unit" gorm:"size:20;not null"`
	Category       string    `json:"category" gorm:"size:50;comment:分类"`
	Manufacturer   string    `json:"manufacturer" gorm:"size:100;comment:生产厂家"`
	RegistrationNo string    `json:"registration_no" gorm:"size:100;comment:注册证号"`
	Status         int       `json:"status" gorm:"default:1"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (Material) TableName() string {
	return "materials"
}
