"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./app/config/env");
const app_1 = __importDefault(require("./app"));
const seedSuperAdmin_1 = require("./app/utils/seedSuperAdmin");
let server;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(env_1.envVars.MONGODB_URL);
        console.log("Connected with database!");
        server = app_1.default.listen(env_1.envVars.PORT, () => {
            console.log(`Server is listening on port ${env_1.envVars.PORT}`);
        });
    }
    catch (error) {
        console.log("error_____", error);
    }
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield startServer();
    yield (0, seedSuperAdmin_1.seedSuperAdmin)();
}))();
// unhandled rejection error(premiss rejection)
process.on("unhandledRejection", (err) => {
    console.log("Unhandled Rejection detected ......... Server shutting down...", err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
// uncaught rejection error(not connect with premiss)
process.on("uncaughtException", (err) => {
    console.log("Uncaught Exception detected ......... Server shutting down...", err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
// signal termination sigterm
process.on("SIGTERM", () => {
    console.log("SIGTERM signal received ......... Server shutting down...");
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
// (for manual shut down)
process.on("SIGINT", () => {
    console.log("SIGINT signal received ......... Server shutting down...");
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
