export interface WardrobeEssential {
  id: string;
  name: string;
  category: "top" | "bottom" | "outerwear" | "shoes" | "accessory" | "dress";
  color: string;
  season: "all" | "summer" | "winter";
  image_url: string;
  cutout_url: string;
  badge?: string;
  recommended?: boolean;
}

export const STARTER_ESSENTIALS: WardrobeEssential[] = [
  // TOPS
  {
    id: "essential-top-1",
    name: "Cream Oversized Linen Shirt",
    category: "top",
    color: "Cream",
    season: "all",
    image_url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop",
    badge: "Versatile",
    recommended: true,
  },
  {
    id: "essential-top-2",
    name: "Heavyweight Boxy White Tee",
    category: "top",
    color: "White",
    season: "all",
    image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop",
    badge: "Essential",
    recommended: true,
  },
  {
    id: "essential-top-3",
    name: "Washed Black Vintage Cotton Tee",
    category: "top",
    color: "Washed Black",
    season: "all",
    image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop",
    recommended: true,
  },
  {
    id: "essential-top-4",
    name: "Heather Grey Crewneck Knit",
    category: "top",
    color: "Heather Grey",
    season: "winter",
    image_url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop",
    recommended: false,
  },

  // BOTTOMS
  {
    id: "essential-bot-1",
    name: "Pleated Wide-Leg Chinos",
    category: "bottom",
    color: "Olive / Sage",
    season: "all",
    image_url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop",
    badge: "Trending",
    recommended: true,
  },
  {
    id: "essential-bot-2",
    name: "Straight-Leg Selvedge Denim",
    category: "bottom",
    color: "Indigo Blue",
    season: "all",
    image_url: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop",
    badge: "Classic",
    recommended: true,
  },
  {
    id: "essential-bot-3",
    name: "Tailored Charcoal Pleated Pants",
    category: "bottom",
    color: "Charcoal Slate",
    season: "all",
    image_url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop",
    recommended: false,
  },
  {
    id: "essential-bot-4",
    name: "Minimalist Linen Easy Shorts",
    category: "bottom",
    color: "Sandstone",
    season: "summer",
    image_url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop",
    recommended: false,
  },

  // OUTERWEAR
  {
    id: "essential-out-1",
    name: "Structured Camel Trench Coat",
    category: "outerwear",
    color: "Camel",
    season: "winter",
    image_url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop",
    badge: "Editorial",
    recommended: true,
  },
  {
    id: "essential-out-2",
    name: "Vintage Denim Trucker Jacket",
    category: "outerwear",
    color: "Light Wash",
    season: "all",
    image_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop",
    recommended: true,
  },

  // SHOES
  {
    id: "essential-shoe-1",
    name: "Minimalist Chunky White Sneakers",
    category: "shoes",
    color: "White",
    season: "all",
    image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop",
    badge: "Staple",
    recommended: true,
  },
  {
    id: "essential-shoe-2",
    name: "Classic Polished Black Loafers",
    category: "shoes",
    color: "Polished Black",
    season: "all",
    image_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop",
    recommended: true,
  },
  {
    id: "essential-shoe-3",
    name: "Suede Chelsea Boots",
    category: "shoes",
    color: "Warm Taupe",
    season: "winter",
    image_url: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&auto=format&fit=crop",
    recommended: false,
  },

  // DRESSES & SETS
  {
    id: "essential-dress-1",
    name: "Minimalist Tailored Jumpsuit / Set",
    category: "dress",
    color: "Sandstone",
    season: "all",
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop",
    recommended: false,
  },

  // ACCESSORIES
  {
    id: "essential-acc-1",
    name: "Brushed Steel Minimalist Watch",
    category: "accessory",
    color: "Silver",
    season: "all",
    image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop",
    recommended: false,
  },
  {
    id: "essential-acc-2",
    name: "Washed Canvas Crossbody Tote",
    category: "accessory",
    color: "Ecru / Natural",
    season: "all",
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop",
    recommended: false,
  },
];
