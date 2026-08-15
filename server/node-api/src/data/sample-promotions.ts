import { IPromotion, PromotionCategory } from "../models/promotion-model";

type SamplePromotion = Omit<
  IPromotion,
  "location" | "isActive" | "createdAt" | "updatedAt" | "distanceMeters"
> & {
  isActive?: boolean;
};

const toPoint = (longitude: number, latitude: number) => ({
  type: "Point" as const,
  coordinates: [longitude, latitude] as [number, number],
});

const melbourne: SamplePromotion[] = [
  {
    title: "Charge & Sip",
    description: "Show your charging session and get 20% off any coffee or tea.",
    businessName: "Little Collins Roast",
    category: "coffee" as PromotionCategory,
    discountLabel: "20% off drinks",
    promoCode: "EVAT20",
    address: "120 Little Collins St, Melbourne VIC 3000",
    latitude: -37.8136,
    longitude: 144.9652,
    terms: "Valid while charging nearby. One use per session.",
  },
  {
    title: "EV Lunch Special",
    description: "Spend $30 or more on lunch and save $10 while your car charges.",
    businessName: "Chinatown Kitchen",
    category: "food" as PromotionCategory,
    discountLabel: "$10 off $30+",
    promoCode: "CHARGE10",
    address: "22 Tattersalls Ln, Melbourne VIC 3000",
    latitude: -37.8119,
    longitude: 144.9674,
  },
  {
    title: "Shop while you charge",
    description: "15% off selected retail when you present this offer at checkout.",
    businessName: "Melbourne Central Retail",
    category: "shopping" as PromotionCategory,
    discountLabel: "15% off",
    promoCode: "PLUG15",
    address: "211 La Trobe St, Melbourne VIC 3000",
    latitude: -37.8105,
    longitude: 144.9628,
  },
  {
    title: "Wait it out",
    description: "2-for-1 bowling lanes during your charging window.",
    businessName: "Strike Melbourne",
    category: "entertainment" as PromotionCategory,
    discountLabel: "2-for-1 lanes",
    promoCode: "BOWL2FOR1",
    address: "Melbourne Central, Melbourne VIC 3000",
    latitude: -37.8102,
    longitude: 144.9636,
  },
  {
    title: "Wash while you wait",
    description: "10% off a car wash completed during your charging session.",
    businessName: "City Express Wash",
    category: "services" as PromotionCategory,
    discountLabel: "10% off wash",
    promoCode: "WASH10",
    latitude: -37.8164,
    longitude: 144.9569,
  },
];

const perth: SamplePromotion[] = [
  {
    title: "Quay Coffee Deal",
    description: "Free extra shot or alternative milk with any large coffee.",
    businessName: "Elizabeth Quay Cafe",
    category: "coffee" as PromotionCategory,
    discountLabel: "Free extra shot",
    promoCode: "QUAYEV",
    address: "Elizabeth Quay, Perth WA 6000",
    latitude: -31.9561,
    longitude: 115.858,
  },
  {
    title: "Hay Street Bites",
    description: "15% off casual dining within a short walk of nearby chargers.",
    businessName: "Hay Street Kitchen",
    category: "food" as PromotionCategory,
    discountLabel: "15% off meals",
    promoCode: "HAY15",
    address: "Hay St, Perth WA 6000",
    latitude: -31.9535,
    longitude: 115.8586,
  },
  {
    title: "Murray Street Retail",
    description: "Spend $50 in-store and receive a $10 voucher for your next visit.",
    businessName: "Murray Street Markets",
    category: "shopping" as PromotionCategory,
    discountLabel: "$10 voucher",
    promoCode: "MURRAY10",
    latitude: -31.9523,
    longitude: 115.8575,
  },
];

export function buildSamplePromotions(): Partial<IPromotion>[] {
  return [...melbourne, ...perth].map((promo) => ({
    ...promo,
    isActive: true,
    location: toPoint(promo.longitude, promo.latitude),
    stationIds: [],
  }));
}

export function buildFallbackPromotions(
  latitude: number,
  longitude: number
): Array<IPromotion & { _id: { toString(): string }; isFallback: boolean }> {
  const offsets = [
    { dLat: 0.0011, dLng: 0.0008, meters: 140 },
    { dLat: -0.0016, dLng: 0.0014, meters: 240 },
    { dLat: 0.0022, dLng: -0.001, meters: 320 },
  ];

  const templates = [
    {
      title: "Charge & Coffee",
      businessName: "Local Cafe Partner",
      category: "coffee" as PromotionCategory,
      discountLabel: "20% off drinks",
      promoCode: "EVAT20",
      description: "Partner cafes near this charger offer a discount while you wait.",
    },
    {
      title: "EV Lunch Special",
      businessName: "Nearby Eatery",
      category: "food" as PromotionCategory,
      discountLabel: "$10 off $30+",
      promoCode: "CHARGE10",
      description: "Grab a meal within walking distance during your charging session.",
    },
    {
      title: "Shop while you charge",
      businessName: "Retail Partner",
      category: "shopping" as PromotionCategory,
      discountLabel: "15% off",
      promoCode: "PLUG15",
      description: "Use this offer at participating shops close to the station.",
    },
  ];

  return templates.map((template, index) => {
    const offset = offsets[index];
    const lat = latitude + offset.dLat;
    const lng = longitude + offset.dLng;
    return {
      ...template,
      _id: { toString: () => `fallback-${index + 1}` },
      latitude: lat,
      longitude: lng,
      location: toPoint(lng, lat),
      isActive: true,
      stationIds: [],
      distanceMeters: offset.meters,
      isFallback: true,
    };
  });
}
