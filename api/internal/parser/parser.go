package parser

import (
	"regexp"
	"strings"
)

var landingKeywords = []string{
	"LANDING", "ARR", "LNDG", "ARRIVING", "ARVNG", "APCH", "APPROACH", "APCHS",
	"INBOUND", "VISUAL APP", "VIS APP", "VIS IN USE", "APPROACH IN USE",
	"ILS APP", "ILS IN USE", "ARRIVALS", "ARRIVAL", "EXPECT ILS TO",
}

var departureKeywords = []string{
	"DEPARTING", "DEPARTURE", "DEPTG", "DEP", "OUTBOUND", "DEPG", "DEPS",
}

var numberWords = map[string]string{
	"ZERO": "0", "ONE": "1", "TWO": "2", "THREE": "3", "FOUR": "4",
	"FIVE": "5", "SIX": "6", "SEVEN": "7", "EIGHT": "8", "NINE": "9",
}

var runwaySuffixes = map[string]string{
	"LEFT": "L", "RIGHT": "R", "CENTER": "C", "CENTRE": "C",
	"L": "L", "R": "R", "C": "C",
}

var nonRunwayUnits = []string{
	"FT", "FEET", "MILES", "MI", "KM", "KTS", "Z", "UTC", "AM", "PM",
	"NOVEMBER", "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY",
	"AUGUST", "SEPTEMBER", "OCTOBER", "NOV", "DEC",
}

var (
	notamRe       = regexp.MustCompile(`NOTAMS?\s?(\.\.\.|:)?\s?(.*)`)
	notamSplitRe  = regexp.MustCompile(`\.+\s?`)
	freqRe        = regexp.MustCompile(`\b(\d{3}\.\d{1,3})\b`)
	atisCodeRe    = regexp.MustCompile(`\bINFO\s([A-Z])\b`)
	atisTimeZRe   = regexp.MustCompile(`\b(\d{4}Z)\b`)
	newlineRe     = regexp.MustCompile(`[\r\n]+`)
	sentenceRe    = regexp.MustCompile(`[.!?]+`)
	altimeterRe   = regexp.MustCompile(`A(\d{4})`)
	windRe        = regexp.MustCompile(`(VRB|\d{3})(\d{2})(G(\d{2}))?KT`)
	visibilityRe  = regexp.MustCompile(`(\d+\s?/\s?\d+|\d+\.?\d*|\d+\s\d+/\d+)SM`)
	rvrRe         = regexp.MustCompile(`R(\d{2})([LRC]?)(/)([MP]?)(\d{4})(V(\d{4}))?`)
	cloudRe       = regexp.MustCompile(`(FEW|SCT|BKN|OVC|VV)(\d{3})`)
	numericRwyRe  = regexp.MustCompile(`(?:RWY|RY|RUNWAY)?\s*(\d{1,2}[LRC]?)`)
	spelledRwyRe  = regexp.MustCompile(`(?:(?:RWY|RY|RUNWAY)?\s*)?((?:(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|ZERO)[\s-]*){1,2}(?:LEFT|RIGHT|CENTER|CENTRE|L|R|C)?)`)
	normRunwayRe  = regexp.MustCompile(`^(\d{1,2})([LRC]?)$`)
)

// Parse turns raw ATIS or METAR text into structured Parsed data.
func Parse(text string) Parsed {
	weather := parseWeatherInfo(text)
	return Parsed{
		Runways:        extractRunwayContexts(text),
		Weather:        weather,
		Notams:         extractNotams(text),
		Frequencies:    extractFrequencies(text),
		AtisCode:       extractAtisCode(text),
		AtisType:       determineAtisType(text),
		AtisTimeZ:      extractAtisTimeZ(text),
		FlightCategory: Category(weather.Visibility, Ceiling(weather.CloudLayers)),
	}
}

func extractNotams(text string) []string {
	m := notamRe.FindStringSubmatch(strings.ToUpper(text))
	out := []string{}
	if m == nil {
		return out
	}
	for _, part := range notamSplitRe.Split(m[2], -1) {
		if p := strings.TrimSpace(part); p != "" {
			out = append(out, p)
		}
	}
	return out
}

func extractFrequencies(text string) []string {
	out := []string{}
	for _, m := range freqRe.FindAllStringSubmatch(text, -1) {
		out = append(out, m[1])
	}
	return out
}

func extractAtisCode(text string) string {
	if m := atisCodeRe.FindStringSubmatch(strings.ToUpper(text)); m != nil {
		return m[1]
	}
	return ""
}

func extractAtisTimeZ(text string) string {
	if m := atisTimeZRe.FindStringSubmatch(strings.ToUpper(text)); m != nil {
		return m[1]
	}
	return ""
}

func determineAtisType(text string) AtisType {
	upper := strings.ToUpper(text)
	firstLine := newlineRe.Split(upper, -1)[0]

	searchStr := firstLine
	if idx := strings.Index(firstLine, "INFO"); idx >= 0 {
		searchStr = firstLine[:idx]
	}
	hasDep := containsAny(searchStr, departureKeywords)
	hasArr := containsAny(searchStr, landingKeywords)

	switch {
	case hasDep && hasArr:
		return AtisCombined
	case hasDep:
		return AtisDeparture
	case hasArr:
		return AtisArrival
	default:
		return AtisUnknown
	}
}

func wordToRunwayWithSuffix(wordSeq string) string {
	var digits []string
	suffix := ""
	for _, p := range strings.Fields(strings.TrimSpace(wordSeq)) {
		if d, ok := numberWords[p]; ok {
			digits = append(digits, d)
		} else if s, ok := runwaySuffixes[p]; ok {
			suffix = s
		}
	}
	if len(digits) == 0 || len(digits) > 2 {
		return ""
	}
	num := padStart2(strings.Join(digits, ""))
	if len(num) > 2 {
		num = num[:2]
	}
	if suffix != "" {
		return num + suffix
	}
	return num
}

func normalizeRunway(runway string) string {
	m := normRunwayRe.FindStringSubmatch(runway)
	if m == nil {
		return runway
	}
	num := m[1]
	if len(num) == 1 {
		num = "0" + num
	}
	return num + m[2]
}

func extractRunwayContexts(text string) Runways {
	landingSeen := map[string]bool{}
	depSeen := map[string]bool{}
	var landing, departure []string

	add := func(seen map[string]bool, list *[]string, r string) {
		if !seen[r] {
			seen[r] = true
			*list = append(*list, r)
		}
	}

	normalized := strings.ToUpper(text)
	for _, sentence := range sentenceRe.Split(normalized, -1) {
		hasLanding := containsAny(sentence, landingKeywords)
		hasDeparture := containsAny(sentence, departureKeywords)

		var runways []string

		for _, idx := range numericRwyRe.FindAllStringSubmatchIndex(sentence, -1) {
			rwy := sentence[idx[2]:idx[3]]
			after := sliceFrom(sentence, idx[1], 10)
			if len(after) > 0 && after[0] >= '0' && after[0] <= '9' {
				continue // part of a longer number
			}
			if containsAny(after, nonRunwayUnits) {
				continue
			}
			runways = append(runways, padStart2(rwy))
		}

		for _, idx := range spelledRwyRe.FindAllStringSubmatchIndex(sentence, -1) {
			rwyRaw := sentence[idx[2]:idx[3]]
			after := sliceFrom(sentence, idx[1], 10)
			if containsAny(after, nonRunwayUnits) {
				continue
			}
			if rwy := wordToRunwayWithSuffix(rwyRaw); rwy != "" {
				runways = append(runways, padStart2(rwy))
			}
		}

		switch {
		case hasLanding && !hasDeparture:
			for _, r := range runways {
				add(landingSeen, &landing, r)
			}
		case hasDeparture && !hasLanding:
			for _, r := range runways {
				add(depSeen, &departure, r)
			}
		case hasLanding && hasDeparture:
			for _, r := range runways {
				add(landingSeen, &landing, r)
				add(depSeen, &departure, r)
			}
		}
	}

	if landing == nil {
		landing = []string{}
	}
	if departure == nil {
		departure = []string{}
	}
	return Runways{LandingRunways: landing, DepartureRunways: departure}
}

func parseWeatherInfo(text string) Weather {
	w := Weather{CloudLayers: []CloudLayer{}}

	if m := altimeterRe.FindStringSubmatch(text); m != nil {
		v := float64(atoiSafe(m[1])) / 100
		w.Altimeter = &v
	}

	if m := windRe.FindStringSubmatch(text); m != nil {
		wind := Wind{Direction: m[1], Speed: atoiSafe(m[2])}
		if m[4] != "" {
			g := atoiSafe(m[4])
			wind.Gust = &g
		}
		w.Wind = &wind
	}

	if m := visibilityRe.FindStringSubmatch(text); m != nil {
		g := m[1]
		var vis float64
		if strings.Contains(g, "/") {
			parts := strings.SplitN(g, "/", 2)
			num := parseLeadingInt(parts[0])
			den := parseLeadingInt(parts[1])
			if den != 0 {
				vis = float64(num) / float64(den)
			}
		} else {
			vis = float64(parseLeadingInt(g))
		}
		w.Visibility = &vis
	}

	if m := rvrRe.FindStringSubmatch(text); m != nil {
		rvr := RVR{Runway: normalizeRunway(m[1] + m[2]), MinRange: atoiSafe(m[5])}
		if m[7] != "" {
			mx := atoiSafe(m[7])
			rvr.MaxRange = &mx
		}
		w.RVR = &rvr
	}

	for _, m := range cloudRe.FindAllStringSubmatch(text, -1) {
		w.CloudLayers = append(w.CloudLayers, CloudLayer{Coverage: m[1], Altitude: atoiSafe(m[2]) * 100})
	}

	return w
}

// --- helpers ---

func containsAny(s string, needles []string) bool {
	for _, n := range needles {
		if strings.Contains(s, n) {
			return true
		}
	}
	return false
}

// sliceFrom returns up to n runes/bytes of s starting at index start (clamped).
func sliceFrom(s string, start, n int) string {
	if start < 0 {
		start = 0
	}
	if start > len(s) {
		return ""
	}
	end := start + n
	if end > len(s) {
		end = len(s)
	}
	return s[start:end]
}

// padStart2 left-pads with '0' to a minimum length of 2 (mirrors JS padStart(2,'0')).
func padStart2(s string) string {
	if len(s) >= 2 {
		return s
	}
	return strings.Repeat("0", 2-len(s)) + s
}

// atoiSafe parses a string of digits; returns 0 on any non-digit content.
func atoiSafe(s string) int {
	n := 0
	for i := 0; i < len(s); i++ {
		if s[i] < '0' || s[i] > '9' {
			return 0
		}
		n = n*10 + int(s[i]-'0')
	}
	return n
}

// parseLeadingInt mirrors JS parseInt: skip leading spaces, read leading digits.
func parseLeadingInt(s string) int {
	s = strings.TrimLeft(s, " \t")
	n := 0
	found := false
	for i := 0; i < len(s); i++ {
		if s[i] < '0' || s[i] > '9' {
			break
		}
		found = true
		n = n*10 + int(s[i]-'0')
	}
	if !found {
		return 0
	}
	return n
}
