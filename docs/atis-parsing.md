# ATIS / METAR parsing

`api/internal/parser` turns raw ATIS or METAR text into structured data. It is a
faithful Go port of the old app's `src/lib/atisParser.ts` and is used for **both**
ATIS text and METAR text (the same way the original single `parseAtis` was), so
wind/altimeter/flight-category can be derived from whichever source parses.

It is pure (no I/O, no dependencies) and is the highest-value correctness surface
in the codebase, so it ships with golden tests (`parser_test.go`). A parallel copy
of the original `atisParser.ts` also lives in `frontend/src/lib/` — the Airports
panel re-parses `atisText` client-side to display departing/arriving runways.

## What `Parse(text)` extracts

- **Runways** — landing vs. departure, from contextual phrasing ("LANDING RWY 26L
  AND 27R", spelled-out "TWO SIX LEFT", numeric with L/R/C suffixes). Non-runway
  numbers (feet, times, dates) are rejected via look-ahead.
- **Weather** — altimeter (`A2992` → 29.92), wind (`27015G25KT`), visibility
  (`10SM`, `1/2SM`), RVR, cloud layers (`OVC004`).
- **NOTAMs**, **frequencies** (`124.5`).
- **ATIS code letter** (`INFO C`), **Zulu time** (`1653Z`), **ATIS type**
  (ARRIVAL / DEPARTURE / COMBINED / UNKNOWN, from keywords before `INFO` on the
  first line).
- **Flight category** — derived from visibility + ceiling.

## Preserved legacy quirks

Behavior matches the original on purpose (the tests encode it):

- A visibility **or** ceiling of `0`/unknown yields `VFR` (the legacy truthiness
  check treated `0` as "unknown").
- The ceiling is the **last** broken/overcast/vertical-vis layer in the report,
  not necessarily the lowest.
- Numeric single-digit runways with a suffix (e.g. `8R`) are not zero-padded,
  while bare single digits are (`8` → `08`).

If you change parsing, update `parser_test.go` and, if the shape changes, the
`frontend/src/lib/atisParser.ts` copy.
