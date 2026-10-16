import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ padding: "48px 24px", textAlign: "center" }}>
      <h1>Không tìm thấy trang</h1>
      <p>Trang bạn mở không tồn tại hoặc đã được chuyển đi.</p>
      <Link href="/admin">Về trang tổng quan</Link>
    </main>
  );
}