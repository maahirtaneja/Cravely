import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI not defined in environment variables");
  process.exit(1);
}

const restaurantsData = [
  {
    name: "The Burger Club",
    description: "Juicy artisanal smash burgers, crispy loaded fries, and handcrafted thickshakes.",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80",
    phone: 9876543210,
    isOpen: true,
    isVerified: true,
    ownerId: "system_seed_owner_1",
    autoLocation: {
      type: "Point",
      coordinates: [75.795, 26.832],
      formattedAddress: "Plot 14, Sanganer Main Road, Jaipur, Rajasthan 302014",
    },
    menu: [
      {
        name: "Classic Smash Cheeseburger",
        description: "Double grilled smash patty with melted American cheddar, gherkins & secret house sauce.",
        price: 199,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Crispy BBQ Chicken Burger",
        description: "Golden fried crispy chicken breast smothered in smoky Texas BBQ glaze and slaw.",
        price: 249,
        image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Peri Peri Loaded Fries",
        description: "Crunchy crinkle-cut fries generously tossed in spicy peri-peri seasoning with cheese dip.",
        price: 129,
        image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Oreo Brownie Thickshake",
        description: "Thick creamy vanilla ice cream churned with crushed Oreos and rich dark fudge.",
        price: 159,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
    ],
  },
  {
    name: "Biryani By Kilo",
    description: "Authentic royal Dum Biryanis cooked individually in clay handis using pure desi ghee.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
    phone: 9829012345,
    isOpen: true,
    isVerified: true,
    ownerId: "system_seed_owner_2",
    autoLocation: {
      type: "Point",
      coordinates: [75.789, 26.828],
      formattedAddress: "Shop 7, Tonk Road, Sanganer, Jaipur, Rajasthan 302014",
    },
    menu: [
      {
        name: "Hyderabadi Chicken Dum Biryani",
        description: "Fragrant long-grain basmati layered with tender chicken pieces, saffron, and fresh mint.",
        price: 349,
        image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Royal Paneer Tikka Biryani",
        description: "Charcoal roasted spiced paneer cubes simmered in aromatic layered saffron rice.",
        price: 299,
        image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Garlic Butter Naan (2 pcs)",
        description: "Traditional tandoor baked leavened bread brushed generously with garlic butter.",
        price: 79,
        image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Shahi Tukda Royal Dessert",
        description: "Crispy fried bread soaked in saffron-infused rabri topped with roasted pistachios.",
        price: 119,
        image: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
    ],
  },
  {
    name: "La Pino'z Woodfire Pizza",
    description: "Freshly tossed hand-stretched sourdough pizzas with authentic Italian herb crust.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
    phone: 9871122334,
    isOpen: true,
    isVerified: true,
    ownerId: "system_seed_owner_3",
    autoLocation: {
      type: "Point",
      coordinates: [75.802, 26.835],
      formattedAddress: "B-22, Airport Plaza, Airport Road, Jaipur, Rajasthan 302014",
    },
    menu: [
      {
        name: "Farmhouse Garden Pizza",
        description: "Loaded with bell peppers, sweet corn, black olives, red onions & mozzarella.",
        price: 289,
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Fiery Paneer Makhani Pizza",
        description: "Spicy tandoori paneer tikka cubes atop rich makhani gravy sauce and cheese.",
        price: 329,
        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Cheesy Stuffed Garlic Bread",
        description: "Freshly baked baguette packed with gooey melted mozzarella, cheddar, and sweet corn.",
        price: 149,
        image: "https://images.unsplash.com/photo-1619895092538-128341789043?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Warm Choco Lava Cake",
        description: "Decadent dark chocolate molten center exploding from a warm chocolate sponge cake.",
        price: 99,
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
    ],
  },
  {
    name: "Sagar Ratna - South Indian",
    description: "Crispy dosas, fluffy steamed idlis, and traditional filter kaapi made fresh every morning.",
    image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80",
    phone: 9811002244,
    isOpen: true,
    isVerified: true,
    ownerId: "system_seed_owner_4",
    autoLocation: {
      type: "Point",
      coordinates: [75.782, 26.825],
      formattedAddress: "Shop 104, Sanganer Market, Jaipur, Rajasthan 302014",
    },
    menu: [
      {
        name: "Special Ghee Roast Masala Dosa",
        description: "Extra crisp golden fermented crepe roasted in pure ghee and stuffed with spiced potato mash.",
        price: 159,
        image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Steamed Button Idli (with Sambar & Chutneys)",
        description: "Four melt-in-mouth steamed rice-lentil cakes served with piping hot dal sambar.",
        price: 99,
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Crispy Medu Vada (2 pcs)",
        description: "Golden fried savory lentil doughnuts flavoured with cracked black pepper and curry leaves.",
        price: 110,
        image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Madras Filter Kaapi",
        description: "Traditional decoction coffee frothed to perfection with fresh milk in steel dabarah.",
        price: 65,
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
    ],
  },
  {
    name: "Wok & Roll - Asian Kitchen",
    description: "Sizzling woks, authentic street-style noodles, crispy dumplings, and spicy Thai curries.",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80",
    phone: 9833445566,
    isOpen: true,
    isVerified: true,
    ownerId: "system_seed_owner_5",
    autoLocation: {
      type: "Point",
      coordinates: [75.791, 26.837],
      formattedAddress: "First Floor, Sector 3, Pratap Nagar, Sanganer, Jaipur 302014",
    },
    menu: [
      {
        name: "Veg Hakka Noodles",
        description: "Wok-tossed noodles with crunchy julienned bell peppers, carrots, spring onions, and soy.",
        price: 189,
        image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Crispy Chilli Paneer Dry",
        description: "Battered paneer cubes tossed with red & green chillies, garlic, and dark soy reduction.",
        price: 229,
        image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Steamed Vegetable Dimsums (6 pcs)",
        description: "Delicate translucent parcels stuffed with minced mushrooms, water chestnuts & scallions.",
        price: 159,
        image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Thai Green Curry with Jasmine Rice",
        description: "Creamy coconut milk curry infused with kaffir lime, galangal, lemongrass, and bamboo shoots.",
        price: 319,
        image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
    ],
  },
  {
    name: "Chai Point & Snacks",
    description: "Desi comfort snacks, hot steaming chai, crispy samosas, and street food delights.",
    image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800&auto=format&fit=crop&q=80",
    phone: 9866554433,
    isOpen: true,
    isVerified: true,
    ownerId: "system_seed_owner_6",
    autoLocation: {
      type: "Point",
      coordinates: [75.786, 26.83],
      formattedAddress: "Near Metro Pillar 24, Sanganer, Jaipur, Rajasthan 302014",
    },
    menu: [
      {
        name: "Adrak Elaichi Kulhad Chai",
        description: "Strong milk tea brewed with fresh crushed ginger and green cardamom, served in clay kulhad.",
        price: 49,
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Punjabi Aloo Samosa (2 pcs)",
        description: "Golden flaky shortcrust pastry filled with spiced potato cubes, cashews & green peas.",
        price: 59,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Mumbai Vada Pav with Lasun Chutney",
        description: "Spiced mashed potato fritter nestled inside soft pav bread with roasted garlic crumb.",
        price: 49,
        image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Indori Poha with Crispy Sev",
        description: "Flattened rice tempered with mustard, fennel seeds, turmeric, green chillies & ratlami sev.",
        price: 79,
        image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
    ],
  },
  {
    name: "Sweet Treats & Bakery Cafe",
    description: "Freshly baked artisan croissants, cheesecakes, cupcakes, and specialty espresso.",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
    phone: 9899887766,
    isOpen: false, // Closed restaurant example
    isVerified: true,
    ownerId: "system_seed_owner_7",
    autoLocation: {
      type: "Point",
      coordinates: [75.798, 26.839],
      formattedAddress: "Shop 4, Commercial Belt, Haldi Ghati Marg, Jaipur 302014",
    },
    menu: [
      {
        name: "Belgian Chocolate Croissant",
        description: "Flaky all-butter laminated pastry filled with two batons of 55% Belgian dark chocolate.",
        price: 140,
        image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Classic New York Cheesecake",
        description: "Silky baked cream cheese custard on a crunchy buttery graham cracker crust with berry coulis.",
        price: 199,
        image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Red Velvet Velvet Slice",
        description: "Moist cocoa buttermilk red sponge layered with rich cream cheese frosting.",
        price: 135,
        image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Iced Caramel Macchiato",
        description: "Double shot of espresso poured over cold whole milk and sweet vanilla syrup, finished with caramel drizzle.",
        price: 175,
        image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
    ],
  },
  {
    name: "Taco Fiesta Mexican Grill",
    description: "Sizzling fajitas, street-style corn tacos, loaded nachos, and zesty burritos.",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80",
    phone: 9811224488,
    isOpen: false, // Closed restaurant example
    isVerified: true,
    ownerId: "system_seed_owner_8",
    autoLocation: {
      type: "Point",
      coordinates: [75.779, 26.821],
      formattedAddress: "Corner 5, Sanganer Ring Road, Jaipur, Rajasthan 302014",
    },
    menu: [
      {
        name: "Crispy Cheesy Veg Tacos (3 pcs)",
        description: "Hard shell corn tortillas packed with refried beans, cheddar, lettuce, sour cream, and pico de gallo.",
        price: 219,
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Loaded Guacamole & Tortilla Chips",
        description: "Stone-ground yellow corn tortilla chips served with fresh avocado guacamole and salsa roja.",
        price: 179,
        image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Grilled Paneer Burrito Bowl",
        description: "Cilantro lime rice, black beans, fajita peppers, grilled paneer, and chipotle crema.",
        price: 269,
        image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
      {
        name: "Chilled Virgin Mojito",
        description: "Muddled mint sprigs, fresh lime wedges, sparkling soda, and cane sugar syrup.",
        price: 119,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80",
        isAvailable: true,
      },
    ],
  },
];

async function seed() {
  console.log("Connecting to MongoDB Atlas Cravely database...");
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection;

  console.log("Cleaning up previous sample restaurants & menu items...");
  await db.collection("restaurants").deleteMany({ ownerId: { $regex: /^system_seed_owner/ } });

  console.log(`Inserting ${restaurantsData.length} diverse restaurants with full menus...`);

  let totalItems = 0;
  for (const rData of restaurantsData) {
    const { menu, ...restData } = rData;
    const resDoc = await db.collection("restaurants").insertOne({
      ...restData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const restaurantId = resDoc.insertedId;

    const itemsToInsert = menu.map((m) => ({
      ...m,
      restaurantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.collection("menuitems").insertMany(itemsToInsert);
    totalItems += itemsToInsert.length;
    console.log(` ✔ Seeded "${restData.name}" (${restData.isOpen ? "OPEN" : "CLOSED"}) with ${itemsToInsert.length} dishes`);
  }

  console.log(`\n🎉 Seed finished successfully! Added ${restaurantsData.length} restaurants and ${totalItems} menu dishes.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
