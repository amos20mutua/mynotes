import type { VaultLink, VaultNote } from "@/types";

export type GraphNode = {
  id: string;
  label: string;
  noteId?: string;
  type: "note" | "ghost" | "root";
  degree: number;
  x: number;
  y: number;
  radius: number;
  cluster: string;
  isHub: boolean;
};

export type GraphEdge = {
  id?: string;
  source: string;
  target: string;
};

export const ROOT_NODE_ID = "root:vault-core";
export const CORE_NODE_IDS = [ROOT_NODE_ID, "root:knowledge-core", "root:projects-core", "root:ideas-core"] as const;

const CORE_NODES = [
  { id: ROOT_NODE_ID, label: "Vault Core", cluster: "Vault Core", x: 600, y: 390 },
  { id: "root:knowledge-core", label: "Knowledge Core", cluster: "Knowledge Core", x: 565, y: 342 },
  { id: "root:projects-core", label: "Projects Core", cluster: "Projects Core", x: 648, y: 360 },
  { id: "root:ideas-core", label: "Ideas Core", cluster: "Ideas Core", x: 624, y: 438 }
] as const;

function resolveClusterName(note: VaultNote) {
  return note.colorGroup || note.folder || "Vault";
}

function resolveCoreNode(clusterName: string) {
  const cluster = clusterName.toLowerCase();

  if (cluster.includes("project")) {
    return "root:projects-core";
  }

  if (cluster.includes("idea") || cluster.includes("content") || cluster.includes("personal")) {
    return "root:ideas-core";
  }

  return "root:knowledge-core";
}

function addEdge(edges: GraphEdge[], seen: Set<string>, source: string, target: string, id?: string) {
  if (source === target) {
    return;
  }

  const key = source < target ? `${source}|${target}` : `${target}|${source}`;
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  edges.push({ id, source, target });
}

function seededValue(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return (hash % 1000) / 1000;
}

export function normalizeTitle(value: string) {
  return value.trim().toLowerCase();
}

export function parseWikiLinks(content: string) {
  return Array.from(content.matchAll(/\[\[([^\]]+)\]\]/g))
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value));
}

function isHubNote(note: VaultNote) {
  const title = note.title.toLowerCase();
  return title.includes("index") || title.includes("graph") || title.includes("map") || title.includes("principles");
}

function clusterCenter(index: number) {
  const centers = [
    { x: 260, y: 210 },
    { x: 760, y: 180 },
    { x: 910, y: 440 },
    { x: 520, y: 540 },
    { x: 170, y: 470 }
  ];

  return centers[index % centers.length];
}

export function buildVaultGraph(notes: VaultNote[], links?: VaultLink[]) {
  const noteByTitle = new Map(notes.map((note) => [normalizeTitle(note.title), note] as const));
  const folderOrder = Array.from(new Set(notes.map((note) => resolveClusterName(note))));
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const seenEdges = new Set<string>();

  for (const note of notes) {
    const nodeId = `note:${note.id}`;
    const clusterName = resolveClusterName(note);
    const folderIndex = Math.max(0, folderOrder.indexOf(clusterName));
    const center = clusterCenter(folderIndex);
    const scatterX = (seededValue(note.id) - 0.5) * 220;
    const scatterY = (seededValue(`${note.id}-y`) - 0.5) * 180;

    nodes.set(nodeId, {
      id: nodeId,
      label: note.title,
      noteId: note.id,
      type: "note",
      degree: 0,
      radius: isHubNote(note) ? 10 : 5.5,
      cluster: clusterName,
      isHub: isHubNote(note),
      x: note.graphPosition?.x ?? center.x + scatterX,
      y: note.graphPosition?.y ?? center.y + scatterY
    });
  }

  for (const coreNode of CORE_NODES) {
    nodes.set(coreNode.id, {
      id: coreNode.id,
      label: coreNode.label,
      type: "root",
      degree: 0,
      x: coreNode.x,
      y: coreNode.y,
      radius: coreNode.id === ROOT_NODE_ID ? 15 : 11.5,
      cluster: coreNode.cluster,
      isHub: true
    });
  }

  addEdge(edges, seenEdges, ROOT_NODE_ID, "root:knowledge-core", "core:knowledge");
  addEdge(edges, seenEdges, ROOT_NODE_ID, "root:projects-core", "core:projects");
  addEdge(edges, seenEdges, ROOT_NODE_ID, "root:ideas-core", "core:ideas");
  addEdge(edges, seenEdges, "root:knowledge-core", "root:projects-core", "core:knowledge-projects");
  addEdge(edges, seenEdges, "root:knowledge-core", "root:ideas-core", "core:knowledge-ideas");
  addEdge(edges, seenEdges, "root:projects-core", "root:ideas-core", "core:projects-ideas");

  if (links && links.length > 0) {
    const noteById = new Map(notes.map((note) => [note.id, note] as const));

    for (const link of links) {
      const sourceNote = noteById.get(link.sourceNoteId);
      const targetNote = noteById.get(link.targetNoteId);

      if (!sourceNote || !targetNote) {
        continue;
      }

      addEdge(edges, seenEdges, `note:${sourceNote.id}`, `note:${targetNote.id}`, link.id);
    }
  } else {
    for (const note of notes) {
      const sourceId = `note:${note.id}`;

      for (const link of parseWikiLinks(note.content)) {
        const matchedNote = noteByTitle.get(normalizeTitle(link));
        const targetId = matchedNote ? `note:${matchedNote.id}` : `ghost:${normalizeTitle(link)}`;

        if (!nodes.has(targetId)) {
          const center = clusterCenter(folderOrder.length + nodes.size);
          nodes.set(targetId, {
            id: targetId,
            label: matchedNote?.title ?? link,
            noteId: matchedNote?.id,
            type: matchedNote ? "note" : "ghost",
            degree: 0,
            radius: matchedNote && isHubNote(matchedNote) ? 9 : matchedNote ? 5.5 : 4.2,
            cluster: matchedNote?.colorGroup ?? matchedNote?.folder ?? "Ghost",
            isHub: matchedNote ? isHubNote(matchedNote) : false,
            x: center.x + (seededValue(targetId) - 0.5) * 160,
            y: center.y + (seededValue(`${targetId}-y`) - 0.5) * 140
          });
        }

        addEdge(edges, seenEdges, sourceId, targetId);
      }
    }
  }

  const nodeList = Array.from(nodes.values());

  const clusteredNotes = new Map<string, GraphNode[]>();

  for (const node of nodeList) {
    if (node.type === "note") {
      if (!clusteredNotes.has(node.cluster)) {
        clusteredNotes.set(node.cluster, []);
      }

      clusteredNotes.get(node.cluster)?.push(node);
    }
  }

  for (const [clusterName, clusterNodes] of clusteredNotes) {
    const hubNodes = clusterNodes.filter((node) => node.isHub);
    const primaryHub = hubNodes[0] ?? clusterNodes.sort((left, right) => right.degree - left.degree)[0];

    if (!primaryHub) {
      continue;
    }

    addEdge(edges, seenEdges, resolveCoreNode(clusterName), primaryHub.id, `core-cluster:${primaryHub.id}`);

    for (const node of clusterNodes) {
      if (node.id === primaryHub.id) {
        continue;
      }

      if (node.isHub) {
        addEdge(edges, seenEdges, primaryHub.id, node.id, `cluster-hub:${primaryHub.id}:${node.id}`);
      }
    }

    const sortedNodes = [...clusterNodes].sort((left, right) => right.degree - left.degree || left.label.localeCompare(right.label));
    for (let index = 0; index < sortedNodes.length - 1; index += 1) {
      addEdge(edges, seenEdges, sortedNodes[index].id, sortedNodes[index + 1].id, `cluster-chain:${sortedNodes[index].id}:${sortedNodes[index + 1].id}`);
    }

    const supportNodes = sortedNodes.filter((node) => !node.isHub);
    for (let index = 0; index < supportNodes.length; index += 3) {
      const node = supportNodes[index];
      if (!node) {
        continue;
      }

      addEdge(edges, seenEdges, primaryHub.id, node.id, `cluster-support:${primaryHub.id}:${node.id}`);
    }
  }

  for (const node of nodeList) {
    node.degree = 0;
  }

  for (const edge of edges) {
    const source = nodes.get(edge.source);
    const target = nodes.get(edge.target);

    if (source) {
      source.degree += 1;
    }

    if (target) {
      target.degree += 1;
    }
  }

  for (const node of nodeList) {
    if (node.type === "root") {
      node.radius = node.id === ROOT_NODE_ID ? 16 : 12.5;
    } else if (node.type === "note") {
      node.radius = node.isHub ? Math.max(12, 11 + node.degree * 0.45) : Math.max(4.5, 4.2 + node.degree * 0.16);
    } else {
      node.radius = 3.6;
    }
  }

  for (let iteration = 0; iteration < 220; iteration += 1) {
    for (let index = 0; index < nodeList.length; index += 1) {
      const node = nodeList[index];
      let forceX = 0;
      let forceY = 0;

      for (let otherIndex = 0; otherIndex < nodeList.length; otherIndex += 1) {
        if (index === otherIndex) {
          continue;
        }

        const other = nodeList[otherIndex];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distanceSq = Math.max(dx * dx + dy * dy, 18);
        const repulsion = node.cluster === other.cluster ? 1700 / distanceSq : 2600 / distanceSq;

        forceX += (dx / Math.sqrt(distanceSq)) * repulsion;
        forceY += (dy / Math.sqrt(distanceSq)) * repulsion;
      }

      const clusterIndex = Math.max(0, folderOrder.indexOf(node.cluster));
      const center = clusterCenter(clusterIndex);
      forceX += (center.x - node.x) * (node.isHub ? 0.004 : 0.0026);
      forceY += (center.y - node.y) * (node.isHub ? 0.004 : 0.0026);

      for (const edge of edges) {
        if (edge.source !== node.id && edge.target !== node.id) {
          continue;
        }

        const otherId = edge.source === node.id ? edge.target : edge.source;
        const other = nodes.get(otherId);

        if (!other) {
          continue;
        }

        const dx = other.x - node.x;
        const dy = other.y - node.y;
        const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const desired = node.cluster === other.cluster ? 78 : 120;
        const attraction = (distance - desired) * 0.0065;

        forceX += (dx / distance) * attraction;
        forceY += (dy / distance) * attraction;
      }

      node.x = Math.min(1120, Math.max(80, node.x + forceX));
      node.y = Math.min(720, Math.max(70, node.y + forceY));
    }
  }

  return {
    nodes: nodeList.sort((a, b) => b.radius - a.radius),
    edges
  };
}

export function getLinkedTitles(note: VaultNote) {
  return parseWikiLinks(note.content);
}

export function getBacklinks(notes: VaultNote[], selectedNote: VaultNote | null, links?: VaultLink[]) {
  if (!selectedNote) {
    return [];
  }

  if (links && links.length > 0) {
    const backlinks = new Set(links.filter((link) => link.targetNoteId === selectedNote.id).map((link) => link.sourceNoteId));
    return notes.filter((note) => backlinks.has(note.id));
  }

  return notes.filter((note) => note.id !== selectedNote.id && parseWikiLinks(note.content).some((title) => normalizeTitle(title) === normalizeTitle(selectedNote.title)));
}
