export type AtisData = {
  infoLetter?: string;
  time?: string;
  windDirection?: string;
  windSpeed?: string;
  windGust?: string;
  visibility?: string;
  clouds?: string[];
  temperature?: string;
  dewPoint?: string;
  altimeter?: string;
  approaches?: string[];
  landingRunways?: string[];
  departureRunways?: string[];
  runwayAdvisories?: string[];
  notams?: string[];
  remarks?: string[];
};

export function parseAtis(raw: string): AtisData {
  const data: AtisData = {};
  const text = raw.replace(/\s+/g, ' ').toUpperCase();

  const infoMatch = text.match(/ATIS INFORMATION\s([A-Z])/);
  if (infoMatch) data.infoLetter = infoMatch[1];

  const timeMatch = text.match(/(\d{4})Z/);
  if (timeMatch) data.time = timeMatch[1];

  const windMatch = text.match(/(\d{3}|VRB)(\d{2})(G(\d{2}))?KT/);
  if (windMatch) {
    data.windDirection = windMatch[1];
    data.windSpeed = windMatch[2];
    if (windMatch[4]) data.windGust = windMatch[4];
  }

  const visMatch = text.match(/(\d{1,2})SM/);
  if (visMatch) data.visibility = `${visMatch[1]} statute miles`;

  const cloudMatches = text.match(/(FEW|SCT|BKN|OVC)\d{3}/g);
  if (cloudMatches) data.clouds = cloudMatches;

  const tempMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
  if (tempMatch) {
    data.temperature = tempMatch[1] + "°C";
    data.dewPoint = tempMatch[2] + "°C";
  }

  const altMatch = text.match(/A(\d{4})/);
  if (altMatch) {
    const inches = altMatch[1];
    data.altimeter = `${inches.slice(0, 2)}.${inches.slice(2)}`;
  }

  const approachMatches = text.match(/(ILS|RNAV|GPS|VIS|VOR|RNP).*?RWY\s\d{2}[LRC]?/g);
  if (approachMatches) {
    data.approaches = approachMatches.map(a => a.trim());
  }

  const landingPatterns = [
    /LNDG AND DEP[\w\s]*?RWYS? ([\dLRC ,]+)/,
    /RWY(?:S)? ([\dLRC ]+(?:AND|,)? ?)+ IN USE/,
    /APCH.*?TO RWY ([\dLRC ,]+)/,
    /ILS.*?RWY ([\dLRC]+)/,
    /SIMUL.*?APCH(?:ES)?(?:.*?RWY)? ([\dLRC ,AND]+)/,
    /ARVNG AND DEPTG RWY(?:S)? ([\dLRC ,AND]+)/,
    /LANDING AND DEPARTING RUNWAY ([\dLRC]+)/,
    /LNDG AND DEPTG ([\dLRC]+)/,
    /LNDG AND DEPTG.*?RWY(?:S)? ([\dLRC]+)/,
    /LDG AND DEPTG.*?RWY(?:S)? ([\dLRC]+)/,
    /LANDING RWY(?:S) ([\dLRC ,AND]+)/,
    /APCH IN USE.*?RWY ([\dLRC]+)/,
    /SIMUL INST APCHS.*?RWY(?:S)? ([\dLRC ,AND]+)/,
    /SIMUL VISUAL APCHS.*?RY(?:S)? ([\dLRC ,AND]+)/,
    /SIMUL VIS APCHS.*?RWY(?:S)? ([\dLRC ,AND]+)/,
    /ILS RY \d{2}[LRC]? APCH IN USE LND RY ([\dLRC]+)/,
    /ILS RWY \d{2}[LRC]? APCH AND ILS RWY \d{2}[LRC]? APCH WITH A VIS APCH TO RWY \d{2}[LRC]? IN USE/
  ];
  for (const pattern of landingPatterns) {
    const match = text.match(pattern);
    if (match) {
      const rwy = match[1]?.match(/\d{2}[LRC]?/g);
      if (rwy) {
        data.landingRunways = [...new Set([...(data.landingRunways || []), ...rwy])];
      }
    }
  }

  const departurePatterns = [
    /DEPTG RWY[S]? ([\dLRC ,]+)/,
    /SIMUL DEPS RWY(?:S)? ([\dLRC ,AND]+)/,
    /ARVNG AND DEPTG RWY(?:S)? ([\dLRC ,AND]+)/,
    /LANDING AND DEPARTING RUNWAY ([\dLRC]+)/,
    /LNDG AND DEPTG ([\dLRC]+)/,
    /LNDG AND DEPTG.*?RWY(?:S)? ([\dLRC]+)/,
    /LND AND DEPTG.*?RWY(?:S)? ([\dLRC]+)/,
    /DEPTG RY ([\dLRC ,]+)/,
    /DEPART RY ([\dLRC ,]+)/,
    /SIMUL INSTR DEPARTURES.*?RWYS? ([\dLRC ,AND]+)/,
    /SIMUL DEPS IN USE ([\dLRC ,AND]+)/,
  ];
  for (const pattern of departurePatterns) {
    const match = text.match(pattern);
    if (match) {
      const rwy = match[1]?.match(/\d{2}[LRC]?/g);
      if (rwy) {
        data.departureRunways = [...new Set([...(data.departureRunways || []), ...rwy])];
      }
    }
  }

  const advisoryMatches = text.match(/RWY \d{2}[LRC]? .*?(?=\.|,|;)/g);
  if (advisoryMatches) {
    data.runwayAdvisories = advisoryMatches.map(s => s.trim());
  }

  const notamMatches = text.match(/NOTAMS.*?(?=\.\.\.|$)/);
  if (notamMatches) {
    const twyMatches = notamMatches[0].match(/TWY [A-Z0-9 ,]+CLSD[^.]*/g);
    if (twyMatches) data.notams = twyMatches.map(s => s.trim());
  }

  const closedRwyMatch = text.match(/RUNWAYS? (.*?) ARE CLSD/);
  if (closedRwyMatch) {
    const closed = closedRwyMatch[1].match(/\d{2}[LRC]?/g);
    if (closed && closed.length) {
      data.runwayAdvisories = [...(data.runwayAdvisories || []), ...closed.map(rwy => `RWY ${rwy} CLOSED`)];
    }
  }

  const customRemarkPatterns = [
    /READBACK ALL HOLD SHORT.*?/,
    /NUMEROUS CRANES.*?(?=\.|,)/,
    /PARALLEL RWYS/,
    /BIRD ACTIVITY.*?(?=\.|,)/,
    /TERMINAL RAMP IS UNCTLD.*?(?=\.|,)/
  ];
  data.remarks = customRemarkPatterns
    .map(p => text.match(p))
    .filter(Boolean)
    .map(m => m![0]);

  return data;
}
