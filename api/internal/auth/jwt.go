package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	jwtIssuer   = "veids"
	jwtAudience = "veids-spa"
)

// Claims is the access-token payload: subject = user id, plus VATSIM cid/rating.
type Claims struct {
	Cid    string `json:"cid"`
	Rating int    `json:"rat"`
	jwt.RegisteredClaims
}

// JWTManager issues and verifies HS256 access tokens.
type JWTManager struct {
	key []byte
	ttl time.Duration
}

// NewJWTManager returns a manager signing with the given key and access TTL.
func NewJWTManager(signingKey string, ttl time.Duration) *JWTManager {
	return &JWTManager{key: []byte(signingKey), ttl: ttl}
}

// Issue mints a signed access token for a user.
func (m *JWTManager) Issue(userID, cid string, rating int) (string, error) {
	now := time.Now()
	claims := Claims{
		Cid:    cid,
		Rating: rating,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			Issuer:    jwtIssuer,
			Audience:  jwt.ClaimStrings{jwtAudience},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.ttl)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(m.key)
}

// Verify parses and validates a token, returning its claims.
func (m *JWTManager) Verify(token string) (*Claims, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return m.key, nil
	}, jwt.WithIssuer(jwtIssuer), jwt.WithAudience(jwtAudience))
	if err != nil {
		return nil, err
	}
	return claims, nil
}
