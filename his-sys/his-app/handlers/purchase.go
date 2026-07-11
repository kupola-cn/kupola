package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"his-app/database"
	"his-app/middleware"
	"his-app/models"

	"github.com/gin-gonic/gin"
)

type PurchaseHandler struct{}

type CreateOrderRequest struct {
	SupplierID uint              `json:"supplier_id" binding:"required"`
	Remark     string            `json:"remark"`
	Items      []CreateOrderItem `json:"items" binding:"required,min=1"`
}

type CreateOrderItem struct {
	MaterialID uint    `json:"material_id" binding:"required"`
	Quantity   int     `json:"quantity" binding:"required,min=1"`
	UnitPrice  float64 `json:"unit_price" binding:"required"`
}

// HandleList 采购订单列表
func (h *PurchaseHandler) HandleList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))

	db := database.GetDB().Model(&models.PurchaseOrder{})
	scope := middleware.GetDataScope(c)
	db = middleware.ApplyDataScope(scope, db)

	var total int64
	db.Count(&total)

	var orders []models.PurchaseOrder
	db.Preload("Supplier").Preload("Creator").Preload("Items").Preload("Items.Material").
		Offset((page - 1) * size).Limit(size).
		Order("id DESC").Find(&orders)

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": gin.H{"list": orders, "total": total},
	})
}

// HandleCreate 创建采购订单
func (h *PurchaseHandler) HandleCreate(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	orgID := middleware.GetOrgID(c)
	userID := middleware.GetUserID(c)

	// 生成订单号
	orderNo := fmt.Sprintf("PO%s%04d", time.Now().Format("20060102150405"), userID)

	var totalAmount float64
	var items []models.PurchaseItem
	for _, item := range req.Items {
		amount := float64(item.Quantity) * item.UnitPrice
		totalAmount += amount
		items = append(items, models.PurchaseItem{
			MaterialID: item.MaterialID,
			Quantity:   item.Quantity,
			UnitPrice:  item.UnitPrice,
			Amount:     amount,
		})
	}

	order := models.PurchaseOrder{
		OrgID:       *orgID,
		SupplierID:  req.SupplierID,
		OrderNo:     orderNo,
		Status:      0,
		TotalAmount: totalAmount,
		CreatedBy:   userID,
		Remark:      req.Remark,
		Items:       items,
	}

	if err := database.GetDB().Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "创建成功", "data": order})
}

// HandleGet 订单详情
func (h *PurchaseHandler) HandleGet(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var order models.PurchaseOrder
	if err := database.GetDB().
		Preload("Supplier").Preload("Creator").
		Preload("Items").Preload("Items.Material").
		First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "订单不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "data": order})
}

// HandleUpdateStatus 更新订单状态
func (h *PurchaseHandler) HandleUpdateStatus(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		Status int `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if err := database.GetDB().Model(&models.PurchaseOrder{}).Where("id = ?", id).Update("status", req.Status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "操作失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "操作成功"})
}
