package models

import "time"

// Role 角色表
type Role struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	OrgID       *uint     `json:"org_id" gorm:"index;comment:nil=system preset"`
	Name        string    `json:"name" gorm:"size:50;not null"`
	Code        string    `json:"code" gorm:"size:50;uniqueIndex;not null"`
	Description string    `json:"description" gorm:"size:255"`
	IsSystem    bool      `json:"is_system" gorm:"default:false;comment:system preset role"`
	Status      int       `json:"status" gorm:"default:1"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Org         *Organization `json:"org,omitempty" gorm:"foreignKey:OrgID"`
	Permissions []Permission  `json:"permissions,omitempty" gorm:"many2many:role_permissions;"`
}

func (Role) TableName() string {
	return "roles"
}
