
CREATE DATABASE auth_db;
CREATE DATABASE user_db;
CREATE DATABASE collection_db;
CREATE DATABASE reward_db;
CREATE DATABASE notification_db;
CREATE DATABASE ecocycle_analytics;
CREATE DATABASE ecocycle_enterprise;

GRANT ALL PRIVILEGES ON DATABASE auth_db TO ecocycle;
GRANT ALL PRIVILEGES ON DATABASE user_db TO ecocycle;
GRANT ALL PRIVILEGES ON DATABASE collection_db TO ecocycle;
GRANT ALL PRIVILEGES ON DATABASE reward_db TO ecocycle;
GRANT ALL PRIVILEGES ON DATABASE notification_db TO ecocycle;
GRANT ALL PRIVILEGES ON DATABASE ecocycle_analytics TO ecocycle;
GRANT ALL PRIVILEGES ON DATABASE ecocycle_enterprise TO ecocycle;
