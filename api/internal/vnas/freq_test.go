package vnas

import "testing"

func TestFormatFreq(t *testing.T) {
	cases := []struct {
		name string
		hz   int
		want string
	}{
		{"tower", 120900000, "120.900"},
		{"approach", 124400000, "124.400"},
		{"trailing zeros kept", 121000000, "121.000"},
		{"inactive sentinel", FreqInactive, ""},
		{"zero", 0, ""},
		{"negative", -1, ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := FormatFreq(tc.hz); got != tc.want {
				t.Errorf("FormatFreq(%d) = %q, want %q", tc.hz, got, tc.want)
			}
		})
	}
}
