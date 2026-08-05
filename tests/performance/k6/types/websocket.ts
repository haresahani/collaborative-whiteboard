export interface WSCursorMovePayload {
  x: number;
  y: number;
  tool?: string;
  sentTs?: number;
}

export interface WSJoinBoardPayload {
  boardId: string;
}
