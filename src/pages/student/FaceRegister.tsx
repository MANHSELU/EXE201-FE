import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import Footer from "../../components/Footer";
import StudentHeader from "../../components/StudentHeader";
import api from "../../services/api";
import * as faceapi from "face-api.js";

const TOTAL_SAMPLES = 10;
const MODEL_URL = "/models";

export default function FaceRegister() {
  const { setHasFaceData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<"loading" | "intro" | "scanning" | "processing" | "done">("loading");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [tip, setTip] = useState("Đưa mặt vào khung hình");
  const [loadingMsg, setLoadingMsg] = useState("Đang tải models...");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const descriptorsRef = useRef<Float32Array[]>([]);
  const isRunningRef = useRef(false);
  const lastCaptureRef = useRef(0);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingMsg("Đang tải AI models...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        setLoadingMsg("Models đã sẵn sàng!");

        try {
          const res = await api.get("/student/face/status");
          if (res.data.data?.hasRegistered) {
            setStep("done");
            setResult({ ok: true, msg: "Bạn đã đăng ký khuôn mặt!" });
            return;
          }
        } catch {}

        setStep("intro");
      } catch (err) {
        console.error("Failed to load models:", err);
        setLoadingMsg("Lỗi tải models. Refresh trang để thử lại.");
      }
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.error("Camera error", e);
      setTip("Không thể truy cập camera");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
  };

  const updateTip = useCallback((count: number, detected: boolean) => {
    if (!detected) {
      setTip("Đưa mặt vào khung hình 👤");
      return;
    }
    if (count < 2) setTip("Giữ yên... đang quét ✨");
    else if (count < 4) setTip("Xoay nhẹ sang trái 👈");
    else if (count < 6) setTip("Xoay nhẹ sang phải 👉");
    else if (count < 8) setTip("Ngẩng lên một chút ☝️");
    else setTip("Gần xong rồi! 🎉");
  }, []);

  const runDetection = useCallback(async () => {
    if (!isRunningRef.current || !videoRef.current || !modelsLoaded) return;

    const video = videoRef.current;

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.15 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setFaceDetected(true);

        const now = Date.now();
        if (now - lastCaptureRef.current >= 400 && descriptorsRef.current.length < TOTAL_SAMPLES) {
          descriptorsRef.current.push(detection.descriptor);
          const count = descriptorsRef.current.length;
          setSampleCount(count);
          lastCaptureRef.current = now;
          updateTip(count, true);

          if (count >= TOTAL_SAMPLES) {
            isRunningRef.current = false;
            stopCamera();
            setStep("processing");
            submitData();
            return;
          }
        }

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const displaySize = { width: video.videoWidth, height: video.videoHeight };
          faceapi.matchDimensions(canvas, displaySize);

          const resizedDetection = faceapi.resizeResults(detection, displaySize);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const box = resizedDetection.detection.box;
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
          }
        }
      } else {
        setFaceDetected(false);
        updateTip(sampleCount, false);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    } catch (e) {
      console.error("Detection error:", e);
    }

    if (isRunningRef.current) {
      requestAnimationFrame(runDetection);
    }
  }, [modelsLoaded, sampleCount, updateTip]);

  const submitData = async () => {
    const descriptors = descriptorsRef.current;

    if (descriptors.length < 3) {
      setResult({ ok: false, msg: `Chỉ có ${descriptors.length} mẫu. Thử lại nhé!` });
      setStep("done");
      return;
    }

    try {
      const faceDescriptors = descriptors.map((d) => Array.from(d));
      const res = await api.post("/student/face/register", { faceDescriptors });

      if (res.data.success) {
        localStorage.setItem("hasFaceData", "true");
        setHasFaceData(true);
        setResult({ ok: true, msg: `Đăng ký thành công ${descriptors.length} mẫu!` });
      } else {
        setResult({ ok: false, msg: res.data.message || "Có lỗi xảy ra" });
      }
    } catch (e: any) {
      console.error("Submit error:", e);
      setResult({ ok: false, msg: e.response?.data?.message || "Lỗi kết nối server" });
    }
    setStep("done");
  };

  const reset = () => {
    setStep("intro");
    setSampleCount(0);
    setFaceDetected(false);
    setResult(null);
    setTip("Đưa mặt vào khung hình");
    descriptorsRef.current = [];
    lastCaptureRef.current = 0;
  };

  useEffect(() => {
    if (step === "scanning" && modelsLoaded) {
      startCamera().then(() => {
        setTimeout(() => {
          isRunningRef.current = true;
          runDetection();
        }, 500);
      });
    }
    return () => {
      isRunningRef.current = false;
      stopCamera();
    };
  }, [step, modelsLoaded, runDetection]);

  // === RENDER ===
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />

      <style>{`
        body { font-family: 'Poppins', sans-serif; }
        .face-register-container {
          min-height: 100vh;
          background-color: #FFF8F5;
          padding: 2rem;
        }
        .main-content {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }
        .card {
          background: white;
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 0.25rem;
        }
        .page-subtitle {
          font-size: 14px;
          color: #6B7280;
          margin-bottom: 1.5rem;
        }
        .icon-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          position: relative;
        }
        .icon-circle.orange {
          background: linear-gradient(135deg, #FFF3E0 0%, #FFCCBC 100%);
        }
        .icon-circle.green {
          background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
        }
        .icon-circle.red {
          background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
        }
        .badge-check {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 36px;
          height: 36px;
          background: #4CAF50;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(76,175,80,0.4);
        }
        .step-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #FAFAFA;
          border-radius: 16px;
          margin-bottom: 0.75rem;
          transition: all 0.2s;
        }
        .step-item:hover {
          background: #FFF3E0;
          transform: translateX(4px);
        }
        .step-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .step-icon.orange { background: linear-gradient(135deg, #FF7043 0%, #FF5722 100%); }
        .step-icon.blue { background: linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%); }
        .step-icon.green { background: linear-gradient(135deg, #66BB6A 0%, #43A047 100%); }
        .primary-btn {
          width: 100%;
          background: linear-gradient(135deg, #FF7043 0%, #FF5722 100%);
          color: white;
          font-size: 16px;
          font-weight: 600;
          padding: 1rem 2rem;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(255,87,34,0.4);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255,87,34,0.5);
        }
        .primary-btn:active {
          transform: scale(0.98);
        }
        .primary-btn.green {
          background: linear-gradient(135deg, #66BB6A 0%, #43A047 100%);
          box-shadow: 0 4px 15px rgba(76,175,80,0.4);
        }
        .primary-btn.green:hover {
          box-shadow: 0 6px 20px rgba(76,175,80,0.5);
        }
        .camera-container {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          background: #000;
          margin-bottom: 1.5rem;
        }
        .camera-video {
          width: 100%;
          aspect-ratio: 4/3;
          object-fit: cover;
          transform: scaleX(-1);
        }
        .camera-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          transform: scaleX(-1);
        }
        .face-guide {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 65%;
          height: 55%;
          border: 4px solid;
          border-radius: 50%;
          transition: border-color 0.3s;
        }
        .face-guide.detected { border-color: #22c55e; }
        .face-guide.not-detected { border-color: #FF7043; }
        .camera-top-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 1rem;
          background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .camera-bottom-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1.5rem;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        }
        .tip-badge {
          padding: 0.75rem 1.5rem;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 600;
          text-align: center;
          transition: all 0.3s;
        }
        .tip-badge.green { background: #22c55e; color: white; }
        .tip-badge.orange { background: #FF7043; color: white; }
        .progress-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 1rem;
        }
        .progress-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .progress-dot.active { background: #22c55e; transform: scale(1.2); }
        .progress-dot.inactive { background: rgba(255,255,255,0.3); }
        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-badge.green { background: #22c55e; color: white; }
        .status-badge.gray { background: rgba(255,255,255,0.2); color: white; }
        .progress-text {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          background: rgba(255,255,255,0.2);
          color: white;
          font-size: 14px;
          font-weight: 600;
        }
        .close-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .close-btn:hover { background: rgba(255,255,255,0.3); }
        .progress-bar-container {
          height: 8px;
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 1rem;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #22c55e, #4ade80);
          border-radius: 4px;
          transition: width 0.3s;
        }
        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #FFCCBC;
          border-top-color: #FF7043;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .alert-box {
          background: #FFF3E0;
          border: 1px solid #FFCC80;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        .alert-box p {
          color: #E65100;
          font-size: 14px;
          margin: 0;
        }
      `}</style>

      <StudentHeader />

      <div className="face-register-container">
        <main className="main-content">
          {/* Page Title */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h1 className="page-title">Đăng Ký Khuôn Mặt</h1>
            <p className="page-subtitle">Xác thực sinh trắc học để điểm danh tự động</p>
          </div>

          <div className="card">
            {/* Loading */}
            {step === "loading" && (
              <div style={{ textAlign: "center", padding: "3rem 0" }}>
                <div className="icon-circle orange">
                  <div className="spinner"></div>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1F2937", marginBottom: "0.5rem" }}>
                  {loadingMsg}
                </h2>
                <p style={{ color: "#6B7280", fontSize: "14px" }}>Vui lòng đợi trong giây lát...</p>
              </div>
            )}

            {/* Intro */}
            {step === "intro" && (
              <>
                {location.state?.message && (
                  <div className="alert-box">
                    <p>⚠️ {location.state.message}</p>
                  </div>
                )}

                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                  <div className="icon-circle orange">
                    <span style={{ fontSize: "56px" }}>🧑‍💻</span>
                    <div className="badge-check">
                      <span style={{ color: "white", fontSize: "20px" }}>✓</span>
                    </div>
                  </div>
                  <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1F2937", marginBottom: "0.5rem" }}>
                    Đăng ký khuôn mặt
                  </h2>
                  <p style={{ color: "#6B7280" }}>Quét nhanh trong 10 giây</p>
                </div>

                <div style={{ marginBottom: "2rem" }}>
                  <div className="step-item">
                    <div className="step-icon orange">📷</div>
                    <div>
                      <p style={{ fontWeight: 600, color: "#1F2937", marginBottom: "0.25rem" }}>Bật camera</p>
                      <p style={{ fontSize: "13px", color: "#6B7280" }}>Cho phép truy cập camera thiết bị</p>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-icon blue">🔄</div>
                    <div>
                      <p style={{ fontWeight: 600, color: "#1F2937", marginBottom: "0.25rem" }}>Xoay mặt theo hướng dẫn</p>
                      <p style={{ fontSize: "13px", color: "#6B7280" }}>Trái, phải, lên, xuống</p>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-icon green">⚡</div>
                    <div>
                      <p style={{ fontWeight: 600, color: "#1F2937", marginBottom: "0.25rem" }}>Hoàn tất trong 10 giây</p>
                      <p style={{ fontSize: "13px", color: "#6B7280" }}>Nhanh chóng và bảo mật</p>
                    </div>
                  </div>
                </div>

                <button className="primary-btn" onClick={() => setStep("scanning")}>
                  <span className="material-icons-outlined">play_arrow</span>
                  Bắt đầu quét
                </button>
              </>
            )}

            {/* Scanning */}
            {step === "scanning" && (
              <>
                <div className="camera-container">
                  <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
                  <canvas ref={canvasRef} className="camera-overlay" />

                  {/* Face guide oval */}
                  <div className={`face-guide ${faceDetected ? "detected" : "not-detected"}`}></div>

                  {/* Top bar */}
                  <div className="camera-top-bar">
                    <button
                      className="close-btn"
                      onClick={() => {
                        isRunningRef.current = false;
                        stopCamera();
                        reset();
                      }}
                    >
                      ✕
                    </button>
                    <div className="progress-text">{Math.round((sampleCount / TOTAL_SAMPLES) * 100)}%</div>
                  </div>

                  {/* Bottom bar */}
                  <div className="camera-bottom-bar">
                    <div className={`tip-badge ${faceDetected ? "green" : "orange"}`}>{tip}</div>

                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: `${(sampleCount / TOTAL_SAMPLES) * 100}%` }}></div>
                    </div>

                    <div className="progress-dots">
                      {Array.from({ length: TOTAL_SAMPLES }).map((_, i) => (
                        <div key={i} className={`progress-dot ${i < sampleCount ? "active" : "inactive"}`}></div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "#6B7280", fontSize: "14px" }}>
                    Đã thu thập <strong style={{ color: "#FF7043" }}>{sampleCount}/{TOTAL_SAMPLES}</strong> mẫu
                  </p>
                </div>
              </>
            )}

            {/* Processing */}
            {step === "processing" && (
              <div style={{ textAlign: "center", padding: "3rem 0" }}>
                <div className="icon-circle orange">
                  <div className="spinner"></div>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1F2937", marginBottom: "0.5rem" }}>
                  Đang xử lý
                </h2>
                <p style={{ color: "#6B7280", fontSize: "14px" }}>
                  Đang lưu {descriptorsRef.current.length} mẫu khuôn mặt...
                </p>
              </div>
            )}

            {/* Done */}
            {step === "done" && (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <div className={`icon-circle ${result?.ok ? "green" : "red"}`}>
                  <span style={{ fontSize: "56px" }}>{result?.ok ? "🎉" : "😕"}</span>
                </div>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: result?.ok ? "#2E7D32" : "#C62828",
                    marginBottom: "0.5rem",
                  }}
                >
                  {result?.ok ? "Thành công!" : "Thất bại"}
                </h2>
                <p style={{ color: "#6B7280", marginBottom: "2rem" }}>{result?.msg}</p>

                {result?.ok ? (
                  <button className="primary-btn green" onClick={() => navigate("/student/dashboard")}>
                    <span className="material-icons-outlined">home</span>
                    Về trang chủ
                  </button>
                ) : (
                  <button className="primary-btn" onClick={reset}>
                    <span className="material-icons-outlined">refresh</span>
                    Thử lại
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
