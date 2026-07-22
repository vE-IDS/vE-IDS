package feed

import (
	"sort"
	"testing"

	"veids/api/internal/vnas"
)

func TestProjectControllers(t *testing.T) {
	feed := &vnas.ControllerFeed{
		Controllers: []vnas.Controller{
			{
				ArtccId:    "ZAU",
				IsActive:   true,
				IsObserver: false,
				LoginTime:  "2026-07-22T16:30:00Z",
				VatsimData: vnas.VatsimData{Cid: "7654321", Callsign: "ORD_TWR"},
				Positions: []vnas.Position{
					{FacilityId: "ORD", FacilityName: "O'Hare", PositionId: "p-twr", PositionName: "Tower", RadioName: "O'Hare Tower", PositionType: "Atct", Frequency: 120900000, IsPrimary: true, IsActive: true},
					{FacilityId: "ORD", FacilityName: "O'Hare", PositionId: "p-gnd", PositionName: "Ground", PositionType: "Atct", Frequency: 121900000, IsPrimary: false, IsActive: true},
				},
			},
			{ // a position with no id is skipped
				VatsimData: vnas.VatsimData{Cid: "1", Callsign: "OBS"},
				Positions:  []vnas.Position{{PositionId: ""}},
			},
		},
	}

	got := projectControllers(feed)
	if len(got) != 2 {
		t.Fatalf("projected %d connections, want 2 (empty position id skipped)", len(got))
	}

	twr, ok := got["p-twr"]
	if !ok {
		t.Fatal("missing p-twr")
	}
	if twr.Cid != "7654321" || twr.Callsign != "ORD_TWR" || twr.ArtccId != "ZAU" {
		t.Errorf("twr identity mismatch: %+v", twr)
	}
	if twr.Frequency != "120.900" { // Hz formatted to MHz
		t.Errorf("twr frequency = %q, want 120.900", twr.Frequency)
	}
	if twr.RadioName != "O'Hare Tower" {
		t.Errorf("twr radioName = %q, want O'Hare Tower", twr.RadioName)
	}
	if !twr.IsPrimary || !twr.IsActive || twr.IsObserver {
		t.Errorf("twr flags mismatch: %+v", twr)
	}
	if gnd := got["p-gnd"]; gnd.IsPrimary { // combined secondary position is not primary
		t.Errorf("p-gnd should not be primary: %+v", gnd)
	}
}

func TestDiffControllers(t *testing.T) {
	twr := ControllerConnection{PositionId: "p-twr", Callsign: "ORD_TWR", Frequency: "120.900"}
	app := ControllerConnection{PositionId: "p-app", Callsign: "ORD_APP", Frequency: "119.000"}

	t.Run("all new when prev empty", func(t *testing.T) {
		up, rm := diffControllers(nil, map[string]ControllerConnection{"p-twr": twr, "p-app": app})
		if len(up) != 2 || len(rm) != 0 {
			t.Fatalf("up=%d rm=%d, want 2/0", len(up), len(rm))
		}
	})

	t.Run("no change → empty delta", func(t *testing.T) {
		prev := map[string]ControllerConnection{"p-twr": twr}
		up, rm := diffControllers(prev, map[string]ControllerConnection{"p-twr": twr})
		if len(up) != 0 || len(rm) != 0 {
			t.Fatalf("up=%d rm=%d, want 0/0 (unchanged)", len(up), len(rm))
		}
	})

	t.Run("changed field → upserted", func(t *testing.T) {
		prev := map[string]ControllerConnection{"p-twr": twr}
		changed := twr
		changed.Frequency = "121.000"
		up, rm := diffControllers(prev, map[string]ControllerConnection{"p-twr": changed})
		if len(up) != 1 || up[0].Frequency != "121.000" || len(rm) != 0 {
			t.Fatalf("up=%+v rm=%v, want single upsert with new freq", up, rm)
		}
	})

	t.Run("logoff → removed", func(t *testing.T) {
		prev := map[string]ControllerConnection{"p-twr": twr, "p-app": app}
		up, rm := diffControllers(prev, map[string]ControllerConnection{"p-twr": twr})
		sort.Strings(rm)
		if len(up) != 0 || len(rm) != 1 || rm[0] != "p-app" {
			t.Fatalf("up=%v rm=%v, want removed=[p-app]", up, rm)
		}
	})
}
