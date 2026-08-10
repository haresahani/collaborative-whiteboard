import { check } from "k6";
import { RefinedResponse, ResponseType } from "k6/http";

export function checkHttpStatus(
  res: RefinedResponse<ResponseType>,
  expectedStatus = 200,
  label = "status is expected",
): boolean {
  return check(res, {
    [label]: (r) => r.status === expectedStatus,
  });
}

export function checkHasJsonField(
  res: RefinedResponse<ResponseType>,
  field: string,
): boolean {
  return check(res, {
    [`response has ${field}`]: (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body && body[field] !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
}
