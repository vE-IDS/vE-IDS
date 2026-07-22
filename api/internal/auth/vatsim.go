package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"veids/api/internal/vatsim"
)

// OAuthClient performs the VATSIM Connect authorization-code flow. It uses a
// state value for CSRF protection (matching the legacy NextAuth provider; PKCE
// can be layered on later — see docs/NOT-DONE.md).
type OAuthClient struct {
	http         *http.Client
	authURL      string
	clientID     string
	clientSecret string
	redirectURI  string
	scopes       string
}

// NewOAuthClient builds a VATSIM Connect OAuth client.
func NewOAuthClient(authURL, clientID, clientSecret, redirectURI, scopes string) *OAuthClient {
	return &OAuthClient{
		http:         &http.Client{Timeout: 15 * time.Second},
		authURL:      strings.TrimRight(authURL, "/"),
		clientID:     clientID,
		clientSecret: clientSecret,
		redirectURI:  redirectURI,
		scopes:       scopes,
	}
}

// AuthorizeURL builds the URL to redirect the user to for consent.
func (o *OAuthClient) AuthorizeURL(state string) string {
	q := url.Values{}
	q.Set("client_id", o.clientID)
	q.Set("redirect_uri", o.redirectURI)
	q.Set("response_type", "code")
	q.Set("scope", o.scopes)
	q.Set("state", state)
	return fmt.Sprintf("%s/oauth/authorize?%s", o.authURL, q.Encode())
}

// TokenResponse is the VATSIM /oauth/token response.
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
	Scope        string `json:"scope"`
}

// Exchange trades an authorization code for VATSIM tokens.
func (o *OAuthClient) Exchange(ctx context.Context, code string) (*TokenResponse, error) {
	form := url.Values{}
	form.Set("grant_type", "authorization_code")
	form.Set("client_id", o.clientID)
	form.Set("client_secret", o.clientSecret)
	form.Set("redirect_uri", o.redirectURI)
	form.Set("code", code)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, o.authURL+"/oauth/token", strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	resp, err := o.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("token exchange: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token exchange status %d", resp.StatusCode)
	}

	var tr TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tr); err != nil {
		return nil, fmt.Errorf("decode token response: %w", err)
	}
	return &tr, nil
}

// UserInfo fetches the VATSIM profile using an access token.
func (o *OAuthClient) UserInfo(ctx context.Context, accessToken string) (*vatsim.VatsimUser, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, o.authURL+"/api/user", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")

	resp, err := o.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("userinfo: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("userinfo status %d", resp.StatusCode)
	}

	var u vatsim.VatsimUser
	if err := json.NewDecoder(resp.Body).Decode(&u); err != nil {
		return nil, fmt.Errorf("decode userinfo: %w", err)
	}
	return &u, nil
}
