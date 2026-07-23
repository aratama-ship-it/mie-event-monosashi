import { readFile, writeFile } from "node:fs/promises";

const inputPath = process.argv[2];
const sourceUrl =
  "https://raw.githubusercontent.com/amay077/JapanPrefGeoJson/master/prefs/24.geojson";

if (!inputPath) {
  throw new Error("Pass the Mie Prefecture GeoJSON path as the first argument.");
}

const feature = JSON.parse(await readFile(inputPath, "utf8"));

if (feature.properties?.id !== 24 || feature.geometry?.type !== "MultiPolygon") {
  throw new Error("Expected Mie Prefecture (code 24) MultiPolygon GeoJSON.");
}

const project = ([longitude, latitude]) => {
  const x = (longitude * Math.PI) / 180;
  const latitudeRadians = (latitude * Math.PI) / 180;
  const y = -Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2));
  return [x, y];
};

const polygons = feature.geometry.coordinates.map((polygon) =>
  polygon.map((ring) => ring.map(project)),
);
const points = polygons.flat(2);
const xs = points.map(([x]) => x);
const ys = points.map(([, y]) => y);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minY = Math.min(...ys);
const maxY = Math.max(...ys);
const width = 400;
const height = 640;
const padding = 12;
const scale = Math.min(
  (width - padding * 2) / (maxX - minX),
  (height - padding * 2) / (maxY - minY),
);
const offsetX = (width - (maxX - minX) * scale) / 2;
const offsetY = (height - (maxY - minY) * scale) / 2;

const path = polygons
  .flatMap((polygon) =>
    polygon.map(
      (ring) =>
        ring
          .map(([x, y], index) => {
            const px = ((x - minX) * scale + offsetX).toFixed(2);
            const py = ((y - minY) * scale + offsetY).toFixed(2);
            return `${index === 0 ? "M" : "L"}${px} ${py}`;
          })
          .join(" ") + " Z",
    ),
  )
  .join(" ");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <title>三重県のシルエット</title>
  <metadata>Generated from ${sourceUrl}. The source repository declares the data Public Domain.</metadata>
  <path d="${path}" fill="#000" fill-rule="evenodd"/>
</svg>
`;

await writeFile(new URL("../public/mie-silhouette.svg", import.meta.url), svg);
