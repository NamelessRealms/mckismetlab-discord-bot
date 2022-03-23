import * as fs from "fs-extra";
import * as path from "path";

let configPath = path.join(__dirname, "..", "..", "..", "config", "bot_service");

export function getConfig(): any {
    return fs.readJSONSync(path.join(configPath, "config.json"));
}

export function getDynamicConfigPath(): any {
    return path.join(configPath, "dynamicConfig.json");
}
