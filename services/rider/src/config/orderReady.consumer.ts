import axios from "axios";
import { getChannel } from "./rabbitmq.js";
import { Rider } from "../model/Rider.js";

export const startOrderReadyConsumer = async () => {
  const channel = getChannel();

  console.log("Starting to consume from:", process.env.ORDER_READY_QUEUE);

  channel.consume(process.env.ORDER_READY_QUEUE!, async (msg) => {
    if (!msg) return;

    try {
      console.log("Received Message:", msg.content.toString());

      const event = JSON.parse(msg.content.toString());

      if (event.type !== "ORDER_READY_FOR_RIDER") {
        console.log("skipping non-order-ready-for-rider event");
        channel.ack(msg);
        return;
      }

      const { orderId, restaurantId, location, attempt = 1 } = event.data;

      console.log(
        `🛵 [Manual Rider Dispatch] Search attempt ${attempt} for order ${orderId}`
      );

      // Check if order was already assigned
      try {
        const { data: statusCheck } = await axios.get(
          `${process.env.RESTAURANT_SERVICE}/api/order/internal/status/${orderId}`,
          {
            headers: {
              "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
          }
        );

        if (
          statusCheck?.riderId ||
          (statusCheck?.status && statusCheck.status !== "ready_for_rider")
        ) {
          console.log(
            `Order ${orderId} already assigned or finalized. Skipping search.`
          );
          channel.ack(msg);
          return;
        }
      } catch (err: any) {
        console.warn("Status check warning:", err?.message);
      }

      // Search radius expands based on attempt: 600m on #1, 900m on #2, up to 1500m
      const searchDistance = Math.min(600 + (attempt - 1) * 300, 1500);

      const riders = await Rider.find({
        isAvailble: true,
        isVerified: true,
        location: {
          $near: {
            $geometry: location,
            $maxDistance: searchDistance,
          },
        },
      });

      console.log(
        `Found ${riders.length} online rider(s) within ${searchDistance}m`
      );

      if (riders.length === 0) {
        console.log("No riders available nearby for this attempt.");
      } else {
        for (const rider of riders) {
          try {
            await axios.post(
              `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
              {
                event: "order:available",
                room: `user:${rider.userId}`,
                payload: { orderId, restaurantId, attempt },
              },
              {
                headers: {
                  "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                },
              }
            );
            console.log(`Dispatched to rider userId: ${rider.userId}`);
          } catch {
            console.log(`Failed to notify rider ${rider.userId}`);
          }
        }
      }

      channel.ack(msg);
      console.log("OrderReady message processed and acknowledged.");
    } catch (error) {
      console.error("OrderReady consumer error:", error);
      try {
        channel.ack(msg);
      } catch {}
    }
  });
};
