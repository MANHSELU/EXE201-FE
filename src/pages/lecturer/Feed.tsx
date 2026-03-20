import { useState, useEffect } from "react";
import api from "../../services/api";
import { connectSocket } from "../../services/socket";
import { useSearchParams } from "react-router-dom";
import LecturerHeader from "../../components/LecturerHeader";
import { useAuth } from "../../context/AuthContext";

const getImgUrl = (img: string) =>
  img.startsWith("http") ? img : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000"}${img}`;

interface Author { _id: string; fullName: string; role: string; }
interface Comment { _id: string; authorId: Author; content: string; images?: string[]; parentCommentId?: string; replyToName?: string; likes: string[]; createdAt: string; }
interface Post {
  _id: string;
  authorId: Author;
  content: string;
  images: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectedReason?: string;
  likes: string[];
  comments: Comment[];
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

const MOTIVATION_QUOTES = [
  { quote: "Mỗi buổi học đều là cơ hội để bạn tiến gần hơn đến mục tiêu! 🌱", author: "Smart Attendance" },
  { quote: "Điểm danh đầy đủ là bước đầu tiên để chinh phục môn học! ✨", author: "Smart Attendance" },
  { quote: "Hôm nay bạn đến lớp là đã chiến thắng chính mình rồi! 🌟", author: "Smart Attendance" },
  { quote: "Sự chăm chỉ của bạn hôm nay sẽ trả về thành quả ngày mai! 🚀", author: "Smart Attendance" },
  { quote: "Mỗi buổi có mặt là bạn đang đầu tư cho tương lai của mình! 📖", author: "Smart Attendance" },
  { quote: "Cố lên! Chỉ còn vài buổi nữa là hoàn thành kì học! ☀️", author: "Smart Attendance" },
  { quote: "Đừng bỏ lỡ buổi nào — mỗi tiết học đều quan trọng! 💪", author: "Smart Attendance" },
  { quote: "Đi học đều giúp bạn tự tin và nắm vững kiến thức! 🌍", author: "Smart Attendance" },
  { quote: "Bạn làm được! Hãy giữ vững phong độ điểm danh nhé! 💡", author: "Smart Attendance" },
  { quote: "Giảng viên tâm huyết tạo nên thế hệ sinh viên xuất sắc! 🎯", author: "Smart Attendance" },
];

const MOTIVATION_CSS = `
  .feed-motivation-card {
    background: linear-gradient(135deg, #FF7043 0%, #FFAB91 100%);
    border-radius: 16px;
    padding: 1rem 1.25rem;
    position: relative;
    overflow: visible;
    box-shadow: 0 4px 15px rgba(255, 112, 67, 0.25);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 16px;
  }
  .feed-motivation-card::before {
    content: '';
    position: absolute;
    top: -30px; right: -30px;
    width: 80px; height: 80px;
    background: rgba(255,255,255,0.15);
    border-radius: 50%;
  }
  .feed-motivation-card::after {
    content: '';
    position: absolute;
    bottom: -20px; left: -20px;
    width: 60px; height: 60px;
    background: rgba(255,255,255,0.1);
    border-radius: 50%;
  }
  .feed-running-mascot {
    flex-shrink: 0; width: 55px; height: 55px;
    position: relative; display: flex; align-items: center; justify-content: center;
  }
  .feed-mascot-body {
    position: relative;
    animation: feed-run-bounce 0.25s ease-in-out infinite;
  }
  .feed-mascot-emoji {
    font-size: 38px; display: block;
    filter: drop-shadow(0 3px 6px rgba(0,0,0,0.2));
  }
  @keyframes feed-run-bounce {
    0%, 100% { transform: translateY(0) rotate(-3deg); }
    50% { transform: translateY(-5px) rotate(3deg); }
  }
  .feed-mascot-legs {
    position: absolute; bottom: -8px; left: 50%;
    transform: translateX(-50%); display: flex; gap: 4px;
  }
  .feed-mascot-leg {
    width: 6px; height: 12px;
    background: linear-gradient(to bottom, #FFB74D, #FF9800);
    border-radius: 3px; transform-origin: top center;
  }
  .feed-mascot-leg-left { animation: feed-leg-left 0.12s ease-in-out infinite; }
  .feed-mascot-leg-right { animation: feed-leg-right 0.12s ease-in-out infinite; }
  @keyframes feed-leg-left {
    0%, 100% { transform: rotate(25deg); }
    50% { transform: rotate(-25deg); }
  }
  @keyframes feed-leg-right {
    0%, 100% { transform: rotate(-25deg); }
    50% { transform: rotate(25deg); }
  }
  .feed-floating-reactions {
    position: absolute; top: -10px; left: 0; right: 0; bottom: 0;
    pointer-events: none; overflow: visible;
  }
  .feed-reaction {
    position: absolute; font-size: 12px;
    animation: feed-float-reaction 2s ease-out infinite; opacity: 0;
  }
  .feed-reaction:nth-child(1) { left: 10%; animation-delay: 0s; }
  .feed-reaction:nth-child(2) { left: 25%; animation-delay: 0.4s; }
  .feed-reaction:nth-child(3) { left: 45%; animation-delay: 0.8s; }
  .feed-reaction:nth-child(4) { left: 65%; animation-delay: 1.2s; }
  .feed-reaction:nth-child(5) { left: 80%; animation-delay: 1.6s; }
  @keyframes feed-float-reaction {
    0% { opacity: 0; transform: translateY(30px) scale(0.5); }
    20% { opacity: 1; transform: translateY(15px) scale(1); }
    100% { opacity: 0; transform: translateY(-25px) scale(0.8); }
  }
  .feed-run-dust {
    position: absolute; left: -8px; bottom: 0;
    display: flex; flex-direction: column; gap: 3px;
  }
  .feed-dust {
    width: 8px; height: 8px;
    background: rgba(255,255,255,0.6); border-radius: 50%;
    animation: feed-dust-puff 0.4s ease-out infinite;
  }
  .feed-dust:nth-child(2) { animation-delay: 0.1s; width: 6px; height: 6px; }
  .feed-dust:nth-child(3) { animation-delay: 0.2s; width: 4px; height: 4px; }
  @keyframes feed-dust-puff {
    0% { opacity: 0.8; transform: translateX(0) scale(1); }
    100% { opacity: 0; transform: translateX(-15px) scale(0.3); }
  }
  .feed-motivation-text { flex: 1; min-width: 0; }
  .feed-quote-inline {
    font-size: 13px; font-weight: 600; color: white;
    line-height: 1.45; text-shadow: 0 1px 2px rgba(0,0,0,0.15);
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
    overflow: hidden; animation: feed-text-glow 2s ease-in-out infinite;
  }
  @keyframes feed-text-glow {
    0%, 100% { opacity: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.15); }
    50% { opacity: 0.85; text-shadow: 0 0 8px rgba(255,255,255,0.8), 0 0 15px rgba(255,255,255,0.5); }
  }
`;

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(date).toLocaleDateString("vi-VN");
}

const Avatar = ({ name, role, size = 40 }: { name?: string; role?: string; size?: number }) => (
  <div className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
    style={{ width: size, height: size, fontSize: size * 0.38, background: AVATAR_BG[role || "LECTURER"] || "#6B7280" }}>
    {name?.charAt(0)?.toUpperCase()}
  </div>
);

export default function LecturerFeed() {
  const { user } = useAuth();
  const [currentQuote] = useState(() => MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)]);
  const [secondQuote] = useState(() => {
    const others = MOTIVATION_QUOTES.filter(q => q.quote !== currentQuote.quote);
    return others[Math.floor(Math.random() * others.length)];
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<"feed" | "my">("feed");
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<{ postId: string; commentId: string; name: string } | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [commentImages, setCommentImages] = useState<Record<string, File[]>>({});
  const [commentImagePreviews, setCommentImagePreviews] = useState<Record<string, string[]>>({});

  const apiPrefix = "/lecturer";

  const fetchFeed = async () => {
    try { const res = await api.get(`${apiPrefix}/feed`); setPosts(res.data.data || []); } catch { setPosts([]); }
  };
  const fetchMyPosts = async () => {
    try { const res = await api.get(`${apiPrefix}/feed/my-posts`); setMyPosts(res.data.data || []); } catch { setMyPosts([]); }
  };

  const [searchParams] = useSearchParams();

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchFeed(), fetchMyPosts()]);
      setLoading(false);
      const postId = searchParams.get("postId");
      if (postId) {
        setTimeout(() => {
          const el = document.getElementById(`post-${postId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.style.boxShadow = "0 0 0 3px #FF7043";
            setTimeout(() => { el.style.boxShadow = ""; }, 2000);
            setOpenComments((prev) => ({ ...prev, [postId]: true }));
          }
        }, 300);
      }
    })();

    if (user?.id) {
      const socket = connectSocket(user.id);
      socket.on("feed-update", () => { fetchFeed(); fetchMyPosts(); });
      return () => { socket.off("feed-update"); };
    }
  }, [user?.id, searchParams]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedImages.length + files.length > 5) return alert("Tối đa 5 ảnh");
    setSelectedImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (idx: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("content", content);
      selectedImages.forEach((f) => fd.append("images", f));
      await api.post(`${apiPrefix}/feed/posts`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setContent("");
      setSelectedImages([]);
      setImagePreviews([]);
      setShowCreateModal(false);
      setSuccess("Bài viết đã gửi, chờ kiểm duyệt!");
      setTimeout(() => setSuccess(""), 4000);
      fetchMyPosts();
      setTab("my");
    } catch { /**/ } finally { setSubmitting(false); }
  };

  const handleLike = async (postId: string) => {
    try { await api.post(`${apiPrefix}/feed/posts/${postId}/like`); fetchFeed(); } catch { /**/ }
  };

  const handleCommentImageSelect = (postId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if ((commentImages[postId]?.length || 0) + files.length > 3) return alert("Tối đa 3 ảnh cho bình luận");
    setCommentImages((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), ...files] }));
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setCommentImagePreviews((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), ev.target?.result as string] }));
      reader.readAsDataURL(f);
    });
  };

  const removeCommentImage = (postId: string, idx: number) => {
    setCommentImages((prev) => ({ ...prev, [postId]: (prev[postId] || []).filter((_, i) => i !== idx) }));
    setCommentImagePreviews((prev) => ({ ...prev, [postId]: (prev[postId] || []).filter((_, i) => i !== idx) }));
  };

  const handleComment = async (postId: string) => {
    const c = commentInputs[postId]?.trim();
    const imgs = commentImages[postId] || [];
    if (!c && imgs.length === 0) return;
    try {
      const fd = new FormData();
      if (c) fd.append("content", c);
      if (replyTo && replyTo.postId === postId) {
        fd.append("parentCommentId", replyTo.commentId);
        fd.append("replyToName", replyTo.name);
      }
      imgs.forEach((f) => fd.append("images", f));
      await api.post(`${apiPrefix}/feed/posts/${postId}/comments`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      setCommentImages((prev) => ({ ...prev, [postId]: [] }));
      setCommentImagePreviews((prev) => ({ ...prev, [postId]: [] }));
      setReplyTo(null);
      fetchFeed();
    } catch { /**/ }
  };

  const handleCommentLike = async (postId: string, commentId: string) => {
    try { await api.post(`${apiPrefix}/feed/posts/${postId}/comments/${commentId}/like`); fetchFeed(); } catch { /**/ }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Xóa bài viết này?")) return;
    try { await api.delete(`${apiPrefix}/feed/posts/${postId}`); fetchFeed(); fetchMyPosts(); } catch { /**/ }
  };

  const displayPosts = tab === "feed" ? posts : myPosts;

  const renderPost = (post: Post) => {
    const isLiked = post.likes.includes(user?.id || "");
    const isOwn = post.authorId?._id === user?.id;
    const showComments = openComments[post._id];

    return (
      <div id={`post-${post._id}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4" style={{ transition: "box-shadow 0.3s" }}>
        <div className="flex items-start justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <Avatar name={post.authorId?.fullName} role={post.authorId?.role} size={42} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-[16px]">{post.authorId?.fullName}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[post.authorId?.role] || "bg-gray-100 text-gray-600"}`}>
                  {ROLE_LABEL[post.authorId?.role] || post.authorId?.role}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <span>{timeAgo(post.createdAt)}</span>
                <span>·</span>
                <span className={IC} style={{ fontSize: 14 }}>public</span>
                {post.status === "PENDING" && <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[11px] font-medium">Chờ duyệt</span>}
                {post.status === "REJECTED" && <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[11px] font-medium">Bị từ chối</span>}
              </div>
            </div>
          </div>
          {isOwn && (
            <button onClick={() => handleDelete(post._id)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition">
              <span className={IC} style={{ fontSize: 20 }}>more_horiz</span>
            </button>
          )}
        </div>

        <div className="px-4 pb-3">
          <p className="text-[16px] text-gray-900 leading-relaxed font-medium whitespace-pre-wrap">{post.content}</p>
          {post.images && post.images.length > 0 && (
            <div className={`mt-3 grid gap-1 rounded-lg overflow-hidden ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
              style={{ background: "#F3F4F6" }}>
              {post.images.map((img, i) => (
                <img key={i} src={getImgUrl(img)}
                  alt="" className="w-full object-contain cursor-pointer hover:opacity-95 transition"
                  style={{ maxHeight: 500 }}
                  onClick={() => setLightboxImg(getImgUrl(img))} />
              ))}
            </div>
          )}
          {post.status === "REJECTED" && post.rejectedReason && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              <span className="font-semibold">Lý do:</span> {post.rejectedReason}
            </div>
          )}
        </div>

        {post.status === "APPROVED" && (
          <>
            {(post.likes.length > 0 || post.comments.length > 0) && (
              <div className="flex items-center justify-between px-4 py-2 text-[13px] text-gray-500">
                {post.likes.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-[20px] h-[20px] rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="material-icons" style={{ fontSize: 12, color: "white" }}>thumb_up</span>
                    </div>
                    <span>{post.likes.length}</span>
                  </div>
                ) : <div />}
                {post.comments.length > 0 && (
                  <button onClick={() => setOpenComments((p) => ({ ...p, [post._id]: !p[post._id] }))} className="hover:underline">
                    {post.comments.length} bình luận
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center border-t border-gray-200 mx-4 py-1">
              <button onClick={() => handleLike(post._id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[14px] font-semibold transition hover:bg-gray-100 ${isLiked ? "text-orange-500" : "text-gray-600"}`}>
                <span className={IC} style={{ fontSize: 20 }}>thumb_up</span>
                Thích
              </button>
              <button onClick={() => setOpenComments((p) => ({ ...p, [post._id]: !p[post._id] }))}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[14px] font-semibold text-gray-600 transition hover:bg-gray-100">
                <span className={IC} style={{ fontSize: 20 }}>chat_bubble_outline</span>
                Bình luận
              </button>
            </div>

            {showComments && (() => {
              const topComments = post.comments.filter((c) => !c.parentCommentId);
              const getReplies = (cId: string) => post.comments.filter((c) => c.parentCommentId?.toString() === cId);

              const renderCommentBubble = (c: Comment, size: number) => {
                const liked = c.likes?.includes(user?.id || "");
                return (
                  <div className="flex items-start gap-2">
                    <Avatar name={c.authorId?.fullName} role={c.authorId?.role} size={size} />
                    <div className="flex-1 min-w-0">
                      <div className="relative inline-block max-w-[90%]">
                        <div className="bg-gray-100 rounded-2xl px-3 py-2">
                          <span className="font-semibold text-[13px] text-gray-900">{c.authorId?.fullName}</span>
                          {c.content && (
                            <p className="text-[14px] text-gray-800">
                              {c.replyToName && <span className="font-semibold text-blue-600 cursor-pointer hover:underline">{c.replyToName} </span>}
                              {c.content}
                            </p>
                          )}
                          {c.images && c.images.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {c.images.map((img, i) => (
                                <img key={i} src={getImgUrl(img)}
                                  alt="" className="rounded-lg cursor-pointer hover:opacity-90 transition object-contain"
                                  style={{ maxWidth: 200, maxHeight: 150, background: "#E5E7EB" }}
                                  onClick={() => setLightboxImg(getImgUrl(img))} />
                              ))}
                            </div>
                          )}
                        </div>
                        {c.likes?.length > 0 && (
                          <div className="absolute -bottom-2 right-1 flex items-center gap-0.5 bg-white rounded-full shadow px-1.5 py-0.5 border border-gray-100">
                            <span className="material-icons" style={{ fontSize: 12, color: "#EF4444" }}>favorite</span>
                            <span className="text-[11px] text-gray-500 font-medium">{c.likes.length}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-3">
                        <span className="text-[11px] text-gray-400">{timeAgo(c.createdAt)}</span>
                        <button onClick={() => handleCommentLike(post._id, c._id)}
                          className={`text-[12px] font-semibold transition ${liked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}>
                          Thích
                        </button>
                        <button onClick={() => setReplyTo({ postId: post._id, commentId: c.parentCommentId || c._id, name: c.authorId?.fullName })}
                          className="text-[12px] font-semibold text-gray-500 hover:text-orange-500 transition">
                          Trả lời
                        </button>
                      </div>
                    </div>
                  </div>
                );
              };

              const renderReplyInput = () => (
                <div className="mt-1.5 ml-10">
                  {commentImagePreviews[post._id]?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2 ml-9">
                      {commentImagePreviews[post._id].map((src, i) => (
                        <div key={i} className="relative group">
                          <img src={src} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-200 cursor-pointer" onClick={() => setLightboxImg(src)} />
                          <button onClick={() => removeCommentImage(post._id, i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <span className={IC} style={{ fontSize: 12 }}>close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Avatar name={user?.fullName} role={user?.role} size={28} />
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1 text-[11px] text-gray-400">
                        <span>Đang trả lời <strong className="text-gray-600">{replyTo?.name}</strong></span>
                        <button onClick={() => setReplyTo(null)} className="text-red-400 hover:text-red-500 ml-1">
                          <span className={IC} style={{ fontSize: 14 }}>close</span>
                        </button>
                      </div>
                      <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5">
                        <input
                          autoFocus
                          value={commentInputs[post._id] || ""}
                          onChange={(e) => setCommentInputs((p) => ({ ...p, [post._id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment(post._id)}
                          placeholder={`Trả lời ${replyTo?.name}...`}
                          className="flex-1 text-[13px] focus:outline-none bg-transparent"
                        />
                        <label className="text-gray-400 hover:text-green-500 cursor-pointer mx-1">
                          <span className={IC} style={{ fontSize: 16 }}>image</span>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleCommentImageSelect(post._id, e)} />
                        </label>
                        <button onClick={() => handleComment(post._id)} className="text-orange-500 hover:text-orange-600 ml-1">
                          <span className={IC} style={{ fontSize: 18 }}>send</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );

              return (
                <div className="px-4 pb-4 border-t border-gray-100">
                  {post.comments.length > 0 && (
                    <div className="pt-3 space-y-3">
                      {topComments.map((c) => {
                        const replies = getReplies(c._id);
                        const isReplyingHere = replyTo && replyTo.postId === post._id && replyTo.commentId === c._id;
                        return (
                          <div key={c._id}>
                            {renderCommentBubble(c, 32)}
                            {replies.length > 0 && (
                              <div className="ml-10 mt-1.5 space-y-1.5 border-l-2 border-gray-200 pl-3">
                                {replies.map((r) => (
                                  <div key={r._id}>{renderCommentBubble(r, 28)}</div>
                                ))}
                              </div>
                            )}
                            {isReplyingHere && renderReplyInput()}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {(!replyTo || replyTo.postId !== post._id) && (
                    <div className="mt-3">
                      {commentImagePreviews[post._id]?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2 ml-10">
                          {commentImagePreviews[post._id].map((src, i) => (
                            <div key={i} className="relative group">
                              <img src={src} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer" onClick={() => setLightboxImg(src)} />
                              <button onClick={() => removeCommentImage(post._id, i)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <span className={IC} style={{ fontSize: 12 }}>close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Avatar name={user?.fullName} role={user?.role} size={32} />
                        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
                          <input
                            value={commentInputs[post._id] || ""}
                            onChange={(e) => setCommentInputs((p) => ({ ...p, [post._id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment(post._id)}
                            placeholder="Viết bình luận..."
                            className="flex-1 text-[14px] focus:outline-none bg-transparent"
                          />
                          <label className="text-gray-400 hover:text-green-500 cursor-pointer mx-1">
                            <span className={IC} style={{ fontSize: 18 }}>image</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleCommentImageSelect(post._id, e)} />
                          </label>
                          <button onClick={() => handleComment(post._id)} className="text-orange-500 hover:text-orange-600 ml-1">
                            <span className={IC} style={{ fontSize: 20 }}>send</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F5", fontFamily: "'Inter', sans-serif" }}>
      <style>{MOTIVATION_CSS}</style>
      <LecturerHeader />

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setLightboxImg(null)}>
          <button onClick={() => setLightboxImg(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition">
            <span className={IC} style={{ fontSize: 28, color: "white" }}>close</span>
          </button>
          <img src={lightboxImg} alt="" className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Create post modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[420px] mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div />
              <h3 className="font-bold text-gray-900 text-lg">Tạo bài viết</h3>
              <button onClick={() => setShowCreateModal(false)} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                <span className={IC} style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={user?.fullName} role={user?.role} size={42} />
                <p className="font-semibold text-[15px] text-gray-900">{user?.fullName}</p>
              </div>
              <form onSubmit={handlePost}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  autoFocus
                  rows={4}
                  placeholder={`${user?.fullName?.split(" ").pop()} ơi, bạn đang nghĩ gì thế?`}
                  className="w-full text-gray-800 text-[16px] focus:outline-none resize-none placeholder-gray-400"
                />
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative group">
                        <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer" onClick={() => setLightboxImg(src)} />
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">
                          <span className={IC} style={{ fontSize: 14 }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-1">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-green-50 cursor-pointer transition">
                      <span className={IC} style={{ fontSize: 20, color: "#22C55E" }}>image</span>
                      <span className="text-[13px] font-medium text-gray-600">Ảnh</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                    </label>
                  </div>
                  <span className="text-[12px] text-gray-400">{selectedImages.length}/5 ảnh</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-gray-400 text-xs">
                  <span className={IC} style={{ fontSize: 14 }}>info</span>
                  Bài viết cần được kiểm duyệt trước khi hiển thị
                </div>
                <button type="submit" disabled={submitting || !content.trim()}
                  className="w-full mt-3 py-2.5 bg-orange-500 text-white rounded-lg text-[15px] font-semibold hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 transition">
                  {submitting ? "Đang đăng..." : "Đăng"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3 columns layout */}
      <div style={{ padding: "24px 24px 24px 24px", marginTop: 16, display: "flex", gap: 40, justifyContent: "space-between" }}>

        {/* LEFT SIDEBAR */}
        <div style={{ width: 320, flexShrink: 0 }} className="hidden lg:block">
          <div className="sticky" style={{ top: 80 }}>
            <a href="/lecturer/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white transition" style={{ textDecoration: "none" }}>
              <Avatar name={user?.fullName} role={user?.role} size={40} />
              <span className="font-semibold text-gray-900 text-[16px]">{user?.fullName}</span>
            </a>

            {[
              { icon: "dynamic_feed", label: "Bảng tin", key: "feed" as const },
              { icon: "person", label: "Bài của tôi", key: "my" as const },
            ].map((item) => (
              <button key={item.key} onClick={() => setTab(item.key)}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-lg text-[16px] font-medium transition ${
                  tab === item.key ? "bg-orange-50 text-orange-600" : "text-gray-800 hover:bg-white"
                }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tab === item.key ? "bg-orange-500" : "bg-gray-200"}`}>
                  <span className={IC} style={{ fontSize: 22, color: tab === item.key ? "white" : "#1F2937" }}>{item.icon}</span>
                </div>
                {item.label}
                {item.key === "my" && myPosts.length > 0 && (
                  <span className="ml-auto text-[12px] bg-red-500 text-white rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5">{myPosts.length}</span>
                )}
              </button>
            ))}

            <a href="#" className="flex items-center gap-3.5 px-3 py-3 rounded-lg text-[16px] font-medium text-gray-800 hover:bg-white transition" style={{ textDecoration: "none" }}>
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className={IC} style={{ fontSize: 22, color: "#1F2937" }}>groups</span>
              </div>
              Nhóm của tôi
            </a>
          </div>
        </div>

        {/* CENTER FEED */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: 750 }}>
          {success && (
            <div className="flex items-center gap-2 text-[14px] text-green-700 bg-green-50 px-4 py-3 rounded-lg border border-green-200 mb-4">
              <span className={IC} style={{ fontSize: 18 }}>check_circle</span>{success}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
            <div className="flex items-center gap-3 px-4 pt-3 pb-2">
              <Avatar name={user?.fullName} role={user?.role} size={40} />
              <button onClick={() => setShowCreateModal(true)}
                className="flex-1 text-left px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-[16px] text-gray-500 transition font-medium">
                Bạn đang nghĩ gì, {user?.fullName?.split(" ").pop()}?
              </button>
            </div>
            <hr className="mx-4 border-gray-200" />
            <div className="flex items-center px-2 py-1">
              <button onClick={() => setShowCreateModal(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px] font-semibold text-gray-600 hover:bg-gray-100 transition">
                <span className={IC} style={{ fontSize: 24, color: "#22C55E" }}>image</span>
                Ảnh/video
              </button>
              <button onClick={() => setShowCreateModal(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px] font-semibold text-gray-600 hover:bg-gray-100 transition">
                <span className={IC} style={{ fontSize: 24, color: "#EAB308" }}>emoji_emotions</span>
                Cảm xúc
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-4 lg:hidden">
            <button onClick={() => setTab("feed")}
              className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition ${tab === "feed" ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
              Bảng tin
            </button>
            <button onClick={() => setTab("my")}
              className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition ${tab === "my" ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
              Bài của tôi
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
              <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "3px solid #FED7AA", borderTopColor: "#FF7043" }} />
              <span className="text-[14px]">Đang tải...</span>
            </div>
          ) : displayPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center gap-3 py-20 text-gray-400">
              <span className={IC} style={{ fontSize: 64, opacity: 0.25 }}>dynamic_feed</span>
              <p className="font-semibold text-gray-500 text-[16px]">{tab === "feed" ? "Chưa có bài viết nào được duyệt" : "Bạn chưa đăng bài viết nào"}</p>
              <p className="text-[14px] text-gray-400">Hãy là người đầu tiên chia sẻ!</p>
              {tab === "my" && (
                <button onClick={() => setShowCreateModal(true)}
                  className="mt-2 px-6 py-2.5 bg-orange-500 text-white rounded-lg text-[14px] font-semibold hover:bg-orange-600 transition">
                  Đăng bài đầu tiên
                </button>
              )}
            </div>
          ) : (
            displayPosts.map((p) => <div key={p._id}>{renderPost(p)}</div>)
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: 320, flexShrink: 0 }} className="hidden xl:block">
          <div className="sticky" style={{ top: 80 }}>
            {/* Motivation Card */}
            <div className="feed-motivation-card">
              <div className="feed-floating-reactions">
                <span className="feed-reaction">💖</span>
                <span className="feed-reaction">👍</span>
                <span className="feed-reaction">💗</span>
                <span className="feed-reaction">❤️</span>
                <span className="feed-reaction">💕</span>
              </div>
              <div className="feed-running-mascot">
                <div className="feed-run-dust">
                  <div className="feed-dust" />
                  <div className="feed-dust" />
                  <div className="feed-dust" />
                </div>
                <div className="feed-mascot-body">
                  <span className="feed-mascot-emoji" aria-hidden>🏃</span>
                  <div className="feed-mascot-legs">
                    <div className="feed-mascot-leg feed-mascot-leg-left" />
                    <div className="feed-mascot-leg feed-mascot-leg-right" />
                  </div>
                </div>
              </div>
              <div className="feed-motivation-text">
                <p className="feed-quote-inline">{currentQuote.quote}</p>
                <p className="mt-1.5 text-xs font-medium text-white/90">{currentQuote.author}</p>
              </div>
            </div>

            <div className="feed-motivation-card" style={{ background: "linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)", boxShadow: "0 4px 15px rgba(79,70,229,0.25)" }}>
              <div className="feed-floating-reactions">
                <span className="feed-reaction">⭐</span>
                <span className="feed-reaction">🌈</span>
                <span className="feed-reaction">✨</span>
                <span className="feed-reaction">🎉</span>
                <span className="feed-reaction">💫</span>
              </div>
              <div className="feed-running-mascot">
                <div className="feed-run-dust">
                  <div className="feed-dust" />
                  <div className="feed-dust" />
                  <div className="feed-dust" />
                </div>
                <div className="feed-mascot-body">
                  <span className="feed-mascot-emoji" aria-hidden>📚</span>
                  <div className="feed-mascot-legs">
                    <div className="feed-mascot-leg feed-mascot-leg-left" />
                    <div className="feed-mascot-leg feed-mascot-leg-right" />
                  </div>
                </div>
              </div>
              <div className="feed-motivation-text">
                <p className="feed-quote-inline">{secondQuote.quote}</p>
                <p className="mt-1.5 text-xs font-medium text-white/90">{secondQuote.author}</p>
              </div>
            </div>

            <hr className="border-gray-300 my-4" />

            {/* Quick Links */}
            <p className="text-gray-500 font-semibold text-[14px] mb-3">Truy cập nhanh</p>
            <div className="space-y-1">
              {[
                { icon: "calendar_today", label: "Lịch dạy hôm nay", href: "/lecturer/schedule", color: "#3B82F6" },
                { icon: "assignment", label: "Báo cáo điểm danh", href: "/lecturer/reports", color: "#22C55E" },
                { icon: "qr_code_2", label: "Tạo mã điểm danh", href: "/lecturer/schedule", color: "#8B5CF6" },
                { icon: "event_note", label: "Duyệt đơn xin phép", href: "/lecturer/leave-requests", color: "#F59E0B" },
              ].map((item, i) => (
                <a key={i} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white cursor-pointer transition" style={{ textDecoration: "none" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15` }}>
                    <span className={IC} style={{ fontSize: 20, color: item.color }}>{item.icon}</span>
                  </div>
                  <span className="text-[14px] font-medium text-gray-700">{item.label}</span>
                </a>
              ))}
            </div>

            <hr className="border-gray-300 my-4" />

            {/* Tips */}
            <p className="text-gray-500 font-semibold text-[14px] mb-3">Mẹo hay</p>
            <div className="space-y-2">
              {[
                { icon: "lightbulb", text: "Đăng bài chia sẻ tài liệu giúp sinh viên học tốt hơn", color: "#F59E0B" },
                { icon: "trending_up", text: "Kiểm tra báo cáo điểm danh thường xuyên để nắm tình hình lớp", color: "#22C55E" },
                { icon: "notifications_active", text: "Bật thông báo để không bỏ lỡ bình luận từ sinh viên", color: "#3B82F6" },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-white rounded-lg p-3 border border-gray-100">
                  <span className={IC} style={{ fontSize: 18, color: tip.color, marginTop: 1 }}>{tip.icon}</span>
                  <p className="text-[12px] text-gray-600 leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
