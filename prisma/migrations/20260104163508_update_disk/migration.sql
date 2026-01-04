-- AlterTable
ALTER TABLE "disk_space_teacher" ALTER COLUMN "to" SET DEFAULT NOW() + INTERVAL '30 days';

-- AlterTable
ALTER TABLE "video_lesson" ADD COLUMN     "size" INTEGER DEFAULT 0;
