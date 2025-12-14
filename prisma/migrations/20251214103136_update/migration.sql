-- AlterTable
ALTER TABLE "LessonReviewSetting" ADD COLUMN     "difficulty" "Difficulty" NOT NULL DEFAULT 'medium',
ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "admin_setting" (
    "id" TEXT NOT NULL,
    "web_title" TEXT,
    "web_favicon" TEXT,
    "web_description" TEXT,
    "web_keywords" TEXT[],
    "web_author" TEXT,
    "web_copyright" TEXT,
    "learning_steps" DOUBLE PRECISION[],
    "last_step_from_learning_to_review" INTEGER NOT NULL DEFAULT 5,
    "ini_interval" INTEGER NOT NULL DEFAULT 2,
    "ini_easy_interval" INTEGER NOT NULL DEFAULT 4,
    "leech_threshold" INTEGER NOT NULL DEFAULT 8,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "admin_setting_pkey" PRIMARY KEY ("id")
);
