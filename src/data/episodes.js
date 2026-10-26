// Kit pricing. These are live bindings: the defaults below are used until the catalog
// loads from the server (prices are managed in the admin panel), then applyKitPricing()
// updates them so every component that imports PRICE shows the current price.
export let PRICE = 1499;
export let ORIGINAL_PRICE = 2249;
export function applyKitPricing(price, mrp) {
  if (price > 0) PRICE = price;
  ORIGINAL_PRICE = mrp > 0 ? mrp : PRICE;
}

export const formatINR = (n) => '₹' + Number(n).toLocaleString('en-IN');

export const EPISODES = [
  {
    id: 'trouble-in-oasis',
    n: 1,
    name: 'Trouble in Oasis',
    lines: ['TROUBLE IN', 'OASIS'],
    world: 'A rare oasis hidden in the middle of a vast desert.',
    headline: 'Lost in the desert. Found something else.',
    body: 'An unexpected encounter with cool water in a world of heat and sand. Fresh, watery and touched by a hint of salt.',
    scent: 'Watery, fresh and mineral-like, with a subtle salty character.',
    scentTags: ['Watery', 'Fresh', 'Mineral', 'Salty'],
    traits: ['Mysterious', 'Refreshing', 'Unusual'],
    persona: 'It feels like discovering something rare where you least expect it.',
    occasions: ['Daytime wear', 'Warm weather', 'Casual outings', 'When you want something refreshing yet distinctive'],
    look: 'A camel stumbles on a secluded pool in the desert. Still water, reflections, heat haze and a pocket of life in the sand.',
    f: {
      mood: ['fresh', 'mysterious'],
      occ: ['everyday'],
      scent: ['watery', 'fresh']
    },
    pal: {
      bg: '#e8892c',
      title: '#ffffff',
      btnBg: '#ffffff',
      btnInk: '#6b3608',
      hl: '#c96a12',
      ink: '#fff8ec',
      accent: '#24c3cf',
      soft: '#ffe9c7',
      deep: '#6b3608',
      accent2: '#24c3cf',
      // Hero text on the light orange: a darker shade of deep (4.6:1, white was 2.6:1).
      heroInk: '#562b06'
    },
    camel: '#2259B2'
  },
  {
    id: 'camel-after-dark',
    n: 2,
    name: 'Camel After Dark',
    lines: ['CAMEL', 'AFTER DARK'],
    world: 'The camel after sunset, stepping into a night of parties, winter air and late-night encounters.',
    headline: "Day shift's over. The camel's out.",
    body: 'Cold nights, good company and absolutely no plans to head home early. A fragrance for the hours when the night starts getting interesting.',
    scent: 'Pleasant, smooth and inviting, with unisex appeal.',
    scentTags: ['Smooth', 'Inviting', 'Unisex'],
    pending: true,
    traits: ['Social', 'Confident', 'Effortlessly cool', 'Ready for the night'],
    persona: 'Social, confident and effortlessly cool.',
    audience: 'Unisex, made with men in mind.',
    occasions: ['Parties', 'Evening outings', 'Winter wear', 'Dinners', 'Nightlife'],
    look: 'The camel, dressed for an evening out. Dark blue skies, purple lighting, nightlife details and a lively party atmosphere.',
    f: {
      mood: ['confident'],
      occ: ['parties', 'evenings'],
      scent: []
    },
    pal: {
      bg: '#141a4d',
      title: '#C4E539',
      btnBg: '#C4E539',
      btnInk: '#141a4d',
      hl: '#7616C1',
      ink: '#f1ecff',
      accent: '#C4E539',
      soft: '#e7dcff',
      deep: '#2b0f5c',
      accent2: '#7616C1'
    },
    camel: '#C4E539'
  },
  {
    id: 'madam-camel',
    n: 3,
    name: 'Madam Camel',
    lines: ['MADAM', 'CAMEL'],
    world: 'A young woman stepping out of the shower, entering the day feeling fresh, new and completely herself.',
    headline: 'Fresh out. No further explanation.',
    body: 'Like stepping out of the shower with a whole new attitude. Fresh, lively and ready to take on whatever the day decides to become.',
    scent: 'Fresh, clean and lively. Bright and contemporary, neither overpowering nor overly soft.',
    scentTags: ['Fresh', 'Clean', 'Lively', 'Bright'],
    traits: ['Youthful', 'Playful', 'Spontaneous', 'Effortlessly fresh'],
    persona: 'Youthful, playful and spontaneous.',
    audience: 'Made for women, especially younger fragrance fans.',
    occasions: ['Everyday wear', 'College', 'Daytime outings', 'Casual meetings', 'Fresh starts'],
    look: 'A fresh post-shower world. Dewy surfaces, playful colour, light reflections and a young camel with a towel on her head.',
    f: {
      mood: ['fresh', 'playful'],
      occ: ['everyday'],
      scent: ['fresh']
    },
    pal: {
      bg: '#9edcff',
      title: '#7616C1',
      btnBg: '#7616C1',
      btnInk: '#ffffff',
      hl: '#2b7fc4',
      ink: '#14295e',
      accent: '#7616C1',
      soft: '#eaf8ff',
      deep: '#14295e',
      accent2: '#ff5fa8'
    },
    camel: '#7616C1'
  },
  {
    id: 'mirage',
    n: 4,
    name: 'Mirage',
    lines: ['MIRAGE'],
    world: 'An unexpected illusion of a tropical paradise. An oasis-like encounter without the harsh desert.',
    headline: 'Too good to be real. Too good to ignore.',
    body: 'A little fruit, a little ocean and a place that may not exist at all. Sweet, watery and just salty enough to keep things interesting.',
    scent: 'Watery and oceanic, with fruity sweetness and a subtle salty touch.',
    scentTags: ['Watery', 'Oceanic', 'Fruity', 'Salty'],
    traits: ['Playful', 'Dreamy', 'Juicy', 'Slightly mysterious'],
    persona: 'Playful, dreamy and juicy, with a hint of mystery.',
    occasions: ['Holidays', 'Daytime parties', 'Casual outings', 'Warm weather', 'Relaxed social occasions'],
    look: 'A surreal meeting of fruit, shimmering water and an imagined tropical landscape. Reflections, translucent forms and juicy colour.',
    note: 'Not to be confused with Trouble in Oasis. That one is rare water in the desert. This one is a sweet, fruity ocean that might not be there.',
    f: {
      mood: ['playful', 'mysterious'],
      occ: ['holidays', 'parties'],
      scent: ['watery', 'fruity']
    },
    pal: {
      bg: '#ff7f8e',
      title: '#ffffff',
      btnBg: '#ffffff',
      btnInk: '#c2334a',
      hl: '#e0485e',
      ink: '#ffffff',
      accent: '#5fe6d4',
      soft: '#ffe4e4',
      deep: '#7a1d33',
      accent2: '#ff9100',
      // Hero text on the pink: a darker shade of deep (4.7:1, white was 2.4:1).
      heroInk: '#6e1a2e'
    },
    camel: '#2259B2'
  },
  {
    id: 'fruitto-del-deserto',
    n: 5,
    name: 'Fruitto Del Deserto',
    lines: ['FRUITTO DEL', 'DESERTO'],
    world: 'A camel discovers irresistible fruit in the middle of the desert. Restraint is no longer an option.',
    headline: 'A desert. A fruit. Absolutely no self-control.',
    body: 'Ripe fruit, luscious dates and figs, a nutty richness and a little Arabian mischief. Some things are simply too tempting to leave alone.',
    scent: 'Fruity, nutty and slightly Arabic-inspired, with dates and figs as key references.',
    scentTags: ['Fruity', 'Nutty', 'Dates', 'Figs'],
    traits: ['Indulgent', 'Rich', 'Tempting', 'Playful'],
    persona: 'Indulgent, rich and full of character.',
    occasions: ['Evening outings', 'Cooler weather', 'Dates', 'Social occasions', 'When you want something indulgent'],
    look: 'Oversized dates, ripe figs and scattered fruit in warm desert colours. A surreal feast in a barren landscape.',
    f: {
      mood: ['indulgent', 'playful'],
      occ: ['dates', 'evenings'],
      scent: ['fruity', 'nutty']
    },
    pal: {
      bg: '#b4461f',
      title: '#ffc23d',
      btnBg: '#ffc23d',
      btnInk: '#5a2210',
      hl: '#b4461f',
      ink: '#fff3e6',
      accent: '#ffc23d',
      soft: '#ffe6cc',
      deep: '#5a2210',
      accent2: '#7a2c5c'
    },
    camel: '#C4E539'
  },
  {
    id: 'oud-but-different',
    n: 6,
    name: 'Oud But Different',
    lines: ['OUD BUT', 'DIFFERENT'],
    world: 'A familiar oud fragrance takes an unexpected turn.',
    headline: 'Oud. With a plot twist.',
    body: 'The depth of woody oud meets the character of rose. Familiar enough to recognise, different enough to remember.',
    scent: 'Woody oud with a rosy character. The rose adds a new dimension to familiar woody depth.',
    scentTags: ['Woody', 'Oud', 'Rosy'],
    traits: ['Distinctive', 'Confident', 'Refined', 'Unconventional'],
    persona: 'Distinctive, confident and a little unconventional.',
    occasions: ['Evening wear', 'Dinners', 'Special occasions', 'A different take on a woody fragrance'],
    look: 'Oud-inspired wood forms meet rose petals. Dark, grounded shapes against expressive florals, with the camel as the unexpected hero.',
    f: {
      mood: ['confident', 'refined'],
      occ: ['evenings'],
      scent: ['woody', 'rosy']
    },
    pal: {
      bg: '#2a140d',
      title: '#ff5d7d',
      btnBg: '#ff5d7d',
      btnInk: '#2a140d',
      hl: '#c21d45',
      ink: '#ffeee6',
      accent: '#ff5d7d',
      soft: '#ffe1e6',
      deep: '#4a1322',
      accent2: '#FF9100'
    },
    camel: '#FF9100'
  }
];

export const EPISODES_BY_ID = Object.fromEntries(EPISODES.map((e) => [e.id, e]));

export const ROUTES = {
  mood: {
    label: 'By mood',
    opts: [
      ['fresh', 'Fresh'],
      ['playful', 'Playful'],
      ['confident', 'Confident'],
      ['indulgent', 'Indulgent'],
      ['mysterious', 'Mysterious'],
      ['refined', 'Refined']
    ]
  },
  occ: {
    label: 'By occasion',
    opts: [
      ['office', 'Office'],
      ['everyday', 'Everyday wear'],
      ['parties', 'Parties'],
      ['dates', 'Dates'],
      ['evenings', 'Evenings'],
      ['holidays', 'Holidays']
    ]
  },
  scent: {
    label: 'By scent character',
    opts: [
      ['watery', 'Watery'],
      ['fruity', 'Fruity'],
      ['woody', 'Woody'],
      ['rosy', 'Rosy'],
      ['nutty', 'Nutty'],
      ['fresh', 'Fresh']
    ]
  }
};

export const OCC_LABELS = Object.fromEntries(ROUTES.occ.opts);
export const MOOD_LABELS = Object.fromEntries(ROUTES.mood.opts);

export const RITUAL_STEPS = [
  {
    k: 'Collect',
    t: "Pick today's episode",
    d: "Sachets of all six fragrances arrive together in the collector box. Choose the situation you're in today."
  },
  {
    k: 'Snap',
    t: 'Carry it with you',
    d: 'Slip the sachet into the snap pouch and clip the carabiner to your bag. It goes wherever you go.'
  },
  {
    k: 'Wear',
    t: 'Tear, swipe, go',
    d: 'Tear at the notch and swipe the attar onto your wrists and neck. Smell different, everywhere.'
  }
];

export const PERKS = [
  ['pocket', 'Pocket-sized', 'Slim enough for a wallet, a pocket or the snap pouch.'],
  ['seal', 'No glass, no spills', 'Each sachet stays sealed until you tear it open.'],
  ['one', 'One episode per sachet', 'A single fragrance in each, so you choose the mood every time.'],
  ['six', 'All six in the kit', 'Every episode is in the box, so you can switch situations anytime.']
];

export const MANIFESTO_QUOTES = [
  'Every camel has a situation.',
  'Mine is snacks. Fruitto, obviously.',
  'Boop accepted. Ready for desert trouble.',
  "Day shift's over. Camel After Dark activated.",
  'Six episodes. One box. Smell different.',
  'Wear your weird everywhere you wander.'
];

export const FAQS = [
  {
    q: 'What is an attar sachet?',
    a: 'Attar is a traditional perfume craft with centuries of history. We seal each Quirky Camel fragrance in a slim, pocket-sized sachet instead of a glass bottle, one fragrance per pack, with its camel’s situation printed on the front.'
  },
  {
    q: 'How do I wear it?',
    a: 'Tear at the notch on the top of the sachet and swipe the attar onto your wrists, neck, and pulse points. That’s the whole ritual: Collect, Snap, Wear.'
  },
  {
    q: "Why can't I buy a single fragrance?",
    a: 'Every fragrance is one episode in the same strange world, so we sell them together. The complete kit is our flagship experience, containing sealed sachets of all six episodes.'
  },
  {
    q: "What's in the complete kit?",
    a: 'Sachets of all six episodes (Trouble in Oasis, Camel After Dark, Madam Camel, Mirage, Fruitto Del Deserto, and Oud But Different), a collector box, a vegan leather snap pouch with carabiner, and a drawstring bag.'
  },
  {
    q: 'Which episode should I start with?',
    a: 'Start with your mood! Use Discover to filter by mood, occasion, or scent character, or spin the reel and let the desert decide. Since the kit has all six, you can switch whenever the situation changes.'
  },
  {
    q: 'Are Trouble in Oasis and Mirage the same?',
    a: 'No. Trouble in Oasis is rare water in the desert: watery, mineral, and slightly salty. Mirage is a sweet, fruity ocean that might not exist: watery, oceanic, and juicy.'
  },
  {
    q: 'What does Camel After Dark smell like?',
    a: 'Smooth, pleasant, and inviting, with unisex appeal and made with evening nightlife in mind. Its exact formulation is crafted for cold nights and social gatherings.'
  },
  {
    q: 'Is Quirky Camel attar alcohol-free?',
    a: 'Yes. All our attars are concentrated perfume oils made without alcohol. If you have sensitive skin, try a small patch on your wrist first.'
  },
  {
    q: 'How long does each sachet last once opened?',
    a: 'Each sachet holds generous concentrated pure attar, enough for multiple swipes throughout the day. Because attar oil has zero alcohol evaporation, a single swipe lasts 8–12 hours on pulse points.'
  }
];

export const KIT_SPECIFICATIONS = [
  { label: 'Format', value: 'Sealed attar oil sachets' },
  { label: 'Total Fragrances', value: '6 unique episodes' },
  { label: 'Alcohol Content', value: 'Alcohol-free perfume oil' },
  { label: 'Longevity', value: '8–12 hours per application' },
  { label: 'Accessories', value: 'Vegan leather snap pouch, carabiner and drawstring bag' },
  { label: 'Packaging', value: 'Collector box' }
];
