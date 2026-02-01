export interface DiagramActor {
  id: string;
  name: string;
}

export interface DiagramMessage {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  type?: 'sync' | 'async' | 'reply';
  order: number;
}

export interface DiagramData {
  actors: DiagramActor[];
  messages: DiagramMessage[];
}

// 3D Visual Node mapped from data
export interface VisualNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'actor' | 'activation';
  actorId?: string;
}

// 3D Visual Edge mapped from data
export interface VisualEdge {
  id: string;
  source: { x: number; y: number };
  target: { x: number; y: number };
  label: string;
  active: boolean; // For animation
}

export enum AppMode {
  STATIC = 'STATIC',
  DYNAMIC = 'DYNAMIC'
}

export enum InputMode {
  UPLOAD = 'UPLOAD',
  TEXT = 'TEXT',
  MANUAL = 'MANUAL'
}
