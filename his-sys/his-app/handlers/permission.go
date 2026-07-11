package handlers

import (
	"net/http"

	"his-app/database"
	"his-app/middleware"
	"his-app/models"

	"github.com/gin-gonic/gin"
)

type PermissionHandler struct{}

// HandleList 权限树
func (h *PermissionHandler) HandleList(c *gin.Context) {
	var perms []models.Permission
	database.GetDB().Where("status = 1").Order("sort_order ASC, id ASC").Find(&perms)

	tree := buildPermTree(perms, 0)
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": tree})
}

func buildPermTree(perms []models.Permission, parentID uint) []models.Permission {
	var tree []models.Permission
	for _, p := range perms {
		pid := uint(0)
		if p.ParentID != nil {
			pid = *p.ParentID
		}
		if pid == parentID {
			p.Children = buildPermTree(perms, p.ID)
			tree = append(tree, p)
		}
	}
	return tree
}

// HandleMenus 获取当前用户菜单
func (h *PermissionHandler) HandleMenus(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// 查询用户角色关联的菜单权限
	var perms []models.Permission
	database.GetDB().
		Joins("JOIN role_permissions ON role_permissions.permission_id = permissions.id").
		Joins("JOIN user_roles ON user_roles.role_id = role_permissions.role_id").
		Where("user_roles.user_id = ? AND permissions.type = ? AND permissions.status = 1", userID, "menu").
		Order("permissions.sort_order ASC").
		Find(&perms)

	tree := buildPermTree(perms, 0)
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": tree})
}
