import type { VaultData, VaultNote } from "@/types";

function makeNote(
  id: string,
  title: string,
  folder: string,
  tags: string[],
  content: string,
  createdAt: string,
  overrides?: Partial<Pick<VaultNote, "isPinned" | "status">>
): VaultNote {
  return {
    id,
    title,
    colorGroup: folder,
    folder,
    tags,
    content,
    isPinned: overrides?.isPinned ?? false,
    status: overrides?.status ?? "active",
    createdAt,
    updatedAt: createdAt
  };
}

function makeClusterSeries(
  cluster: string,
  folder: string,
  tags: string[],
  startHour: number,
  items: Array<{ slug: string; title: string; links: string[] }>
) {
  return items.map((item, index) =>
    makeNote(
      item.slug,
      item.title,
      folder,
      tags,
      `# ${item.title}

## Connected ideas
${item.links.map((link) => `- [[${link}]]`).join("\n")}

## Notes
- Expand this thought
- Capture examples
- Link back into the vault`,
      `2026-03-27T${String(startHour + Math.floor(index / 6)).padStart(2, "0")}:${String((index % 6) * 5).padStart(2, "0")}:00.000Z`
    )
  );
}

const workspaceNotes = [
  makeNote(
    "welcome-note",
    "Welcome to Obsidian Vault",
    "Workspace",
    ["welcome", "system"],
    `# Welcome to Obsidian Vault

This vault is designed to feel alive, connected, and spacious.

## Core workflows
- Capture quick ideas in [[Inbox]]
- Move active work into [[Projects Index]]
- Review structure through the [[Knowledge Graph]]
- Use [[Writing Principles]] to keep notes clean

## Maps
- [[Knowledge Graph]]
- [[Maps of Thought]]
- [[Projects Index]]

## Next steps
- Build around [[Focus System]]
- Connect reading into [[Reading Queue]]`,
    "2026-03-27T10:00:00.000Z",
    { isPinned: true }
  ),
  makeNote(
    "writing-principles",
    "Writing Principles",
    "Workspace",
    ["writing", "system"],
    `# Writing Principles

## Rules
- Prefer small connected notes
- Link back to [[Projects Index]] when something becomes active
- Distill ideas into [[Maps of Thought]]

## Daily use
- Start in [[Inbox]]
- Expand through [[Daily Notes Template]]
- Revisit through the [[Knowledge Graph]]`,
    "2026-03-27T10:05:00.000Z"
  ),
  makeNote(
    "focus-system",
    "Focus System",
    "Workspace",
    ["focus", "systems"],
    `# Focus System

- Weekly goals live in [[Quarter Planning]]
- Daily execution happens through [[Daily Notes Template]]
- Review loops connect back to [[Projects Index]]
- Protect deep work using [[Deep Work Rituals]]`,
    "2026-03-27T10:10:00.000Z"
  ),
  makeNote(
    "inbox",
    "Inbox",
    "Workspace",
    ["capture", "inbox"],
    `# Inbox

- Quick capture for ideas
- Route promising notes into [[Projects Index]]
- Move evergreen ideas toward [[Writing Principles]]
- Surface open threads in [[Maps of Thought]]`,
    "2026-03-27T10:15:00.000Z"
  ),
  makeNote(
    "maps-of-thought",
    "Maps of Thought",
    "Maps of Content",
    ["moc", "thinking"],
    `# Maps of Thought

- Bridge [[Writing Principles]] with [[Knowledge Graph]]
- Track how [[Learning Roadmap]] shapes [[Systems Design Notes]]
- Connect long-term questions into [[Open Questions]]`,
    "2026-03-27T10:20:00.000Z"
  ),
  makeNote(
    "knowledge-graph",
    "Knowledge Graph",
    "Maps of Content",
    ["graph", "moc"],
    `# Knowledge Graph

The graph reveals clusters, weak links, and hidden bridges.

## Look for
- Hubs like [[Projects Index]] and [[Maps of Thought]]
- Dense neighborhoods around [[Systems Design Notes]]
- New unresolved ideas from [[Open Questions]]`,
    "2026-03-27T10:25:00.000Z"
  ),
  makeNote(
    "projects-index",
    "Projects Index",
    "Projects",
    ["projects", "index"],
    `# Projects Index

- [[Website Refresh]]
- [[Learning Roadmap]]
- [[Content Studio]]
- [[AI Lab Notes]]
- [[Knowledge Graph]]`,
    "2026-03-27T10:30:00.000Z"
  ),
  makeNote(
    "daily-notes-template",
    "Daily Notes Template",
    "Templates",
    ["template", "daily"],
    `# Daily Notes Template

## Focus
- [[Projects Index]]

## Notes
- 

## Follow-up
- Review [[Writing Principles]]
- Update [[Open Questions]]`,
    "2026-03-27T10:35:00.000Z",
    { status: "draft" }
  ),
  makeNote(
    "open-questions",
    "Open Questions",
    "Research",
    ["questions", "research"],
    `# Open Questions

- Which notes should become new maps?
- Where does [[AI Lab Notes]] overlap with [[Systems Design Notes]]?
- What belongs in [[Knowledge Graph]] versus [[Projects Index]]?`,
    "2026-03-27T10:40:00.000Z"
  ),
  makeNote(
    "reading-queue",
    "Reading Queue",
    "Research",
    ["reading", "queue"],
    `# Reading Queue

- Feed new ideas into [[Learning Roadmap]]
- Convert highlights into [[Reference Notes]]
- Promote important themes to [[Maps of Thought]]`,
    "2026-03-27T10:45:00.000Z"
  )
];

const projectCluster = [
  makeNote("website-refresh", "Website Refresh", "Projects", ["project", "product"], `# Website Refresh

## Goal
- Clarify the visual system through [[Design Critique Notes]]
- Connect launch work to [[Launch Checklist]]
- Pull messaging from [[Content Strategy]]`, "2026-03-27T11:00:00.000Z"),
  makeNote("learning-roadmap", "Learning Roadmap", "Projects", ["project", "learning"], `# Learning Roadmap

- Organize concepts from [[Reference Notes]]
- Feed deeper topics into [[Systems Design Notes]]
- Keep the long arc visible in [[Quarter Planning]]`, "2026-03-27T11:05:00.000Z"),
  makeNote("content-studio", "Content Studio", "Projects", ["project", "content"], `# Content Studio

- Source ideas from [[Reading Queue]]
- Refine themes inside [[Content Strategy]]
- Review cadence through [[Editorial Calendar]]`, "2026-03-27T11:10:00.000Z"),
  makeNote("ai-lab-notes", "AI Lab Notes", "Projects", ["project", "ai"], `# AI Lab Notes

- Track experiments from [[Prompt Patterns]]
- Link product concepts into [[Systems Design Notes]]
- Collect open threads inside [[Open Questions]]`, "2026-03-27T11:15:00.000Z"),
  makeNote("launch-checklist", "Launch Checklist", "Projects", ["ops", "launch"], `# Launch Checklist

- Align with [[Website Refresh]]
- Pull assets from [[Content Studio]]
- Final pass against [[Design Critique Notes]]`, "2026-03-27T11:20:00.000Z"),
  makeNote("quarter-planning", "Quarter Planning", "Projects", ["planning", "systems"], `# Quarter Planning

- Balance [[Focus System]] with [[Learning Roadmap]]
- Turn active projects into milestones for [[Projects Index]]
- Reprioritize from [[Open Questions]]`, "2026-03-27T11:25:00.000Z")
];

const knowledgeCluster = [
  makeNote("systems-design-notes", "Systems Design Notes", "Research", ["systems", "architecture"], `# Systems Design Notes

- Related to [[AI Lab Notes]]
- Clarify tradeoffs with [[Architecture Heuristics]]
- Keep mental models in [[Maps of Thought]]`, "2026-03-27T11:30:00.000Z"),
  makeNote("architecture-heuristics", "Architecture Heuristics", "Research", ["systems", "heuristics"], `# Architecture Heuristics

- Layering supports [[Systems Design Notes]]
- Operational concerns connect to [[Launch Checklist]]
- Product thinking loops back into [[Website Refresh]]`, "2026-03-27T11:35:00.000Z"),
  makeNote("reference-notes", "Reference Notes", "Research", ["reference", "reading"], `# Reference Notes

- Distill ideas from [[Reading Queue]]
- Promote durable patterns into [[Writing Principles]]
- Feed concepts into [[Learning Roadmap]]`, "2026-03-27T11:40:00.000Z"),
  makeNote("prompt-patterns", "Prompt Patterns", "Research", ["ai", "prompts"], `# Prompt Patterns

- Tested inside [[AI Lab Notes]]
- Connect to [[Open Questions]]
- Inform experiments in [[Systems Design Notes]]`, "2026-03-27T11:45:00.000Z"),
  makeNote("deep-work-rituals", "Deep Work Rituals", "Workspace", ["focus", "habits"], `# Deep Work Rituals

- Supports [[Focus System]]
- Creates better notes inside [[Daily Notes Template]]
- Protects momentum on [[Website Refresh]]`, "2026-03-27T11:50:00.000Z"),
  makeNote("decision-journal", "Decision Journal", "Workspace", ["reflection", "systems"], `# Decision Journal

- Capture choices from [[Quarter Planning]]
- Review tradeoffs from [[Systems Design Notes]]
- Revisit assumptions through [[Open Questions]]`, "2026-03-27T11:55:00.000Z")
];

const contentCluster = [
  makeNote("content-strategy", "Content Strategy", "Content", ["content", "strategy"], `# Content Strategy

- Guided by [[Content Studio]]
- Scheduled inside [[Editorial Calendar]]
- Supports storytelling for [[Website Refresh]]`, "2026-03-27T12:00:00.000Z"),
  makeNote("editorial-calendar", "Editorial Calendar", "Content", ["content", "calendar"], `# Editorial Calendar

- Pulls priorities from [[Content Strategy]]
- Keeps shipping aligned with [[Quarter Planning]]
- Tracks publishing from [[Content Studio]]`, "2026-03-27T12:05:00.000Z"),
  makeNote("design-critique-notes", "Design Critique Notes", "Content", ["design", "review"], `# Design Critique Notes

- Review visual issues on [[Website Refresh]]
- Link feedback loops into [[Launch Checklist]]
- Store recurring patterns in [[Writing Principles]]`, "2026-03-27T12:10:00.000Z"),
  makeNote("storytelling-patterns", "Storytelling Patterns", "Content", ["writing", "content"], `# Storytelling Patterns

- Derived from [[Content Strategy]]
- Supports stronger notes in [[Writing Principles]]
- Inspires themes for [[Content Studio]]`, "2026-03-27T12:15:00.000Z"),
  makeNote("meeting-notes", "Meeting Notes", "Content", ["meetings", "coordination"], `# Meeting Notes

- Convert outcomes into [[Decision Journal]]
- Push tasks into [[Launch Checklist]]
- Promote insights into [[Projects Index]]`, "2026-03-27T12:20:00.000Z"),
  makeNote("weekly-review", "Weekly Review", "Workspace", ["review", "systems"], `# Weekly Review

- Scan [[Projects Index]]
- Reconnect with [[Open Questions]]
- Rebalance [[Focus System]]`, "2026-03-27T12:25:00.000Z")
];

const evergreenCluster = [
  makeNote("evergreen-ideas", "Evergreen Ideas", "Ideas", ["ideas", "evergreen"], `# Evergreen Ideas

- Pull from [[Inbox]]
- Connect to [[Maps of Thought]]
- Graduate promising threads to [[Projects Index]]`, "2026-03-27T12:30:00.000Z"),
  makeNote("concept-garden", "Concept Garden", "Ideas", ["ideas", "garden"], `# Concept Garden

- Organize themes from [[Evergreen Ideas]]
- Structure by [[Maps of Thought]]
- Revisit with [[Writing Principles]]`, "2026-03-27T12:35:00.000Z"),
  makeNote("personal-os", "Personal OS", "Ideas", ["systems", "life"], `# Personal OS

- Combines [[Focus System]], [[Weekly Review]], and [[Decision Journal]]
- Informs how [[Projects Index]] evolves`, "2026-03-27T12:40:00.000Z"),
  makeNote("synthesis-notes", "Synthesis Notes", "Ideas", ["thinking", "synthesis"], `# Synthesis Notes

- Blend [[Reference Notes]] with [[Evergreen Ideas]]
- Surface themes back into [[Knowledge Graph]]`, "2026-03-27T12:45:00.000Z"),
  makeNote("idea-incubator", "Idea Incubator", "Ideas", ["ideas", "incubation"], `# Idea Incubator

- Keep rough ideas from [[Inbox]]
- Test whether they belong in [[Content Studio]] or [[AI Lab Notes]]
- Push stable ones into [[Concept Garden]]`, "2026-03-27T12:50:00.000Z"),
  makeNote("future-bets", "Future Bets", "Ideas", ["bets", "strategy"], `# Future Bets

- Relates to [[Quarter Planning]]
- Connects speculative work from [[AI Lab Notes]]
- Reassess during [[Weekly Review]]`, "2026-03-27T12:55:00.000Z")
];

const learningCluster = makeClusterSeries("learning", "Learning", ["learning", "study"], 13, [
  { slug: "database-notes", title: "Database Notes", links: ["Systems Design Notes", "Architecture Heuristics", "Learning Roadmap"] },
  { slug: "distributed-systems", title: "Distributed Systems", links: ["Systems Design Notes", "Architecture Heuristics", "Open Questions"] },
  { slug: "networking-fundamentals", title: "Networking Fundamentals", links: ["Distributed Systems", "Reference Notes", "Learning Roadmap"] },
  { slug: "typescript-patterns", title: "TypeScript Patterns", links: ["AI Lab Notes", "Reference Notes", "Writing Principles"] },
  { slug: "react-performance", title: "React Performance", links: ["Website Refresh", "Systems Design Notes", "Prompt Patterns"] },
  { slug: "ai-evals", title: "AI Evals", links: ["AI Lab Notes", "Prompt Patterns", "Open Questions"] },
  { slug: "prompt-design", title: "Prompt Design", links: ["Prompt Patterns", "AI Lab Notes", "Writing Principles"] },
  { slug: "knowledge-synthesis", title: "Knowledge Synthesis", links: ["Maps of Thought", "Synthesis Notes", "Reference Notes"] },
  { slug: "deep-reading", title: "Deep Reading", links: ["Reading Queue", "Reference Notes", "Knowledge Synthesis"] },
  { slug: "memory-systems", title: "Memory Systems", links: ["Personal OS", "Knowledge Graph", "Concept Garden"] }
]);

const projectsSatelliteCluster = makeClusterSeries("projects", "Projects", ["execution", "project"], 14, [
  { slug: "feature-backlog", title: "Feature Backlog", links: ["Website Refresh", "Launch Checklist", "Projects Index"] },
  { slug: "launch-metrics", title: "Launch Metrics", links: ["Launch Checklist", "Website Refresh", "Weekly Review"] },
  { slug: "feedback-inbox", title: "Feedback Inbox", links: ["Meeting Notes", "Design Critique Notes", "Website Refresh"] },
  { slug: "product-principles", title: "Product Principles", links: ["Website Refresh", "Writing Principles", "Projects Index"] },
  { slug: "automation-ideas", title: "Automation Ideas", links: ["AI Lab Notes", "Future Bets", "Projects Index"] },
  { slug: "workflow-experiments", title: "Workflow Experiments", links: ["Focus System", "Personal OS", "AI Lab Notes"] },
  { slug: "research-sprint", title: "Research Sprint", links: ["Learning Roadmap", "Open Questions", "Projects Index"] },
  { slug: "ops-checkpoints", title: "Ops Checkpoints", links: ["Launch Checklist", "Quarter Planning", "Decision Journal"] },
  { slug: "content-ops", title: "Content Ops", links: ["Content Studio", "Editorial Calendar", "Meeting Notes"] },
  { slug: "design-system-audit", title: "Design System Audit", links: ["Website Refresh", "Design Critique Notes", "Content Strategy"] }
]);

const personalCluster = makeClusterSeries("personal", "Personal", ["personal", "life"], 15, [
  { slug: "health-notes", title: "Health Notes", links: ["Focus System", "Weekly Review", "Deep Work Rituals"] },
  { slug: "habit-tracker", title: "Habit Tracker", links: ["Weekly Review", "Focus System", "Personal OS"] },
  { slug: "travel-ideas", title: "Travel Ideas", links: ["Evergreen Ideas", "Future Bets", "Inbox"] },
  { slug: "finance-system", title: "Finance System", links: ["Personal OS", "Decision Journal", "Weekly Review"] },
  { slug: "relationship-notes", title: "Relationship Notes", links: ["Weekly Review", "Personal OS", "Writing Principles"] },
  { slug: "home-systems", title: "Home Systems", links: ["Personal OS", "Automation Ideas", "Focus System"] },
  { slug: "fitness-experiments", title: "Fitness Experiments", links: ["Health Notes", "Habit Tracker", "Deep Work Rituals"] },
  { slug: "life-admin", title: "Life Admin", links: ["Finance System", "Home Systems", "Weekly Review"] }
]);

const ideaCluster = makeClusterSeries("ideas", "Ideas", ["ideas", "brainstorm"], 16, [
  { slug: "future-products", title: "Future Products", links: ["Future Bets", "AI Lab Notes", "Projects Index"] },
  { slug: "writing-topics", title: "Writing Topics", links: ["Content Strategy", "Storytelling Patterns", "Writing Principles"] },
  { slug: "research-questions", title: "Research Questions", links: ["Open Questions", "Reading Queue", "Knowledge Graph"] },
  { slug: "moc-improvements", title: "MOC Improvements", links: ["Maps of Thought", "Knowledge Graph", "Projects Index"] },
  { slug: "vault-patterns", title: "Vault Patterns", links: ["Knowledge Graph", "Personal OS", "Writing Principles"] },
  { slug: "graph-ideas", title: "Graph Ideas", links: ["Knowledge Graph", "MOC Improvements", "Future Products"] },
  { slug: "interface-experiments", title: "Interface Experiments", links: ["Website Refresh", "Design Critique Notes", "Graph Ideas"] },
  { slug: "system-refinements", title: "System Refinements", links: ["Personal OS", "Focus System", "Decision Journal"] }
]);

export const defaultVaultNotes: VaultNote[] = [
  ...workspaceNotes,
  ...projectCluster,
  ...knowledgeCluster,
  ...contentCluster,
  ...evergreenCluster,
  ...learningCluster,
  ...projectsSatelliteCluster,
  ...personalCluster,
  ...ideaCluster
];

export const defaultVaultData: VaultData = {
  notes: defaultVaultNotes,
  links: []
};
