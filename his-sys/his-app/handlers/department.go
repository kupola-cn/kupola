package handlers

import (
	"net/http"
	"strconv"

	"his-app/database"
	"his-app/middleware"
	"his-app/models"

	"github.com/gin-gonic/gin"
)

type DepartmentHandler struct{}

type CreateDeptRequest struct {
	OrgID uint   `json:"org_id" binding:"required"`
	Name  string `json:"name" binding:"required"`
	Code  string `json:"code" binding:"required"`
}

// HandleList 部门列表
func (h *DepartmentHandler) HandleList(c *gin.Context) {
	orgID := c.Query("org_id")

	db := database.GetDB().Model(&models.Department{})

	// 数据权限过滤
	scope := middleware.GetDataScope(c)
	if !scope.AllData && scope.OrgID != nil {
		db = db.Where("org_id = ?", *scope.OrgID)
	}
	if orgID != "" {
		db = db.Where("org_id = ?", orgID)
	}

	var depts []models.Department
	db.Preload("Org").Order("id ASC").Find(&depts)

	c.JSON(http.StatusOK, gin.H{"code": 0, "data": depts})
}

// HandleCreate 创建部门
func (h *DepartmentHandler) HandleCreate(c *gin.Context) {
	var req CreateDeptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	dept := models.Department{
		OrgID: req.OrgID,
		Name:  req.Name,
		Code:  req.Code,
		Status: 1,
	}

	if err := database.GetDB().Create(&dept).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "创建成功", "data": dept})
}

// HandleUpdate 更新部门
func (h *DepartmentHandler) HandleUpdate(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var dept models.Department
	if err := database.GetDB().First(&dept, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "部门不存在"})
		return
	}

	var req CreateDeptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	database.GetDB().Model(&dept).Updates(map[string]interface{}{
		"name": req.Name,
		"code": req.Code,
	})

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "更新成功", "data": dept})
}

// HandleDelete 删除部门
func (h *DepartmentHandler) HandleDelete(c *gin.Context) {
	id := c.Param("id")
	if err := database.GetDB().Delete(&models.Department{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "删除成功"})
}
