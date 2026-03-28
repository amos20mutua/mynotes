import type { VaultData, VaultNote } from "@/types";

function makePublicNote(id: string, title: string, content: string, tags: string[], createdAt: string): VaultNote {
  return {
    id,
    title,
    content,
    colorGroup: "Public",
    folder: "Public",
    tags: ["public", "topic", ...tags],
    status: "active",
    createdAt,
    updatedAt: createdAt
  };
}

export const publicVaultData: VaultData = {
  notes: [
    makePublicNote(
      "wisdom",
      "Wisdom",
      `# Wisdom

Wisdom is not the speed of your mind. It is the quality of your judgment when desire, fear, pride, and pressure are all speaking at once.

## What wisdom does
- It separates what is urgent from what is important.
- It teaches you that not every open door is your door.
- It reminds you that a right thing at the wrong time can still wound your life.

## Deep reminder
- Knowledge tells you what can be done.
- Power tells you what may be done.
- Wisdom tells you what should be done.

## Practice
- Before major decisions, ask: "What does this feed in me?"
- If a choice strengthens vanity, noise, and haste, it is rarely a wise choice.
- If a choice strengthens peace, truth, discipline, and service, it is usually worth deeper attention.

## Connected themes
- [[Purpose]]
- [[Discernment]]
- [[Character]]
- [[Public Speaking]]
`,
      ["wisdom", "judgment", "life"],
      "2026-03-28T08:00:00.000Z"
    ),
    makePublicNote(
      "god",
      "God",
      `# God

The deepest need of the human soul is not merely information about God, but alignment with Him.

## Core thought
- Many people want God to assist their plans.
- Few want God to examine their motives.
- Yet transformation begins where surrender becomes more important than self-protection.

## Deep reminder
- God is not an accessory to ambition.
- He is the center that reveals whether ambition is pure, corrupted, or incomplete.

## Practice
- Pray before planning, not only after failing.
- Let scripture correct your appetite, not only comfort your pain.
- Build a private life that can carry the public weight you ask God to give you.

## Connected themes
- [[Purpose]]
- [[Wisdom]]
- [[Discipline]]
- [[Public Speaking]]
`,
      ["faith", "god", "christianity"],
      "2026-03-28T08:02:00.000Z"
    ),
    makePublicNote(
      "tech",
      "Tech",
      `# Tech

Technology is not valuable because it is advanced. It is valuable when it reduces friction, expands capability, and serves real human need.

## What builders forget
- Newness is not usefulness.
- Complexity is not depth.
- Feature count is not product clarity.

## Deep reminder
- The best technology disappears into empowerment.
- It lets ordinary people do what used to require experts, time, and permission.

## Practice
- Build tools that remove confusion before you build tools that impress.
- Prefer leverage over spectacle.
- Ask whether the product strengthens attention or exploits it.

## Connected themes
- [[Building Tech]]
- [[Future of Tech]]
- [[AI]]
- [[Systems Thinking]]
`,
      ["technology", "building", "systems"],
      "2026-03-28T08:04:00.000Z"
    ),
    makePublicNote(
      "futuristic-tech",
      "Futuristic Tech",
      `# Futuristic Tech

Futuristic technology is not just about what looks advanced. It is about what changes the default boundaries of human action.

## Signs of truly future-facing tools
- They compress time.
- They increase precision.
- They remove layers between thought and execution.

## Deep reminder
- The future usually arrives quietly.
- Before a technology becomes dramatic, it first becomes useful.

## Practice
- Track tools that reduce translation between idea and output.
- Watch for interfaces that make computing feel more natural, less procedural.
- Stay close to signals, but do not worship novelty.

## Connected themes
- [[Future of Tech]]
- [[AI]]
- [[Quantum Computing]]
- [[Attention]]
`,
      ["future", "technology", "signals"],
      "2026-03-28T08:06:00.000Z"
    ),
    makePublicNote(
      "ai",
      "AI",
      `# AI

AI is not important because it mimics intelligence. It is important because it can multiply judgment, speed, iteration, and coordination at scale.

## What matters most
- AI changes who can build.
- AI changes how fast ideas become systems.
- AI changes the value of clarity, because vague people cannot direct powerful tools well.

## Deep reminder
- In an AI age, the rarest asset is not access to tools.
- It is discernment, taste, integrity, and the ability to ask better questions.

## Practice
- Use AI to expand thought, not replace thinking.
- Let it accelerate drafts, analysis, and pattern recognition.
- Keep a human standard for truth, responsibility, and meaning.

## Connected themes
- [[Future of AI]]
- [[Tech]]
- [[Highest IQ]]
- [[Building Tech]]
`,
      ["ai", "intelligence", "tools"],
      "2026-03-28T08:08:00.000Z"
    ),
    makePublicNote(
      "public-speaking",
      "Public Speaking",
      `# Public Speaking

Public speaking is not the art of sounding powerful. It is the discipline of carrying truth clearly enough that other people can receive it.

## What gives words weight
- inner conviction
- clean structure
- emotional honesty
- disciplined restraint

## Deep reminder
- Many people speak to be admired.
- Strong communicators speak to transfer reality.

## Practice
- Say less, but make every sentence carry direction.
- Do not decorate weak ideas with volume.
- If the message has not first pierced you, it will rarely pierce others.

## Connected themes
- [[Wisdom]]
- [[Purpose]]
- [[God]]
- [[Clarity]]
`,
      ["speaking", "communication", "conviction"],
      "2026-03-28T08:10:00.000Z"
    ),
    makePublicNote(
      "purpose",
      "Purpose",
      `# Purpose

Purpose is not a mood. It is a governing direction that organizes sacrifice, attention, and identity.

## What purpose does
- It tells you what to say no to.
- It gives pain context.
- It makes discipline feel meaningful rather than oppressive.

## Deep reminder
- Many people search for purpose as though it is hidden in a feeling.
- Often it appears through responsibility, obedience, burden, and long faithfulness.

## Practice
- Notice what kind of problems keep calling your spirit back.
- Notice what kind of service gives you life even when it costs you.
- Do not confuse applause with assignment.

## Connected themes
- [[Wisdom]]
- [[Discipline]]
- [[God]]
- [[Building Tech]]
`,
      ["purpose", "calling", "direction"],
      "2026-03-28T08:12:00.000Z"
    ),
    makePublicNote(
      "building-tech",
      "Building Tech",
      `# Building Tech

To build technology well, you need more than code. You need perception, patience, empathy, and the courage to cut what does not matter.

## What strong builders know
- Good products come from repeated simplification.
- A system becomes powerful when its parts cooperate naturally.
- Distribution matters almost as much as invention.

## Deep reminder
- Builders often fail by trying to prove intelligence rather than deliver utility.
- The strongest products feel inevitable after they are made.

## Practice
- Build around a sharp user pain.
- Reduce steps.
- Make the first win happen fast.

## Connected themes
- [[Tech]]
- [[Future of Tech]]
- [[AI]]
- [[Systems Thinking]]
`,
      ["builders", "products", "execution"],
      "2026-03-28T08:14:00.000Z"
    ),
    makePublicNote(
      "future-of-ai",
      "Future of AI",
      `# Future of AI

The future of AI will not only be decided by model size. It will be shaped by trust, interfaces, agency, and the human values embedded into workflows.

## What to watch
- agents that complete real work
- tools that remember context
- systems that collaborate across tasks
- assistants that move from chat to execution

## Deep reminder
- The next leap is not only smarter models.
- It is a more seamless merger between intention and action.

## Practice
- Watch where AI removes waiting.
- Watch where it upgrades leverage for small teams.
- Watch where it begins to reorganize whole professions.

## Connected themes
- [[AI]]
- [[Future of Tech]]
- [[Futuristic Tech]]
- [[Highest IQ]]
`,
      ["future", "ai", "agents"],
      "2026-03-28T08:16:00.000Z"
    ),
    makePublicNote(
      "future-of-tech",
      "Future of Tech",
      `# Future of Tech

The future of tech belongs to tools that feel faster, calmer, more ambient, and more aligned with human intent.

## The direction of change
- fewer interfaces, more orchestration
- fewer steps, more direct outcomes
- fewer silos, more connected systems

## Deep reminder
- Every generation of technology removes one more layer between desire and action.
- The real race is to shape that convenience without corrupting the human being using it.

## Practice
- Study systems, not just products.
- Track what becomes default behavior.
- Ask whether a technology increases agency or dependency.

## Connected themes
- [[Tech]]
- [[Futuristic Tech]]
- [[Quantum Computing]]
- [[Building Tech]]
`,
      ["future", "technology", "systems"],
      "2026-03-28T08:18:00.000Z"
    ),
    makePublicNote(
      "highest-iq",
      "Highest IQ",
      `# Highest IQ

Raw intelligence is valuable, but without humility and moral structure it often becomes sophisticated foolishness.

## What real intellectual power includes
- pattern recognition
- conceptual compression
- disciplined attention
- the ability to stay teachable

## Deep reminder
- The highest form of intelligence is not merely solving hard problems.
- It is seeing reality clearly enough to live truthfully within it.

## Practice
- Train depth, not just speed.
- Read slowly enough to think.
- Build the ability to hold tension without rushing into shallow certainty.

## Connected themes
- [[Wisdom]]
- [[AI]]
- [[Quantum Computing]]
- [[Clarity]]
`,
      ["intelligence", "reasoning", "clarity"],
      "2026-03-28T08:20:00.000Z"
    ),
    makePublicNote(
      "quantum-computing",
      "Quantum Computing",
      `# Quantum Computing

Quantum computing matters because it represents a different model of computation, one that may change how certain classes of problems are approached.

## Why it matters
- optimization
- simulation
- cryptography
- scientific discovery

## Deep reminder
- The point of studying advanced technology is not to sound ahead.
- It is to learn where the limits of current systems may eventually break open.

## Practice
- Understand the first principles before chasing headlines.
- Track what becomes practically useful, not only theoretically impressive.
- Stay grounded in patient learning.

## Connected themes
- [[Future of Tech]]
- [[Futuristic Tech]]
- [[Highest IQ]]
- [[Research]]
`,
      ["quantum", "computation", "research"],
      "2026-03-28T08:22:00.000Z"
    ),
    makePublicNote(
      "discipline",
      "Discipline",
      `# Discipline

Discipline is the agreement you make with your future self that your moods will not be allowed to rule your destiny.

## Why it matters
- Talent can start.
- Inspiration can spark.
- Discipline is what carries a life far enough to become trustworthy.

## Deep reminder
- Freedom is not the absence of structure.
- Freedom is what becomes possible when structure is faithful enough to support growth.

## Practice
- Make your standards visible.
- Lower friction around the right habits.
- Stop negotiating with what you already know is right.

## Connected themes
- [[Purpose]]
- [[Attention]]
- [[Character]]
- [[God]]
`,
      ["discipline", "consistency", "growth"],
      "2026-03-28T08:24:00.000Z"
    ),
    makePublicNote(
      "attention",
      "Attention",
      `# Attention

Attention is one of the holiest resources in modern life because what owns your attention slowly shapes your inner world.

## What attention does
- It feeds thought loops.
- It builds emotional atmosphere.
- It determines what becomes mentally available in important moments.

## Deep reminder
- You become more like what you stare at repeatedly.
- Attention is not neutral exposure. It is slow formation.

## Practice
- Remove low-value noise before trying to increase productivity.
- Protect the first and last moments of the day.
- Give your best attention to what deserves depth.

## Connected themes
- [[Discipline]]
- [[Wisdom]]
- [[AI]]
- [[Clarity]]
`,
      ["attention", "focus", "formation"],
      "2026-03-28T08:26:00.000Z"
    ),
    makePublicNote(
      "clarity",
      "Clarity",
      `# Clarity

Clarity is not having every answer. It is seeing the next true thing well enough to move without self-deception.

## What blocks clarity
- emotional noise
- ego attachment
- haste
- borrowed language that has never been tested by reality

## Deep reminder
- Confusion is often sustained by what we are unwilling to admit.
- Many answers arrive the moment honesty becomes more important than comfort.

## Practice
- Name the problem simply.
- Remove decorative language.
- Ask what is true even if it costs your current story.

## Connected themes
- [[Wisdom]]
- [[Public Speaking]]
- [[Highest IQ]]
- [[Truth]]
`,
      ["clarity", "truth", "thinking"],
      "2026-03-28T08:28:00.000Z"
    ),
    makePublicNote(
      "character",
      "Character",
      `# Character

Character is what remains when opportunities, pressure, secrecy, and power begin to test who you really are.

## Why it matters
- Skill can open doors.
- Character determines what survives after the door opens.

## Deep reminder
- A person is not finally measured by what they can do when seen.
- They are measured by what they choose when no one is present to reward them.

## Practice
- Keep promises to yourself.
- Tell the truth faster.
- Refuse the kind of success that requires inner decay.

## Connected themes
- [[Wisdom]]
- [[Discipline]]
- [[Purpose]]
- [[Leadership]]
`,
      ["character", "integrity", "virtue"],
      "2026-03-28T08:30:00.000Z"
    ),
    makePublicNote(
      "leadership",
      "Leadership",
      `# Leadership

Leadership is not control. It is the ability to carry vision, reality, and responsibility in a way that helps other people rise with you.

## Real leadership requires
- inner steadiness
- clean communication
- responsibility under pressure
- sacrifice before entitlement

## Deep reminder
- Weak leaders love influence.
- Strong leaders love stewardship.

## Practice
- Clarify direction.
- Reduce confusion.
- Carry weight without making other people carry your insecurity.

## Connected themes
- [[Character]]
- [[Public Speaking]]
- [[Wisdom]]
- [[Building Tech]]
`,
      ["leadership", "stewardship", "responsibility"],
      "2026-03-28T08:32:00.000Z"
    ),
    makePublicNote(
      "truth",
      "Truth",
      `# Truth

Truth is not harsh because it is accurate. It only feels harsh when illusion has become emotionally expensive to lose.

## Why truth matters
- It stabilizes reality.
- It ends wasted motion.
- It becomes the foundation of durable peace.

## Deep reminder
- Lies can preserve comfort for a while.
- Truth preserves life.

## Practice
- Speak truth without theatrical cruelty.
- Receive truth without immediate self-defense.
- Build your life so correction becomes gain, not insult.

## Connected themes
- [[Clarity]]
- [[Wisdom]]
- [[Character]]
- [[God]]
`,
      ["truth", "reality", "honesty"],
      "2026-03-28T08:34:00.000Z"
    ),
    makePublicNote(
      "systems-thinking",
      "Systems Thinking",
      `# Systems Thinking

Systems thinking is the discipline of seeing how parts, feedback loops, constraints, and incentives shape outcomes over time.

## Why it matters
- Most recurring problems are structural, not random.
- Most recurring successes are designed, not accidental.

## Deep reminder
- If the structure is wrong, effort alone will not save the result.
- Better systems often matter more than harder effort.

## Practice
- Ask what keeps producing this result.
- Trace incentives before assigning blame.
- Improve the flow, not only the visible symptom.

## Connected themes
- [[Tech]]
- [[Building Tech]]
- [[Future of Tech]]
- [[Leadership]]
`,
      ["systems", "thinking", "design"],
      "2026-03-28T08:36:00.000Z"
    ),
    makePublicNote(
      "discernment",
      "Discernment",
      `# Discernment

Discernment is the ability to sense difference where others only see similarity.

## What it helps with
- choosing the right opportunity
- detecting hidden motives
- distinguishing charisma from substance
- separating movement from progress

## Deep reminder
- Not everything bright is light.
- Not everything delayed is denied.

## Practice
- Watch patterns longer.
- Trust the fruit more than the presentation.
- Do not confuse intensity with depth.

## Connected themes
- [[Wisdom]]
- [[Truth]]
- [[God]]
- [[Purpose]]
`,
      ["discernment", "judgment", "spiritual"],
      "2026-03-28T08:38:00.000Z"
    ),
    makePublicNote(
      "research",
      "Research",
      `# Research

Research is disciplined curiosity directed by humility.

## What strong research does
- asks better questions
- resists premature certainty
- tests assumptions
- values evidence without losing imagination

## Deep reminder
- Serious learning is not collecting facts.
- It is being changed by better contact with reality.

## Practice
- Go to primary sources.
- Write your own understanding in simple language.
- Return to difficult material until it becomes usable.

## Connected themes
- [[Quantum Computing]]
- [[Highest IQ]]
- [[Systems Thinking]]
- [[Clarity]]
`,
      ["research", "learning", "knowledge"],
      "2026-03-28T08:40:00.000Z"
    )
  ],
  links: []
};
