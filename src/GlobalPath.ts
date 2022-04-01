import * as path from "path";

export default class GlobalPath {

    public static rootPath() {
        return path.join(__dirname, "..");
    }

    public static botConfigDirPath() {
        return path.join(this.rootPath(), "botconfig");
    }
}