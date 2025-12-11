import { getVenueDetail } from "./court.service.js";

export async function getVenueDetailHandler(request, reply) {
  try {
    // Thêm log này để xem params thực tế là gì
    request.log.info({ params: request.params }, "getVenueDetailHandler params");

    const { venueId } = request.params;

    const data = await getVenueDetail(venueId);
    if (!data) {
      return reply.status(404).send({ message: "Venue not found" });
    }

    return reply.send({ data });
  } catch (err) {
    request.log.error(err, "Error fetching venue detail");
    return reply.status(500).send({ message: "Internal server error" });
  }
}
