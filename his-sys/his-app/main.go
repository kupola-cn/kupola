package main

import (
	"log"

	"his-app/config"
	"his-app/database"
	"his-app/middleware"
	"his-app/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化数据库
	database.Init(&cfg.Database)

	// 执行迁移
	database.Migrate()

	// 初始化种子数据
	database.Seed()

	// 初始化 JWT
	middleware.InitJWT(cfg.JWT.Secret)

	// 创建 Gin 引擎
	r := gin.Default()

	// 全局中间件
	r.Use(middleware.CORS())

	// 静态文件服务（前端页面）
	r.Static("/static", "../his-web")

	// 首页重定向到登录页
	r.GET("/", func(c *gin.Context) {
		c.Redirect(302, "/static/login.html")
	})

	// 注册 API 路由
	routes.SetupRouter(r)

	// 启动服务
	addr := ":" + cfg.Server.Port
	log.Printf("HIS 系统启动于 %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
