export interface CreateBoardRequest {
  title: string;
}

export interface BoardResponse {
  id: string;
  title: string;
  version: number;
  createdAt: string;
}
