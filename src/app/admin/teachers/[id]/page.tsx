import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getTeacherAccount, getTeacherById } from "@/mocks/teachers";
import { TeacherAccountActions } from "./TeacherAccountActions";
import styles from "./page.module.css";
export const metadata: Metadata = { title:"Hồ sơ giáo viên | Quản trị" };
function Field({label,children}:{label:string;children:React.ReactNode}){return <div className={styles.item}><dt>{label}</dt><dd>{children||"—"}</dd></div>}
async function TeacherProfile({params}:{params:Promise<{id:string}>}) {
 const {id}=await params; const teacher=await getTeacherById(id); if(!teacher)notFound(); const account=await getTeacherAccount(id); if(!account)notFound();
 const accountLabel=account.status==="active"?"Đang hoạt động":account.status==="locked"?"Đã khóa":"Chờ kích hoạt";
 return <><PageHeader title={teacher.fullName} subtitle={`Mã ${teacher.teacherCode} · Tài khoản ${account.username}`} actions={<><Button href={`/admin/teachers/${id}/edit`}>Sửa hồ sơ</Button><Button href="/admin/teachers">Về danh sách</Button></>}/>
 <section className={styles.card}><div className={styles.grid}><Field label="Trạng thái tài khoản"><span className={styles.tag}>{accountLabel}</span></Field><Field label="Trạng thái làm việc">{teacher.employmentStatus==="working"?"Đang làm việc":"Ngừng làm việc"}</Field><Field label="Email">{teacher.email}</Field><Field label="Số điện thoại">{teacher.phoneNumber}</Field><Field label="Ngày sinh">{teacher.dateOfBirth}</Field><Field label="Giới tính">{teacher.gender==="female"?"Nữ":teacher.gender==="male"?"Nam":teacher.gender==="other"?"Khác":""}</Field><Field label="Ngày bắt đầu">{teacher.startDate}</Field><Field label="Địa chỉ">{teacher.address}</Field><Field label="Chuyên môn">{teacher.specialization}</Field><Field label="Bằng cấp">{teacher.qualification}</Field><Field label="Chứng chỉ">{teacher.certificates.join(", ")}</Field><Field label="Ghi chú">{teacher.note}</Field></div></section>
 <section className={styles.card}><h2>Quản lý tài khoản</h2><p>Tên đăng nhập: <strong>{account.username}</strong>. Email chỉ dùng cho quy trình mời/kích hoạt, không phải tên đăng nhập.</p><TeacherAccountActions id={id} status={account.status}/><p>Phiên bản hiện tại chỉ mô phỏng trạng thái tài khoản; chưa gửi email, tạo mật khẩu hoặc xác thực đăng nhập thật.</p></section>
 </>;
}
export default function TeacherProfilePage({params}:{params:Promise<{id:string}>}) {return <Suspense fallback={<p>Đang tải hồ sơ giáo viên...</p>}><TeacherProfile params={params}/></Suspense>;}
