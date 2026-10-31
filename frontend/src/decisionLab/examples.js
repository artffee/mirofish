export const featureLabels = {
  value: "Value",
  originality: "Originality",
  simplicity: "Simplicity",
  local_story: "Local story",
  practicality: "Practicality",
  premium_finish: "Premium finish",
};
export const examples = {
  artwork: {
    label: "Artwork",
    audience:
      "Visitors browsing an independent art stand on Las Olas Boulevard, Fort Lauderdale.",
    question: "Which A305X print concept is worth testing with real visitors?",
    scenario:
      "A visitor sees two equally sized prints displayed side by side. Both are available to take home today.",
    budget: 35,
    alternatives: [
      {
        id: "A",
        title: "Cafecito on Las Olas",
        description:
          "A playful hand-drawn café scene with a local story and bright, unexpected colors.",
        price: 30,
        features: ["originality", "local_story"],
      },
      {
        id: "B",
        title: "Quiet Canal",
        description:
          "A minimal canal illustration with calm colors and a simple composition, printed on premium paper.",
        price: 30,
        features: ["simplicity", "premium_finish"],
      },
    ],
  },
  product: {
    label: "Product",
    audience:
      "Adults looking for a small creative gift from an independent maker.",
    question:
      "Which notebook concept should we put in front of potential buyers first?",
    scenario:
      "A visitor has time to inspect three notebooks. Size and delivery are the same.",
    budget: 25,
    alternatives: [
      {
        id: "A",
        title: "Everyday Notes",
        description: "A simple, practical notebook for daily lists.",
        price: 16,
        features: ["value", "practicality", "simplicity"],
      },
      {
        id: "B",
        title: "Your Next Bad Idea",
        description:
          "A bold A305X notebook with unusual prompts and playful artwork.",
        price: 24,
        features: ["originality", "local_story"],
      },
      {
        id: "C",
        title: "Studio Edition",
        description:
          "A minimal notebook with a premium cover and heavier paper.",
        price: 32,
        features: ["premium_finish", "simplicity"],
      },
    ],
  },
  message: {
    label: "Ad message",
    audience:
      "Local residents considering visiting an independent art gallery.",
    question: "Which message would be worth testing in a real advertisement?",
    scenario:
      "A resident sees one short gallery message while browsing a neighborhood guide.",
    budget: 20,
    alternatives: [
      {
        id: "A",
        title: "Art with a local heartbeat",
        description:
          "Meet the artists behind your neighborhood. Visit this weekend.",
        price: null,
        features: ["local_story"],
      },
      {
        id: "B",
        title: "Make room for the unexpected",
        description:
          "Original art for the beautifully unpredictable. Explore the collection.",
        price: null,
        features: ["originality"],
      },
    ],
  },
  price: {
    label: "Price",
    audience: "Visitors considering the same A305X art print as a souvenir.",
    question:
      "What affordability objections should we check at these three prices?",
    scenario:
      "The exact same print is offered at one price. Quality, framing and delivery are held constant.",
    budget: 30,
    alternatives: [
      {
        id: "A",
        title: "Print at $20",
        description: "The same unframed local art print.",
        price: 20,
        features: ["local_story", "originality"],
      },
      {
        id: "B",
        title: "Print at $35",
        description: "The same unframed local art print.",
        price: 35,
        features: ["local_story", "originality"],
      },
      {
        id: "C",
        title: "Print at $50",
        description: "The same unframed local art print.",
        price: 50,
        features: ["local_story", "originality"],
      },
    ],
  },
};
export function freshExample(key) {
  return { ...structuredClone(examples[key]), context: "", mode: "fixture" };
}
