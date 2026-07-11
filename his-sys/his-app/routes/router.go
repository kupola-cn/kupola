package routes

import (
	"his-app/handlers"
	"his-app/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine) {
	// 公开路由
	public := r.Group("/api")
	{
		auth := &handlers.AuthHandler{}
		public.POST("/auth/login", auth.HandleLogin)
	}

	// 需要认证的路由
	api := r.Group("/api")
	api.Use(middleware.AuthRequired())
	{
		// 认证相关
		auth := &handlers.AuthHandler{}
		api.POST("/auth/logout", auth.HandleLogout)
		api.GET("/auth/profile", auth.HandleProfile)
		api.PUT("/auth/password", auth.HandleChangePassword)

		// 用户管理
		user := &handlers.UserHandler{}
		api.GET("/users", user.HandleList)
		api.POST("/users", user.HandleCreate)
		api.GET("/users/:id", user.HandleGet)
		api.PUT("/users/:id", user.HandleUpdate)
		api.DELETE("/users/:id", user.HandleDelete)
		api.PUT("/users/:id/status", user.HandleUpdateStatus)
		api.PUT("/users/:id/roles", user.HandleAssignRoles)

		// 组织管理
		org := &handlers.OrganizationHandler{}
		api.GET("/organizations", org.HandleList)
		api.POST("/organizations", org.HandleCreate)
		api.GET("/organizations/:id", org.HandleGet)
		api.PUT("/organizations/:id", org.HandleUpdate)
		api.DELETE("/organizations/:id", org.HandleDelete)

		// 部门管理
		dept := &handlers.DepartmentHandler{}
		api.GET("/departments", dept.HandleList)
		api.POST("/departments", dept.HandleCreate)
		api.PUT("/departments/:id", dept.HandleUpdate)
		api.DELETE("/departments/:id", dept.HandleDelete)

		// 角色管理
		role := &handlers.RoleHandler{}
		api.GET("/roles", role.HandleList)
		api.POST("/roles", role.HandleCreate)
		api.PUT("/roles/:id", role.HandleUpdate)
		api.DELETE("/roles/:id", role.HandleDelete)
		api.PUT("/roles/:id/permissions", role.HandleAssignPermissions)
		api.GET("/roles/:id/permissions", role.HandleGetPermissions)

		// 权限管理
		perm := &handlers.PermissionHandler{}
		api.GET("/permissions", perm.HandleList)
		api.GET("/permissions/menus", perm.HandleMenus)

		// 耗材管理
		mat := &handlers.MaterialHandler{}
		api.GET("/materials", mat.HandleList)
		api.POST("/materials", mat.HandleCreate)
		api.PUT("/materials/:id", mat.HandleUpdate)
		api.DELETE("/materials/:id", mat.HandleDelete)

		// 供应商管理
		sup := &handlers.SupplierHandler{}
		api.GET("/suppliers", sup.HandleList)
		api.POST("/suppliers", sup.HandleCreate)
		api.PUT("/suppliers/:id", sup.HandleUpdate)
		api.DELETE("/suppliers/:id", sup.HandleDelete)

		// 库存管理
		inv := &handlers.InventoryHandler{}
		api.GET("/inventories", inv.HandleList)
		api.GET("/inventories/:id", inv.HandleGet)

		// 采购管理
		pur := &handlers.PurchaseHandler{}
		api.GET("/purchase-orders", pur.HandleList)
		api.POST("/purchase-orders", pur.HandleCreate)
		api.GET("/purchase-orders/:id", pur.HandleGet)
		api.PUT("/purchase-orders/:id/status", pur.HandleUpdateStatus)
	}
}
