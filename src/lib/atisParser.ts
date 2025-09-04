const landingKeywords = [ 'LANDING', 'ARR', 'LNDG', 'ARRIVING', 'ARVNG', 'APCH', 'APPROACH', 'APCHS', 'INBOUND', 'VISUAL APP', 'VIS APP', 'VIS IN USE', 'APPROACH IN USE', 'ILS APP', 'ILS IN USE', 'ARRIVALS', 'ARRIVAL', 'EXPECT ILS TO'];
const departureKeywords = ['DEPARTING', 'DEPARTURE', 'DEPTG', 'DEP', 'OUTBOUND', 'DEPG', 'DEPS'];

export interface AtisParsedData {
  runways: {
    landingRunways: string[];
    departureRunways: string[];
  };
  weather: {
    altimeter: number | undefined;
    wind: {
      direction: string;
      speed: number;
      gust: number | undefined;
    } | undefined;
    visibility: number | undefined;
    rvr: {
      runway: string;
      minRange: number;
      maxRange: number | undefined;
    } | undefined;
    cloudLayers: {
      coverage: string;
      altitude: number;
    }[];
  };
  notams: string[];
  frequencies: string[];
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR'
  atisCode?: string;
  atisType: 'ARRIVAL' | 'DEPARTURE' | 'COMBINED' | 'UNKNOWN';
  atisTimeZ?: string;
}

export function parseAtis(text: string): AtisParsedData {
  const runways = extractRunwayContexts(text);
  const weather = parseWeatherInfo(text);
  const notams = extractNotams(text);
  const frequencies = extractFrequencies(text);
  const atisCode = extractAtisCode(text);
  const atisType = determineAtisType(text);
  const atisTimeZ = extractAtisTimeZ(text);
  const flightCategory = getFlightCategory(weather.visibility, getCeiling(weather.cloudLayers))

  return { runways, weather, notams, frequencies, atisCode, atisType, atisTimeZ, flightCategory };
}

function extractNotams(text: string): string[] {
  const matches = text.toUpperCase().match(/NOTAMS?\s?(\.\.\.|:)?\s?(.*)/);
  if (!matches) return [];
  const [, , notamText] = matches;
  return notamText.split(/\.+\s?/).map(n => n.trim()).filter(n => n.length > 0);
}

function extractFrequencies(text: string): string[] {
  const matches = text.match(/\b(\d{3}\.\d{1,3})\b/g);
  return matches || [];
}

function extractAtisCode(text: string): string | undefined {
  // Look for codes like "INFO C", "INFO V", or just a single letter after airport code and INFO
  const match = text.toUpperCase().match(/\bINFO\s([A-Z])\b/);
  return match ? match[1] : undefined;
}

function extractAtisTimeZ(text: string): string | undefined {
  // Find time in Zulu, like "1653Z"
  const match = text.toUpperCase().match(/\b(\d{4}Z)\b/);
  return match ? match[1] : undefined;
}

function determineAtisType(text: string): 'ARRIVAL' | 'DEPARTURE' | 'COMBINED' | 'UNKNOWN' {
  const upperText = text.toUpperCase();
  const firstLine = upperText.split(/[\r\n]+/)[0];

  // Find position of "INFO <code>" (e.g. INFO R, INFO D)
  const infoMatch = firstLine.match(/INFO/);
  const searchStr = infoMatch ? firstLine.substring(0, infoMatch.index) : firstLine;
  console.log(searchStr)
  const hasDep = departureKeywords.some(k => searchStr.includes(k));
  const hasArr = landingKeywords.some(k => searchStr.includes(k));

  if (hasDep && hasArr) return 'COMBINED';
  if (hasDep) return 'DEPARTURE';
  if (hasArr) return 'ARRIVAL';

  return 'UNKNOWN';
}

const NUMBER_WORDS: Record<string, string> = {
  'ZERO': '0', 'ONE': '1', 'TWO': '2', 'THREE': '3', 'FOUR': '4',
  'FIVE': '5', 'SIX': '6', 'SEVEN': '7', 'EIGHT': '8', 'NINE': '9'
};

const RUNWAY_SUFFIXES: Record<string, string> = {
  'LEFT': 'L', 'RIGHT': 'R', 'CENTER': 'C', 'CENTRE': 'C',
  'L': 'L', 'R': 'R', 'C': 'C'
};

function wordToRunwayWithSuffix(wordSeq: string): string | undefined {
  const parts = wordSeq.trim().split(/\s+/);
  const digits: string[] = [];
  let suffix: string | null = null;

  for (const p of parts) {
    if (NUMBER_WORDS[p]) {
      digits.push(NUMBER_WORDS[p]);
    } else if (RUNWAY_SUFFIXES[p]) {
      suffix = RUNWAY_SUFFIXES[p];
    }
  }

  if (digits.length === 0 || digits.length > 2) {
    return undefined;  // Reject if no digits or too many digits (avoid 9750, etc)
  }

  const runwayNumber = digits.join('').padStart(2, '0').slice(0, 2);
  return suffix ? runwayNumber + suffix : runwayNumber;
}

function normalizeRunway(runway: string): string {
  // Add leading zero to single-digit runways, keep suffixes like L/R/C
  const match = runway.match(/^(\d{1,2})([LRC]?)$/);
  if (!match) return runway; // return as is if no match
  let num = match[1];
  const suffix = match[2];
  if (num.length === 1) num = '0' + num;
  return num + suffix;
}

function extractRunwayListsFromPhrase(phrase: string): string[] {
  // Parses phrases like: "RWY 4 AND 8R" or "4, 8R" into ["04", "08R"]
  const runwayList: string[] = [];

  // Remove repeated "RWY", "RUNWAY" etc to avoid duplication
  phrase = phrase.replace(/\b(RWY|RUNWAY|RY|RUNWAY)\b/gi, '');

  // Split by 'AND', commas or spaces
  const parts = phrase.split(/,|AND|\s+/gi).filter(p => p.trim() !== '');

  for (const partRaw of parts) {
    const part = partRaw.toUpperCase().trim();
    // Runway can be numbers possibly with suffixes
    // Also allow spelled out words (ZERO, ONE, etc) + suffix
    const spelledRunway = wordToRunwayWithSuffix(part);
    if (spelledRunway) {
      runwayList.push(normalizeRunway(spelledRunway));
    } else {
      // Check if part matches runway pattern directly (digits with optional L/R/C)
      if (/^\d{1,2}[LRC]?$/.test(part)) {
        runwayList.push(normalizeRunway(part));
      }
    }
  }

  return runwayList;
}

function extractRunwayContexts(text: string): {
  landingRunways: string[],
  departureRunways: string[]
} {
  const landingRunways: Set<string> = new Set();
  const departureRunways: Set<string> = new Set();

  const normalizedText = text.toUpperCase();
  const sentences = normalizedText.split(/[.!?]+/);

  // Only 1 or 2 number words for spelled out runways to avoid long numbers
  const spelledOutRunwayRegex = /(?:(?:RWY|RY|RUNWAY)?\s*)?((?:(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|ZERO)[\s-]*){1,2}(?:LEFT|RIGHT|CENTER|CENTRE|L|R|C)?)/gi;

  // Numeric runway regex for exactly 1 or 2 digits plus optional L/R/C
  const numericRunwayRegex = /(?:RWY|RY|RUNWAY)?\s*(\d{1,2}[LRC]?)/gi;

  // Units or words that indicate this is not a runway, like lengths or time
  const nonRunwayUnits = ['FT', 'FEET', 'MILES', 'MI', 'KM', 'KTS', 'Z', 'UTC', 'AM', 'PM', 'NOVEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOV', 'DEC'];

  for (const sentence of sentences) {
    const hasLanding = landingKeywords.some(k => sentence.includes(k));
    const hasDeparture = departureKeywords.some(k => sentence.includes(k));

    // Collect runways found this sentence
    const runways: string[] = [];

    // Check numeric runways
    for (const match of sentence.matchAll(numericRunwayRegex)) {
      const rwy = match[1];
      const indexAfter = match.index! + match[0].length;
      const afterText = sentence.slice(indexAfter, indexAfter + 10); // look ahead

      // Reject if directly followed by digit (part of longer number)
      if (/^\d/.test(afterText)) continue;

      // Reject if followed by nonRunwayUnits words
      if (nonRunwayUnits.some(unit => afterText.includes(unit))) continue;

      runways.push(rwy.padStart(2, '0')); // pad single digits
    }

    // Check spelled-out runways
    for (const match of sentence.matchAll(spelledOutRunwayRegex)) {
      const rwyRaw = match[1];
      const indexAfter = match.index! + match[0].length;
      const afterText = sentence.slice(indexAfter, indexAfter + 10);

      // Reject if followed by nonRunwayUnits words
      if (nonRunwayUnits.some(unit => afterText.includes(unit))) continue;

      const rwy = wordToRunwayWithSuffix(rwyRaw);
      if (rwy) runways.push(rwy.padStart(2, '0'));
    }

    if (hasLanding && !hasDeparture) {
      runways.forEach(r => landingRunways.add(r));
    } else if (hasDeparture && !hasLanding) {
      runways.forEach(r => departureRunways.add(r));
    } else if (hasLanding && hasDeparture) {
      runways.forEach(r => {
        landingRunways.add(r);
        departureRunways.add(r);
      });
    }
  }

  return {
    landingRunways: Array.from(landingRunways),
    departureRunways: Array.from(departureRunways),
  };
}

function parseWeatherInfo(text: string) {
  const altimeterMatch = text.match(/A(\d{4})/);
  const windMatch = text.match(/(VRB|\d{3})(\d{2})(G(\d{2}))?KT/);
  const visibilityMatch = text.match(/(\d+\s?\/\s?\d+|\d+\.?\d*|\d+\s\d+\/\d+)SM/);
  const rvrMatch = text.match(/R(\d{2})([LRC]?)(\/)([MP]?)(\d{4})(V(\d{4}))?/);
  const cloudLayerRegex = /(FEW|SCT|BKN|OVC|VV)(\d{3})/g;
  const cloudLayers = [];
  let m;
  while ((m = cloudLayerRegex.exec(text)) !== null) {
    cloudLayers.push({ coverage: m[1], altitude: parseInt(m[2], 10) * 100 });
  }

  let visibility = undefined

  if (visibilityMatch) {
    if (visibilityMatch[1].indexOf('/') != -1) {
      const sub = visibilityMatch[1].split('/')
      visibility = parseInt(sub[0]) / parseInt(sub[1])
    } else {
      visibility = parseInt(visibilityMatch[1])
    }
  }

  return {
    altimeter: altimeterMatch ? parseInt(altimeterMatch[1], 10) / 100 : undefined,
    wind: windMatch
      ? {
          direction: windMatch[1],
          speed: parseInt(windMatch[2], 10),
          gust: windMatch[4] ? parseInt(windMatch[4], 10) : undefined
        }
      : undefined,
    visibility: visibility,
    rvr: rvrMatch
      ? {
          runway: normalizeRunway(rvrMatch[1] + rvrMatch[2]),
          minRange: parseInt(rvrMatch[5], 10),
          maxRange: rvrMatch[7] ? parseInt(rvrMatch[7], 10) : undefined
        }
      : undefined,
    cloudLayers,
  };
}

function getFlightCategory(visibility: number | undefined, ceiling: number | undefined): 'VFR' | 'MVFR' | 'IFR' | 'LIFR' {
  if (!visibility || !ceiling) {
    return 'VFR'
  }

  if (visibility < 1 || ceiling < 500) {
    return 'LIFR'
  } else if (visibility < 3 || ceiling < 1000) {
    return 'IFR'
  } else if (visibility <= 5 || ceiling <= 3000) {
    return 'MVFR'
  } else {
    return 'VFR'
  }
}
function getCeiling(cloudLayers: { coverage: string; altitude: number; }[]): number | undefined {
  let returnValue: number | undefined

  cloudLayers.map((data) => {
    if (data.coverage == 'BKN' || data.coverage == 'OVC' || data.coverage == 'VV') {
      returnValue = data.altitude
      return
    }
  })

  return returnValue
}

export function getFlightCategoryColor(data: 'VFR' | 'MVFR' | 'IFR' | 'LIFR') {
  switch (data) {
    case 'VFR':
      return 'bg-green-700'
    case 'MVFR':
      return 'bg-blue-700'
    case 'IFR':
      return 'bg-rose-800'
    case 'LIFR':
      return 'bg-fuchsia-500'
  }
}