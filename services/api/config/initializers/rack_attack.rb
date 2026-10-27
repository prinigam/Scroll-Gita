# Production must configure a shared cache before multiple API processes are deployed.
Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
Rack::Attack.throttle("api/ip", limit: 120, period: 60) do |request|
  request.ip if request.path.start_with?("/api/v1/") && request.path != "/api/v1/health"
end
Rack::Attack.throttled_responder = lambda do |request|
  [429, { "content-type" => "application/json", "retry-after" => "60" }, [
    { error: { code: "rate_limited", message: "Please try again later", details: {} },
      meta: { request_id: request.env["action_dispatch.request_id"] } }.to_json
  ]]
end
