package handlers

import (
	"net/http"
	"time"

	"his-app/database"
	"his-app/middleware"
	"his-app/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct{}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type PasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// HandleLogin 登录
func (h *AuthHandler) HandleLogin(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	var user models.User
	if err := database.GetDB().Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "用户名或密码错误"})
		return
	}

	if user.Status != 1 {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "账号已被禁用"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "用户名或密码错误"})
		return
	}

	// 更新最后登录时间
	now := time.Now()
	database.GetDB().Model(&user).Update("last_login_at", &now)

	// 生成 token
	token, err := middleware.GenerateToken(user.ID, user.OrgID, user.OrgType, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "令牌生成失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "登录成功",
		"data": gin.H{
			"token":    token,
			"user_id":  user.ID,
			"username": user.Username,
			"real_name": user.RealName,
			"org_type": user.OrgType,
		},
	})
}

// HandleLogout 登出（前端清除 token 即可，后端仅返回成功）
func (h *AuthHandler) HandleLogout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "登出成功"})
}

// HandleProfile 获取当前用户信息
func (h *AuthHandler) HandleProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var user models.User
	if err := database.GetDB().Preload("Roles").Preload("Org").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}

	// 获取权限码
	perms, _ := middleware.GetUserPermissions(database.GetDB(), userID)

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": gin.H{
			"user":        user,
			"permissions": perms,
		},
	})
}

// HandleChangePassword 修改密码
func (h *AuthHandler) HandleChangePassword(c *gin.Context) {
	var req PasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误，新密码至少6位"})
		return
	}

	userID := middleware.GetUserID(c)
	var user models.User
	if err := database.GetDB().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "原密码错误"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "密码加密失败"})
		return
	}

	database.GetDB().Model(&user).Update("password_hash", string(hash))
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "密码修改成功"})
}
