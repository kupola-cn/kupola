package models

import "time"

// Department 部门表
type Department struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	OrgID     uint      `json:"org_id" gorm:"not null;index"`
	Name      string    `json:"name" gorm:"size:100;not null"`
	Code      string    `json:"code" gorm:"size:50;uniqueIndex"`
	Status    int       `json:"status" gorm:"default:1"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Org *Organization `json:"org,omitempty" gorm:"foreignKey:OrgID"`
}

func (Department) TableName() string {
	return "departments"
}
