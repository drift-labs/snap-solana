import express from "express";

const filesToServe = [
  "/snap.manifest.json",
  "/images/icon.svg",
  "/dist/main.js",
];

const server = express();

filesToServe.forEach((file) => {
  server.get(file, (req, res) => {
    res.sendFile(__dirname + file);
  });
});

server.listen(8080, () => {
  console.log(`Serving files on port 8080:\n${filesToServe.join("\n")}`);
});
