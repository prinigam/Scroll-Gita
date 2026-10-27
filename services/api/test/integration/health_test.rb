require "test_helper"
require "minitest/mock"

class HealthTest < ActionDispatch::IntegrationTest
  test "versioned health checks database and returns request ID" do
    get "/api/v1/health", headers: { "X-Request-Id" => "health-test-request" }
    assert_response :ok
    assert_equal "ok", response.parsed_body.dig("data", "status")
    assert_equal "health-test-request", response.parsed_body.dig("meta", "request_id")
  end

  test "unimplemented guide does not pretend to provide AI" do
    post "/api/v1/guide/ask", params: { question: "Sample question" }, as: :json
    assert_response :not_found
  end

  test "database outage returns structured service unavailable" do
    outage = ->(*) { raise ActiveRecord::ConnectionNotEstablished }
    ActiveRecord::Base.connection_pool.stub(:with_connection, outage) do
      get "/api/v1/health"
      assert_response :service_unavailable
      assert_equal "database_unavailable", response.parsed_body.dig("error", "code")
      assert response.parsed_body.dig("meta", "request_id").present?
    end
  end
end
