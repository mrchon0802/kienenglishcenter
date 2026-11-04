import { revalidatePath } from "next/cache";

/** Gọi sau mỗi thay đổi dữ liệu để mọi trang admin và học sinh tải lại dữ liệu mới. */
export function revalidateEverything() {
  revalidatePath("/admin", "layout");
  revalidatePath("/student", "layout");
}
