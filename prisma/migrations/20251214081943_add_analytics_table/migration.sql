-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "timezone" VARCHAR(100) NOT NULL,
    "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue_change" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "new_students" INTEGER NOT NULL DEFAULT 0,
    "students_change" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active_courses" INTEGER NOT NULL DEFAULT 0,
    "courses_change" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating_change" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "total_users" INTEGER NOT NULL DEFAULT 0,
    "total_courses" INTEGER NOT NULL DEFAULT 0,
    "total_lessons" INTEGER NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "chart_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_date_idx" ON "analytics"("date");

-- CreateIndex
CREATE INDEX "analytics_timezone_idx" ON "analytics"("timezone");

-- CreateIndex
CREATE INDEX "analytics_user_id_idx" ON "analytics"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_date_timezone_user_id_key" ON "analytics"("date", "timezone", "user_id");
