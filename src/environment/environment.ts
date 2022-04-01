import { environment as commonEnv } from "./Environment.common";
import { environment as prodEnv } from "./Environment.prod";
import { environment as devEnv } from "./Environment.dev";

const ENV = process.env.NODE_ENV || "development";

let env;

switch (ENV) {
    case "production":
        env = prodEnv;
        break;
    case "development":
        env = devEnv;
        break;
    default:
        throw new Error(`no matching constants file found for env '${env}'`);
}

export const environment = Object.assign(commonEnv, env);
