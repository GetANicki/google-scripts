import fs from "fs";
import { Parser } from "json2csv";

interface Location {
  "Location No": string;
  "Location Name": string;
  Address: string;
  Latitude: number;
  Longitude: number;
}

const [inputFilenameArg, outputFilenameArg] = process.argv.slice(2);

const inputFilename = inputFilenameArg || "locations.json";
const outputFilename =
  outputFilenameArg || inputFilename.replace(".json", ".csv");

const input = JSON.parse(
  fs.readFileSync(inputFilename || "locations.json").toString("utf-8"),
);

if (!input?.data?.length) {
  console.log("Loaded data, but didn't find any locations");
  process.exit(-1);
}

console.log(`Loaded ${input?.data.length} locations from source`);

const locations: Location[] = input.data.map(
  (x) =>
    ({
      "Location No": `${x.id}`,
      "Location Name": x.name,
      Address: x.geocoded_address,
      Latitude: x.lat,
      Longitude: x.lon,
    } as Location),
);

// get only unique addresses
let filteredLocations = locations
  .filter(
    (x) =>
      !locations.find(
        (y) => y["Location No"] !== x["Location No"] && y.Address === x.Address,
      ),
  )
  // don't conflict with our "magic" "Home" address
  .filter((x) => x["Location Name"].trim().toLowerCase() !== "home");

console.log(`Parsed ${filteredLocations.length} unique locations`);

// exclude actual street addresses
filteredLocations = filteredLocations.filter(
  (x) => !/^[0-9]+/.test(x["Location Name"]),
);

console.log(`Filtered to ${filteredLocations.length} named locations`);

fs.writeFileSync(outputFilename, new Parser().parse(filteredLocations));
