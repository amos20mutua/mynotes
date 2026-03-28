import type { VaultData, VaultNote } from "@/types";

function makePublicNote(id: string, title: string, summary: string, links: string[], createdAt: string): VaultNote {
  return {
    id,
    title,
    content: `# ${title}

${summary}

## Connected themes
${links.map((link) => `- [[${link}]]`).join("\n")}
`,
    colorGroup: "Public",
    folder: "Public",
    tags: ["public", "topic"],
    status: "active",
    createdAt,
    updatedAt: createdAt
  };
}

export const publicVaultData: VaultData = {
  notes: [
    makePublicNote("wisdom", "Wisdom", "Short reflections on judgment, clarity, character, and living with depth.", ["Purpose", "Highest IQ", "Public Speaking"], "2026-03-28T08:00:00.000Z"),
    makePublicNote("christian-god", "Christian God", "A living note around God, scripture, devotion, hunger, and spiritual formation.", ["Wisdom", "Purpose", "Public Speaking"], "2026-03-28T08:02:00.000Z"),
    makePublicNote("tech", "Tech", "Broad notes about technology, builders, systems, software, and digital leverage.", ["Building Tech", "AI", "Future of Tech"], "2026-03-28T08:04:00.000Z"),
    makePublicNote("futuristic-tech", "Futuristic Tech", "Signals around advanced interfaces, ambitious tools, and what computing may become next.", ["Future of Tech", "Quantum Computing", "AI"], "2026-03-28T08:06:00.000Z"),
    makePublicNote("ai", "AI", "Ideas about intelligence, models, tooling, agents, and how AI reshapes work and thought.", ["Future of AI", "Tech", "Highest IQ"], "2026-03-28T08:08:00.000Z"),
    makePublicNote("public-speaking", "Public Speaking", "Notes on clarity, delivery, persuasion, conviction, and how to move people with words.", ["Wisdom", "Purpose", "Christian God"], "2026-03-28T08:10:00.000Z"),
    makePublicNote("purpose", "Purpose", "Thoughts on calling, direction, disciplined becoming, and building a meaningful life.", ["Wisdom", "Christian God", "Building Tech"], "2026-03-28T08:12:00.000Z"),
    makePublicNote("building-tech", "Building Tech", "Builder-focused notes on creating products, systems, and useful technology with intention.", ["Tech", "Future of Tech", "AI"], "2026-03-28T08:14:00.000Z"),
    makePublicNote("future-of-ai", "Future of AI", "Speculation and structured thinking around where AI is heading and what matters most next.", ["AI", "Futuristic Tech", "Highest IQ"], "2026-03-28T08:16:00.000Z"),
    makePublicNote("future-of-tech", "Future of Tech", "A forward-looking note on where tools, interfaces, and human-computer systems are moving.", ["Tech", "Futuristic Tech", "Building Tech"], "2026-03-28T08:18:00.000Z"),
    makePublicNote("highest-iq", "Highest IQ", "Ideas about intelligence, deep reasoning, learning velocity, and disciplined mental sharpness.", ["Wisdom", "AI", "Quantum Computing"], "2026-03-28T08:20:00.000Z"),
    makePublicNote("quantum-computing", "Quantum Computing", "A simple public overview of quantum computing, why it matters, and where it may lead.", ["Futuristic Tech", "Future of Tech", "Highest IQ"], "2026-03-28T08:22:00.000Z")
  ],
  links: []
};
