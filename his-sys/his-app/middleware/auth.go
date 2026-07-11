package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	CtxUserID   contextKey = "user_id"
	CtxOrgID    contextKey = "org_id"
	CtxOrgType  contextKey = "org_type"
	CtxUsername contextKey = "username"
)

var jwtSecret []byte

func InitJWT(secret string) {
	jwtSecret = []byte(secret)
}

// GenerateToken 生成 JWT token
func GenerateToken(userID uint, orgID *uint, orgType, username string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  userID,
		"org_id":   orgID,
		"org_type": orgType,
		"username": username,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// AuthRequired JWT 认证中间件
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "未提供认证令牌"})
			c.Abort()
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "认证令牌无效或已过期"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "令牌解析失败"})
			c.Abort()
			return
		}

		// 注入 context
		ctx := c.Request.Context()
		if uid, ok := claims["user_id"].(float64); ok {
			ctx = context.WithValue(ctx, CtxUserID, uint(uid))
		}
		if oid, ok := claims["org_id"].(float64); ok {
			v := uint(oid)
			ctx = context.WithValue(ctx, CtxOrgID, &v)
		}
		if ot, ok := claims["org_type"].(string); ok {
			ctx = context.WithValue(ctx, CtxOrgType, ot)
		}
		if un, ok := claims["username"].(string); ok {
			ctx = context.WithValue(ctx, CtxUsername, un)
		}
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

// GetUserID 从 context 获取用户 ID
func GetUserID(c *gin.Context) uint {
	if v, ok := c.Request.Context().Value(CtxUserID).(uint); ok {
		return v
	}
	return 0
}

// GetOrgID 从 context 获取组织 ID
func GetOrgID(c *gin.Context) *uint {
	if v, ok := c.Request.Context().Value(CtxOrgID).(*uint); ok {
		return v
	}
	return nil
}

// GetOrgType 从 context 获取组织类型
func GetOrgType(c *gin.Context) string {
	if v, ok := c.Request.Context().Value(CtxOrgType).(string); ok {
		return v
	}
	return ""
}
