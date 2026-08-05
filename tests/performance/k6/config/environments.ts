export const ENV = {
  API_BASE_URL: __ENV.API_URL || "http://127.0.0.1:1234",
  WS_BASE_URL:
    __ENV.WS_URL || "ws://127.0.0.1:3001/socket.io/?EIO=4&transport=websocket",
  JWT_SECRET:
    __ENV.JWT_SECRET || "mock_jwt_secret_for_tests_only_32_chars_long",
};

export const TIMEOUTS = {
  HTTP_REQUEST: "10s",
  WS_CONNECT: "10s",
};
