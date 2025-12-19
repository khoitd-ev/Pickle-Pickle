// backend/src/modules/home/home.routes.js
import { getHomeLocations, getTopBookedVenues } from "./home.service.js";

export default async function homeRoutes(app) {

    app.get("/public/home/locations", async (req, reply) => {
        const { limit } = req.query || {};
        const items = await getHomeLocations({ limit });
        return reply.send({ items });
    });

    
    app.get("/public/home/top-venues", async (req, reply) => {
        const { city, limit } = req.query || {};
        const items = await getTopBookedVenues({ city, limit });
        return reply.send({ items });
    });
}
