module Api
  module V1
    class HealthController < ApplicationController
      def show
        ActiveRecord::Base.connection_pool.with_connection { |connection| connection.execute("SELECT 1") }
        render json: { data: { status: "ok" }, meta: { request_id: request.request_id } }
      rescue ActiveRecord::ConnectionNotEstablished, ActiveRecord::StatementInvalid
        render json: {
          error: { code: "database_unavailable", message: "Service temporarily unavailable", details: {} },
          meta: { request_id: request.request_id }
        }, status: :service_unavailable
      end
    end
  end
end
