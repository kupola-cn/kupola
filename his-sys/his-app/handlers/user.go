package handlers

import (
	"net/http"
	"strconv"

	"his-app/database"
	"his-app/middleware"
	"his-app/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct{}

type CreateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	RealName string `json:"real_name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	OrgID    *uint  `json:"org_id"`
	OrgType  string `json:"org_type" binding:"required"`
}

type UpdateUserRequest struct {
	RealName string `json:"real_name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
}

type AssignRolesRequest struct {
	RoleIDs []uint `json:"role_ids" binding:"required"`
}

// HandleList 用户列表
func (h *UserHandler) HandleList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	keyword := c.Query("keyword")
	orgID := c.Query("org_id")

	db := database.GetDB().Model(&models.User{})

	scope := middleware.GetDataScope(c)
	if !scope.AllData && scope.OrgID != nil {
		db = db.Where("org_id = ?", *scope.OrgID)
	}
	if orgID != "" {
		db = db.Where("org_id = ?", orgID)
	}
	if keyword != "" {
		db = db.Where("username LIKE ? OR real_name LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	db.Count(&total)

	var users []models.User
	db.Preload("Org").Preload("Roles").
		Offset((page - 1) * size).Limit(size).
		Order("id DESC").Find(&users)

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": gin.H{
			"list":  users,
			"total": total,
			"page":  page,
			"size":  size,
		},
	})
}

// HandleCreate 创建用户
func (h *UserHandler) HandleCreate(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	// 检查用户名是否已存在
	var count int64
	database.GetDB().Model(&models.User{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "用户名已存在"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "密码加密失败"})
		return
	}

	user := models.User{
		Username:     req.Username,
		PasswordHash: string(hash),
		RealName:     req.RealName,
		Phone:        req.Phone,
		Email:        req.Email,
		OrgID:        req.OrgID,
		OrgType:      req.OrgType,
		Status:       1,
	}

	if err := database.GetDB().Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "创建成功", "data": user})
}

// HandleGet 用户详情
func (h *UserHandler) HandleGet(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := database.GetDB().Preload("Org").Preload("Roles").First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": user})
}

// HandleUpdate 更新用户
func (h *UserHandler) HandleUpdate(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := database.GetDB().First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	database.GetDB().Model(&user).Updates(map[string]interface{}{
		"real_name": req.RealName,
		"phone":     req.Phone,
		"email":     req.Email,
	})

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "更新成功", "data": user})
}

// HandleDelete 删除用户（软删除）
func (h *UserHandler) HandleDelete(c *gin.Context) {
	id := c.Param("id")
	if err := database.GetDB().Delete(&models.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "删除成功"})
}

// HandleUpdateStatus 启用/禁用用户
func (h *UserHandler) HandleUpdateStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status int `json:"status" binding:"oneof=0 1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if err := database.GetDB().Model(&models.User{}).Where("id = ?", id).Update("status", req.Status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "操作失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "操作成功"})
}

// HandleAssignRoles 分配角色
func (h *UserHandler) HandleAssignRoles(c *gin.Context) {
	id := c.Param("id")
	var req AssignRolesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	var user models.User
	if err := database.GetDB().First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}

	var roles []models.Role
	database.GetDB().Where("id IN ?", req.RoleIDs).Find(&roles)

	database.GetDB().Model(&user).Association("Roles").Replace(&roles)

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "角色分配成功"})
}
