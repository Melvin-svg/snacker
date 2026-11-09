// The machine has exactly six motors, wired to slots A1, A2, A3, B1, B2, B3 (see the
// firmware's SLOTS table). Every product needs a UNIQUE position from that list: a
// position the firmware does not know ends in ERROR:UNKNOWN_SLOT (jam + refund), and two
// products on one slot both vend from that slot's motor. Keep this in sync with the
// backend's firebase/seed.js.
export const DEFAULT_SNACKS = [
  {
    id: "lays-classic",
    name: "Classic Salted Lays",
    subtitle: "Crispy Potato Chips",
    category: "snacks",
    price: 20,
    stock: 12,
    position: "A1",
    imgSrc: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "doritos-nacho",
    name: "Doritos Nacho Cheese",
    subtitle: "Crunchy Tortilla Chips",
    category: "snacks",
    price: 35,
    stock: 10,
    position: "A2",
    imgSrc: "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "oreo-vanilla",
    name: "Oreo Sandwich Cookies",
    subtitle: "Vanilla Cream Cookies",
    category: "snacks",
    price: 30,
    stock: 15,
    position: "A3",
    imgSrc: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "snickers-bar",
    name: "Snickers Bar",
    subtitle: "Caramel & Peanuts Chocolate",
    category: "snacks",
    price: 45,
    stock: 8,
    position: "B1",
    imgSrc: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "coca-cola",
    name: "Coca-Cola Original",
    subtitle: "Chilled Soda 300ml",
    category: "drinks",
    price: 40,
    stock: 16,
    position: "B2",
    imgSrc: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "kitkat-wafer",
    name: "KitKat 4-Finger",
    subtitle: "Crispy Wafer Chocolate",
    category: "snacks",
    price: 30,
    stock: 11,
    position: "B3",
    imgSrc: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&auto=format&fit=crop&q=80",
  },
];
