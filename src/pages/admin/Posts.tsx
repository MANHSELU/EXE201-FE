import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";

interface Author { _id: string; fullName: string; email: string; role: string; }
interface Post {
  _id: string;
  authorId: Author;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectedReason?: string;
  images?: string[];
  likes: string[];
  comments: { _id: string }[];
  createdAt: string;
}

const IC = "material-icons-outlined";
const ROLE_COLOR: Record<string, string> = {
  STUDENT: "bg-green-100 text-green-700",
  LECTURER: "bg-blue-100 text-blue-700",
  ADMIN: "bg-orange-100 text-orange-700",
};
const ROLE_LABEL: Record<string, string> = { STUDENT: "Học viên", LECTURER: "Giảng viên", ADMIN: "Quản trị" };
const AVATAR_BG: Record<string, string> = { STUDENT: "#10B981", LECTURER: "#3B82F6", ADMIN: "#FF7043" };

const STATUS_CONFIG = {
  PENDING:  { label: "Chờ duyệt",  cls: "bg-amber-100 text-amber-700",  icon: "pending" },
  APPROVED: { label: "Đã duyệt",   cls: "bg-green-100 text-green-700",  icon: "check_circle" },
  REJECTED: { label: "Từ chối",    cls: "bg-red-100 text-red-700",      icon: "cancel" },
};

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(date).toLocaleDateString("vi-VN");
}

const AdminPosts: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("PENDING");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; postId: string }>({ open: false, postId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState<string>("");
  const [lightboxImg, setLightboxImg] = useState<string>("");
  const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000";
  const getImgUrl = (img: string) => img.startsWith("http") ? img : `${baseUrl}${img}`;

  const fetchPosts = async (status?: string) => {
    try {
      const q = status ? `?status=${status}` : "";
      const res = await api.get(`/admin/posts${q}`);
      setPosts(res.data.data || []);
    } catch { setPosts([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(filterStatus); }, [filterStatus]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try { await api.patch(`/admin/posts/${id}/approve`); fetchPosts(filterStatus); } catch { /**/ } finally { setProcessing(""); }
  };

  const handleReject = async () => {
    setProcessing(rejectModal.postId);
    try {
      await api.patch(`/admin/posts/${rejectModal.postId}/reject`, { reason: rejectReason });
      setRejectModal({ open: false, postId: "" });
      setRejectReason("");
      fetchPosts(filterStatus);
    } catch { /**/ } finally { setProcessing(""); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa bài viết này vĩnh viễn?")) return;
    setProcessing(id);
    try { await api.delete(`/admin/posts/${id}`); fetchPosts(filterStatus); } catch { /**/ } finally { setProcessing(""); }
  };


  return (
    <AdminLayout title="" breadcrumb={[{ path: "/admin/dashboard", label: "Trang chủ" }, { label: "Kiểm duyệt bài viết" }]}>
      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer" onClick={() => setLightboxImg("")}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
            onClick={() => setLightboxImg("")}>
            <span className={IC} style={{ color: "white", fontSize: 24 }}>close</span>
          </button>
          <img src={lightboxImg} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Reject modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-2">Từ chối bài viết</h3>
            <p className="text-sm text-gray-500 mb-4">Nhập lý do từ chối (tuỳ chọn, sẽ hiển thị cho người đăng):</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="VD: Nội dung không phù hợp..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => { setRejectModal({ open: false, postId: "" }); setRejectReason(""); }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Hủy</button>
              <button onClick={handleReject} disabled={!!processing}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition font-medium">
                Từ chối bài viết
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition" title="Quay lại">
          <span className={IC} style={{ color: "#111827", fontSize: 28 }}>arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kiểm duyệt bài viết</h1>
          <p className="text-sm text-gray-500">Duyệt bài viết từ học viên và giảng viên</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition ${
                filterStatus === s ? `${cfg.cls} border-transparent shadow-sm` : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}>
              <span className={IC} style={{ fontSize: 16 }}>{cfg.icon}</span>
              {cfg.label}
            </button>
          );
        })}
        <button onClick={() => setFilterStatus("")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition ${
            filterStatus === "" ? "bg-gray-100 text-gray-700 border-transparent shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
          }`}>
          <span className={IC} style={{ fontSize: 16 }}>list</span>
          Tất cả
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
          <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "3px solid #FED7AA", borderTopColor: "#FF7043" }} />
          <span className="text-sm">Đang tải...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
          <span className={IC} style={{ fontSize: 56, opacity: 0.3 }}>dynamic_feed</span>
          <p className="font-medium text-gray-500">Không có bài viết nào</p>
        </div>
      ) : (
        <div className="space-y-5 max-w-4xl mx-auto">
          {posts.map((post) => {
            const sCfg = STATUS_CONFIG[post.status];
            const isProc = processing === post._id;
            return (
              <div key={post._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Author row */}
                <div className="flex items-start gap-4 px-6 pt-6 pb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-base"
                    style={{ background: AVATAR_BG[post.authorId?.role] || "#6B7280" }}>
                    {post.authorId?.fullName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-[15px]">{post.authorId?.fullName}</span>
                      <span className="text-sm text-gray-400">{post.authorId?.email}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[post.authorId?.role] || "bg-gray-100 text-gray-600"}`}>
                        {ROLE_LABEL[post.authorId?.role] || post.authorId?.role}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sCfg.cls}`}>
                        <span className={`${IC} align-middle`} style={{ fontSize: 12, marginRight: 2 }}>{sCfg.icon}</span>
                        {sCfg.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-5">
                  <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  {post.images && post.images.length > 0 && (
                    <div className={`mt-3 grid gap-1.5 rounded-xl overflow-hidden ${post.images.length === 1 ? "grid-cols-1" : post.images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                      {post.images.map((img, i) => (
                        <img
                          key={i}
                          src={getImgUrl(img)}
                          alt=""
                          className="w-full object-cover cursor-pointer hover:opacity-90 transition rounded-lg border border-gray-100"
                          style={{ maxHeight: post.images!.length === 1 ? 400 : 200 }}
                          onClick={() => setLightboxImg(getImgUrl(img))}
                        />
                      ))}
                    </div>
                  )}
                  {post.status === "REJECTED" && post.rejectedReason && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      Lý do từ chối: {post.rejectedReason}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className={IC} style={{ fontSize: 14 }}>favorite_border</span>
                      {post.likes.length} thích
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={IC} style={{ fontSize: 14 }}>chat_bubble_outline</span>
                      {post.comments.length} bình luận
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex-wrap">
                  {post.status === "PENDING" && (
                    <>
                      <button onClick={() => handleApprove(post._id)} disabled={isProc}
                        className="inline-flex items-center gap-1.5 px-5 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 transition">
                        <span className={IC} style={{ fontSize: 16 }}>check_circle</span>
                        Duyệt
                      </button>
                      <button onClick={() => { setRejectModal({ open: true, postId: post._id }); setRejectReason(""); }}
                        disabled={isProc}
                        className="inline-flex items-center gap-1.5 px-5 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50 transition">
                        <span className={IC} style={{ fontSize: 16 }}>cancel</span>
                        Từ chối
                      </button>
                    </>
                  )}
                  {post.status === "APPROVED" && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 border border-green-200 text-sm font-semibold rounded-lg">
                      <span className={IC} style={{ fontSize: 16 }}>check_circle</span>
                      Đã duyệt
                    </span>
                  )}
                  {post.status === "REJECTED" && (
                    <button onClick={() => handleApprove(post._id)} disabled={isProc}
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 transition">
                      <span className={IC} style={{ fontSize: 16 }}>check_circle</span>
                      Duyệt lại
                    </button>
                  )}
                  <button onClick={() => handleDelete(post._id)} disabled={isProc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition ml-auto">
                    <span className={IC} style={{ fontSize: 14 }}>delete_outline</span>
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPosts;
