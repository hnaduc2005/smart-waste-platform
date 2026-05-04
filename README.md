<div align="center">
  <a href="https://github.com/your-username/smart-waste-platform" target="_blank">
    <img src="./assets/chatBot.png" width="90" alt="Logo" />
  </a>

  <h1>EcoCycle Website</h1>

  <p>
    <img src="https://img.shields.io/badge/Java_Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" alt="Spring Boot" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/YOLOv11-FF9900?style=for-the-badge&logo=python&logoColor=white" alt="YOLOv11" />
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  </p>

  <img src="./assets/bg-3.webp" width="95%" alt="Banner" />
</div>

## 💡 Tổng quan

**Smart Waste Platform** là một nền tảng quản lý rác thải thông minh và mạnh mẽ, được xây dựng trên kiến trúc Microservices, React và tích hợp AI, thiết kế để tối ưu hóa quy trình thu gom và phân loại rác thải. Với trọng tâm là sự hiệu quả và thân thiện với người dùng, nền tảng cho phép quản lý toàn diện từ việc nhận diện rác, theo dõi quá trình thu gom đến hệ thống đổi thưởng một cách liền mạch. 

Các tính năng chính bao gồm:

## ✨ Tính năng

- **🔐 Xác thực Người dùng & Phân quyền Truy cập:** Đăng nhập bảo mật và hệ thống phân quyền chi tiết (người dùng, nhân viên thu gom, doanh nghiệp, quản trị viên) đảm bảo hệ thống và dữ liệu chỉ được truy cập bởi đúng đối tượng.
- **🌍 Quản lý & Điều phối Thu gom:** Tạo mới, xem, cập nhật và quản lý các yêu cầu thu gom. Phân công nhiệm vụ cho đội ngũ một cách dễ dàng, giúp tất cả các bên liên quan luôn nắm bắt được tiến độ và nâng cao tính trách nhiệm.
- **🔍 Nhận diện & Phân loại bằng AI:** Tích hợp trí tuệ nhân tạo (AI Waste Classifier) để tự động nhận diện và phân loại rác thải chính xác, giúp người dùng và hệ thống xử lý rác hiệu quả hơn.
- **📄 Thống kê & Bảng điều khiển (Analytics):** Quản lý khối lượng dữ liệu lớn và cung cấp các báo cáo chuyên sâu thông qua biểu đồ cùng một trang quản trị (Admin Dashboard) toàn diện để theo dõi sự phát triển của nền tảng.
- **🎯 Tối ưu hóa & Sẵn sàng Mở rộng:** Được xây dựng bằng kiến trúc Microservices và đóng gói bằng Docker, hệ thống được tối ưu hóa cho tốc độ và sự ổn định, đảm bảo khả năng vận hành mượt mà ở quy mô lớn (Production-Ready).
- **🎁 Hệ thống Điểm thưởng & Linh hoạt:** Khuyến khích người dùng tham gia bảo vệ môi trường thông qua hệ thống tích điểm và đổi thưởng (Reward System), đồng thời cung cấp các giải pháp quản lý linh hoạt cho các đối tác doanh nghiệp.
- **📱 Thiết kế Tương thích (Responsive Design):** Trải nghiệm Smart Waste Platform trên mọi thiết bị với thiết kế giao diện tự động thích ứng với nhiều kích thước màn hình khác nhau.

Cho dù bạn là một người dùng cá nhân muốn góp phần bảo vệ môi trường, một nhân viên thu gom hay một doanh nghiệp đối tác, Smart Waste Platform là công cụ hoàn hảo để theo dõi và quản lý vòng tuần hoàn của rác thải một cách dễ dàng. ♻️

## 👩💻 Công nghệ Sử dụng (Tech Stack)

- **Java 21 & Spring Boot**: Ngôn ngữ và framework lõi để xây dựng hệ thống kiến trúc Microservices backend (bao gồm Auth, Collection, Reward, User, Enterprise, Analytics, Admin...).
- **Spring Cloud**: Cung cấp hạ tầng quan trọng cho Microservices bao gồm API Gateway, Service Discovery và Config Server.
- **React 19 & Vite**: Bộ đôi hoàn hảo để xây dựng giao diện web Frontend (Dashboard) với tốc độ khởi động nhanh và hiệu năng cao.
- **TypeScript**: Sử dụng trên toàn bộ Frontend để tăng cường tính an toàn dữ liệu và dễ dàng bảo trì.
- **Python**: Môi trường chính để phát triển dịch vụ Trí tuệ nhân tạo (`waste-classifier`) nhằm phân loại rác thải tự động.
- **Docker & Kubernetes**: Nền tảng đóng gói (containerization) và điều phối để triển khai các microservices ở môi trường cục bộ (`docker-compose`) cũng như thực tế.

## 📖 Nguồn dữ liệu & Thư viện Tích hợp (Sources and Libraries)

- [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/): Thư viện bản đồ tương tác để theo dõi và quản lý vị trí các điểm thu gom rác thải.
- [Recharts](https://recharts.org/): Công cụ vẽ biểu đồ chuyên nghiệp để trực quan hóa dữ liệu thống kê, báo cáo trên Admin Dashboard.
- [Firebase](https://firebase.google.com/): Dịch vụ phụ trợ (BaaS) được tích hợp ở Frontend hỗ trợ các tính năng xác thực và thời gian thực.
- [Axios](https://axios-http.com/): Thư viện xử lý các luồng gọi API giao tiếp mượt mà giữa Frontend React và hệ thống Backend Spring Boot.
- [Bootstrap 5](https://getbootstrap.com/): Framework UI giúp xây dựng giao diện tương thích (responsive) nhanh chóng và đồng bộ.

## 📦 Bắt đầu nhanh (Getting Started)

Để thiết lập và chạy dự án này trên môi trường cục bộ (local), hãy làm theo các bước dưới đây.

### 🚀 Yêu cầu hệ thống (Prerequisites)

- **Docker Desktop** và **Docker Compose** (Cách khuyến nghị và nhanh nhất để khởi chạy toàn bộ hệ thống Microservices, Database, Kafka).
- **Java Development Kit (JDK) 21** và **Maven** (Nếu bạn muốn chỉnh sửa và phát triển Backend độc lập).
- **Node.js** (v18.x trở lên) và **npm** (Dành cho việc chỉnh sửa và phát triển Frontend).
- **Python 3.10+** (Dành cho việc phát triển dịch vụ AI `waste-classifier`).

## 🛠️ Cài đặt & Khởi chạy (Installation)

1. **Clone mã nguồn dự án:**

   ```bash
   git clone https://github.com/your-username/smart-waste-platform.git
   cd smart-waste-platform
   ```

2. **Khởi chạy toàn bộ hệ thống bằng Docker Compose (Khuyến nghị):**
   
   Cách này sẽ tự động tải các dependencies, build image và khởi động toàn bộ Frontend, Backend, AI service cùng các cơ sở dữ liệu (PostgreSQL, Redis, Kafka, Zookeeper).

   ```bash
   cd infrastructure/docker
   docker-compose up -d --build
   ```

3. **Phát triển Frontend độc lập (Tuỳ chọn):**
   
   Nếu bạn chỉ muốn code giao diện, hãy mở một Terminal mới và trỏ vào thư mục `frontend`:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Biên dịch Backend (Tuỳ chọn):**
   
   Nếu bạn có thay đổi ở mã nguồn Java, hãy biên dịch toàn bộ các module bằng lệnh:

   ```bash
   cd backend
   mvn clean install
   ```

## 📖 Cách sử dụng (Usage)

### ✔ Truy cập ứng dụng (Running the app)

Sau khi hệ thống khởi động thành công (đặc biệt là qua Docker), bạn có thể truy cập nền tảng và các công cụ quản trị qua các đường dẫn sau:

- **Ứng dụng Frontend (Người dùng & Admin):** Mở trình duyệt và truy cập [http://localhost:5173](http://localhost:5173).
- **Eureka Discovery Server:** Theo dõi trạng thái (Health Check) của các microservices tại [http://localhost:8761](http://localhost:8761).
- **API Gateway (Bộ định tuyến Backend):** Hoạt động tại cổng [http://localhost:8080](http://localhost:8080).
- **PgAdmin (Quản lý Database):** Truy cập tại [http://localhost:5050](http://localhost:5050) *(Tài khoản: admin@ecocycle.vn / Mật khẩu: admin)*.

### 🔥 Tài liệu API (API Documentation)

Hệ thống sử dụng Spring Boot cho các microservices. Sau khi các dịch vụ khởi động hoàn tất, tài liệu API (Swagger/OpenAPI) chi tiết cho từng dịch vụ có thể được truy cập thông qua API Gateway hoặc trực tiếp tại các cổng dịch vụ gốc (ví dụ: Auth Service tại `http://localhost:8081/swagger-ui.html`, Collection Service tại `http://localhost:8083/swagger-ui.html`).
