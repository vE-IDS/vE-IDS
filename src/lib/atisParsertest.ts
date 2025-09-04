/**
 * @interface Cloud
 * Represents a single cloud layer in a METAR report.
 */
export interface Cloud {
    cover: string;
    altitude: number;
}

/**
 * @interface DecodedAtis
 * Represents the structured, decoded ATIS/METAR information.
 */
export interface DecodedAtis {
    infoCode: string;
    obsTime: string;
    atisType: string;
    wind: string;
    visibility: string;
    weather: string;
    clouds: Cloud[];
    temp: string;
    dewpoint: string;
    altimeter: string;
    ceiling: string;
    flightCategory: string;
    depRunways: string[];
    arrRunways: string[];
    remarks: string;
}

/**
 * Decodes a raw ATIS/METAR string into a structured object.
 * @param {string} text - The raw ATIS broadcast string.
 * @returns {DecodedAtis} - A structured object with the decoded information.
 */
export function decodeAtis(text: string): DecodedAtis {
    const upperText = text.toUpperCase();
    
    /** @type {DecodedAtis} */
    const output: DecodedAtis = {
        infoCode: 'N/A',
        obsTime: 'N/A',
        atisType: 'General',
        wind: 'N/A',
        visibility: 'N/A',
        weather: 'N/A',
        clouds: [],
        temp: 'N/A',
        dewpoint: 'N/A',
        altimeter: 'N/A',
        ceiling: 'No Ceiling',
        flightCategory: 'UNKNOWN',
        depRunways: [],
        arrRunways: [],
        remarks: 'None'
    };

    // Information Code
    const phoneticMap: { [key: string]: string } = { 'ALPHA':'A', 'BRAVO':'B', 'CHARLIE':'C', 'DELTA':'D', 'ECHO':'E', 'FOXTROT':'F', 'GOLF':'G', 'HOTEL':'H', 'INDIA':'I', 'JULIETT':'J', 'KILO':'K', 'LIMA':'L', 'MIKE':'M', 'NOVEMBER':'N', 'OSCAR':'O', 'PAPA':'P', 'QUEBEC':'Q', 'ROMEO':'R', 'SIERRA':'S', 'TANGO':'T', 'UNIFORM':'U', 'VICTOR':'V', 'WHISKEY':'W', 'XRAY':'X', 'YANKEE':'Y', 'ZULU':'Z' };
    const infoCodeMatch = upperText.match(/(?:INFO|INFORMATION)\s+([A-Z]|ALPHA|BRAVO|CHARLIE|DELTA|ECHO|FOXTROT|GOLF|HOTEL|INDIA|JULIETT|KILO|LIMA|MIKE|NOVEMBER|OSCAR|PAPA|QUEBEC|ROMEO|SIERRA|TANGO|UNIFORM|VICTOR|WHISKEY|XRAY|YANKEE|ZULU)\b/);
    if (infoCodeMatch) {
        output.infoCode = phoneticMap[infoCodeMatch[1]] || infoCodeMatch[1];
    }

    // Observation Time (Zulu)
    const timeMatch = upperText.match(/\b(\d{2})(\d{2})(\d{2})Z\b/);
    if (timeMatch) {
        output.obsTime = `Day ${timeMatch[1]} at ${timeMatch[2]}:${timeMatch[3]}Z`;
    }

    // ATIS Type (Departure/Arrival)
    const hasDeparture = /(DEPARTING|DEPARTURE|DEP)/.test(upperText);
    const hasArrival = /(ARRIVING|ARRIVAL|ARR|LANDING)/.test(upperText);
    if (hasDeparture && hasArrival) output.atisType = 'Combined';
    else if (hasDeparture) output.atisType = 'Departure';
    else if (hasArrival) output.atisType = 'Arrival';
    
    // Wind: 25007KT or 25007G15KT or VRB03KT
    const windMatch = upperText.match(/\b(VRB|\d{3})(\d{2,3})(G\d{2})?KT\b/);
    if (windMatch) {
        output.wind = `${windMatch[1]}° at ${parseInt(windMatch[2])} knots${windMatch[3] ? `, gusts to ${parseInt(windMatch[3].slice(1))} knots` : ''}`;
    }

    // Visibility: 10SM or 1 1/2SM or 3/4SM or 9999 or 8000
    const visMatch = upperText.match(/\b((\d+\s)?\d\/\dSM|\d+SM|P6SM|M1\/4SM|CAVOK|(\d{4}))\b/);
    if (visMatch) {
        if (visMatch[0] === 'P6SM' || visMatch[0] === 'CAVOK' || (visMatch[3] && parseInt(visMatch[3]) >= 9999)) {
            output.visibility = '10+ statute miles';
        } else if (visMatch[0].includes('SM')) {
            output.visibility = `${visMatch[0].replace('SM', '')} statute miles`.replace('M1/4', 'Less than 1/4');
        } else if (visMatch[3]) {
            const visMeters = parseInt(visMatch[3]);
            output.visibility = `${visMeters} meters (~${(visMeters / 1609).toFixed(1)} mi)`;
        }
    }
    
    // Weather: -RA BR or +TSRA
    const weatherMatch = upperText.match(/\s(-|\+|VC)?([A-Z]{2}|[A-Z]{4}){1,3}\s/);
    if (weatherMatch && weatherMatch[0].trim().length > 1 && weatherMatch[0].trim().length < 9) {
        output.weather = weatherMatch[0].trim();
    } else {
        output.weather = 'None';
    }

    // Temp/Dew Point: 18/15 or M01/M05
    const tempMatch = upperText.match(/\b(M?\d{2})\/(M?\d{2})\b/);
    if (tempMatch) {
        output.temp = `${tempMatch[1].replace('M', '-')}°C`;
        output.dewpoint = `${tempMatch[2].replace('M', '-')}°C`;
    }

    // Altimeter: A2992
    const altimeterMatch = upperText.match(/\bA(\d{4})\b/);
    if (altimeterMatch) {
        output.altimeter = `${(parseInt(altimeterMatch[1]) / 100).toFixed(2)} inHg`;
    }
    
    // Cloud Layers
    const cloudRegex = /(FEW|SCT|BKN|OVC|VV)(\d{3})/g;
    let cloudMatch;
    while ((cloudMatch = cloudRegex.exec(upperText)) !== null) {
        output.clouds.push({
            cover: cloudMatch[1],
            altitude: parseInt(cloudMatch[2]) * 100
        });
    }
    
    // Ceiling and Flight Category Calculation
    const ceilingLayer = output.clouds.find(c => c.cover === 'BKN' || c.cover === 'OVC' || c.cover === 'VV');
    if (ceilingLayer) {
        output.ceiling = `${ceilingLayer.altitude.toLocaleString()} ft AGL`;
    }

    let visibilityMiles = Infinity;
    if(output.visibility !== 'N/A' && output.visibility.includes('statute miles')){
        const visText = output.visibility.replace(' statute miles', '').trim();
        if(visText.includes('/')){
            const parts = visText.split(' ');
            if (parts.length > 1) { visibilityMiles = parseInt(parts[0]) + (parseInt(parts[1].split('/')[0]) / parseInt(parts[1].split('/')[1])); } 
            else { visibilityMiles = parseInt(visText.split('/')[0]) / parseInt(visText.split('/')[1]); }
        } else if (visText === '10+') { visibilityMiles = 10; } 
        else if (visText.startsWith('Less than')) { visibilityMiles = 0.24; }
        else { visibilityMiles = parseFloat(visText); }
    } else if (output.visibility !== 'N/A' && output.visibility.includes('meters')) {
        const metersMatch = output.visibility.match(/(\d+)/);
        if (metersMatch) {
            const meters = parseFloat(metersMatch[0]);
            visibilityMiles = meters / 1609.34;
        }
    }
    
    const ceilingFt = ceilingLayer ? ceilingLayer.altitude : Infinity;
    
    if (ceilingFt < 500 || visibilityMiles < 1) output.flightCategory = 'LIFR';
    else if (ceilingFt < 1000 || visibilityMiles < 3) output.flightCategory = 'IFR';
    else if (ceilingFt <= 3000 || visibilityMiles <= 5) output.flightCategory = 'MVFR';
    else output.flightCategory = 'VFR';
    
    if (output.visibility === 'N/A' && !ceilingLayer) output.flightCategory = 'UNKNOWN';

    // Runway and Approach Parsing
    // Departure Runways
    const depRwyRegex = /DEPART(?:ING|URE)S?\s+(?:RUNWAY|RWY)S?\s+([\w\s,AND&.-]+?)(?:\.|$|ARRIV|APPR|RMK)/i;
    const depMatch = upperText.match(depRwyRegex);
    if (depMatch && depMatch[1]) {
        const runwayIdentifiers = depMatch[1].match(/\b\d{1,2}[LCR]?\b/g);
        if (runwayIdentifiers) {
            output.depRunways = [...new Set(runwayIdentifiers)];
        }
    }

    // Arrival Runways & Approaches
    const arrAndApprRegex = /(?:ARRIV(?:ING|AL)S?|LANDING)S?\s+(?:RUNWAY|RWY)S?\s+([\w\s,AND&'.-]+?)(?:\.|$|DEPART|RMK)|((?:ILS|RNAV|GPS|LDA|VOR|VISUAL|CONTACT)\s+(?:PRM\s+)?(?:APPROACH|APCH)(?:ES)?(?:[\w\s,AND&'.-]*?))(?:\s+IN USE|\bTO\b|\.)/gi;
    let arrivalCandidates: string[] = [];
    let match;
    while ((match = arrAndApprRegex.exec(upperText)) !== null) {
        const cleanedMatch = (match[2] || match[3] || '').trim();
        if (!cleanedMatch) continue;

        if (match[2]) { // Matched "ARRIVING RUNWAY..." part
            const parts = cleanedMatch.split(/\s*,\s*|\s+AND\s+/i);
            const cleanedParts = parts.map(p =>
                p.trim()
                 .replace(/\s+(RWY|RUNWAY|APCHS|APPROACHES)\b/gi, '')
                 .replace(/\s+/g, ' ')
            ).filter(Boolean);
            arrivalCandidates.push(...cleanedParts);
        } else if (match[3]) { // Matched "ILS APPROACH..." part
            arrivalCandidates.push(cleanedMatch);
        }
    }
    output.arrRunways = [...new Set(arrivalCandidates)];

    // Handle Dual-Use and Generic-Use Runways
    const dualRwyRegex = /DEPART(?:ING|URE)S?\s+AND\s+(?:LANDING|ARRIV(?:ING|AL))S?\s+(?:RUNWAY|RWY)S?\s+([\w\s,AND&'.-]+?)(?:\.|$|RMK)/i;
    const dualMatch = upperText.match(dualRwyRegex);
    if (dualMatch && dualMatch[1]) {
        const runways = dualMatch[1].match(/\b\d{1,2}[LCR]?\b/g) || [];
        output.depRunways = [...new Set([...output.depRunways, ...runways])];
        output.arrRunways = [...new Set([...output.arrRunways, ...runways])];
    }

    if (output.depRunways.length === 0 && output.arrRunways.length === 0) {
        const genericRwyRegex = /(?:RUNWAY|RWY)S?\s+([\d\w\s,ANDLRC&'.-]+?)\s+IN USE/i;
        const genericMatch = upperText.match(genericRwyRegex);
        if (genericMatch && genericMatch[1]) {
            const runways = genericMatch[1].match(/\b\d{1,2}[LCR]?\b/g) || [];
            output.depRunways = runways;
            output.arrRunways = runways;
        }
    }
    
    // Remarks
    const remarksMatch = upperText.match(/RMK\s+(.*)/);
    if (remarksMatch) {
        output.remarks = remarksMatch[1];
        const infoCodeInRemarks = output.remarks.match(/(.*)\s+(INFO|INFORMATION)\s+([A-Z]|ALPHA|BRAVO|CHARLIE|DELTA|ECHO|FOXTROT|GOLF|HOTEL|INDIA|JULIETT|KILO|LIMA|MIKE|NOVEMBER|OSCAR|PAPA|QUEBEC|ROMEO|SIERRA|TANGO|UNIFORM|VICTOR|WHISKEY|XRAY|YANKEE|ZULU)/);
        if (infoCodeInRemarks && output.infoCode === 'N/A') {
            output.remarks = infoCodeInRemarks[1].trim();
            output.infoCode = phoneticMap[infoCodeInRemarks[3]] || infoCodeInRemarks[3];
        }
    }

    return output;
}

