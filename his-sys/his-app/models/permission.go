package models

// Permission 权限定义表
type Permission struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	Name     string `json:"name" gorm:"size:50;not null"`
	Code     string `json:"code" gorm:"size:100;uniqueIndex;not null"`
	Type     string `json:"type" gorm:"size:20;not null;comment:menu|button|data"`
	ParentID *uint  `json:"parent_id" gorm:"index"`
	Path     string `json:"path" gorm:"size:255;comment:frontend route path"`
	Icon     string `json:"icon" gorm:"size:50"`
	SortOrder int   `json:"sort_order" gorm:"default:0"`
	Status   int    `json:"status" gorm:"default:1"`

	Parent   *Permission  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children []Permission `json:"children,omitempty" gorm:"-"` // 非外键，手动查询组装
}

func (Permission) TableName() string {
	return "permissions"
}
