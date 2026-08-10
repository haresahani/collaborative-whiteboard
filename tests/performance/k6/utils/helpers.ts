export function handleSummary(data: any): Record<string, string> {
  return {
    stdout: textSummary(data),
  };
}

function textSummary(data: any): string {
  const httpReqs = data.metrics.http_reqs
    ? data.metrics.http_reqs.values.count
    : 0;
  const httpReqDuration = data.metrics.http_req_duration
    ? Math.round(data.metrics.http_req_duration.values["p(95)"])
    : 0;
  const httpReqFailed = data.metrics.http_req_failed
    ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2)
    : "0";

  return `
=================================================
k6 PERFORMANCE TEST SUMMARY REPORT
=================================================
Total HTTP Requests : ${httpReqs}
P95 Request Latency : ${httpReqDuration} ms
Failed Request Rate : ${httpReqFailed} %
=================================================
`;
}
