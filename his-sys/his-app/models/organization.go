package models

import "time"

// Organization 组织表（集团+分机构统一存储）
type Organization struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"size:100;not null"`
	OrgType   string    `json:"org_type" gorm:"size:20;not null;comment:group|branch"`
	ParentID  *uint     `json:"parent_id"`
	Address   string    `json:"address" gorm:"size:255"`
	Contact   string    `json:"contact" gorm:"size:50"`
	Phone     string    `json:"phone" gorm:"size:20"`
	Status    int       `json:"status" gorm:"default:1;comment:1=active 0=disabled"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Parent     *Organization  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children   []Organization `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Departments []Department  `json:"departments,omitempty" gorm:"foreignKey:OrgID"`
}

func (Organization) TableName() string {
	return "organizations"
}
