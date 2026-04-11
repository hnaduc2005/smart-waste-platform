-- Script tự động tạo tất cả databases cho từng Microservice khi PostgreSQL khởi động
-- Chạy tự động nhờ volume mount vào /docker-entrypoint-initdb.d/

CREATE DATABASE auth_db;
CREATE DATABASE user_db;
CREATE DATABASE collection_db;
CREATE DATABASE reward_db;
CREATE DATABASE notification_db;

GRANT ALL PRIVILEGES ON DATABASE auth_db TO ecocycle;
GRANT ALL PRIVILEGES ON DATABASE user_db TO ecocycle;
GRANT ALL PRIVILEGES ON DATABASE collection_db TO ecocycle;
GRANT ALL PRIVILEGES ON DATABASE reward_db TO ecocycle;
GRANT ALL PRIVILEGES ON DATABASE notification_db TO ecocycle;
