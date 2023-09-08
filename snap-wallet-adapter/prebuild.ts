import path from "path";
import fs from "fs";
import snapPackage from "../snap/package.json";

const versionFilePath = path.join(__dirname, "src", "version.ts");

const newVersionFileContents = `export const SNAP_VERSION = "${snapPackage.version}";`;

fs.writeFileSync(versionFilePath, newVersionFileContents);

const readmePath = path.join(__dirname, "README.md");

const readmeFileContents = fs.readFileSync(readmePath, "utf-8");

const readmeVersionRegex = /### Snap Version: (.*)/;

const currentReadmeVersion = readmeFileContents.match(readmeVersionRegex)?.[1];

if (currentReadmeVersion !== snapPackage.version) {
  const newReadmeContents = readmeFileContents.replace(
    /### Snap Version: .*/,
    `### Snap Version: ${snapPackage.version}`
  );

  fs.writeFileSync(readmePath, newReadmeContents);

  console.log(
    "\n*** Updated snap version in readme. Please commit and push these changes. ***\n"
  );
}
