package handlers

import (
	"net/http"
	"strconv"

	"his-app/database"
	"his-app/middleware"
	"his-app/models"

	"github.com/gin-gonic/gin"
)

type SupplierHandler struct{}

type CreateSupplierRequest struct {
	Name      string `json:"name" binding:"required"`
	Contact   string `json:"contact"`
	Phone     string `json:"phone"`
	Address   string `json:"address"`
	LicenseNo string `json:"license_no"`
}

// HandleList 供应商列表
func (h *SupplierHandler) HandleList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	keyword := c.Query("keyword")

	db := database.GetDB().Model(&models.Supplier{})
	if keyword != "" {
		db = db.Where("name LIKE ? OR contact LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	db.Count(&total)

	var suppliers []models.Supplier
	db.Offset((page - 1) * size).Limit(size).Order("id DESC").Find(&suppliers)

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": gin.H{"list": suppliers, "total": total},
	})
}

// HandleCreate 创建供应商（仅集团）
func (h *SupplierHandler) HandleCreate(c *gin.Context) {
	if !middleware.CanWriteMaterial(c) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "仅集团可管理供应商"})
		return
	}

	var req CreateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	supplier := models.Supplier{
		Name:      req.Name,
		Contact:   req.Contact,
		Phone:     req.Phone,
		Address:   req.Address,
		LicenseNo: req.LicenseNo,
		Status:    1,
	}

	if err := database.GetDB().Create(&supplier).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "创建成功", "data": supplier})
}

// HandleUpdate 更新供应商
func (h *SupplierHandler) HandleUpdate(c *gin.Context) {
	if !middleware.CanWriteMaterial(c) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "仅集团可管理供应商"})
		return
	}

	id, _ := strconv.Atoi(c.Param("id"))
	var supplier models.Supplier
	if err := database.GetDB().First(&supplier, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "供应商不存在"})
		return
	}

	var req CreateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	database.GetDB().Model(&supplier).Updates(map[string]interface{}{
		"name":    req.Name,
		"contact": req.Contact,
		"phone":   req.Phone,
		"address": req.Address,
		"license_no": req.LicenseNo,
	})

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "更新成功", "data": supplier})
}

// HandleDelete 删除供应商
func (h *SupplierHandler) HandleDelete(c *gin.Context) {
	if !middleware.CanWriteMaterial(c) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "仅集团可管理供应商"})
		return
	}

	id := c.Param("id")
	database.GetDB().Delete(&models.Supplier{}, id)
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "删除成功"})
}
