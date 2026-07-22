package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
)

// randomToken returns a URL-safe random string with nBytes of entropy.
func randomToken(nBytes int) (string, error) {
	b := make([]byte, nBytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// NewState generates an OAuth CSRF state value.
func NewState() (string, error) { return randomToken(32) }

// hashToken returns the hex SHA-256 of a token (used to store refresh tokens by
// hash rather than in plaintext).
func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
