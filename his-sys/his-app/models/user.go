package models

import (
	"time"

	"gorm.io/gorm"
)

// User 用户表
type User struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Username     string         `json:"username" gorm:"size:50;uniqueIndex;not null"`
	PasswordHash string         `json:"-" gorm:"size:255;not null"`
	RealName     string         `json:"real_name" gorm:"size:50"`
	Phone        string         `json:"phone" gorm:"size:20"`
	Email        string         `json:"email" gorm:"size:100"`
	OrgID        *uint          `json:"org_id" gorm:"index"`
	OrgType      string         `json:"org_type" gorm:"size:20;not null;comment:group|branch"`
	Status       int            `json:"status" gorm:"default:1;comment:1=active 0=disabled"`
	LastLoginAt  *time.Time     `json:"last_login_at"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	Org   *Organization `json:"org,omitempty" gorm:"foreignKey:OrgID"`
	Roles []Role        `json:"roles,omitempty" gorm:"many2many:user_roles;"`
}

func (User) TableName() string {
	return "users"
}
