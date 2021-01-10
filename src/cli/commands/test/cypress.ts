import { CommandModule } from "yargs";
import Cypress from "cypress";
import { startDocker } from "../../../node/dev/start-docker";
import { setupDatabase } from "../../../node/dev/setup-database";
import { checkRedis } from "../../common/check-redis";
import { log } from "../../../node/utils/log";
import { generateExpressRoutes } from "../../../node/dev/generate-express-routes";
import { startWebpack } from "../../common/start-webpack";
import { startServer } from "../../common/start-server";
import { clearDb } from "../../../node/test/clear-db";

const cypress: CommandModule<{}, { open: boolean }> = {
  command: "cypress",
  describe: "Run Cypress Tests",
  builder: (yargs) =>
    yargs.options({
      open: {
        type: "boolean",
        default: false,
        description: "Run tests in interactive mode",
      },
    }),
  handler: async ({ open }) => {
    process.env.DB_CONNECTION = "saas_test";
    process.env.NODE_ENV = "test";
    process.env.SERVER_PORT = "3037";
    process.env.JWT_SECRET = "abc_123";

    await startDocker();

    try {
      await Promise.all([setupDatabase(false), checkRedis()]);
      await clearDb();
    } catch (err) {
      log.error(err.message);
      process.exit(1);
    }

    const metadata = await generateExpressRoutes();
    await startWebpack(metadata);
    await startServer();

    if (open) {
      await Cypress.open();
    } else {
      await Cypress.run();
    }

    process.exit(0);
  },
};

export default cypress;
