package database

import (
	"his-app/models"
	"log"
)

// Migrate 自动迁移所有模型
func Migrate() {
	err := DB.AutoMigrate(
		&models.Organization{},
		&models.Department{},
		&models.User{},
		&models.Role{},
		&models.Permission{},
		&models.Material{},
		&models.Supplier{},
		&models.Inventory{},
		&models.PurchaseOrder{},
		&models.PurchaseItem{},
	)
	if err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}
	log.Println("database migration completed")
}
