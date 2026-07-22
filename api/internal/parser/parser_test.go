package parser

import "testing"

func TestParseMetar_VFR(t *testing.T) {
	p := Parse("KATL 211653Z 27015G25KT 10SM FEW250 28/17 A2992 RMK AO2 SLP132")

	if p.Weather.Wind == nil || p.Weather.Wind.Direction != "270" || p.Weather.Wind.Speed != 15 {
		t.Fatalf("wind = %+v, want dir=270 speed=15", p.Weather.Wind)
	}
	if p.Weather.Wind.Gust == nil || *p.Weather.Wind.Gust != 25 {
		t.Fatalf("gust = %v, want 25", p.Weather.Wind.Gust)
	}
	if p.Weather.Altimeter == nil || *p.Weather.Altimeter != 29.92 {
		t.Fatalf("altimeter = %v, want 29.92", p.Weather.Altimeter)
	}
	if p.Weather.Visibility == nil || *p.Weather.Visibility != 10 {
		t.Fatalf("visibility = %v, want 10", p.Weather.Visibility)
	}
	if len(p.Weather.CloudLayers) != 1 || p.Weather.CloudLayers[0].Coverage != "FEW" || p.Weather.CloudLayers[0].Altitude != 25000 {
		t.Fatalf("clouds = %+v, want FEW@25000", p.Weather.CloudLayers)
	}
	if p.FlightCategory != VFR {
		t.Fatalf("category = %s, want VFR", p.FlightCategory)
	}
}

func TestParseMetar_LIFR(t *testing.T) {
	// Low ceiling (OVC004 = 400ft) drives LIFR.
	p := Parse("KSFO 211656Z 20012KT 2SM BR OVC004 15/13 A2985")

	if p.Weather.Wind == nil || p.Weather.Wind.Speed != 12 || p.Weather.Wind.Gust != nil {
		t.Fatalf("wind = %+v, want speed=12 no gust", p.Weather.Wind)
	}
	ceil := Ceiling(p.Weather.CloudLayers)
	if ceil == nil || *ceil != 400 {
		t.Fatalf("ceiling = %v, want 400", ceil)
	}
	if p.FlightCategory != LIFR {
		t.Fatalf("category = %s, want LIFR", p.FlightCategory)
	}
}

func TestParseVisibilityFraction(t *testing.T) {
	p := Parse("METAR 1/2SM OVC002")
	if p.Weather.Visibility == nil || *p.Weather.Visibility != 0.5 {
		t.Fatalf("visibility = %v, want 0.5", p.Weather.Visibility)
	}
}

func TestParseAtis_CodeTimeRunwaysNotams(t *testing.T) {
	text := "ATL ATIS INFO C 1653Z. WIND 270 AT 15. LANDING RWY 26L AND 27R. DEPARTING RWY 26R AND 27L. NOTAMS TWY A CLSD."
	p := Parse(text)

	if p.AtisCode != "C" {
		t.Errorf("atisCode = %q, want C", p.AtisCode)
	}
	if p.AtisTimeZ != "1653Z" {
		t.Errorf("atisTimeZ = %q, want 1653Z", p.AtisTimeZ)
	}
	if !equalStrings(p.Runways.LandingRunways, []string{"26L", "27R"}) {
		t.Errorf("landing = %v, want [26L 27R]", p.Runways.LandingRunways)
	}
	if !equalStrings(p.Runways.DepartureRunways, []string{"26R", "27L"}) {
		t.Errorf("departure = %v, want [26R 27L]", p.Runways.DepartureRunways)
	}
	if len(p.Notams) != 1 || p.Notams[0] != "TWY A CLSD" {
		t.Errorf("notams = %v, want [TWY A CLSD]", p.Notams)
	}
}

func TestParseAtis_SpelledRunways(t *testing.T) {
	p := Parse("LANDING RUNWAY TWO SIX LEFT.")
	if !equalStrings(p.Runways.LandingRunways, []string{"26L"}) {
		t.Fatalf("landing = %v, want [26L]", p.Runways.LandingRunways)
	}
}

func TestDetermineAtisType(t *testing.T) {
	cases := map[string]AtisType{
		"DEPARTURE AND ARRIVAL INFO A": AtisCombined,
		"ILS APPROACH IN USE INFO B":   AtisArrival,
		"DEPARTURE ATIS INFO D":        AtisDeparture,
		"ATL ATIS INFO C":              AtisUnknown,
	}
	for text, want := range cases {
		if got := determineAtisType(text); got != want {
			t.Errorf("determineAtisType(%q) = %s, want %s", text, got, want)
		}
	}
}

func TestFrequencies(t *testing.T) {
	p := Parse("CTC APPROACH ON 124.5 OR 118.75")
	if !equalStrings(p.Frequencies, []string{"124.5", "118.75"}) {
		t.Fatalf("frequencies = %v, want [124.5 118.75]", p.Frequencies)
	}
}

func TestCategoryBoundaries(t *testing.T) {
	mk := func(v float64, c int) FlightCategory {
		return Category(&v, &c)
	}
	if got := mk(5, 3000); got != MVFR {
		t.Errorf("vis=5 ceil=3000 => %s, want MVFR", got)
	}
	if got := mk(3, 1500); got != MVFR {
		t.Errorf("vis=3 ceil=1500 => %s, want MVFR", got)
	}
	if got := mk(2, 800); got != IFR {
		t.Errorf("vis=2 ceil=800 => %s, want IFR", got)
	}
	if got := mk(10, 5000); got != VFR {
		t.Errorf("vis=10 ceil=5000 => %s, want VFR", got)
	}
}

func equalStrings(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
