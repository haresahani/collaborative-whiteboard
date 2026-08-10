import { APIRequestContext } from "@playwright/test";

export class AssetsApi {
  constructor(private request: APIRequestContext) {}

  async uploadAsset(boardId: string, fileBuffer: Buffer, fileName: string) {
    return this.request.post(`/api/assets/upload`, {
      multipart: {
        boardId,
        file: {
          name: fileName,
          mimeType: "image/png",
          buffer: fileBuffer,
        },
      },
    });
  }
}
