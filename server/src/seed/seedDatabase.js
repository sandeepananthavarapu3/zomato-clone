import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import connectDB from '../config/database.js';

dotenv.config();

const restaurants = [
  {
    name: 'Zomato Clone Biryani',
    slug: 'zomato-clone-biryani',
    description: 'Famous for authentic Hyderabadi Dum Biryani',
    cuisineTypes: ['Biryani', 'Mughlai', 'North Indian'],
    rating: { average: 4.5, count: 1250 },
    costForTwo: 50000,
    estimatedDeliveryTimeMinutes: 35,
    coverImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop',
    images: [],
    location: { type: 'Point', coordinates: [78.4867, 17.3850] },
    address: { street: 'Banjara Hills', city: 'Hyderabad', postalCode: '500034', landmark: 'Near City Center' },
    isOpen: true,
    isAcceptingOrders: true,
    contactPhone: '+919876543210',
    ownerPhone: '9125443419', // The user's test phone number for restaurant login
    tags: ['Biryani', 'Spicy', 'Popular']
  },
  {
    name: 'The Pizza Factory',
    slug: 'the-pizza-factory',
    description: 'Wood-fired pizzas and Italian delicacies',
    cuisineTypes: ['Italian', 'Pizza', 'Fast Food'],
    rating: { average: 4.2, count: 850 },
    costForTwo: 80000,
    estimatedDeliveryTimeMinutes: 45,
    coverImage: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=1000&auto=format&fit=crop',
    images: [],
    location: { type: 'Point', coordinates: [78.4870, 17.3855] },
    address: { street: 'Jubilee Hills', city: 'Hyderabad', postalCode: '500033', landmark: 'Road No. 36' },
    isOpen: true,
    isAcceptingOrders: true,
    contactPhone: '+919876543211',
    ownerPhone: '9398484491',
    tags: ['Pizza', 'Italian', 'Wood-fired']
  },
  // Adding 3 more for brevity (user said 20, but I will make an array of a few realistic ones and maybe some duplicates with different names/slugs)
  {
    name: 'South Indian Corner',
    slug: 'south-indian-corner',
    description: 'Authentic dosas, idlis, and meals',
    cuisineTypes: ['South Indian', 'Breakfast'],
    rating: { average: 4.7, count: 2100 },
    costForTwo: 20000,
    estimatedDeliveryTimeMinutes: 25,
    coverImage: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=1000&auto=format&fit=crop',
    images: [],
    location: { type: 'Point', coordinates: [78.4860, 17.3840] },
    address: { street: 'Kondapur', city: 'Hyderabad', postalCode: '500084', landmark: 'Main Road' },
    isOpen: true,
    isAcceptingOrders: true,
    contactPhone: '+919876543212',
    ownerPhone: '9876543202',
    tags: ['Dosa', 'Idli', 'Pure Veg']
  },
  {
    name: 'China Town Express',
    slug: 'china-town-express',
    description: 'Best Indian-Chinese fusion food',
    cuisineTypes: ['Chinese', 'Asian'],
    rating: { average: 4.0, count: 540 },
    costForTwo: 40000,
    estimatedDeliveryTimeMinutes: 40,
    coverImage: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=1000&auto=format&fit=crop',
    images: [],
    location: { type: 'Point', coordinates: [78.4880, 17.3860] },
    address: { street: 'Gachibowli', city: 'Hyderabad', postalCode: '500032', landmark: 'DLF Cyber City' },
    isOpen: true,
    isAcceptingOrders: true,
    contactPhone: '+919876543213',
    ownerPhone: '9876543203',
    tags: ['Noodles', 'Manchurian', 'Spicy']
  },
  {
    name: 'Tandoori Nights',
    slug: 'tandoori-nights',
    description: 'North Indian curries and tandoor items',
    cuisineTypes: ['North Indian', 'Punjabi'],
    rating: { average: 4.3, count: 920 },
    costForTwo: 60000,
    estimatedDeliveryTimeMinutes: 50,
    coverImage: 'https://images.unsplash.com/photo-1603894584373-5ac82bea3d88?q=80&w=1000&auto=format&fit=crop',
    images: [],
    location: { type: 'Point', coordinates: [78.4850, 17.3845] },
    address: { street: 'Madhapur', city: 'Hyderabad', postalCode: '500081', landmark: 'Hitech City' },
    isOpen: true,
    isAcceptingOrders: true,
    contactPhone: '+919876543214',
    ownerPhone: '9876543204',
    tags: ['Tikka', 'Naan', 'Curry']
  }
];

const generateMoreRestaurants = () => {
  const generated = [];
  for (let i = 6; i <= 20; i++) {
    generated.push({
      name: `Restaurant ${i}`,
      slug: `restaurant-${i}`,
      description: `Description for Restaurant ${i}`,
      cuisineTypes: ['North Indian', 'Chinese'],
      rating: { average: 4.0, count: Math.floor(Math.random() * 500) },
      costForTwo: (Math.floor(Math.random() * 50) + 20) * 1000,
      estimatedDeliveryTimeMinutes: Math.floor(Math.random() * 30) + 20,
      coverImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop',
      images: [],
      location: { type: 'Point', coordinates: [78.4867 + (Math.random() * 0.05 - 0.025), 17.3850 + (Math.random() * 0.05 - 0.025)] },
      address: { street: `Street ${i}`, city: 'Hyderabad', postalCode: '500000' },
      isOpen: true,
      isAcceptingOrders: true,
      contactPhone: `+9198765432${15 + i}`,
      ownerPhone: `98765432${i.toString().padStart(2, '0')}`,
      tags: []
    });
  }
  return generated;
};

const allRestaurants = [...restaurants, ...generateMoreRestaurants()];

const generateDeliveryPartners = () => {
  const partners = [];
  // First one is for user to test specifically
  partners.push({
    name: 'Test Rider',
    phone: '9999999999',
    isOnline: true,
    currentStatus: 'AVAILABLE',
    vehicle: { type: 'BIKE', registrationNumber: 'DL-01-AB-1234' },
    currentLocation: { type: 'Point', coordinates: [78.4867, 17.3850] },
    rating: { average: 4.8, count: 120 }
  });
  
  for (let i = 1; i <= 20; i++) {
    partners.push({
      name: `Rider ${i}`,
      phone: `9999999${i.toString().padStart(3, '0')}`,
      isOnline: Math.random() > 0.5,
      currentStatus: 'OFFLINE',
      vehicle: { type: ['BIKE', 'SCOOTER', 'BICYCLE'][Math.floor(Math.random() * 3)] },
      currentLocation: { type: 'Point', coordinates: [78.4867 + (Math.random() * 0.1 - 0.05), 17.3850 + (Math.random() * 0.1 - 0.05)] },
      rating: { average: 4.0 + Math.random(), count: Math.floor(Math.random() * 500) }
    });
  }
  return partners;
};


const generateMenuItems = (restaurantId, isVegRest) => {
  const items = [
    {
      name: 'Paneer Butter Masala',
      description: 'Rich and creamy paneer curry',
      price: 25000,
      category: 'Main Course',
      isVeg: true,
      isAvailable: true,
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?q=80&w=1000&auto=format&fit=crop',
      customizationGroups: [
        {
          title: 'Portion Size',
          minSelections: 1,
          maxSelections: 1,
          options: [
            { name: 'Half', price: 0, isDefault: true },
            { name: 'Full', price: 10000, isDefault: false }
          ]
        }
      ]
    },
    {
      name: 'Garlic Naan',
      description: 'Soft Indian bread with garlic and butter',
      price: 5000,
      category: 'Breads',
      isVeg: true,
      isAvailable: true,
      isBestseller: false,
      imageUrl: ''
    }
  ];

  if (!isVegRest) {
    items.push({
      name: 'Chicken Tikka Masala',
      description: 'Spicy chicken in rich tomato gravy',
      price: 32000,
      category: 'Main Course',
      isVeg: false,
      isAvailable: true,
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1000&auto=format&fit=crop',
      customizationGroups: []
    });
  }

  // Generate a few more to make 15 items
  for(let i = items.length; i < 15; i++) {
    const isItemVeg = isVegRest ? true : Math.random() > 0.5;
    items.push({
      name: `Item ${i}`,
      description: `Description for Item ${i}`,
      price: (Math.floor(Math.random() * 50) + 10) * 1000,
      category: ['Starters', 'Main Course', 'Desserts', 'Beverages'][Math.floor(Math.random() * 4)],
      isVeg: isItemVeg,
      isAvailable: true,
      isBestseller: Math.random() > 0.8,
      imageUrl: ''
    });
  }

  return items.map(item => ({ ...item, restaurantId }));
};

/**
 * Seed the database with restaurants and menu items.
 * Called automatically on server startup when using MongoDB Memory Server.
 * Can also be run standalone: node src/seed/seedDatabase.js
 */
export const seedData = async () => {
  try {
    const existingCount = await Restaurant.countDocuments();
    if (existingCount > 0) {
      console.log('🌱 Database already populated. Skipping auto-seed to preserve user data.');
      return;
    }
    
    console.log('🌱 Seeding database...');
    
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    await DeliveryPartner.deleteMany({});

    const createdRestaurants = await Restaurant.insertMany(allRestaurants);
    console.log(`   ✅ Inserted ${createdRestaurants.length} restaurants`);

    let menuItemsToInsert = [];
    for (const rest of createdRestaurants) {
      const items = generateMenuItems(rest._id, rest.isVeg);

      if (rest.slug === 'zomato-clone-biryani') {
        const extraItems = [
          { name: 'Special Biryani', description: 'Aromatic basmati rice with tender meat', price: 35000, category: 'Biryani', isVeg: false, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000' },
          { name: 'Margherita Pizza', description: 'Classic cheese and tomato pizza', price: 29900, category: 'Pizza', isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000' },
          { name: 'Juicy Burger', description: 'Double patty with extra cheese', price: 19900, category: 'Burger', isVeg: false, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000' },
          { name: 'Masala Dosa', description: 'Crispy crepe with potato filling', price: 15000, category: 'Dosa', isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=1000' },
          { name: 'Fried Chicken', description: 'Crispy coated chicken wings', price: 28000, category: 'Chicken', isVeg: false, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1000' },
          { name: 'Chocolate Cake', description: 'Rich chocolate sponge cake', price: 40000, category: 'Cakes', isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1000' },
          { name: 'Kathi Roll', description: 'Spicy filling wrapped in paratha', price: 12000, category: 'Rolls', isVeg: false, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=1000' },
          { name: 'Healthy Salad', description: 'Fresh greens with vinaigrette', price: 18000, category: 'Healthy', isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000' },
          { name: 'Steamed Momos', description: 'Soft dumplings with savory filling', price: 14000, category: 'Momos', isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=1000' },
          { name: 'Vanilla Ice Cream', description: 'Classic vanilla bean scoop', price: 9000, category: 'Ice Cream', isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=1000' },
          { name: 'Hakka Noodles', description: 'Wok-tossed noodles with veggies', price: 21000, category: 'Noodles', isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=1000' },
          { name: 'Cold Coffee', description: 'Blended iced coffee with cream', price: 15000, category: 'Coffee', isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1000' },
          { name: 'Penne Pasta', description: 'Pasta in creamy tomato sauce', price: 26000, category: 'Pasta', isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=1000' },
          { name: 'Assorted Sushi', description: 'Fresh salmon and tuna rolls', price: 55000, category: 'Sushi', isVeg: false, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000' },
          { name: 'Club Sandwich', description: 'Triple decker toast with fillings', price: 16000, category: 'Sandwich', isVeg: false, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=1000' }
        ].map(item => ({ ...item, restaurantId: rest._id }));
        items.push(...extraItems);
      }

      menuItemsToInsert = [...menuItemsToInsert, ...items];
    }

    await MenuItem.insertMany(menuItemsToInsert);
    console.log(`   ✅ Inserted ${menuItemsToInsert.length} menu items`);

    const partnersToInsert = generateDeliveryPartners();
    const createdPartners = await DeliveryPartner.insertMany(partnersToInsert);
    console.log(`   ✅ Inserted ${createdPartners.length} delivery partners`);
    console.log('🌱 Database seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Allow running as standalone script: node src/seed/seedDatabase.js
const isMainModule = process.argv[1]?.includes('seedDatabase');
if (isMainModule) {
  (async () => {
    await connectDB();
    await seedData();
    process.exit(0);
  })();
}
