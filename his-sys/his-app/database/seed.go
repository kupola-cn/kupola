package database

import (
	"his-app/models"
	"log"

	"golang.org/x/crypto/bcrypt"
)

// Seed 初始化种子数据
func Seed() {
	seedOrganizations()
	seedPermissions()
	seedRoles()
	seedAdmin()
	log.Println("seed data completed")
}

func seedOrganizations() {
	var count int64
	DB.Model(&models.Organization{}).Count(&count)
	if count > 0 {
		return
	}

	group := models.Organization{
		Name:    "总部集团",
		OrgType: "group",
		Address: "默认地址",
		Contact: "管理员",
		Status:  1,
	}
	DB.Create(&group)

	// 创建示例分机构
	branchA := models.Organization{
		Name:     "血液透析中心A",
		OrgType:  "branch",
		ParentID: &group.ID,
		Address:  "分机构A地址",
		Status:   1,
	}
	branchB := models.Organization{
		Name:     "血液透析中心B",
		OrgType:  "branch",
		ParentID: &group.ID,
		Address:  "分机构B地址",
		Status:   1,
	}
	DB.Create(&branchA)
	DB.Create(&branchB)
}

func seedPermissions() {
	var count int64
	DB.Model(&models.Permission{}).Count(&count)
	if count > 0 {
		return
	}

	perms := []models.Permission{
		// 一级菜单
		{Name: "系统管理", Code: "system", Type: "menu", Path: "/system", Icon: "settings", SortOrder: 1},
		{Name: "耗材管理", Code: "material", Type: "menu", Path: "/material", Icon: "box", SortOrder: 2},
		{Name: "采购管理", Code: "purchase", Type: "menu", Path: "/purchase", Icon: "dollar", SortOrder: 3},
		{Name: "库存管理", Code: "inventory", Type: "menu", Path: "/inventory", Icon: "layers", SortOrder: 4},
	}
	DB.Create(&perms)

	// 二级菜单 - 系统管理
	systemID := perms[0].ID
	subPerms := []models.Permission{
		{Name: "用户管理", Code: "system:user", Type: "menu", ParentID: &systemID, Path: "/system/users", Icon: "user", SortOrder: 1},
		{Name: "组织管理", Code: "system:org", Type: "menu", ParentID: &systemID, Path: "/system/organizations", Icon: "home", SortOrder: 2},
		{Name: "部门管理", Code: "system:dept", Type: "menu", ParentID: &systemID, Path: "/system/departments", Icon: "grid-2x2", SortOrder: 3},
		{Name: "角色管理", Code: "system:role", Type: "menu", ParentID: &systemID, Path: "/system/roles", Icon: "shield", SortOrder: 4},
	}
	DB.Create(&subPerms)

	// 按钮权限 - 用户管理
	userMenuID := subPerms[0].ID
	userBtns := []models.Permission{
		{Name: "用户新增", Code: "system:user:create", Type: "button", ParentID: &userMenuID, SortOrder: 1},
		{Name: "用户编辑", Code: "system:user:update", Type: "button", ParentID: &userMenuID, SortOrder: 2},
		{Name: "用户删除", Code: "system:user:delete", Type: "button", ParentID: &userMenuID, SortOrder: 3},
	}
	DB.Create(&userBtns)

	// 二级菜单 - 耗材管理
	materialID := perms[1].ID
	matPerms := []models.Permission{
		{Name: "耗材目录", Code: "material:catalog", Type: "menu", ParentID: &materialID, Path: "/material/catalog", Icon: "file-text", SortOrder: 1},
		{Name: "供应商管理", Code: "material:supplier", Type: "menu", ParentID: &materialID, Path: "/material/suppliers", Icon: "users", SortOrder: 2},
	}
	DB.Create(&matPerms)

	// 二级菜单 - 采购管理
	purchaseID := perms[2].ID
	purPerms := []models.Permission{
		{Name: "采购订单", Code: "purchase:order", Type: "menu", ParentID: &purchaseID, Path: "/purchase/orders", Icon: "file", SortOrder: 1},
	}
	DB.Create(&purPerms)

	// 二级菜单 - 库存管理
	inventoryID := perms[3].ID
	invPerms := []models.Permission{
		{Name: "库存查询", Code: "inventory:view", Type: "menu", ParentID: &inventoryID, Path: "/inventory/list", Icon: "table", SortOrder: 1},
	}
	DB.Create(&invPerms)
}

func seedRoles() {
	var count int64
	DB.Model(&models.Role{}).Count(&count)
	if count > 0 {
		return
	}

	roles := []models.Role{
		{Name: "超级管理员", Code: "super_admin", Description: "系统最高权限", IsSystem: true, Status: 1},
		{Name: "集团管理员", Code: "group_admin", Description: "集团管理", IsSystem: true, Status: 1},
		{Name: "采购总监", Code: "purchase_director", Description: "负责采购管理", IsSystem: true, Status: 1},
		{Name: "分机构管理员", Code: "branch_admin", Description: "分机构管理", IsSystem: true, Status: 1},
		{Name: "护士长", Code: "head_nurse", Description: "护理管理", IsSystem: true, Status: 1},
		{Name: "透析医师", Code: "dialysis_doctor", Description: "透析治疗", IsSystem: true, Status: 1},
		{Name: "库管员", Code: "warehouse_keeper", Description: "库存管理", IsSystem: true, Status: 1},
	}
	DB.Create(&roles)

	// 给超级管理员分配所有权限
	var allPerms []models.Permission
	DB.Find(&allPerms)
	DB.Model(&roles[0]).Association("Permissions").Replace(&allPerms)
}

func seedAdmin() {
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)

	admin := models.User{
		Username:     "admin",
		PasswordHash: string(hash),
		RealName:     "超级管理员",
		OrgType:      "group",
		Status:       1,
	}
	DB.Create(&admin)

	// 分配超级管理员角色
	var superRole models.Role
	DB.Where("code = ?", "super_admin").First(&superRole)
	DB.Model(&admin).Association("Roles").Append(&superRole)
}
