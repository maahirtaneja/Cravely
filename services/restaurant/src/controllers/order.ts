import axios from "axios";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import Address from "../models/Address.js";
import Cart from "../models/Cart.js";
import { IMenuItem } from "../models/MenuItems.js";
import Order from "../models/Order.js";
import Restaurant, { IRestaurant } from "../models/Restaurant.js";
import { publishEvent } from "../config/order.publisher.js";

export const createOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const { paymentMethod, addressId } = req.body;

  if (!addressId) {
    return res.status(400).json({
      message: "Address is required",
    });
  }

  const address = await Address.findOne({
    _id: addressId,
    userId: user._id,
  });

  if (!address) {
    return res.status(404).json({
      message: "Address Not found",
    });
  }

  const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(2);
  };

  const cartItems = await Cart.find({ userId: user._id })
    .populate<{ itemId: IMenuItem }>("itemId")
    .populate<{ restaurantId: IRestaurant }>("restaurantId");

  if (cartItems.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const firstCartItem = cartItems[0];

  if (!firstCartItem || !firstCartItem.restaurantId) {
    return res.status(400).json({
      message: "Invailid Cart Data",
    });
  }

  const restaurantId = firstCartItem.restaurantId._id;

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return res.status(404).json({
      message: "No restaurant with this id",
    });
  }

  if (!restaurant.isOpen) {
    return res.status(404).json({
      message: "Sorry this restaurant is closed for now",
    });
  }

  const distance = getDistanceKm(
    address.location.coordinates[1],
    address.location.coordinates[0],
    restaurant.autoLocation.coordinates[1],
    restaurant.autoLocation.coordinates[0]
  );

  let subtotal = 0;

  const orderItems = cartItems.map((cart) => {
    const item = cart.itemId;

    if (!item) {
      throw new Error("Invalid cart item");
    }

    const itemTotal = item.price * cart.quauntity;

    subtotal += itemTotal;

    return {
      itemId: item._id.toString(),
      name: item.name,
      price: item.price,
      quauntity: cart.quauntity,
    };
  });

  const deliveryFee = subtotal < 250 ? 49 : 0;
  const platfromFee = 7;
  const totalAmount = subtotal + deliveryFee + platfromFee;

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const [longitude, latitude] = address.location.coordinates;

  const riderAmount = Math.ceil(distance) * 17;

  const order = await Order.create({
    userId: user._id.toString(),
    restaurantId: restaurantId.toString(),
    restaurantName: restaurant.name,
    riderId: null,
    distance,
    riderAmount,
    items: orderItems,
    subtotal,
    deliveryFee,
    platfromFee,
    totalAmount,
    addressId: address._id.toString(),
    deliveryAddress: {
      fromattedAddress: address.formattedAddress,
      mobile: address.mobile,
      latitude,
      longitude,
    },

    paymentMethod,
    paymentStatus: "pending",
    status: "placed",
    expiresAt,
  });

  await Cart.deleteMany({ userId: user._id });

  res.json({
    message: "Order created successfully",
    orderId: order._id.toString(),
    amount: totalAmount,
  });
});

export const fetchOrderForPayment = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  if (order.paymentStatus !== "pending") {
    return res.status(400).json({
      message: "Order already paid",
    });
  }

  res.json({
    orderId: order._id,
    amount: order.totalAmount,
    currency: "INR",
  });
});

export const fetchRestaurantOrders = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    const { restaurantId } = req.params;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!restaurantId) {
      return res.status(400).json({
        message: "Restaurant id is required",
      });
    }

    const limit = req.query.limit ? Number(req.query.limit) : 0;

    const orders = await Order.find({
      restaurantId,
      paymentStatus: "paid",
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  }
);

const ALLOWED_STATUSES = ["accepted", "preparing", "ready_for_rider"] as const;

export const updateOrderStatus = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    const { orderId } = req.params;
    const { status } = req.body;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus !== "paid") {
      return res.status(404).json({
        message: "Order not completed",
      });
    }

    const restaurant = await Restaurant.findById(order.restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    if (restaurant.ownerId !== user._id.toString()) {
      return res.status(401).json({
        message: "You are not allowed to update this order",
      });
    }

    if (status === "ready_for_rider") {
      const currentAttempts = (order.riderSearchAttempts || 0) + 1;
      order.riderSearchAttempts = currentAttempts;

      // When 5th attempt is reached and restaurant retries, cancel and refund customer
      if (currentAttempts >= 5) {
        order.status = "cancelled";
        const refundMessage = `Rider not available after 5 attempts. Your order has been cancelled and refund of ₹${order.totalAmount} will be credited to your original payment method within 24 hours.`;
        order.cancelReason = refundMessage;
        await order.save();

        // Notify customer
        await axios.post(
          `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
          {
            event: "order:update",
            room: `user:${order.userId}`,
            payload: {
              orderId: order._id,
              status: "cancelled",
              cancelReason: refundMessage,
              message: refundMessage,
            },
          },
          {
            headers: {
              "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
          }
        );

        // Notify order room
        await axios.post(
          `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
          {
            event: "order:update",
            room: `user:${order._id}`,
            payload: {
              orderId: order._id,
              status: "cancelled",
              cancelReason: refundMessage,
              message: refundMessage,
            },
          },
          {
            headers: {
              "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
          }
        );

        // Notify restaurant
        await axios.post(
          `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
          {
            event: "order:update",
            room: `restaurant:${restaurant._id}`,
            payload: {
              orderId: order._id,
              status: "cancelled",
              cancelReason: "Cancelled: 5 rider retries exhausted without a rider.",
            },
          },
          {
            headers: {
              "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
          }
        );

        return res.json({
          message: "5th retry reached. Order cancelled and customer refund initiated.",
          order,
        });
      }

      order.status = "ready_for_rider";
      await order.save();

      // Notify customer of manual retry attempt
      await axios.post(
        `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
        {
          event: "order:update",
          room: `user:${order.userId}`,
          payload: {
            orderId: order._id,
            status: order.status,
            riderSearchAttempts: currentAttempts,
            message: `Restaurant retrying rider search (Attempt ${currentAttempts} of 5)...`,
          },
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        }
      );

      // Publish event for rider service
      await publishEvent("ORDER_READY_FOR_RIDER", {
        orderId: order._id.toString(),
        restaurantId: restaurant._id.toString(),
        location: restaurant.autoLocation,
        attempt: currentAttempts,
      });

      return res.json({
        message: `Rider search dispatched (Attempt ${currentAttempts} of 5)`,
        order,
      });
    }

    order.status = status;
    await order.save();

    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      {
        event: "order:update",
        room: `user:${order.userId}`,
        payload: {
          orderId: order._id,
          status: order.status,
        },
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      }
    );

    res.json({
      message: "order status updated successfully",
      order,
    });
  }
);

export const getMyOrders = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const orders = await Order.find({
    userId: req.user._id.toString(),
    paymentStatus: "paid",
  }).sort({ createdAt: -1 });

  res.json({ orders });
});

export const fetchSingleOrder = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.userId !== req.user._id.toString()) {
      return res.status(401).json({
        message: "You are not allowed to view this order",
      });
    }

    res.json(order);
  }
);

export const assignRiderToOrder = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const { orderId, riderId, riderName, riderImage, riderPhone } = req.body;

  const orderAvailable = await Order.findOne({
    riderId: String(riderId),
    status: { $ne: "delivered" },
  });

  if (orderAvailable) {
    return res.status(400).json({
      message: "You already have an order",
    });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
      success: false,
    });
  }

  if (order.riderId !== null) {
    return res.status(400).json({
      message: "Order already taken by another rider",
      success: false,
    });
  }

  const orderUpdated = await Order.findOneAndUpdate(
    { _id: orderId, riderId: null },
    {
      riderId: String(riderId),
      riderName:
        riderName && !riderName.startsWith("http")
          ? riderName
          : "Delivery Partner",
      riderImage:
        riderImage ||
        (riderName && riderName.startsWith("http") ? riderName : null),
      riderPhone,
      status: "rider_assigned",
    },
    { new: true }
  );

  if (!orderUpdated) {
    return res.status(400).json({
      message: "Order already taken by another rider",
      success: false,
    });
  }

  // Notify customer
  await axios.post(
    `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `user:${orderUpdated.userId}`,
      payload: orderUpdated,
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    }
  );

  // Notify restaurant
  await axios.post(
    `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `restaurant:${orderUpdated.restaurantId}`,
      payload: orderUpdated,
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    }
  );

  // Broadcast to all other riders that this order is claimed so their popups vanish immediately!
  await axios.post(
    `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
    {
      event: "order:taken",
      room: "riders",
      payload: {
        orderId: orderUpdated._id.toString(),
        message: "Order was accepted by another rider",
      },
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    }
  );

  res.json({
    message: "Rider Assigned Successfully",
    success: true,
    order: orderUpdated,
  });
});

export const getCurrentOrderForRider = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const { riderId } = req.query;

  if (!riderId) {
    return res.status(400).json({
      message: "Rider id is required",
    });
  }

  const order = await Order.findOne({
    riderId: String(riderId),
    status: { $ne: "delivered" },
  }).populate("restaurantId");

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  res.json(order);
});

export const updateOrderStatusRider = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const { orderId } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  if (order.status === "rider_assigned") {
    order.status = "picked_up";

    await order.save();

    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      }
    );

    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      }
    );

    return res.json({
      message: "Order updated Successfully",
    });
  }

  if (order.status === "picked_up") {
    order.status = "delivered";

    await order.save();

    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      }
    );

    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      }
    );

    return res.json({
      message: "Order updated Successfully",
    });
  }
});

export const getOrderStatusInternal = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json({
    orderId: order._id,
    status: order.status,
    riderId: order.riderId,
  });
});

export const cancelOrderNoRider = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // If already assigned or already finalized, don't re-cancel
  if (order.riderId || order.status === "delivered" || order.status === "cancelled") {
    return res.json({
      message: "Order already finalized or assigned to rider",
      order,
    });
  }

  const refundMessage = `Rider not available. Your order has been cancelled and refund of ₹${order.totalAmount} will be credited to your original payment method within 24 hours.`;

  order.status = "cancelled";
  order.cancelReason = refundMessage;
  await order.save();

  // Notify customer
  await axios.post(
    `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
    {
      event: "order:update",
      room: `user:${order.userId}`,
      payload: {
        orderId: order._id,
        status: "cancelled",
        cancelReason: refundMessage,
        message: refundMessage,
      },
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    }
  );

  // Notify order room
  await axios.post(
    `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
    {
      event: "order:update",
      room: `user:${order._id}`,
      payload: {
        orderId: order._id,
        status: "cancelled",
        cancelReason: refundMessage,
        message: refundMessage,
      },
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    }
  );

  // Notify restaurant
  await axios.post(
    `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
    {
      event: "order:update",
      room: `restaurant:${order.restaurantId}`,
      payload: {
        orderId: order._id,
        status: "cancelled",
        cancelReason: "Cancelled: No delivery partner available nearby after retries.",
      },
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    }
  );

  res.json({
    message: "Order cancelled successfully. Customer notified of refund.",
    order,
  });
});
