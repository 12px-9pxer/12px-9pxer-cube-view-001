export const CUBE_MAP_STEPS = 6;
export const CUBE_MAP_UNIT = 12;

export const CUBE_MAP_LABELS = {
  x: ["썬루프", "자동주차", "네비게이션", "평행주차", "안장온열", "자율주행"],
  y: ["경차", "소형차", "중형차", "세단", "SUV", "밴"],
  z: ["출근길", "퇴근길", "아이픽업", "여행", "출장", "주차"],
};

export const CUBE_MAP_PERSONAS = [
  {
    id: 0,
    name: "김민지",
    color: "#4F73E3",
    nodes: [
      { x: 2, y: 4, z: 0 },
      { x: 2, y: 4, z: 2 },
      { x: 3, y: 4, z: 2 },
      { x: 4, y: 4, z: 2 },
      { x: 0, y: 4, z: 3 },
    ],
  },
  {
    id: 1,
    name: "박준호",
    color: "#E8534A",
    nodes: [
      { x: 5, y: 3, z: 4 },
      { x: 4, y: 3, z: 4 },
      { x: 5, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      { x: 5, y: 3, z: 0 },
    ],
  },
  {
    id: 2,
    name: "이수진",
    color: "#F09530",
    nodes: [
      { x: 1, y: 0, z: 5 },
      { x: 2, y: 0, z: 5 },
      { x: 3, y: 0, z: 5 },
      { x: 1, y: 1, z: 5 },
      { x: 2, y: 1, z: 5 },
    ],
  },
  {
    id: 3,
    name: "최동욱",
    color: "#3BAF7C",
    nodes: [
      { x: 0, y: 4, z: 3 },
      { x: 1, y: 4, z: 3 },
      { x: 0, y: 3, z: 3 },
      { x: 1, y: 3, z: 3 },
      { x: 2, y: 4, z: 3 },
    ],
  },
  {
    id: 4,
    name: "정미영",
    color: "#8B67D8",
    nodes: [
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 1, y: 1, z: 1 },
      { x: 2, y: 1, z: 1 },
      { x: 2, y: 2, z: 0 },
    ],
  },
  {
    id: 5,
    name: "한승민",
    color: "#1ABBC8",
    nodes: [
      { x: 5, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      { x: 5, y: 2, z: 1 },
      { x: 4, y: 2, z: 1 },
      { x: 5, y: 3, z: 4 },
    ],
  },
  {
    id: 6,
    name: "오재원",
    color: "#E0673D",
    nodes: [
      { x: 2, y: 4, z: 2 },
      { x: 1, y: 5, z: 2 },
      { x: 2, y: 5, z: 3 },
      { x: 1, y: 5, z: 3 },
      { x: 0, y: 5, z: 3 },
    ],
  },
  {
    id: 7,
    name: "류나영",
    color: "#5585A4",
    nodes: [
      { x: 5, y: 3, z: 4 },
      { x: 4, y: 3, z: 4 },
      { x: 5, y: 4, z: 4 },
      { x: 4, y: 4, z: 4 },
      { x: 5, y: 4, z: 3 },
    ],
  },
  {
    id: 8,
    name: "신혜린",
    color: "#D95884",
    nodes: [
      { x: 0, y: 4, z: 3 },
      { x: 1, y: 4, z: 3 },
      { x: 0, y: 5, z: 3 },
      { x: 1, y: 5, z: 3 },
      { x: 0, y: 4, z: 2 },
    ],
  },
  {
    id: 9,
    name: "김현우",
    color: "#9B7848",
    nodes: [
      { x: 1, y: 1, z: 5 },
      { x: 2, y: 1, z: 5 },
      { x: 3, y: 1, z: 5 },
      { x: 1, y: 2, z: 5 },
      { x: 2, y: 2, z: 4 },
    ],
  },
];

export function buildCubeMapOverview(personas = CUBE_MAP_PERSONAS) {
  const map = new Map();

  personas.forEach((persona) => {
    persona.nodes.forEach((node) => {
      const key = `${node.x},${node.y},${node.z}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          ...node,
          personaIds: new Set(),
          names: [],
          colors: [],
        });
      }

      const entry = map.get(key);
      if (!entry.personaIds.has(persona.id)) {
        entry.personaIds.add(persona.id);
        entry.names.push(persona.name);
        entry.colors.push(persona.color);
      }
    });
  });

  const nodes = [...map.values()].map((entry) => ({
    ...entry,
    count: entry.personaIds.size,
    personaIds: [...entry.personaIds],
  }));

  nodes.sort((a, b) => b.count - a.count || a.x - b.x || a.y - b.y || a.z - b.z);

  return {
    nodes,
    hotspots: nodes.filter((node) => node.count >= 2).slice(0, 3),
    maxCount: Math.max(...nodes.map((node) => node.count), 1),
  };
}
