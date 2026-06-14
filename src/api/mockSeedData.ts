import type { Block, BlockType } from "../types/models";

type BlockSeed = {
  id: string;
  type: BlockType;
  parentId?: string | null;
  day: string;
  createdAt: string;
  content?: string[];
  title?: string;
  checked?: boolean;
  language?: string;
};

function seedBlock(def: BlockSeed): Block {
  return {
    id: def.id,
    type: def.type,
    parentId: def.parentId ?? null,
    day: def.day,
    createdAt: def.createdAt,
    content: def.content ?? [],
    properties: {
      title: def.title ?? "",
      checked: def.checked ?? false,
      language: def.language ?? "",
      imageData: "",
      open: true,
    },
  };
}

/** Three days of sample note-tracking data for local mock mode. */
export function createMockSeedBlocks(): Block[] {
  const d1 = "2026-06-12";
  const d2 = "2026-06-13";
  const d3 = "2026-06-14";

  const seeds: BlockSeed[] = [
    // ── Thursday — planning a weekend trip ──────────────────────────────
    {
      id: "mock-d1-trip",
      type: "h2",
      day: d1,
      createdAt: `${d1}T08:31:00.000Z`,
      content: ["mock-d1-trip-text", "mock-d1-trip-todos"],
      title: "Travel & accommodation",
    },
    {
      id: "mock-d1-trip-text",
      type: "text",
      parentId: "mock-d1-trip",
      day: d1,
      createdAt: `${d1}T08:32:00.000Z`,
      title:
        "Friday evening train from the city, arrive around 9 pm. Lakeside Inn is booked — check-in from 3 pm. Saturday bike ride to the old town on the other shore.",
    },
    {
      id: "mock-d1-trip-todos",
      type: "h3",
      parentId: "mock-d1-trip",
      day: d1,
      createdAt: `${d1}T08:40:00.000Z`,
      content: ["mock-d1-todo-1", "mock-d1-todo-2", "mock-d1-todo-3"],
      title: "Still to do",
    },
    {
      id: "mock-d1-todo-1",
      type: "todo",
      parentId: "mock-d1-trip-todos",
      day: d1,
      createdAt: `${d1}T08:41:00.000Z`,
      title: "Print train tickets",
      checked: true,
    },
    {
      id: "mock-d1-todo-2",
      type: "todo",
      parentId: "mock-d1-trip-todos",
      day: d1,
      createdAt: `${d1}T08:42:00.000Z`,
      title: "Reserve bikes (2× city bikes)",
      checked: true,
    },
    {
      id: "mock-d1-todo-3",
      type: "todo",
      parentId: "mock-d1-trip-todos",
      day: d1,
      createdAt: `${d1}T08:43:00.000Z`,
      title: "Harbor restaurant — table for Saturday 7:30 pm",
      checked: false,
    },
    {
      id: "mock-d1-pack",
      type: "h2",
      day: d1,
      createdAt: `${d1}T10:15:00.000Z`,
      content: ["mock-d1-pack-1", "mock-d1-pack-2", "mock-d1-pack-3"],
      title: "Packing list",
    },
    {
      id: "mock-d1-pack-1",
      type: "todo",
      parentId: "mock-d1-pack",
      day: d1,
      createdAt: `${d1}T10:16:00.000Z`,
      title: "Rain jacket",
      checked: false,
    },
    {
      id: "mock-d1-pack-2",
      type: "todo",
      parentId: "mock-d1-pack",
      day: d1,
      createdAt: `${d1}T10:17:00.000Z`,
      title: "Sunscreen & sunglasses",
      checked: false,
    },
    {
      id: "mock-d1-pack-3",
      type: "todo",
      parentId: "mock-d1-pack",
      day: d1,
      createdAt: `${d1}T10:18:00.000Z`,
      title: "Camera + charger",
      checked: true,
    },
    {
      id: "mock-d1-journal",
      type: "text",
      day: d1,
      createdAt: `${d1}T20:45:00.000Z`,
      title:
        "Quick call with Lena in the evening — she's visiting next month. Friday's forecast looks good, light breeze by the water.",
    },

    // ── Friday — market, cooking, book ──────────────────────────────────
    {
      id: "mock-d2-market",
      type: "h2",
      day: d2,
      createdAt: `${d2}T07:16:00.000Z`,
      content: ["mock-d2-market-text", "mock-d2-market-list"],
      title: "Farmers market",
    },
    {
      id: "mock-d2-market-text",
      type: "text",
      parentId: "mock-d2-market",
      day: d2,
      createdAt: `${d2}T07:17:00.000Z`,
      title:
        "Hoffman's stall has fresh asparagus right now. Stall 14 — good strawberries, but go early.",
    },
    {
      id: "mock-d2-market-list",
      type: "h3",
      parentId: "mock-d2-market",
      day: d2,
      createdAt: `${d2}T07:25:00.000Z`,
      content: [
        "mock-d2-todo-1",
        "mock-d2-todo-2",
        "mock-d2-todo-3",
        "mock-d2-todo-4",
      ],
      title: "Shopping list",
    },
    {
      id: "mock-d2-todo-1",
      type: "todo",
      parentId: "mock-d2-market-list",
      day: d2,
      createdAt: `${d2}T07:26:00.000Z`,
      title: "1 lb asparagus",
      checked: true,
    },
    {
      id: "mock-d2-todo-2",
      type: "todo",
      parentId: "mock-d2-market-list",
      day: d2,
      createdAt: `${d2}T07:27:00.000Z`,
      title: "Fresh herbs — dill & parsley",
      checked: true,
    },
    {
      id: "mock-d2-todo-3",
      type: "todo",
      parentId: "mock-d2-market-list",
      day: d2,
      createdAt: `${d2}T07:28:00.000Z`,
      title: "Lemon",
      checked: true,
    },
    {
      id: "mock-d2-todo-4",
      type: "todo",
      parentId: "mock-d2-market-list",
      day: d2,
      createdAt: `${d2}T07:29:00.000Z`,
      title: "Olive oil (almost empty)",
      checked: false,
    },
    {
      id: "mock-d2-recipe",
      type: "h2",
      day: d2,
      createdAt: `${d2}T12:00:00.000Z`,
      content: ["mock-d2-recipe-text"],
      title: "Recipe: asparagus with hollandaise",
    },
    {
      id: "mock-d2-recipe-text",
      type: "text",
      parentId: "mock-d2-recipe",
      day: d2,
      createdAt: `${d2}T12:01:00.000Z`,
      title:
        "Peel asparagus, boil 12 min in salted water with a pinch of sugar. Hollandaise: 3 yolks, 5 oz butter, lemon juice, salt. Potatoes on the side. Try less butter next time.",
    },
    {
      id: "mock-d2-book",
      type: "h2",
      day: d2,
      createdAt: `${d2}T21:30:00.000Z`,
      content: ["mock-d2-book-text"],
      title: "Book — The Midnight Library",
    },
    {
      id: "mock-d2-book-text",
      type: "text",
      parentId: "mock-d2-book",
      day: d2,
      createdAt: `${d2}T21:31:00.000Z`,
      title:
        "Finished chapter 12. The parallel lives idea really sticks — especially the fishing village scene. Chapter 13 tomorrow, then done with the book.",
    },
    {
      id: "mock-d2-call",
      type: "todo",
      day: d2,
      createdAt: `${d2}T22:00:00.000Z`,
      title: "Call Mom — her birthday is Monday, don't forget",
      checked: false,
    },

    // ── Saturday — today ────────────────────────────────────────────────
    {
      id: "mock-d3-day",
      type: "h2",
      day: d3,
      createdAt: `${d3}T08:01:00.000Z`,
      content: [
        "mock-d3-todo-1",
        "mock-d3-todo-2",
        "mock-d3-todo-3",
        "mock-d3-todo-4",
      ],
      title: "To do",
    },
    {
      id: "mock-d3-todo-1",
      type: "todo",
      parentId: "mock-d3-day",
      day: d3,
      createdAt: `${d3}T08:02:00.000Z`,
      title: "Run in the park — 4 miles",
      checked: true,
    },
    {
      id: "mock-d3-todo-2",
      type: "todo",
      parentId: "mock-d3-day",
      day: d3,
      createdAt: `${d3}T08:03:00.000Z`,
      title: "Water plants (monstera + basil)",
      checked: false,
    },
    {
      id: "mock-d3-todo-3",
      type: "todo",
      parentId: "mock-d3-day",
      day: d3,
      createdAt: `${d3}T08:04:00.000Z`,
      title: "Write birthday card for Anna",
      checked: false,
    },
    {
      id: "mock-d3-todo-4",
      type: "todo",
      parentId: "mock-d3-day",
      day: d3,
      createdAt: `${d3}T08:05:00.000Z`,
      title: "Pack suitcase for the lake trip",
      checked: false,
    },
    {
      id: "mock-d3-gift",
      type: "h2",
      day: d3,
      createdAt: `${d3}T11:00:00.000Z`,
      content: ["mock-d3-gift-text", "mock-d3-gift-ideas"],
      title: "Gift ideas — Anna turns 30",
    },
    {
      id: "mock-d3-gift-text",
      type: "text",
      parentId: "mock-d3-gift",
      day: d3,
      createdAt: `${d3}T11:01:00.000Z`,
      title:
        "Party on June 22. Budget around $40. She likes ceramics and good tea.",
    },
    {
      id: "mock-d3-gift-ideas",
      type: "h3",
      parentId: "mock-d3-gift",
      day: d3,
      createdAt: `${d3}T11:10:00.000Z`,
      content: ["mock-d3-gift-1", "mock-d3-gift-2", "mock-d3-gift-3"],
      title: "Options",
    },
    {
      id: "mock-d3-gift-1",
      type: "todo",
      parentId: "mock-d3-gift-ideas",
      day: d3,
      createdAt: `${d3}T11:11:00.000Z`,
      title: "Tea set from the shop on Main Street",
      checked: false,
    },
    {
      id: "mock-d3-gift-2",
      type: "todo",
      parentId: "mock-d3-gift-ideas",
      day: d3,
      createdAt: `${d3}T11:12:00.000Z`,
      title: "Handmade bowl from the pottery market",
      checked: false,
    },
    {
      id: "mock-d3-gift-3",
      type: "todo",
      parentId: "mock-d3-gift-ideas",
      day: d3,
      createdAt: `${d3}T11:13:00.000Z`,
      title: "Yoga studio gift card",
      checked: true,
    },
    {
      id: "mock-d3-weather",
      type: "text",
      day: d3,
      createdAt: `${d3}T14:30:00.000Z`,
      title:
        "Partly cloudy this afternoon, 72 °F. Good for packing and a quick break on the balcony. Train at 6:12 pm — leave for the station in good time.",
    },
  ];

  return seeds.map(seedBlock);
}
