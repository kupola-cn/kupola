package handlers

import (
	"net/http"
	"strconv"

	"his-app/database"
	"his-app/models"

	"github.com/gin-gonic/gin"
)

type RoleHandler struct{}

type CreateRoleRequest struct {
	Name        string `json:"name" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Description string `json:"description"`
	OrgID       *uint  `json:"org_id"`
}

type AssignPermissionsRequest struct {
	PermissionIDs []uint `json:"permission_ids" binding:"required"`
}

// HandleList 角色列表
func (h *RoleHandler) HandleList(c *gin.Context) {
	orgID := c.Query("org_id")

	db := database.GetDB().Model(&models.Role{})
	if orgID != "" {
		// 查询该系统角色 + 该组织自定义角色
		db = db.Where("org_id IS NULL OR org_id = ?", orgID)
	}

	var roles []models.Role
	db.Preload("Permissions").Order("id ASC").Find(&roles)

	c.JSON(http.StatusOK, gin.H{"code": 0, "data": roles})
}

// HandleCreate 创建角色
func (h *RoleHandler) HandleCreate(c *gin.Context) {
	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	role := models.Role{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		OrgID:       req.OrgID,
		IsSystem:    false,
		Status:      1,
	}

	if err := database.GetDB().Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "创建成功", "data": role})
}

// HandleUpdate 更新角色
func (h *RoleHandler) HandleUpdate(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var role models.Role
	if err := database.GetDB().First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "角色不存在"})
		return
	}

	if role.IsSystem {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "系统预设角色不可编辑"})
		return
	}

	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	database.GetDB().Model(&role).Updates(map[string]interface{}{
		"name":        req.Name,
		"description": req.Description,
	})

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "更新成功", "data": role})
}

// HandleDelete 删除角色
func (h *RoleHandler) HandleDelete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var role models.Role
	if err := database.GetDB().First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "角色不存在"})
		return
	}

	if role.IsSystem {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "系统预设角色不可删除"})
		return
	}

	database.GetDB().Delete(&role)
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "删除成功"})
}

// HandleAssignPermissions 分配权限
func (h *RoleHandler) HandleAssignPermissions(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var role models.Role
	if err := database.GetDB().Preload("Permissions").First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "角色不存在"})
		return
	}

	var req AssignPermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	var perms []models.Permission
	database.GetDB().Where("id IN ?", req.PermissionIDs).Find(&perms)

	database.GetDB().Model(&role).Association("Permissions").Replace(&perms)

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "权限分配成功"})
}

// HandleGetPermissions 获取角色已有权限
func (h *RoleHandler) HandleGetPermissions(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var role models.Role
	if err := database.GetDB().Preload("Permissions").First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "角色不存在"})
		return
	}

	var permIDs []uint
	for _, p := range role.Permissions {
		permIDs = append(permIDs, p.ID)
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "data": permIDs})
}
