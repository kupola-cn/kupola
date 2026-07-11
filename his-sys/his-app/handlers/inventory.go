package handlers

import (
	"net/http"
	"strconv"

	"his-app/database"
	"his-app/middleware"
	"his-app/models"

	"github.com/gin-gonic/gin"
)

type InventoryHandler struct{}

// HandleList 库存列表（数据权限过滤）
func (h *InventoryHandler) HandleList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	materialID := c.Query("material_id")

	db := database.GetDB().Model(&models.Inventory{})

	// 数据权限：分机构只能看自己的库存
	scope := middleware.GetDataScope(c)
	db = middleware.ApplyDataScope(scope, db)

	if materialID != "" {
		db = db.Where("material_id = ?", materialID)
	}

	var total int64
	db.Count(&total)

	var inventories []models.Inventory
	db.Preload("Material").Preload("Org").
		Offset((page - 1) * size).Limit(size).
		Order("id DESC").Find(&inventories)

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": gin.H{
			"list":  inventories,
			"total": total,
		},
	})
}

// HandleGet 库存详情
func (h *InventoryHandler) HandleGet(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var inv models.Inventory
	if err := database.GetDB().Preload("Material").Preload("Org").First(&inv, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "记录不存在"})
		return
	}

	// 数据权限检查
	scope := middleware.GetDataScope(c)
	if !scope.AllData && scope.OrgID != nil && inv.OrgID != *scope.OrgID {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "无权查看该机构数据"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "data": inv})
}
