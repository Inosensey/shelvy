// Static content for the demo workspace. Everything here is fictional.

export const DEMO = {
  orgId: 'demo-org',
  orgName: 'ByteHub Computer Shop',
  orgDescription:
    'Sample data for exploring Shelvy. This workspace resets daily.',
  historyDays: 60,
  users: {
    OWNER: {
      id: 'demo-owner',
      email: 'owner@demo.shelvy.test',
      firstName: 'Maria',
      lastName: 'Santos',
    },
    MANAGER: {
      id: 'demo-manager',
      email: 'manager@demo.shelvy.test',
      firstName: 'Paolo',
      lastName: 'Reyes',
    },
    STAFF: {
      id: 'demo-staff',
      email: 'staff@demo.shelvy.test',
      firstName: 'Jessa',
      lastName: 'Cruz',
    },
  },
} as const;

export type DemoRole = keyof typeof DEMO.users;

export interface SupplierSpec {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export const SUPPLIERS: SupplierSpec[] = [
  {
    name: 'Pacific Peripherals Trading',
    email: 'orders@pacific-peripherals.example',
    phone: '+63 2 8555 0101',
    address: 'Quezon City, Metro Manila',
  },
  {
    name: 'Nexus Computer Distribution',
    email: 'sales@nexus-computers.example',
    phone: '+63 2 8555 0102',
    address: 'Makati City, Metro Manila',
  },
  {
    name: 'Luzon Display Supply',
    email: 'hello@luzon-display.example',
    phone: '+63 2 8555 0103',
    address: 'Pasig City, Metro Manila',
  },
  {
    name: 'MegaChip Components',
    email: 'orders@megachip.example',
    phone: '+63 32 555 0104',
    address: 'Cebu City, Cebu',
  },
  {
    name: 'Visayas Gadget Wholesale',
    email: 'wholesale@visayas-gadgets.example',
    phone: '+63 33 555 0105',
    address: 'Iloilo City, Iloilo',
  },
  {
    name: 'Cebu Cable & Accessories',
    email: 'support@cebu-cables.example',
    phone: '+63 32 555 0106',
    address: 'Mandaue City, Cebu',
  },
];

export interface ProductSpec {
  sku: string;
  name: string;
  description: string;
  price: number; // PHP
  supplier: number; // index into SUPPLIERS
  threshold: number; // low stock alert level
  opening: number; // stock at the start of the history
  rate: number; // average units sold per day (0 = no sales)
  endLow?: number; // force the product to end the history at this stock level
  archived?: boolean;
}

export const PRODUCTS: ProductSpec[] = [
  // Peripherals
  {
    sku: 'MOU-0001',
    name: 'Wireless Gaming Mouse 16K DPI',
    description: 'Lightweight wireless mouse with 6 programmable buttons.',
    price: 1450,
    supplier: 0,
    threshold: 8,
    opening: 40,
    rate: 0.9,
  },
  {
    sku: 'KEY-0001',
    name: 'Mechanical Keyboard (Red Switch)',
    description: 'Full-size RGB keyboard with linear red switches.',
    price: 2650,
    supplier: 0,
    threshold: 8,
    opening: 36,
    rate: 0.8,
  },
  {
    sku: 'KEY-0002',
    name: 'Mechanical Keyboard (Blue Switch)',
    description: 'Full-size keyboard with clicky blue switches.',
    price: 2450,
    supplier: 0,
    threshold: 8,
    opening: 30,
    rate: 0.6,
    endLow: 3,
  },
  {
    sku: 'PAD-0001',
    name: 'RGB Mouse Pad XL',
    description: '900 x 400 mm extended pad with RGB edge lighting.',
    price: 490,
    supplier: 0,
    threshold: 15,
    opening: 80,
    rate: 1.4,
  },
  {
    sku: 'CAM-0001',
    name: 'USB Webcam 1080p',
    description: 'Full HD webcam with built-in microphone.',
    price: 1890,
    supplier: 0,
    threshold: 6,
    opening: 24,
    rate: 0.4,
  },
  {
    sku: 'HDS-0001',
    name: 'Gaming Headset 7.1 Surround',
    description: 'USB headset with detachable microphone.',
    price: 2190,
    supplier: 0,
    threshold: 8,
    opening: 30,
    rate: 0.6,
  },
  {
    sku: 'MOU-0002',
    name: 'Wired Office Mouse (Discontinued)',
    description: 'Basic 3-button optical mouse. No longer sold.',
    price: 250,
    supplier: 0,
    threshold: 5,
    opening: 12,
    rate: 0,
    archived: true,
  },
  // Displays
  {
    sku: 'MON-0001',
    name: '24" IPS Monitor 144Hz',
    description: 'Full HD IPS panel, 1 ms response time.',
    price: 8990,
    supplier: 2,
    threshold: 4,
    opening: 14,
    rate: 0.25,
  },
  {
    sku: 'MON-0002',
    name: '27" Curved Monitor 165Hz',
    description: '1440p curved VA panel with adaptive sync.',
    price: 14990,
    supplier: 2,
    threshold: 3,
    opening: 10,
    rate: 0.15,
  },
  {
    sku: 'ARM-0001',
    name: 'Monitor Arm (Single)',
    description: 'Gas-spring desk mount for 17" to 32" screens.',
    price: 1290,
    supplier: 2,
    threshold: 5,
    opening: 20,
    rate: 0.3,
  },
  // Components
  {
    sku: 'RAM-0001',
    name: '16GB DDR4 3200MHz Memory',
    description: 'Single 16GB desktop memory module.',
    price: 2290,
    supplier: 3,
    threshold: 10,
    opening: 45,
    rate: 0.7,
  },
  {
    sku: 'RAM-0002',
    name: '32GB DDR5 5600MHz Kit (2x16GB)',
    description: 'Dual-channel DDR5 kit with heat spreaders.',
    price: 6490,
    supplier: 3,
    threshold: 5,
    opening: 18,
    rate: 0.25,
  },
  {
    sku: 'SSD-0001',
    name: '1TB NVMe SSD',
    description: 'PCIe 4.0 M.2 solid state drive.',
    price: 3690,
    supplier: 3,
    threshold: 8,
    opening: 34,
    rate: 0.6,
  },
  {
    sku: 'SSD-0002',
    name: '2TB SATA SSD',
    description: '2.5" SATA solid state drive.',
    price: 6290,
    supplier: 3,
    threshold: 5,
    opening: 16,
    rate: 0.2,
  },
  {
    sku: 'PSU-0001',
    name: '650W 80+ Bronze Power Supply',
    description: 'Non-modular ATX power supply.',
    price: 2890,
    supplier: 3,
    threshold: 5,
    opening: 18,
    rate: 0.25,
  },
  {
    sku: 'CAS-0001',
    name: 'ATX Mid-Tower Case',
    description: 'Tempered glass side panel with 3 included fans.',
    price: 3190,
    supplier: 3,
    threshold: 4,
    opening: 14,
    rate: 0.2,
    endLow: 2,
  },
  {
    sku: 'GPU-0001',
    name: 'Graphics Card 8GB GDDR6',
    description: 'Dual-fan graphics card for 1080p gaming.',
    price: 19990,
    supplier: 3,
    threshold: 3,
    opening: 9,
    rate: 0.12,
    endLow: 0,
  },
  {
    sku: 'COO-0001',
    name: 'CPU Cooler (Dual Tower)',
    description: 'Dual-tower air cooler with 120 mm fans.',
    price: 1990,
    supplier: 3,
    threshold: 6,
    opening: 22,
    rate: 0.3,
  },
  // Laptops & gadgets
  {
    sku: 'LAP-0001',
    name: '15.6" Laptop Ryzen 5 / 16GB / 512GB',
    description: 'Everyday laptop with a Full HD display.',
    price: 38990,
    supplier: 1,
    threshold: 3,
    opening: 8,
    rate: 0.1,
  },
  {
    sku: 'LAP-0002',
    name: '14" Ultrabook Core i5 / 16GB / 512GB',
    description: 'Thin and light 14-inch ultrabook.',
    price: 46990,
    supplier: 1,
    threshold: 2,
    opening: 6,
    rate: 0.08,
  },
  {
    sku: 'BAG-0001',
    name: 'Laptop Backpack 15.6"',
    description: 'Water-resistant backpack with padded laptop sleeve.',
    price: 890,
    supplier: 4,
    threshold: 10,
    opening: 40,
    rate: 0.5,
  },
  {
    sku: 'PWR-0001',
    name: 'Power Bank 20000mAh',
    description: '22.5W fast-charging power bank with USB-C.',
    price: 1190,
    supplier: 4,
    threshold: 12,
    opening: 45,
    rate: 0.8,
    endLow: 9,
  },
  {
    sku: 'EAR-0001',
    name: 'Wireless Earbuds',
    description: 'Bluetooth 5.3 earbuds with charging case.',
    price: 1590,
    supplier: 4,
    threshold: 10,
    opening: 38,
    rate: 0.6,
  },
  // Cables & accessories
  {
    sku: 'CBL-0001',
    name: 'HDMI 2.1 Cable 2m',
    description: '8K-ready braided HDMI cable.',
    price: 390,
    supplier: 5,
    threshold: 20,
    opening: 90,
    rate: 1.5,
  },
  {
    sku: 'CBL-0002',
    name: 'USB-C Fast Charging Cable 1m',
    description: '60W braided USB-C to USB-C cable.',
    price: 290,
    supplier: 5,
    threshold: 25,
    opening: 120,
    rate: 2.0,
  },
  {
    sku: 'CBL-0003',
    name: 'Ethernet Cable Cat6 5m',
    description: 'Flat Cat6 patch cable.',
    price: 220,
    supplier: 5,
    threshold: 20,
    opening: 70,
    rate: 0.9,
    endLow: 6,
  },
  {
    sku: 'HUB-0001',
    name: 'USB 3.0 Hub 4-Port',
    description: 'Compact bus-powered USB hub.',
    price: 590,
    supplier: 5,
    threshold: 12,
    opening: 50,
    rate: 0.7,
  },
];
