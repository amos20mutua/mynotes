"use client";

import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ROOT_NODE_ID } from "@/lib/vault/graph";
import { buildSphericalVaultGraph } from "@/lib/vault/sphere-graph";
import type { VaultLink, VaultNote } from "@/types";

type GraphViewProps = {
  notes: VaultNote[];
  links: VaultLink[];
  selectedNote: VaultNote | null;
  onSelectNote: (noteId: string) => void;
  onOpenLinkedNote: (title: string) => void;
  onOpenEditor: () => void;
  onCreateNoteAtPoint: (title: string, graphPosition: { x: number; y: number; z: number }, connectToTitle?: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
};

type ComposerState = {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  graphZ: number;
  title: string;
  connectToTitle?: string;
};

type ProjectedNode = {
  id: string;
  label: string;
  noteId?: string;
  type: "note" | "ghost" | "root";
  cluster: string;
  isHub: boolean;
  x: number;
  y: number;
  z: number;
  scale: number;
  radius: number;
};

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 780;
const DEFAULT_SCALE = 1.12;
const MIN_SCALE = 0.84;
const MAX_SCALE = 1.44;
const SPHERE_RADIUS = 320;
const CAMERA_DISTANCE = 2.45;
const SPHERE_CENTER_X = VIEWPORT_WIDTH / 2;
const SPHERE_CENTER_Y = VIEWPORT_HEIGHT * 0.37;
const AUTO_ROTATE_SPEED = 0.00018;
const ACTIVE_LINE_COLOR = "#b36a67";
const HOVER_LINE_COLOR = "#946363";

const clusterPalette = [
  { fill: "#c89a4a", selected: "#efbf72", glow: "rgba(239, 191, 114, 0.24)", edge: "rgba(118, 134, 164, 0.16)", label: "#f4efe6", frontLabel: "#fffaf2" },
  { fill: "#6f95c4", selected: "#8cb3e2", glow: "rgba(140, 179, 226, 0.2)", edge: "rgba(118, 134, 164, 0.16)", label: "#eef3f9", frontLabel: "#f8fbff" },
  { fill: "#5e978d", selected: "#7db6aa", glow: "rgba(125, 182, 170, 0.18)", edge: "rgba(118, 134, 164, 0.16)", label: "#e8efec", frontLabel: "#f3faf7" },
  { fill: "#6886ab", selected: "#87a6cd", glow: "rgba(135, 166, 205, 0.19)", edge: "rgba(118, 134, 164, 0.16)", label: "#edf2f7", frontLabel: "#f9fbff" }
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getClusterColor(cluster: string) {
  let hash = 0;

  for (let index = 0; index < cluster.length; index += 1) {
    hash = (hash * 33 + cluster.charCodeAt(index)) >>> 0;
  }

  return clusterPalette[hash % clusterPalette.length];
}

function shortExcerpt(content: string) {
  const compact = content.replace(/^#.*$/gm, "").replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/\s+/g, " ").trim();
  return compact ? compact.slice(0, 120) : "Empty note.";
}

function buildAdjacency(edges: { source: string; target: string }[]) {
  const adjacency = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, new Set());
    }

    if (!adjacency.has(edge.target)) {
      adjacency.set(edge.target, new Set());
    }

    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  return adjacency;
}

function buildDepthMap(rootId: string | null, adjacency: Map<string, Set<string>>) {
  const depths = new Map<string, number>();

  if (!rootId) {
    return depths;
  }

  depths.set(rootId, 0);
  const queue = [{ id: rootId, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || current.depth >= 2) {
      continue;
    }

    for (const neighbor of adjacency.get(current.id) ?? []) {
      if (depths.has(neighbor)) {
        continue;
      }

      const nextDepth = current.depth + 1;
      depths.set(neighbor, nextDepth);
      queue.push({ id: neighbor, depth: nextDepth });
    }
  }

  return depths;
}

function normalizeVector(point: { x: number; y: number; z: number }) {
  const length = Math.hypot(point.x, point.y, point.z) || 1;
  return {
    x: point.x / length,
    y: point.y / length,
    z: point.z / length
  };
}

function rotatePoint(point: { x: number; y: number; z: number }, rotationX: number, rotationY: number) {
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);
  const x1 = point.x * cosY + point.z * sinY;
  const z1 = -point.x * sinY + point.z * cosY;

  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);
  const y2 = point.y * cosX - z1 * sinX;
  const z2 = point.y * sinX + z1 * cosX;

  return {
    x: x1,
    y: y2,
    z: z2
  };
}

function inverseRotatePoint(point: { x: number; y: number; z: number }, rotationX: number, rotationY: number) {
  const cosX = Math.cos(-rotationX);
  const sinX = Math.sin(-rotationX);
  const y1 = point.y * cosX - point.z * sinX;
  const z1 = point.y * sinX + point.z * cosX;

  const cosY = Math.cos(-rotationY);
  const sinY = Math.sin(-rotationY);

  return {
    x: point.x * cosY + z1 * sinY,
    y: y1,
    z: -point.x * sinY + z1 * cosY
  };
}

export function GraphView({ notes, links, selectedNote, onSelectNote, onOpenLinkedNote, onOpenEditor, onCreateNoteAtPoint, onDeleteNote }: GraphViewProps) {
  const graph = useMemo(() => buildSphericalVaultGraph(notes, links), [links, notes]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [lockedNodeId, setLockedNodeId] = useState<string | null>(selectedNote ? `note:${selectedNote.id}` : ROOT_NODE_ID);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [rotationX, setRotationX] = useState(-0.18);
  const [rotationY, setRotationY] = useState(0.24);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isStandaloneApp, setIsStandaloneApp] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 768px)").matches;
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const hoverPauseRef = useRef(false);
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);

  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node] as const)), [graph.nodes]);
  const adjacency = useMemo(() => buildAdjacency(graph.edges), [graph.edges]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery(searchInput.trim().toLowerCase());
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateMode = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateMode);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as DeferredInstallPrompt);
    };

    const onAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsStandaloneApp(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      mediaQuery.removeEventListener("change", updateMode);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let lastTime = performance.now();

    const tick = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      if (!draggingRef.current && !hoverPauseRef.current && !composer) {
        setRotationY((value) => value + delta * AUTO_ROTATE_SPEED);
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [composer]);

  const searchMatchNode = useMemo(() => {
    if (!query) {
      return null;
    }

    return (
      graph.nodes.find((node) => node.noteId && node.label.toLowerCase() === query) ??
      graph.nodes.find((node) => node.noteId && node.label.toLowerCase().startsWith(query)) ??
      graph.nodes.find((node) => node.noteId && node.label.toLowerCase().includes(query)) ??
      null
    );
  }, [graph.nodes, query]);

  const activeNodeId = hoveredNodeId ?? searchMatchNode?.id ?? lockedNodeId ?? ROOT_NODE_ID;
  const neighborhoodDepths = useMemo(() => buildDepthMap(activeNodeId, adjacency), [activeNodeId, adjacency]);
  const neighborhood = useMemo(() => new Set(neighborhoodDepths.keys()), [neighborhoodDepths]);

  const projectedNodes = useMemo(() => {
    return graph.nodes
      .map<ProjectedNode>((node) => {
        const point = normalizeVector({
          x: node.position[0],
          y: node.position[1],
          z: node.position[2]
        });
        const rotated = rotatePoint(point, rotationX, rotationY);
        const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - rotated.z);
        const screenX = SPHERE_CENTER_X + rotated.x * SPHERE_RADIUS * perspective;
        const screenY = SPHERE_CENTER_Y + rotated.y * SPHERE_RADIUS * perspective;
        const baseRadius = node.type === "root" ? 12 : node.isHub ? 8.5 : node.type === "ghost" ? 4.2 : 5.2;

        return {
          id: node.id,
          label: node.label,
          noteId: node.noteId,
          type: node.type,
          cluster: node.cluster,
          isHub: node.isHub,
          x: screenX,
          y: screenY,
          z: rotated.z,
          scale: perspective,
          radius: baseRadius * perspective
        };
      })
      .sort((left, right) => left.z - right.z);
  }, [graph.nodes, rotationX, rotationY]);

  const projectedNodeById = useMemo(() => new Map(projectedNodes.map((node) => [node.id, node] as const)), [projectedNodes]);

  const filteredNodeIds = useMemo(() => {
    if (!query) {
      return new Set(graph.nodes.map((node) => node.id));
    }

    const ids = new Set(graph.nodes.filter((node) => node.label.toLowerCase().includes(query)).map((node) => node.id));

    if (searchMatchNode?.id) {
      ids.add(searchMatchNode.id);
      for (const neighbor of adjacency.get(searchMatchNode.id) ?? []) {
        ids.add(neighbor);
      }
    }

    return ids;
  }, [adjacency, graph.nodes, query, searchMatchNode]);

  const previewNode = activeNodeId ? nodeById.get(activeNodeId) ?? null : null;
  const previewNote = previewNode?.noteId ? notes.find((note) => note.id === previewNode.noteId) ?? null : null;

  const connectedNotes = useMemo(() => {
    if (!previewNote) {
      return [];
    }

    const connectedIds = new Set<string>();
    for (const link of links) {
      if (link.sourceNoteId === previewNote.id) {
        connectedIds.add(link.targetNoteId);
      }
      if (link.targetNoteId === previewNote.id) {
        connectedIds.add(link.sourceNoteId);
      }
    }

    return notes.filter((note) => connectedIds.has(note.id));
  }, [links, notes, previewNote]);

  const connectedGraphNodes = useMemo(() => {
    if (!previewNode) {
      return [];
    }

    const connectedIds = new Set<string>();
    for (const edge of graph.edges) {
      if (edge.source === previewNode.id) {
        connectedIds.add(edge.target);
      } else if (edge.target === previewNode.id) {
        connectedIds.add(edge.source);
      }
    }

    return graph.nodes.filter((node) => connectedIds.has(node.id));
  }, [graph.edges, graph.nodes, previewNode]);

  const handleNodeClick = (nodeId: string) => {
    setLockedNodeId(nodeId);
    setHoveredNodeId(null);

    const node = nodeById.get(nodeId);
    if (node?.noteId) {
      onSelectNote(node.noteId);
    }
  };

  const handlePanelOpen = () => {
    if (!previewNode) {
      return;
    }

    if (previewNote) {
      onSelectNote(previewNote.id);
      onOpenEditor();
      return;
    }

    if (previewNode.type === "ghost") {
      onOpenLinkedNote(previewNode.label);
    }
  };

  const openComposerAt = (clientX: number, clientY: number, graphX: number, graphY: number, graphZ = 0) => {
    setComposer({
      x: clientX,
      y: clientY,
      graphX,
      graphY,
      graphZ,
      title: "",
      connectToTitle: previewNote?.title ?? selectedNote?.title
    });
  };

  const getSpherePositionFromPointer = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();

    if (!rect) {
      return inverseRotatePoint({ x: 0, y: 0, z: 1 }, rotationX, rotationY);
    }

    const sphereRadiusPx = Math.min(rect.width * 0.3, rect.height * 0.42) * scale;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * 0.42;
    const normalizedX = clamp((clientX - centerX) / sphereRadiusPx, -1, 1);
    const normalizedY = clamp((clientY - centerY) / sphereRadiusPx, -1, 1);
    const distanceSq = normalizedX * normalizedX + normalizedY * normalizedY;
    const visibleZ = Math.sqrt(Math.max(0.06, 1 - Math.min(1, distanceSq)));

    return normalizeVector(
      inverseRotatePoint(
        {
          x: normalizedX,
          y: normalizedY,
          z: visibleZ
        },
        rotationX,
        rotationY
      )
    );
  };

  const safeTopStyle = {
    top: isMobile ? "calc(env(safe-area-inset-top, 0px) + 12px)" : undefined
  } as const;
  const mobileHeaderOffset = showInstallHelp ? "calc(env(safe-area-inset-top, 0px) + 122px)" : "calc(env(safe-area-inset-top, 0px) + 12px)";
  const topBarStyle = isMobile ? { top: mobileHeaderOffset } : safeTopStyle;
  const installSheetStyle = {
    top: "calc(env(safe-area-inset-top, 0px) + 12px)"
  } as const;
  const mobilePanelStyle = {
    bottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)"
  } as const;

  const handleInstall = async () => {
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isAndroid = /android/i.test(window.navigator.userAgent);

    if (isStandaloneApp) {
      toast.message("Already installed");
      return;
    }

    if (deferredInstallPrompt) {
      await deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredInstallPrompt(null);
      }
      return;
    }

    if (isIos) {
      setShowInstallHelp(true);
      return;
    }

    if (isAndroid) {
      toast.message("On Android, use the browser menu and choose Install app or Add to Home screen.");
      return;
    }

    toast.message("Use your browser menu to install this app if the prompt does not appear.");
  };

  return (
    <section className="relative min-h-[100dvh] overflow-hidden rounded-[32px] border border-white/6 bg-[#050811] sm:min-h-[90vh]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(123,192,255,0.12),transparent_22%),radial-gradient(circle_at_78%_18%,rgba(255,196,120,0.1),transparent_18%),radial-gradient(circle_at_48%_75%,rgba(117,216,190,0.08),transparent_24%),linear-gradient(180deg,rgba(10,15,28,0.82),rgba(4,7,15,0.96))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] [background-size:180px_180px]" />
      <div className="pointer-events-none absolute inset-x-[8%] top-[20%] h-[42%] rounded-full bg-[radial-gradient(circle,rgba(120,150,255,0.1),transparent_66%)] blur-3xl" />

      {showInstallHelp ? (
        <div style={installSheetStyle} className="absolute inset-x-4 z-30 sm:hidden">
          <div className="rounded-[24px] border border-white/12 bg-[#030617]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-7 text-white">On iPhone, tap Share and choose Add to Home Screen.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className="inline-flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/6 text-sm text-slate-200 transition hover:bg-white/10"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div style={topBarStyle} className="absolute inset-x-3 z-20 flex items-start justify-between gap-3 sm:inset-x-5 sm:top-5">
        <h1 className="px-1 pt-1 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">Vault</h1>

        <div className="flex min-w-0 items-center gap-2">
          {!isStandaloneApp ? (
            <button
              type="button"
              onClick={() => {
                void handleInstall();
              }}
              className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-2 text-xs font-medium text-slate-100 shadow-[0_20px_56px_rgba(0,0,0,0.2)] backdrop-blur-xl transition hover:bg-white/8 sm:px-4 sm:text-sm sm:backdrop-blur-2xl"
            >
              Install
            </button>
          ) : null}

          <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-slate-950/34 px-3 py-2 shadow-[0_20px_56px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:backdrop-blur-2xl">
            <Search className="size-4 text-slate-500" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search notes"
              className="h-auto min-w-[92px] border-0 bg-transparent px-0 py-0 text-sm focus:border-0 sm:min-w-[200px]"
            />
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="graph-canvas absolute inset-0 touch-none"
        onWheel={(event) => {
          event.preventDefault();
          const delta = clamp(Math.abs(event.deltaY) / 420, 0.02, 0.08);
          setScale((value) => clamp(Number((value - Math.sign(event.deltaY) * delta).toFixed(3)), MIN_SCALE, MAX_SCALE));
        }}
      >
        <svg
          viewBox={`0 0 ${VIEWPORT_WIDTH} ${VIEWPORT_HEIGHT}`}
          className="h-full w-full"
          onPointerDown={(event) => {
            activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (activePointersRef.current.size === 1) {
              draggingRef.current = true;
              pointerRef.current = { x: event.clientX, y: event.clientY };
            } else if (activePointersRef.current.size === 2) {
              draggingRef.current = false;
              const points = Array.from(activePointersRef.current.values());
              pinchDistanceRef.current = Math.hypot(points[0]!.x - points[1]!.x, points[0]!.y - points[1]!.y);
            }
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (activePointersRef.current.has(event.pointerId)) {
              activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
            }

            if (activePointersRef.current.size === 2) {
              const points = Array.from(activePointersRef.current.values());
              const distance = Math.hypot(points[0]!.x - points[1]!.x, points[0]!.y - points[1]!.y);

              if (pinchDistanceRef.current !== null) {
                const delta = clamp((distance - pinchDistanceRef.current) / 280, -0.08, 0.08);
                setScale((value) => clamp(Number((value + delta).toFixed(3)), MIN_SCALE, MAX_SCALE));
              }

              pinchDistanceRef.current = distance;
              return;
            }

            if (!draggingRef.current || !pointerRef.current) {
              return;
            }

            const deltaX = event.clientX - pointerRef.current.x;
            const deltaY = event.clientY - pointerRef.current.y;
            pointerRef.current = { x: event.clientX, y: event.clientY };

            setRotationY((value) => value + deltaX * 0.0062);
            setRotationX((value) => clamp(value + deltaY * 0.0042, -0.78, 0.78));
          }}
          onPointerUp={(event) => {
            activePointersRef.current.delete(event.pointerId);
            if (activePointersRef.current.size < 2) {
              pinchDistanceRef.current = null;
            }
            if (activePointersRef.current.size === 0) {
              draggingRef.current = false;
              pointerRef.current = null;
            } else if (activePointersRef.current.size === 1) {
              const remaining = Array.from(activePointersRef.current.values())[0] ?? null;
              draggingRef.current = true;
              pointerRef.current = remaining;
            }
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerLeave={() => {
            if (!draggingRef.current) {
              setHoveredNodeId(null);
            }
          }}
          onDoubleClick={(event) => {
            if (event.target !== event.currentTarget) {
              return;
            }

            const spherePoint = getSpherePositionFromPointer(event.clientX, event.clientY);
            openComposerAt(event.clientX, event.clientY, spherePoint.x, spherePoint.y, spherePoint.z);
          }}
        >
          <g transform={`translate(${VIEWPORT_WIDTH * (1 - scale) * 0.5} ${VIEWPORT_HEIGHT * (1 - scale) * 0.5}) scale(${scale})`}>
            {graph.edges.map((edge) => {
              const source = projectedNodeById.get(edge.source);
              const target = projectedNodeById.get(edge.target);

              if (!source || !target) {
                return null;
              }

              const sourceDepth = neighborhoodDepths.get(edge.source) ?? null;
              const targetDepth = neighborhoodDepths.get(edge.target) ?? null;
              const activeDepth = Math.max(sourceDepth ?? 9, targetDepth ?? 9);
              const highlighted = neighborhood.size > 0 ? neighborhood.has(edge.source) && neighborhood.has(edge.target) : false;
              const palette = getClusterColor(nodeById.get(edge.source)?.cluster ?? "Vault");
              const meanDepth = (source.z + target.z) * 0.5;
              const frontFactor = clamp((meanDepth + 1) / 2, 0, 1);

              if (!highlighted && frontFactor < 0.26) {
                return null;
              }

              const stroke = highlighted ? (activeDepth <= 1 ? ACTIVE_LINE_COLOR : HOVER_LINE_COLOR) : palette.edge;
              const opacity = highlighted ? (activeDepth <= 1 ? 0.76 : 0.34) : 0.015 + frontFactor * 0.045;
              const width = highlighted ? (activeDepth <= 1 ? 1.85 : 1.02) : 0.42;

              return <line key={`${edge.source}-${edge.target}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={stroke} strokeOpacity={opacity} strokeWidth={width} />;
            })}

            {projectedNodes.map((node) => {
              const baseNode = nodeById.get(node.id);
              if (!baseNode) {
                return null;
              }

              const palette =
                node.id === ROOT_NODE_ID
                  ? { fill: "#d0a156", selected: "#f0c16e", glow: "rgba(240,193,110,0.28)", label: "#f4ede1", frontLabel: "#fff9ef" }
                  : baseNode.type === "ghost"
                    ? { fill: "#6a8fb8", selected: "#88afd8", glow: "rgba(136,175,216,0.2)", label: "#edf2f7", frontLabel: "#fbfdff" }
                    : getClusterColor(baseNode.cluster);
              const selected = node.id === activeNodeId;
              const hovered = node.id === hoveredNodeId;
              const depth = neighborhoodDepths.get(node.id) ?? null;
              const visibleByQuery = filteredNodeIds.has(node.id);
              const frontFactor = clamp((node.z + 1) / 2, 0, 1);
              const radius = node.radius * (selected ? 1.16 : hovered ? 1.08 : depth === 1 ? 1.03 : 1);
              const nodeOpacity = !visibleByQuery ? 0.06 : selected ? 1 : hovered ? 0.92 : depth === 1 ? 0.8 : depth === 2 ? 0.46 : 0.12 + frontFactor * 0.42;
              const haloOpacity = selected ? 0.28 : hovered ? 0.14 : depth === 1 ? 0.08 : 0.02;
              const showLabel = selected || hovered || depth === 1 || (baseNode.isHub && frontFactor > 0.62) || (visibleByQuery && frontFactor > 0.8 && node.radius > 5.5);
              const labelOpacity = selected ? 1 : hovered ? 0.96 : depth === 1 ? 0.84 : 0.42 + frontFactor * 0.42;
              const labelColor = selected || frontFactor > 0.72 ? palette.frontLabel : palette.label;
              const nodeFill = selected ? palette.selected : hovered ? palette.selected : palette.fill;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x} ${node.y})`}
                  className="cursor-pointer"
                  onMouseEnter={() => {
                    hoverPauseRef.current = true;
                    setHoveredNodeId(node.id);
                  }}
                  onMouseLeave={() => {
                    hoverPauseRef.current = false;
                    setHoveredNodeId(null);
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleNodeClick(node.id);
                  }}
                >
                  <circle r={Math.max(radius * 2.1, 12)} fill="transparent" />
                  <circle r={radius * 1.8} fill={palette.glow} opacity={haloOpacity} />
                  <circle r={radius} fill={nodeFill} fillOpacity={nodeOpacity} />
                  {showLabel ? (
                    <g transform={`translate(${radius + 8} ${-Math.max(2, radius * 0.25)})`} opacity={labelOpacity}>
                      <rect x={-6} y={-13} rx={11} width={node.label.length * 5.8 + 14} height={22} fill="rgba(3,7,18,0.78)" stroke="rgba(255,255,255,0.06)" />
                      <text fill={labelColor} fontSize={isMobile ? "10.5" : "10"} fontWeight="600" dominantBaseline="middle">
                        {node.label}
                      </text>
                    </g>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div
        style={isMobile ? { bottom: "calc(env(safe-area-inset-bottom, 0px) + 118px)" } : undefined}
        className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 sm:bottom-4"
      >
        <button
          type="button"
          onClick={() => {
            const defaultPoint = inverseRotatePoint({ x: 0, y: 0, z: 1 }, rotationX, rotationY);
            openComposerAt(window.innerWidth / 2 - 150, window.innerHeight - 180, defaultPoint.x, defaultPoint.y, defaultPoint.z);
          }}
          className="rounded-full border border-white/10 bg-slate-950/58 px-5 py-3 text-sm font-medium text-slate-100 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition hover:bg-slate-950/80"
        >
          <span className="inline-flex items-center gap-2">
            <Plus className="size-4" />
            New note
          </span>
        </button>
      </div>

      {previewNode ? (
        <div
          style={isMobile ? { ...mobilePanelStyle, left: "50%", transform: "translateX(-50%)", width: "min(76vw, 284px)" } : undefined}
          className="absolute inset-x-3 z-20 rounded-[30px] border border-white/10 bg-slate-950/58 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl max-sm:inset-x-auto max-sm:max-h-[18vh] max-sm:min-h-[132px] max-sm:overflow-hidden max-sm:rounded-[24px] max-sm:p-3.5 md:inset-x-auto md:bottom-4 md:left-4 md:w-[340px] md:backdrop-blur-2xl"
        >
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
            {previewNode.id === ROOT_NODE_ID ? "Vault core" : previewNode.type === "ghost" ? "Linked idea" : "Selected note"}
          </p>
          <h2 className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.04em] text-white max-sm:text-[1.1rem] sm:text-2xl">{previewNode.label}</h2>

          <p className="mt-4 text-[15px] leading-8 text-slate-300 max-sm:mt-2 max-sm:text-[12px] max-sm:leading-5">
            {previewNode.id === ROOT_NODE_ID
              ? "The vault core anchors the network and helps you move into nearby notes."
              : previewNote
                ? (isMobile ? shortExcerpt(previewNote.content).slice(0, 48) : shortExcerpt(previewNote.content))
                : "This linked idea has not been expanded into a full note yet."}
          </p>

          {(previewNode.id === ROOT_NODE_ID ? connectedGraphNodes.length > 0 : connectedNotes.length > 0) ? (
            <div className="mt-4 max-sm:mt-2">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 max-sm:text-[9px]">Connected notes</p>
              <div className="mt-3 flex flex-wrap gap-2 max-sm:mt-2">
                {(previewNode.id === ROOT_NODE_ID ? connectedGraphNodes.slice(0, isMobile ? 2 : 4).map((node) => ({ id: node.id, title: node.label, nodeId: node.id })) : connectedNotes.slice(0, isMobile ? 2 : 4).map((note) => ({ id: note.id, title: note.title, nodeId: `note:${note.id}` }))).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNodeClick(item.nodeId)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/8 max-sm:px-2.5 max-sm:py-1 max-sm:text-[10px]"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2 max-sm:mt-2">
            <button
              type="button"
              onClick={handlePanelOpen}
              className="rounded-full border border-cyan-300/18 bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-100 transition hover:bg-cyan-300/20 max-sm:px-2.5 max-sm:py-1 max-sm:text-[10px]"
            >
              <span className="inline-flex items-center gap-1.5">
                <ArrowLeft className="size-3.5" />
                {isMobile ? "Open" : "Open note"}
              </span>
            </button>
            {previewNote ? (
              <button
                type="button"
                onClick={() => {
                  void onDeleteNote(previewNote.id);
                }}
                className="rounded-full border border-red-400/18 bg-red-400/10 px-3 py-1.5 text-xs text-red-100 transition hover:bg-red-400/20 max-sm:px-2.5 max-sm:py-1 max-sm:text-[10px]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Trash2 className="size-3.5" />
                  {isMobile ? "Del" : "Delete"}
                </span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {composer ? (
        <div
          className="fixed z-40 w-[280px] rounded-[26px] border border-white/10 bg-slate-950/74 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl max-sm:inset-x-4 max-sm:bottom-[calc(env(safe-area-inset-bottom,0px)+28px)] max-sm:top-auto max-sm:w-auto"
          style={{
            left: isMobile ? undefined : Math.min(composer.x, window.innerWidth - 304),
            top: isMobile ? undefined : Math.min(composer.y, window.innerHeight - 180)
          }}
        >
          <p className="text-sm font-semibold text-white">Quick capture</p>
          <p className="mt-1 text-xs text-slate-500">Press Enter to place a new note into the sphere.</p>
          <Input
            autoFocus
            value={composer.title}
            onChange={(event) => setComposer((value) => (value ? { ...value, title: event.target.value } : value))}
            placeholder="Note title"
            className="mt-3"
            onKeyDown={async (event) => {
              if (event.key === "Escape") {
                setComposer(null);
                return;
              }

              if (event.key === "Enter" && composer.title.trim()) {
                event.preventDefault();
                setIsCreating(true);
                await onCreateNoteAtPoint(composer.title.trim(), { x: composer.graphX, y: composer.graphY, z: composer.graphZ }, composer.connectToTitle);
                setIsCreating(false);
                setComposer(null);
              }
            }}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setComposer(null)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/8">
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!composer.title.trim()) {
                  return;
                }

                setIsCreating(true);
                await onCreateNoteAtPoint(composer.title.trim(), { x: composer.graphX, y: composer.graphY, z: composer.graphZ }, composer.connectToTitle);
                setIsCreating(false);
                setComposer(null);
              }}
              className="rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
