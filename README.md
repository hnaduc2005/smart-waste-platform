# Crowdsourced Waste Collection & Recycling Platform (EcoCycle)
Nền tảng kết nối người dân, doanh nghiệp tái chế và dịch vụ thu gom rác theo khu vực.

## 1. Tổng quan dự án

Quản lý rác thải đô thị tại Việt Nam đang đối mặt với nhiều thách thức như lịch thu gom không ổn định, tỷ lệ phân loại rác tại nguồn thấp và sự phối hợp rời rạc giữa người dân, đơn vị thu gom và doanh nghiệp tái chế. Trong khi đó, quy định bắt buộc phân loại rác tại nguồn từ năm 2025 đặt ra nhu cầu cấp thiết về một nền tảng số hỗ trợ kết nối, điều phối và giám sát toàn bộ quy trình thu gom – tái chế theo khu vực một cách hiệu quả và minh bạch.

### Vấn đề (Problems)
Hiện chưa có một hệ thống số hóa tập trung cho phép người dân báo cáo rác, theo dõi thu gom và khuyến khích phân loại đúng, đồng thời giúp doanh nghiệp tái chế và cơ quan quản lý tiếp cận dữ liệu vận hành theo thời gian thực. Việc thiếu công cụ điều phối và phân tích dữ liệu khiến hiệu quả thu gom thấp, chi phí tăng và làm giảm cơ hội phát triển kinh tế tuần hoàn.

### Các diễn viên chính (Primary Actors)
* Citizen
* Recycling Enterprise
* Collector
* Administrator

## 2. Yêu cầu chức năng (Functional Requirements)

### Citizen
* Báo cáo rác/tái chế cần thu gom (ảnh + GPS + mô tả).
* Theo dõi trạng thái thu gom của từng báo cáo (Pending / Accepted / Assigned / Collected).
* Thực hiện phân loại rác tại nguồn (chọn loại rác khi tạo báo cáo).
* Nhận điểm thưởng khi báo cáo hợp lệ và phân loại đúng.
* Xem lịch sử điểm thưởng và bảng xếp hạng theo khu vực.
* Gửi phản hồi hoặc khiếu nại khi việc thu gom không đúng cam kết.

### Recycling Enterprise
* Đăng ký và quản lý năng lực xử lý rác: Loại rác tiếp nhận/Công suất xử lý/Khu vực phục vụ.
* Nhận và quyết định tiếp nhận hoặc từ chối các yêu cầu thu gom trong phạm vi hoạt động.
* Xem danh sách yêu cầu thu gom được gợi ý ưu tiên xử lý dựa trên các tiêu chí cấu hình. (optional)
* Gán và điều phối yêu cầu thu gom cho Collector thuộc doanh nghiệp.
* Theo dõi tiến độ xử lý và trạng thái thu gom theo thời gian thực.
* Xem báo cáo khối lượng rác đã thu gom và tái chế theo loại/khu vực/thời gian.
* Tạo và cấu hình quy tắc tính điểm thưởng cho Citizen (theo loại rác, chất lượng báo cáo, thời gian xử lý…).

### Collector
* Nhận các yêu cầu thu gom được phân công từ Recycling Enterprise.
* Cập nhật trạng thái thu gom theo thời gian thực (Assigned / On the way / Collected).
* Xác nhận hoàn tất thu gom bằng hình ảnh và thông tin trạng thái.
* Xem lịch sử công việc và số lượng yêu cầu đã hoàn thành.

### Administrator
* Quản lý tài khoản và phân quyền.
* Giám sát hoạt động tổng thể của hệ thống.
* Tiếp nhận và giải quyết tranh chấp/khiếu nại.

### Tùy chọn: AI hỗ trợ phân loại rác (Decision Support):
* Input: ảnh rác do Citizen upload
* Output: gợi ý loại rác (Organic / Recyclable / Hazardous…)
* *(Người dùng xác nhận lại trước khi gửi).*

## 3. Tổng quan cấu trúc dự án
Nội dung chi tiết từng thư mục:

* `backend/`: Microservices (Spring Boot, Spring Cloud, Python AI).
* `frontend/`: Giao diện (Web Dashboard ReactJS, Mobile App Flutter).
* `infrastructure/`: Cấu hình Docker, Kubernetes, Database.
* `docs/`: Tài liệu OpenAPI, UML, Architecture.
* `scripts/`: Scripts khởi chạy dự án.
* `docker-compose.yml`: Triển khai cục bộ các service bằng docker-compose.