export const THRESHOLDS = {
  SMOKE: {
    http_req_duration: ["p(95)<300"],
    "http_req_failed{expected_response:true}": ["rate<0.01"],
    ws_connecting: ["p(95)<500"],
  },
  LOAD: {
    http_req_duration: ["p(95)<1200", "p(99)<2000"],
    "http_req_failed{expected_response:true}": ["rate<0.02"],
    ws_connecting: ["p(95)<1000"],
  },
  STRESS: {
    http_req_duration: ["p(95)<3000"],
    "http_req_failed{expected_response:true}": ["rate<0.05"],
  },
  SPIKE: {
    http_req_duration: ["p(95)<5000"],
    "http_req_failed{expected_response:true}": ["rate<0.10"],
  },
  SOAK: {
    http_req_duration: ["p(95)<1000"],
    "http_req_failed{expected_response:true}": ["rate<0.01"],
  },
};
