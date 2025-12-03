import { Server } from "http";
import mongoose from "mongoose";
import { envVars } from "./app/config/env";
import app from "./app";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";

let server: Server;

const startServer = async () => {
  try {
    await mongoose.connect(envVars.MONGODB_URL as string);
    console.log("Connected with database!");

    server = app.listen(envVars.PORT, () => {
      console.log(`Server is listening on port ${envVars.PORT}`);
    });
  } catch (error) {
    console.log("error_____", error);
  }
};

(async () => {
  await startServer();
  await seedSuperAdmin();
})();

// unhandled rejection error(premiss rejection)
process.on("unhandledRejection", (err) => {
  console.log(
    "Unhandled Rejection detected ......... Server shutting down...",
    err
  );

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }

  process.exit(1);
});

// uncaught rejection error(not connect with premiss)
process.on("uncaughtException", (err) => {
  console.log(
    "Uncaught Exception detected ......... Server shutting down...",
    err
  );

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
