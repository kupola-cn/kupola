package middleware

import (
	"his-app/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// DataScope 数据权限范围
type DataScope struct {
	OrgID   *uint  // nil 表示不限制（集团管理层）
	OrgType string // group | branch
	AllData bool   // 是否可查看所有机构数据
}

// GetDataScope 获取当前用户的数据权限范围
func GetDataScope(c *gin.Context) DataScope {
	orgType := GetOrgType(c)
	orgID := GetOrgID(c)

	scope := DataScope{
		OrgID:   orgID,
		OrgType: orgType,
		AllData: false,
	}

	// 集团用户可查看所有数据
	if orgType == "group" {
		scope.AllData = true
		scope.OrgID = nil
	}

	return scope
}

// ApplyDataScope 对查询应用数据权限过滤
func ApplyDataScope(scope DataScope, db *gorm.DB) *gorm.DB {
	if scope.AllData {
		return db // 集团管理层，不限制
	}
	if scope.OrgID != nil {
		return db.Where("org_id = ?", *scope.OrgID)
	}
	return db
}

// CanWriteMaterial 判断是否可编辑耗材目录（仅集团可操作）
func CanWriteMaterial(c *gin.Context) bool {
	return GetOrgType(c) == "group"
}

// GetUserPermissions 获取用户权限码列表
func GetUserPermissions(db *gorm.DB, userID uint) ([]string, error) {
	var perms []string
	err := db.Model(&models.Permission{}).
		Joins("JOIN role_permissions ON role_permissions.permission_id = permissions.id").
		Joins("JOIN user_roles ON user_roles.role_id = role_permissions.role_id").
		Where("user_roles.user_id = ? AND permissions.status = 1", userID).
		Pluck("permissions.code", &perms).Error
	return perms, err
}
