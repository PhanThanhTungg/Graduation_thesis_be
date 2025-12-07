-- 1. Thêm cột mới cho phép NULL trước
ALTER TABLE "questions" ADD COLUMN "user_id" TEXT;

-- 2. Gán giá trị mặc định cho dữ liệu cũ (chọn 1 user hợp lệ)
UPDATE "questions"
SET "user_id" = (
    SELECT id FROM "user" ORDER BY id LIMIT 1
);

-- 3. Đặt lại thành NOT NULL sau khi đã cập nhật
ALTER TABLE "questions"
ALTER COLUMN "user_id" SET NOT NULL;

-- 4. Thêm khóa ngoại
ALTER TABLE "questions" ADD CONSTRAINT "questions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
