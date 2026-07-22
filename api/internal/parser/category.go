package parser

// Ceiling returns the altitude (ft) of the lowest broken/overcast/vertical-vis
// layer, or nil if none. Mirrors the legacy behavior where the LAST matching
// layer in the list wins.
func Ceiling(layers []CloudLayer) *int {
	var ceiling *int
	for _, l := range layers {
		if l.Coverage == "BKN" || l.Coverage == "OVC" || l.Coverage == "VV" {
			a := l.Altitude
			ceiling = &a
		}
	}
	return ceiling
}

// Category derives the flight category from visibility (statute miles) and
// ceiling (ft). Faithful to the legacy rule: a nil OR zero visibility/ceiling is
// treated as "unknown" and yields VFR (a legacy quirk preserved on purpose).
func Category(visibility *float64, ceiling *int) FlightCategory {
	if visibility == nil || *visibility == 0 || ceiling == nil || *ceiling == 0 {
		return VFR
	}
	v := *visibility
	c := *ceiling
	switch {
	case v < 1 || c < 500:
		return LIFR
	case v < 3 || c < 1000:
		return IFR
	case v <= 5 || c <= 3000:
		return MVFR
	default:
		return VFR
	}
}
