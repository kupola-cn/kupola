package handlers

import (
	"net/http"
	"strconv"

	"his-app/database"
	"his-app/models"

	"github.com/gin-gonic/gin"
)

type OrganizationHandler struct{}

type CreateOrgRequest struct {
	Name    string `json:"name" binding:"required"`
	OrgType string `json:"org_type" binding:"required,oneof=group branch"`
	ParentID *uint  `json:"parent_id"`
	Address string `json:"address"`
	Contact string `json:"contact"`
	Phone   string `json:"phone"`
}

// HandleList 组织列表（树形结构）
func (h *OrganizationHandler) HandleList(c *gin.Context) {
	var orgs []models.Organization
	database.GetDB().Where("status = 1").Order("id ASC").Find(&orgs)

	// 构建树形结构
	tree := buildOrgTree(orgs, 0)
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": tree})
}

func buildOrgTree(orgs []models.Organization, parentID uint) []models.Organization {
	var tree []models.Organization
	for _, org := range orgs {
		pid := uint(0)
		if org.ParentID != nil {
			pid = *org.ParentID
		}
		if pid == parentID {
			children := buildOrgTree(orgs, org.ID)
			org.Children = children
			tree = append(tree, org)
		}
	}
	return tree
}

// HandleCreate 创建组织
func (h *OrganizationHandler) HandleCreate(c *gin.Context) {
	var req CreateOrgRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	org := models.Organization{
		Name:     req.Name,
		OrgType:  req.OrgType,
		ParentID: req.ParentID,
		Address:  req.Address,
		Contact:  req.Contact,
		Phone:    req.Phone,
		Status:   1,
	}

	if err := database.GetDB().Create(&org).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "创建成功", "data": org})
}

// HandleGet 组织详情
func (h *OrganizationHandler) HandleGet(c *gin.Context) {
	id := c.Param("id")
	var org models.Organization
	if err := database.GetDB().First(&org, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "组织不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": org})
}

// HandleUpdate 更新组织
func (h *OrganizationHandler) HandleUpdate(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var org models.Organization
	if err := database.GetDB().First(&org, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "组织不存在"})
		return
	}

	var req CreateOrgRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	database.GetDB().Model(&org).Updates(map[string]interface{}{
		"name":     req.Name,
		"address":  req.Address,
		"contact":  req.Contact,
		"phone":    req.Phone,
	})

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "更新成功", "data": org})
}

// HandleDelete 删除组织
func (h *OrganizationHandler) HandleDelete(c *gin.Context) {
	id := c.Param("id")

	// 检查是否有子机构
	var childCount int64
	database.GetDB().Model(&models.Organization{}).Where("parent_id = ?", id).Count(&childCount)
	if childCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "该组织下有子机构，无法删除"})
		return
	}

	if err := database.GetDB().Delete(&models.Organization{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "删除成功"})
}
