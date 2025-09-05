import { parseAtis, getFlightCategory, getFlightCategoryColor } from '../lib/atisParser';

describe('atisParser', () => {
  describe('parseAtis', () => {
    it('should parse a basic ATIS message', () => {
      const atisMessage = 'KLGA INFO A 1253Z. WIND 36010KT. VIS 10SM. CLR. ALTM 3000. RWY 04.';
      const result = parseAtis(atisMessage);
      expect(result).toBeDefined();
      expect(result.runways.landingRunways).toEqual(['04']);
      expect(result.weather.wind?.direction).toBe('360');
      expect(result.weather.wind?.speed).toBe(10);
      expect(result.weather.visibility).toBe(10);
      expect(result.weather.altimeter).toBe(30.00);
      expect(result.atisCode).toBe('A');
      expect(result.atisTimeZ).toBe('1253Z');
    });

    it('should handle missing data gracefully', () => {
      const atisMessage = 'KJFK INFO B.';
      const result = parseAtis(atisMessage);
      expect(result).toBeDefined();
      expect(result.runways.landingRunways).toEqual([]);
      expect(result.weather.wind).toBeUndefined();
      expect(result.weather.visibility).toBeUndefined();
      expect(result.weather.altimeter).toBeUndefined();
      expect(result.atisCode).toBe('B');
    });

    it('should parse multiple runways', () => {
      const atisMessage = 'KLAX INFO C. RWY 25R AND 24L.';
      const result = parseAtis(atisMessage);
      expect(result).toBeDefined();
      expect(result.runways.landingRunways).toEqual(['25R', '24L']);
    });
  });

  describe('getFlightCategory', () => {
    it('should return VFR when visibility and ceiling are good', () => {
      expect(getFlightCategory(6, 3500)).toBe('VFR');
    });

    it('should return MVFR when visibility or ceiling is marginal', () => {
      expect(getFlightCategory(4, 2000)).toBe('MVFR');
      expect(getFlightCategory(6, 2000)).toBe('MVFR');
    });

    it('should return IFR when visibility or ceiling is low', () => {
      expect(getFlightCategory(2, 800)).toBe('IFR');
      expect(getFlightCategory(2, 3500)).toBe('IFR');
    });

    it('should return LIFR when visibility and ceiling are very low', () => {
      expect(getFlightCategory(0.5, 300)).toBe('LIFR');
    });

     it('should return VFR when visibility or ceiling is not defined', () => {
      expect(getFlightCategory(undefined, 300)).toBe('VFR');
      expect(getFlightCategory(0.5, undefined)).toBe('VFR');
      expect(getFlightCategory(undefined, undefined)).toBe('VFR');
    });
  });

  describe('getFlightCategoryColor', () => {
    it('should return the correct color for VFR', () => {
      expect(getFlightCategoryColor('VFR')).toBe('bg-green-700');
    });

    it('should return the correct color for MVFR', () => {
      expect(getFlightCategoryColor('MVFR')).toBe('bg-blue-700');
    });

    it('should return the correct color for IFR', () => {
      expect(getFlightCategoryColor('IFR')).toBe('bg-rose-800');
    });

    it('should return the correct color for LIFR', () => {
      expect(getFlightCategoryColor('LIFR')).toBe('bg-fuchsia-500');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty ATIS message', () => {
      const atisMessage = '';
      const result = parseAtis(atisMessage);
      expect(result).toBeDefined();
    });

    it('should handle ATIS message with unusual formatting', () => {
      const atisMessage = '  KORD   INFO   D  .   WIND   VRB5KT  .   VIS   1/2SM   .   OVC003  .';
      const result = parseAtis(atisMessage);
      expect(result).toBeDefined();
      expect(result.weather.wind?.direction).toBe('VRB');
      expect(result.weather.wind?.speed).toBe(5);
      expect(result.weather.visibility).toBe(0.5);
      expect(result.weather.cloudLayers).toEqual([{ coverage: 'OVC', altitude: 300 }]);
    });

    it('should handle runway with single digit', () => {
      const atisMessage = 'KBOS INFO E. RWY 4.';
      const result = parseAtis(atisMessage);
      expect(result).toBeDefined();
      expect(result.runways.landingRunways).toEqual(['04']);
    });

    it('should handle RVR with variable range', () => {
        const atisMessage = 'KATL INFO F. RVR R26L/1600V2400.';
        const result = parseAtis(atisMessage);
        expect(result).toBeDefined();
        expect(result.weather.rvr).toEqual({
            runway: '26L',
            minRange: 1600,
            maxRange: 2400,
        });
    });
  });
});