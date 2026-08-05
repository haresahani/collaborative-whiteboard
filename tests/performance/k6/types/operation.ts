export interface CRDTOperation {
  opId: string;
  boardId: string;
  type: string;
  actorId: string;
  lamport: number;
  createdAt: string;
  payload: Record<string, unknown>;
}
