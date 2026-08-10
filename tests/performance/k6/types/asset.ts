export interface AssetUploadInitRequest {
  boardId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface AssetUploadInitResponse {
  assetId: string;
  uploadUrl: string;
}
