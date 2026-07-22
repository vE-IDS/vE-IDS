package vnas

import "fmt"

// FreqInactive is the sentinel the feed uses for a position that isn't
// transmitting on a real frequency (199.998 MHz).
const FreqInactive = 199998000

// FormatFreq renders a frequency given in Hz as a MHz string to three decimals
// (e.g. 121900000 -> "121.900"). The inactive sentinel and any non-positive
// value render as "".
func FormatFreq(hz int) string {
	if hz <= 0 || hz == FreqInactive {
		return ""
	}
	return fmt.Sprintf("%.3f", float64(hz)/1e6)
}
