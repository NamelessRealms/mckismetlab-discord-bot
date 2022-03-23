const fs = require("fs-extra");
const path = require("path");

const buildPath = path.join(__dirname, "build");

if (fs.existsSync(buildPath)) fs.removeSync(buildPath);
