import { parseLocationNo } from "./locations";

describe("locations", () => {
  describe("parseLocationNo", () => {
    it.each([
      ["1087 Country Hills Rd, Yardley, PA 19067", "19067_1087CountryHillsRd"],
      ["1087 Country Hills Rd, Yardley, PA, 19067", "19067_1087CountryHillsRd"],
      [
        "1087 Country Hills Rd, Yardley, PA, 19067 US",
        "19067_1087CountryHillsRd",
      ],
      [
        "1087 Country Hills Rd, Apt #2, Yardley, PA, 19067 US",
        "19067_1087CountryHillsRd",
      ],
      ["1087 Country Hills Rd, Yardley, PA", "1087CountryHillsRdYardleyPA"],
    ])("should parse valid address", (address, expectedLocationNo) => {
      expect(parseLocationNo(address)).toBe(expectedLocationNo);
    });
  });
});
