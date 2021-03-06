import { parseSpreadsheetValues } from "./googleExt";

describe("googleExt", () => {
  describe("parseSpreadsheetValues", () => {
    it("should parse spreadsheet values into objects", () => {
      const headers = ["First Name", "Last Name", "Age"];
      const rows = [
        ["John", "Doe", "23"],
        ["Jane", "Doe", "42"],
      ];

      const objects = parseSpreadsheetValues<{
        firstName: string;
        lastName: string;
        age: string;
      }>(headers, rows);

      expect(objects).toMatchObject([
        {
          firstName: "John",
          lastName: "Doe",
          age: "23",
        },
        {
          firstName: "Jane",
          lastName: "Doe",
          age: "42",
        },
      ]);
    });

    it("should parse spreadsheet values with empty cells", () => {
      const [headers, ...rows] = [
        ["Order ID", "Status", "Notes"],
        ["cus_LHejWZ80NfdZkb_1648581971144", "In Optimo", ""],
      ];

      const objects = parseSpreadsheetValues(headers, rows);

      expect(objects).toMatchObject([
        {
          orderId: "cus_LHejWZ80NfdZkb_1648581971144",
          status: "In Optimo",
          notes: "",
        },
      ]);
    });

    it("should parse headers properly", () => {
      expect(
        parseSpreadsheetValues(
          ["Order ID", "Pickup Location", "Drop-off Location"],
          [["1", "CVS", "Home"]],
        ),
      ).toMatchObject([
        { orderId: "1", pickupLocation: "CVS", dropOffLocation: "Home" },
      ]);
    });

    it.skip("should ignore empty rows", () => {
      expect(
        parseSpreadsheetValues(
          ["Awesome", "Cool"],
          [
            ["", ""],
            [null as any, null as any],
          ],
        ),
      ).toMatchObject([]);
    });
  });
});
