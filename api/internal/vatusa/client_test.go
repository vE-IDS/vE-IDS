package vatusa

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestFetchFacilities(t *testing.T) {
	// Trimmed real /v2/facility payload.
	const body = `{"data":[
		{"id":"ZJX","name":"Jacksonville ARTCC","url":"https://zjxartcc.org","hosted_email_domain":null,"region":7,"atm":989429,"datm":1655242,"ta":1552646,"ec":1551411,"fe":1551263,"wm":1811931,"active":1,"ace":0},
		{"id":"ZNY","name":"New York ARTCC","url":"https://zny.org","region":7,"atm":0,"datm":0,"ta":0,"ec":0,"fe":0,"wm":0,"active":0,"ace":0}
	],"testing":false}`

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/facility" {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(body))
	}))
	defer srv.Close()

	facs, err := New(srv.URL, "").FetchFacilities(context.Background())
	if err != nil {
		t.Fatalf("FetchFacilities: %v", err)
	}
	if len(facs) != 2 {
		t.Fatalf("want 2 facilities, got %d", len(facs))
	}
	zjx := facs[0]
	if zjx.ID != "ZJX" || zjx.Name != "Jacksonville ARTCC" || zjx.Region != 7 {
		t.Errorf("unexpected facility: %+v", zjx)
	}
	if !zjx.Active {
		t.Error("ZJX should be active")
	}
	if zjx.Staff.ATM != 989429 || zjx.Staff.DATM != 1655242 || zjx.Staff.TA != 1552646 || zjx.Staff.FE != 1551263 {
		t.Errorf("unexpected ZJX staff: %+v", zjx.Staff)
	}
	if facs[1].Active {
		t.Error("ZNY should be inactive (active=0)")
	}
}

func TestFetchFacilityRoles(t *testing.T) {
	const body = `{"data":{"facility":{"info":{"id":"ZJX"},"roles":[
		{"id":5685506,"cid":1373016,"facility":"ZJX","role":"FACCBT","created_at":"2022-10-01T00:02:56+00:00"},
		{"id":6711522,"cid":1209660,"facility":"ZJX","role":"MTR","created_at":"2024-02-15T23:04:18+00:00"}
	]}}}`

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/facility/ZJX" {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(body))
	}))
	defer srv.Close()

	roles, err := New(srv.URL, "").FetchFacilityRoles(context.Background(), "ZJX")
	if err != nil {
		t.Fatalf("FetchFacilityRoles: %v", err)
	}
	if len(roles) != 2 {
		t.Fatalf("want 2 roles, got %d", len(roles))
	}
	if roles[0].Role != "FACCBT" || roles[0].CID != 1373016 {
		t.Errorf("unexpected first role: %+v", roles[0])
	}
}

func TestFetchFacilitiesNon200(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "boom", http.StatusInternalServerError)
	}))
	defer srv.Close()

	if _, err := New(srv.URL, "").FetchFacilities(context.Background()); err == nil {
		t.Fatal("expected error on non-200")
	}
}
