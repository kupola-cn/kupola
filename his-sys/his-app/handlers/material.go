package handlers

import (
	"net/http"
	"strconv"

	"his-app/database"
	"his-app/middleware"
	"his-app/models"

	"github.com/gin-gonic/gin"
)

type MaterialHandler struct{}

type CreateMaterialRequest struct {
	Name           string `json:"name" binding:"required"`
	Code           string `json:"code" binding:"required"`
	Spec           string `json:"spec"`
	Unit           string `json:"unit" binding:"required"`
	Category       string `json:"category"`
	Manufacturer   string `json:"manufacturer"`
	RegistrationNo string `json:"registration_no"`
}

// HandleList 耗材列表
func (h *MaterialHandler) HandleList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	keyword := c.Query("keyword")
	category := c.Query("category")

	db := database.GetDB().Model(&models.Material{})
	if keyword != "" {
		db = db.Where("name LIKE ? OR code LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}
	if category != "" {
		db = db.Where("category = ?", category)
	}

	var total int64
	db.Count(&total)

	var materials []models.Material
	db.Offset((page - 1) * size).Limit(size).Order("id DESC").Find(&materials)

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": gin.H{
			"list":  materials,
			"total": total,
		},
	})
}

// HandleCreate 创建耗材（仅集团）
func (h *MaterialHandler) HandleCreate(c *gin.Context) {
	if !middleware.CanWriteMaterial(c) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "仅集团可管理耗材目录"})
		return
	}

	var req CreateMaterialRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	material := models.Material{
		Name:           req.Name,
		Code:           req.Code,
		Spec:           req.Spec,
		Unit:           req.Unit,
		Category:       req.Category,
		Manufacturer:   req.Manufacturer,
		RegistrationNo: req.RegistrationNo,
		Status:         1,
	}

	if err := database.GetDB().Create(&material).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "创建成功", "data": material})
}

// HandleUpdate 更新耗材（仅集团）
func (h *MaterialHandler) HandleUpdate(c *gin.Context) {
	if !middleware.CanWriteMaterial(c) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "仅集团可管理耗材目录"})
		return
	}

	id, _ := strconv.Atoi(c.Param("id"))
	var material models.Material
	if err := database.GetDB().First(&material, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "耗材不存在"})
		return
	}

	var req CreateMaterialRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	database.GetDB().Model(&material).Updates(map[string]interface{}{
		"name":           req.Name,
		"code":           req.Code,
		"spec":           req.Spec,
		"unit":           req.Unit,
		"category":       req.Category,
		"manufacturer":   req.Manufacturer,
		"registration_no": req.RegistrationNo,
	})

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "更新成功", "data": material})
}

// HandleDelete 删除耗材（仅集团）
func (h *MaterialHandler) HandleDelete(c *gin.Context) {
	if !middleware.CanWriteMaterial(c) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "仅集团可管理耗材目录"})
		return
	}

	id := c.Param("id")
	database.GetDB().Delete(&models.Material{}, id)
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "删除成功"})
}
