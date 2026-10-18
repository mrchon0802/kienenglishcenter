import { Input } from "@/components/ui/Input";
import styles from "./MediaFields.module.css";

interface MediaFieldsProps {
  imageUrl: string;
  audioUrl: string;
  onChange: (patch: { imageUrl?: string; audioUrl?: string }) => void;
}

/**
 * Giai đoạn dùng dữ liệu mẫu: nhập đường dẫn (link) ảnh/âm thanh.
 * Khi có backend sẽ thay bằng nút tải file lên (Cloudinary hoặc S3).
 */
export function MediaFields({ imageUrl, audioUrl, onChange }: MediaFieldsProps) {
  return (
    <div className={styles.wrap}>
      <Input
        label="Hình ảnh (không bắt buộc)"
        type="url"
        value={imageUrl}
        placeholder="https://..."
        hint="Dán link ảnh minh họa cho câu hỏi."
        onChange={(e) => onChange({ imageUrl: e.target.value })}
      />
      <Input
        label="Âm thanh (không bắt buộc)"
        type="url"
        value={audioUrl}
        placeholder="https://..."
        hint="Dán link file nghe. Dùng cho câu hỏi nghe."
        onChange={(e) => onChange({ audioUrl: e.target.value })}
      />
    </div>
  );
}
