export const THRESHOLDS = {
  SMOKE: {
    http_req_duration: ["p(95)<300"],
    http_req_failed: ["rate<0.01"],
    ws_connecting: ["p(95)<500"],
  },
  LOAD: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.02"],
    ws_connecting: ["p(95)<800"],
  },
  STRESS: {
    http_req_duration: ["p(95)<1500"],
    http_req_failed: ["rate<0.05"],
  },
  SPIKE: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.10"],
  },
  SOAK: {
    http_req_duration: ["p(95)<600"],
    http_req_failed: ["rate<0.01"],
  },
};
