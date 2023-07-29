import path from "path";
import fs from "fs";
import snapPackage from "../snap/package.json";

const fileContents = `export const SNAP_VERSION = "${snapPackage.version}";`;

fs.writeFileSync(path.join(__dirname, "src", "version.ts"), fileContents);
