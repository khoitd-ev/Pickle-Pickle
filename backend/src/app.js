// src/app.js
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config/env.js";
import { searchRoutes } from "./modules/search/search.routes.js";
import { courtRoutes } from "./modules/courts/court.routes.js";
import { bookingRoutes } from "./modules/bookings/booking.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import addonRoutes from "./modules/addons/addon.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import { startBookingExpirationJob } from "./jobs/bookingExpiration.job.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import ownerAddonRoutes from "./modules/addons/ownerAddon.routes.js";
import { venueConfigRoutes } from "./modules/venueConfig/venueConfig.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import { adminFinanceRoutes } from "./modules/adminFinance/adminFinance.routes.js";
import { adminVenueRoutes } from "./modules/adminVenues/adminVenue.routes.js";
import ownerVenueContentRoutes from "./modules/venueContent/ownerVenueContent.routes.js";
import adminVenueContentRoutes from "./modules/venueContent/adminVenueContent.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // CORS
  app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });


  // Cho phép upload file (multipart/form-data)
  app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  // Serve thư mục uploads qua /uploads/...
  app.register(fastifyStatic, {
    root: path.join(__dirname, "..", "uploads"),
    prefix: `${config.apiPrefix}/uploads/`,
  });

  // Healthcheck cho Docker
  app.get("/healthz", async () => {
    return {
      ok: true,
      ts: Date.now(),
    };
  });

  app.register(searchRoutes, { prefix: config.apiPrefix });
  app.register(courtRoutes, { prefix: config.apiPrefix });
  app.register(bookingRoutes, { prefix: config.apiPrefix });
  app.register(authRoutes, { prefix: config.apiPrefix });
  app.register(addonRoutes, { prefix: config.apiPrefix });
  app.register(paymentRoutes, { prefix: config.apiPrefix });
  app.register(dashboardRoutes, { prefix: config.apiPrefix });

  // Owner-specific addon routes
  app.register(ownerAddonRoutes, {
    prefix: `${config.apiPrefix}/owner`,
  });
  app.register(venueConfigRoutes, { prefix: config.apiPrefix });

  // User management routes
  app.register(userRoutes, { prefix: config.apiPrefix });
  // Admin finance routes
  app.register(adminFinanceRoutes, { prefix: config.apiPrefix });
  // Admin venue management routes
  app.register(adminVenueRoutes, { prefix: config.apiPrefix });

  app.register(ownerVenueContentRoutes, {
    prefix: `${config.apiPrefix}/owner`,
  });

  app.register(adminVenueContentRoutes, { prefix: config.apiPrefix });
  startBookingExpirationJob();

  

  return app;
}
