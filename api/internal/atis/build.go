package atis

import (
	"strings"

	"veids/api/internal/parser"
	"veids/api/internal/vatsim"
)

// Stations returns the distinct ICAOs (callsign prefix, first 4 chars) that have
// an ATIS position online in the datafeed, in first-seen order.
func Stations(feed *vatsim.Datafeed) []string {
	seen := map[string]bool{}
	var out []string
	for _, a := range feed.Atis {
		if len(a.Callsign) < 4 {
			continue
		}
		icao := strings.ToUpper(a.Callsign[:4])
		if !seen[icao] {
			seen[icao] = true
			out = append(out, icao)
		}
	}
	return out
}

// Build produces one Report per online-ATIS station. metarByICAO supplies the
// (optional) raw METAR text per ICAO used to derive wind/altimeter/category.
func Build(feed *vatsim.Datafeed, metarByICAO map[string]string) []Report {
	groups := map[string][]vatsim.ATISEntry{}
	var order []string
	for _, a := range feed.Atis {
		if len(a.Callsign) < 4 {
			continue
		}
		icao := strings.ToUpper(a.Callsign[:4])
		if _, ok := groups[icao]; !ok {
			order = append(order, icao)
		}
		groups[icao] = append(groups[icao], a)
	}

	reports := make([]Report, 0, len(order))
	for _, icao := range order {
		reports = append(reports, buildOne(icao, groups[icao], metarByICAO[icao]))
	}
	return reports
}

// buildOne mirrors the old buildAirportWeather: prefer the METAR parse for
// wind/altimeter/category, falling back to the merged ATIS text.
func buildOne(icao string, entries []vatsim.ATISEntry, metar string) Report {
	atisText := mergeAtisText(entries)

	atisLetter := ""
	for _, e := range entries {
		if e.AtisCode != "" {
			atisLetter = e.AtisCode
			break
		}
	}

	var metarParse, atisParse *parser.Parsed
	if metar != "" {
		p := parser.Parse(metar)
		metarParse = &p
	}
	if atisText != "" {
		p := parser.Parse(atisText)
		atisParse = &p
	}

	return Report{
		ICAO:           icao,
		AtisAvailable:  len(entries) > 0,
		AtisLetter:     atisLetter,
		AtisText:       atisText,
		Metar:          metar,
		FlightCategory: pickCategory(metarParse, atisParse),
		Wind:           pickWind(metarParse, atisParse),
		Altimeter:      pickAltimeter(metarParse, atisParse),
	}
}

// mergeAtisText concatenates ATIS body lines across split arrival/departure
// positions, deduping exact-duplicate lines.
func mergeAtisText(entries []vatsim.ATISEntry) string {
	seen := map[string]bool{}
	var lines []string
	for _, e := range entries {
		for _, line := range e.TextAtis {
			t := strings.TrimSpace(line)
			if t == "" || seen[t] {
				continue
			}
			seen[t] = true
			lines = append(lines, t)
		}
	}
	return strings.Join(lines, " ")
}

func pickWind(m, a *parser.Parsed) *parser.Wind {
	if m != nil && m.Weather.Wind != nil {
		return m.Weather.Wind
	}
	if a != nil && a.Weather.Wind != nil {
		return a.Weather.Wind
	}
	return nil
}

func pickAltimeter(m, a *parser.Parsed) *float64 {
	if m != nil && m.Weather.Altimeter != nil {
		return m.Weather.Altimeter
	}
	if a != nil && a.Weather.Altimeter != nil {
		return a.Weather.Altimeter
	}
	return nil
}

func pickCategory(m, a *parser.Parsed) parser.FlightCategory {
	if m != nil {
		return m.FlightCategory
	}
	if a != nil {
		return a.FlightCategory
	}
	return parser.VFR
}
