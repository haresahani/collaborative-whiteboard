import { Board } from "./board.model";

export async function assertBoardAccess(boardId: string, userId: string) {
  return Board.findOne({
    _id: boardId,
    ownerId: userId,
  })
    .select("_id ownerId")
    .lean();
}
