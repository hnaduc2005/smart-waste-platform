# Cẩm Nang Bảo Vệ Đồ Án: Smart Waste Platform

Tài liệu này mô tả chi tiết kiến trúc hệ thống và tổng hợp các câu hỏi phản biện mà giảng viên/hội đồng thường hay đặt ra đối với đồ án áp dụng thiết kế **Microservices**, kèm theo gợi ý trả lời dựa trên dự án Smart Waste Platform.

---

## 1. MÔ TẢ CHI TIẾT HỆ THỐNG (SYSTEM ARCHITECTURE)

Smart Waste Platform được thiết kế theo kiến trúc Microservices thuần túy, ảo hóa hoàn toàn bằng Docker. Bao gồm 18 tiến trình (services/containers).

### 1.1. Tầng Front-end & Cổng Giao Tiếp
- **Frontend** (ReactJS/Vite): Ứng dụng Single Page Application (SPA), hướng sự kiện trên UI.
- **API Gateway** (Spring Cloud Gateway): Cổng vào duy nhất từ internet. Vai trò:
  - Định tuyến (Routing) request tới đúng Microservice.
  - Xử lý CORS và lọc bảo mật sơ bộ trước khi vô hệ thống.

### 1.2. Tầng Quản Lý Hạ Tầng (Infrastructure - Spring Cloud)
- **Discovery Server (Eureka)**: Sổ danh bạ đăng ký dịch vụ. Mọi service phải báo tên và IP cho nó, để Gateway và các Frontend Client khác biết đường tìm nhau.
- **Config Server (Spring Cloud Config)**: Quản lý và phân phối cấu hình tập trung (YAML/Properties) tới toàn bộ Microservices để dễ dàng cập nhật môi trường.

### 1.3. Tầng Nghiệp Vụ Cốt Lõi (Business Core - Spring Boot)
Chứa 8 service độc lập (mỗi service chạy ở một port riêng):
- `auth-service` (8081): Quản lý đăng nhập, JwtToken, phân quyền bằng Spring Security.
- `user-service` (8082): Quản lý profile người dùng.
- `collection-service` (8083): Quản lý tạo/nhận/điều phối lịch thu gom rác. Đây là service trọng tâm, có giao tiếp trực tiếp với AI.
- `reward-service` (8084): Logic tích điểm và xử lý đổi quà, voucher.
- `notification-service` (8085): Gửi thông báo đến user.
- `analytics-service` (8086): Xử lý tính toán thống kê bảng biểu.
- `enterprise-service` (8087): Dành cho đối tác doanh nghiệp, phương tiện.
- `admin-service` (8088): Đóng vai trò BFF (Backend-For-Frontend) tổng hợp số liệu để trả API riêng cho Admin Dashboard.

### 1.4. Tầng Dịch vụ Trí Tuệ Nhân Tạo (AI Service)
- `waste-classifier` (Python/FastAPI): Tiếp nhận hình ảnh và mô hình AI để trả về phân loại nhãn rác thải chuẩn xác.

### 1.5. Middleware & Cơ Sở Dữ Liệu
Hệ thống sử dụng cơ chế *Database-per-service* (mỗi service dùng một database/schema riêng) trên PostgreSQL gốc để đảm bảo nguyên lý Decoupling.
- **PostgreSQL**: DB vật lý chứa dữ liệu hệ thống.
- **Redis Cache**: Bộ nhớ đệm tốc độ cao, thường lưu JWT Token (Blacklist) hoặc để giảm tải việc đọc trực tiếp (như rank điểm thưởng).
- **Kafka & Zookeeper**: Trục xương sống điều phối sự kiện bất đồng bộ. Thay vì liên tục gọi API chéo lẫn nhau gây chết chùm, hệ thống bắn "Event" thông qua Kafka. Ví dụ: `collection-service` bắn sự kiện "Rác đã thu", `reward-service` tự động nghe và tự động cộng điểm.

---

## 2. NGÂN HÀNG CÂU HỎI VÀ GỢI Ý TRẢ LỜI CHO BUỔI BẢO VỆ

Dưới đây là các câu hỏi hóc búa thường lọt vào tầm ngắm của Hội đồng:

### Nhóm 01: Kiến Trúc (Architecture)

**Q1: Tại sao nhóm không code Monolithic (khối liền) cho dễ mà lại áp dụng Microservices? Lợi thế ở đây là gì?**
> **Trả lời:** Nền tảng cần phục vụ nhiều nhóm đối tượng: Users, Enterprise/Tài xế, AI Model, Admin. Khi dùng Monolithic, mỗi lần update AI hoặc chỉnh sửa Frontend Admin có thể làm chết tính năng tạo lịch thu gom rác của User hiện tại (single point of failure). Với Microservices, tính độc lập cực lớn. Ví dụ service Reward bị sập, app vẫn cho phép user đăng nhập và ghi nhận rác thải bình thường (nhờ Kafka xếp hàng lại lệnh). Hơn nữa, sau này có thể scale mở rộng độc lập (như module xử lý AI).

**Q2: Nếu áp dụng Microservices, làm sao em quản lý giao dịch trọn vẹn (Transaction)? Ví dụ thu gom rác xong thì phải cộng điểm, nếu sập giữa chừng thì sao?**
> **Trả lời:** Em sử dụng cơ chế **Event-Driven qua Kafka**. Thay vì giao dịch đồng bộ (phải thành công cùng lúc), em dùng kiến trúc Choreography. `collection-service` xử lý xong DB của nó, gửi sự kiện `collection-completed` vào Kafka. Kafka sẽ giữ Event đó. Nếu `reward-service` lúc đó bị chết, khi khởi động lại nó sẽ tự động đọc tiếp message chưa đọc từ Kafka và cộng điểm bù. Tránh được việc Request bị treo vòng tròn.

**Q3: Gateway của em có tác dụng gì? Nếu không có Gateway em gọi thẳng IP của service nội bộ được không?**
> **Trả lời:** Không có Gateway thì gọi IP trực tiếp vẫn được, CÓ ĐIỀU ở quy mô Microservices, frontend sẽ phải gánh mọi cái IP/Port (rất rủi ro bảo mật). Khi deploy lên server thật, IP bị thay đổi (dynamic config từ Docker/K8s). API Gateway che chở các Service bên trong, dùng chung một cổng duy nhất cho UI, đồng thời em có cấu hình tích hợp Discovery Server(Eureka) để phía Gateway tự mò ra IP mới của service thay vì hardcode bên Frontend.

### Nhóm 02: Giao Tiếp Của Dịch Vụ Mạng (Networking & Communication)

**Q4: Hệ thống gọi REST API bằng OpenFeign và qua Kafka, vậy theo em lúc nào thì dùng Feign (Đồng bộ), lúc nào thì dùng Kafka (Bất đồng bộ)?**
> **Trả lời:** Dùng **Feign Client (Đồng bộ)** khi kết quả là BẮT BUỘC để tiến hành luồng logic tiếp theo, hoặc để đọc thông tin. VD: Admin Dashboard gọi `admin-service`, và `admin-service` gọi Feign sang User & Analytics để gom thông tin trả ngay lập tức ra view HTML (BFF Pattern).
Dùng **Kafka (Bất đồng bộ)** khi xử lý nghiệp vụ dài, không yêu cầu phản hồi lập tức để ghi luồng. VD: Upload đơn rác thành công, gửi thông báo PUSH notification hoặc Mail (notification-service xử lý ngầm), người dùng không phải chờ màn hình xoay xoay.

**Q5: Giữa tầng Core Spring Boot Java và AI Python em kết nối ra sao?**
> **Trả lời:** Em đóng gói Python thành một API RESTful bằng FastAPI. Việc này giúp `collection-service` của Java tương tác qua giao thức HTTP tiêu chuẩn, ném request ảnh JSON sang, nhận về object phân tích. Cách này làm tính độc quyền ngôn ngữ bị phá vỡ, các công nghệ không bắt ép chung một framework.

### Nhóm 03: Bảo mật, Tối ưu & Database

**Q6: Token em quản lý ra sao trong kiến trúc vi dịch vụ này? Nếu User bị block, làm sao thu hồi lại JWT tức thời?**
> **Trả lời:** Tại Smart Waste, Token xác thực chạy độc lập (Stateless). Tuy nhiên để xử lý bài toán thu hồi token lập tức khi người dùng log out hoặc bị ban, em có sử dụng **Redis Cache** làm một cơ chế *Token Blacklist* (Danh sách đen). Mỗi request đi qua Auth-service hoặc Gateway, em check ID token trong Redis (Tốc độ mili-giây). Nếu nằm trong Blacklist -> chặn lập tức, không gây quá tải cho việc truy vấn DB Users.

**Q7: Dự án em có bao nhiêu database? Thế lỡ muốn join bảng lấy tên User của 1 Lịch Thu Gom thì code SQL sao?**
> **Trả lời:** Dự án tuân thủ triệt để nguyên lý *Database-per-Service*, em KHÔNG join bảng (SQL/Foreign key) liên schema. Ở `collection_db` em chỉ lưu `user_id`. Nếu cần xem chi tiết User của collection đó, em xử lý ở Tầng ứng dụng (Application Level), dùng Feign Client chọc sang `user-service` dựa trên `user_id` để ghép Data bằng Code, hoặc qua BFF (như Admin-service đang làm).

**Q8: Đồ án của em thiết kế nặng hạ tầng thế này, làm thế nào để em Deploy lên thực tế?**
> **Trả lời:** Toàn bộ em đã đóng gói thành `docker-compose`. Chỉ việc 1 câu lệnh `docker compose up -d` mọi môi trường (DB, Zookeeper, Kafka, Java, Python) sẽ dựng chung lên 1 server Ubuntu/Linux thống nhất theo đúng chuẩn network cô lập `ecocycle-network` như chạy thực tế trên production.

---
*Mẹo bảo vệ: Khi thuyết trình, các bạn hãy chủ động mở file `infrastructure/docker/docker-compose.yml` để trình bày bằng hình ảnh thực tế chạy code. Giảng viên luôn đánh giá điểm tuyệt đối nếu thí sinh chứng minh được mình am hiểu cấu trúc file orchestration này.*
