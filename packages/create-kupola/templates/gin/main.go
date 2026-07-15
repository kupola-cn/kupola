package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// 加载模板
	r.LoadHTMLGlob("templates/*")

	// 静态文件（Kupola CSS/JS/Icons）
	r.Static("/static", "./static")

	// 路由
	r.GET("/", indexHandler)
	r.GET("/dashboard", dashboardHandler)

	r.Run(":8080")
}

func indexHandler(c *gin.Context) {
	c.HTML(http.StatusOK, "index.html", gin.H{
		"title": "{{PROJECT_NAME}}",
	})
}

func dashboardHandler(c *gin.Context) {
	stats := []gin.H{
		{"label": "Total Users", "value": "1,284", "delta": "+12%"},
		{"label": "Revenue", "value": "$84K", "delta": "+8%"},
		{"label": "Tasks", "value": "42", "delta": "-3%"},
		{"label": "Completion", "value": "94%", "delta": "+2%"},
	}

	c.HTML(http.StatusOK, "dashboard.html", gin.H{
		"title": "Dashboard — {{PROJECT_NAME}}",
		"stats": stats,
	})
}
