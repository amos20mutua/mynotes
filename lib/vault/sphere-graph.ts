import { buildVaultGraph, ROOT_NODE_ID, type GraphEdge, type GraphNode } from "@/lib/vault/graph";
import type { VaultLink, VaultNote } from "@/types";

export type SphereGraphNode = GraphNode & {
  position: [number, number, number];
  normal: [number, number, number];
};

export type SphereGraph = {
  nodes: SphereGraphNode[];
  edges: GraphEdge[];
};

const SPHERE_RADIUS = 12;
const MIN_SPHERE_NODE_COUNT = 18;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const CORE_POSITIONS: Record<string, [number, number, number]> = {
  [ROOT_NODE_ID]: [0.08, 0.92, 0.38],
  "root:knowledge-core": [0.86, 0.24, 0.44],
  "root:projects-core": [-0.78, 0.12, 0.62],
  "root:ideas-core": [0.04, -0.88, -0.46]
};

function toPoint(longitude: number, latitude: number, radius = SPHERE_RADIUS): [number, number, number] {
  const cosLatitude = Math.cos(latitude);
  const x = radius * cosLatitude * Math.cos(longitude);
  const y = radius * Math.sin(latitude);
  const z = radius * cosLatitude * Math.sin(longitude);
  return [x, y, z];
}

function toNormal(position: [number, number, number]): [number, number, number] {
  const length = Math.hypot(position[0], position[1], position[2]) || 1;
  return [position[0] / length, position[1] / length, position[2] / length];
}

function distributedDirections(count: number, startIndex = 0) {
  if (count <= 0) {
    return [] as Array<[number, number, number]>;
  }

  return Array.from({ length: count }, (_, index) => {
    const sequenceIndex = index + startIndex;
    const t = (sequenceIndex + 0.5) / count;
    const y = 1 - t * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * sequenceIndex;
    return [Math.cos(theta) * radius, y, Math.sin(theta) * radius] as [number, number, number];
  });
}

function projectPointToSphere(point: [number, number, number]) {
  const normal = toNormal(point);
  return [normal[0] * SPHERE_RADIUS, normal[1] * SPHERE_RADIUS, normal[2] * SPHERE_RADIUS] as [number, number, number];
}

function graphPositionToPoint(note: VaultNote) {
  if (
    note.graphPosition &&
    Number.isFinite(note.graphPosition.x) &&
    Number.isFinite(note.graphPosition.y) &&
    Number.isFinite(note.graphPosition.z ?? 0) &&
    note.graphPosition.z !== undefined
  ) {
    return projectPointToSphere([note.graphPosition.x, note.graphPosition.y, note.graphPosition.z ?? 0]);
  }

  if (
    note.graphPosition &&
    Number.isFinite(note.graphPosition.x) &&
    Number.isFinite(note.graphPosition.y) &&
    note.graphPosition.x >= 0 &&
    note.graphPosition.x <= 1 &&
    note.graphPosition.y >= 0 &&
    note.graphPosition.y <= 1
  ) {
    const longitude = note.graphPosition.x * Math.PI * 2 - Math.PI;
    const latitude = note.graphPosition.y * Math.PI - Math.PI / 2;
    return toPoint(longitude, latitude, SPHERE_RADIUS);
  }

  return null;
}

function pickShellIndices(total: number, count: number) {
  if (count <= 0 || total <= 0) {
    return [];
  }

  if (count >= total) {
    return Array.from({ length: total }, (_, index) => index);
  }

  return Array.from({ length: count }, (_, index) => Math.min(total - 1, Math.round((index * (total - 1)) / Math.max(1, count - 1))));
}

export function buildSphericalVaultGraph(notes: VaultNote[], links?: VaultLink[]): SphereGraph {
  const flatGraph = buildVaultGraph(notes, links);
  const noteById = new Map(notes.map((note) => [note.id, note] as const));
  const computedPositions = new Map<string, [number, number, number]>();
  const noteNodes = flatGraph.nodes
    .filter((node) => node.type === "note")
    .slice()
    .sort((left, right) => left.cluster.localeCompare(right.cluster) || right.degree - left.degree || left.label.localeCompare(right.label));

  const unpositionedNoteNodes = noteNodes.filter((node) => {
    const note = node.noteId ? noteById.get(node.noteId) : null;
    const persisted = note ? graphPositionToPoint(note) : null;

    if (persisted) {
      computedPositions.set(node.id, persisted);
      return false;
    }

    return true;
  });

  const shellDirections = distributedDirections(Math.max(unpositionedNoteNodes.length, MIN_SPHERE_NODE_COUNT));
  const noteDirectionIndices = pickShellIndices(shellDirections.length, unpositionedNoteNodes.length);

  unpositionedNoteNodes.forEach((node, index) => {
    const direction = shellDirections[noteDirectionIndices[index] ?? index] ?? [0, 0, 1];
    computedPositions.set(node.id, projectPointToSphere(direction));
  });

  const scaffoldDirections = shellDirections.filter((_, index) => !noteDirectionIndices.includes(index));
  const scaffoldNodes: SphereGraphNode[] =
    noteNodes.length < MIN_SPHERE_NODE_COUNT
      ? scaffoldDirections.slice(0, MIN_SPHERE_NODE_COUNT - noteNodes.length).map((direction, index) => {
          const position = projectPointToSphere(direction);
          return {
            id: `ghost:shell-${index}`,
            label: "",
            type: "ghost",
            degree: 0,
            x: 0,
            y: 0,
            radius: 3.3,
            cluster: "Shell",
            isHub: false,
            position,
            normal: toNormal(position)
          };
        })
      : [];

  const positionedNodes: SphereGraphNode[] = flatGraph.nodes.map((node, index) => {
    const note = node.noteId ? noteById.get(node.noteId) : null;
    const position =
      node.type === "root"
        ? projectPointToSphere(CORE_POSITIONS[node.id] ?? [0, 0, 1])
        : note
          ? computedPositions.get(node.id) ?? toPoint(GOLDEN_ANGLE * index, 0)
          : toPoint(GOLDEN_ANGLE * index, 0);

    return {
      ...node,
      position,
      normal: toNormal(position)
    };
  });

  return {
    nodes: [...positionedNodes, ...scaffoldNodes],
    edges: flatGraph.edges
  };
}
