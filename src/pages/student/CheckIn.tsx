import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Footer from "../../components/Footer";
import StudentHeader from "../../components/StudentHeader";
import * as faceapi from "face-api.js";

const DEV_MODE = true;
const MODEL_URL = "/models";

// CONFIG
const REQUIRED_MATCH_RATE = 0.7;  // 70% frame phải khớp
const REQUIRED_FRAMES = 15;       // cần 15 lần verify
const MATCH_THRESHOLD = 0.5;      // Euclidean distance threshold

type CheckInStep = "loading" | "otp" | "location" | "liveness" | "processing" | "result";

interface SlotInfo {
  sessionId: string;
  slotId: string;
  subjectName: string;
  subjectCode: string;
  className: string;
  roomName: string;
  startTime: string;
  endTime: string;
  date: string;
}

const StudentCheckIn: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<CheckInStep>("loading");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [storedDescriptors, setStoredDescriptors] = useState<Float32Array[]>([]);

  // OTP
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);

  // Location
  const [locationStatus, setLocationStatus] = useState<"checking" | "success" | "failed">("checking");
  const [locationError, setLocationError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [schoolLocation, setSchoolLocation] = useState({ lat: 10.8411, lng: 106.8098, radius: 500 });

  // Face Recognition
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [faceDetected, setFaceDetected] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Đang tải...");
  const [progress, setProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceMatchResult, setFaceMatchResult] = useState<"matching" | "matched" | "not_matched" | null>(null);

  const isRunningRef = useRef(false);
  const frameCountRef = useRef(0);
  const matchCountRef = useRef(0);
  
  // Store verified data in refs to preserve through re-renders
  const verifiedCodeRef = useRef<string>("");
  const slotInfoRef = useRef<SlotInfo | null>(null);

  // Result
  const [processingStatus, setProcessingStatus] = useState("");
  const [checkInResult, setCheckInResult] = useState<"success" | "failed" | null>(null);
  const [resultMessage, setResultMessage] = useState("");

  // Load models and check registration
  useEffect(() => {
    const init = async () => {
      try {
        // Load face-api.js models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);

        // Check face registration and get stored descriptors
        const res = await api.get("/student/face/descriptors");
        if (!res.data.success || !res.data.data?.hasRegistered) {
          navigate("/student/face-register", { state: { message: "Cần đăng ký khuôn mặt trước" } });
          return;
        }

        // Convert stored descriptors to Float32Array
        const descriptors = res.data.data.faceDescriptors.map(
          (d: number[]) => new Float32Array(d)
        );
        setStoredDescriptors(descriptors);
        setCurrentStep("otp");
      } catch (err) {
        console.error("Init error:", err);
        setStatusMessage("Lỗi tải models. Refresh trang.");
      }
    };
    init();
  }, [navigate]);

  // Euclidean distance between two descriptors
  const euclideanDistance = (a: Float32Array, b: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
  };

  // Compare descriptor with stored ones
  const isMatch = (descriptor: Float32Array): boolean => {
    for (const stored of storedDescriptors) {
      const dist = euclideanDistance(descriptor, stored);
      if (dist < MATCH_THRESHOLD) return true;
    }
    return false;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setStatusMessage("Không thể mở camera");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  // Detection loop using face-api.js
  const runDetection = useCallback(async () => {
    if (!isRunningRef.current || !videoRef.current || !modelsLoaded) return;

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.15 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setFaceDetected(true);
        frameCountRef.current += 1;

        // Compare with stored descriptors
        const matched = isMatch(detection.descriptor);
        if (matched) {
          matchCountRef.current += 1;
        }

        const currentProgress = Math.min((frameCountRef.current / REQUIRED_FRAMES) * 100, 100);
        const matchRate = frameCountRef.current > 0 ? Math.round((matchCountRef.current / frameCountRef.current) * 100) : 0;
        setProgress(currentProgress);

        if (frameCountRef.current < REQUIRED_FRAMES) {
          setStatusMessage(`Xác thực... ${matchRate}% khớp (${frameCountRef.current}/${REQUIRED_FRAMES})`);
        }

        // Draw face box
        if (canvasRef.current) {
          const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
          faceapi.matchDimensions(canvasRef.current, displaySize);
          const resized = faceapi.resizeResults(detection, displaySize);
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            const box = resized.detection.box;
            ctx.strokeStyle = matched ? "#22c55e" : "#ef4444";
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
          }
        }

        // Check if done
        if (frameCountRef.current >= REQUIRED_FRAMES) {
          const finalMatchRate = matchCountRef.current / frameCountRef.current;
          const img = captureFrame();

          if (finalMatchRate >= REQUIRED_MATCH_RATE) {
            setFaceMatchResult("matched");
            setStatusMessage(`Xác thực thành công! (${Math.round(finalMatchRate * 100)}%)`);
            setTimeout(() => captureAndProcess(true, img, finalMatchRate), 500);
          } else {
            setFaceMatchResult("not_matched");
            setStatusMessage(`Không khớp! Chỉ ${Math.round(finalMatchRate * 100)}% (cần ${Math.round(REQUIRED_MATCH_RATE * 100)}%)`);
            setTimeout(() => captureAndProcess(false, img, finalMatchRate), 500);
          }
          return;
        }
      } else {
        setFaceDetected(false);
        setStatusMessage("Đưa mặt vào camera");
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
  }, [modelsLoaded, storedDescriptors]);

  const captureAndProcess = (faceMatched: boolean, img: string | null, matchRate: number = 0) => {
    setCapturedImage(img);
    isRunningRef.current = false;
    stopCamera();

    if (faceMatched) {
      setCurrentStep("processing");
      processCheckIn(img, true, matchRate);
    } else {
      setCheckInResult("failed");
      setResultMessage("Khuôn mặt không khớp với dữ liệu đã đăng ký!");
      setCurrentStep("result");
    }
  };

  // OTP handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^[A-Z0-9]?$/i.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.toUpperCase();
    setOtpCode(newCode);
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    const code = otpCode.join("");
    if (code.length !== 6) {
      setOtpError("Nhập đủ 6 ký tự");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      console.log("Verifying OTP code:", code);
      const res = await api.post("/student/attendance/verify-code", { code });
      console.log("Verify response:", res.data);
      
      if (res.data.data) {
        setSlotInfo(res.data.data);
        slotInfoRef.current = res.data.data;  // Store in ref too
        verifiedCodeRef.current = code;        // Store verified code
        console.log("SlotInfo set:", res.data.data);
      } else {
        console.error("No data in response:", res.data);
        setOtpError("Không nhận được thông tin buổi học");
        return;
      }
      
      if (res.data.schoolLocation) setSchoolLocation(res.data.schoolLocation);
      setCurrentStep("location");
    } catch (err: any) {
      console.error("Verify error:", err);
      setOtpError(err.response?.data?.message || "Mã không hợp lệ");
    } finally {
      setOtpLoading(false);
    }
  };

  // Location check
  const checkLocation = useCallback(() => {
    setLocationStatus("checking");
    if (DEV_MODE) {
      setLocationStatus("success");
      setTimeout(() => setCurrentStep("liveness"), 500);
      return;
    }
    if (!navigator.geolocation) {
      setLocationStatus("failed");
      setLocationError("Không hỗ trợ định vị");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        const R = 6371000;
        const dLat = ((schoolLocation.lat - pos.coords.latitude) * Math.PI) / 180;
        const dLon = ((schoolLocation.lng - pos.coords.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((pos.coords.latitude * Math.PI) / 180) *
            Math.cos((schoolLocation.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (dist <= schoolLocation.radius) {
          setLocationStatus("success");
          setTimeout(() => setCurrentStep("liveness"), 500);
        } else {
          setLocationStatus("failed");
          setLocationError(`Ngoài khu vực (${Math.round(dist)}m)`);
        }
      },
      () => {
        setLocationStatus("failed");
        setLocationError("Không xác định được");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [schoolLocation]);

  // Process check-in
  const processCheckIn = async (img: string | null, faceVerified: boolean = true, matchRate: number = 0.9) => {
    setProcessingStatus("Đang gửi điểm danh...");
    
    // Use ref values as fallback (state might not be available)
    const currentSlotInfo = slotInfo || slotInfoRef.current;
    const code = verifiedCodeRef.current || otpCode.join("");
    
    console.log("processCheckIn data:", { 
      slotInfo, 
      slotInfoRef: slotInfoRef.current, 
      code, 
      verifiedCodeRef: verifiedCodeRef.current 
    });
    
    // Validate required data
    if (!currentSlotInfo?.slotId || !currentSlotInfo?.sessionId || !code) {
      console.error("Missing data:", { currentSlotInfo, code });
      setCheckInResult("failed");
      setResultMessage("Dữ liệu không đầy đủ. Vui lòng thử lại từ đầu.");
      setCurrentStep("result");
      return;
    }
    
    try {
      console.log("Submitting checkin:", {
        slotId: currentSlotInfo.slotId,
        sessionId: currentSlotInfo.sessionId,
        code,
        faceVerified,
        faceMatchRate: matchRate,
      });
      
      const res = await api.post("/student/attendance/checkin", {
        slotId: currentSlotInfo.slotId,
        sessionId: currentSlotInfo.sessionId,
        code: code,
        faceImage: img,
        faceVerified: faceVerified,
        faceMatchRate: matchRate,
        location: userLocation,
      });
      
      if (res.data.success) {
        setCheckInResult("success");
        setResultMessage("Điểm danh thành công!");
      } else {
        setCheckInResult("failed");
        setResultMessage(res.data.message || "Điểm danh thất bại");
      }
    } catch (err: any) {
      console.error("Checkin error:", err);
      setCheckInResult("failed");
      setResultMessage(err.response?.data?.message || "Lỗi kết nối server");
    } finally {
      setCurrentStep("result");
    }
  };

  const retryLiveness = () => {
    setFaceDetected(false);
    setFaceMatchResult(null);
    setProgress(0);
    frameCountRef.current = 0;
    matchCountRef.current = 0;
    setCapturedImage(null);
    setCurrentStep("liveness");
  };

  // Effects
  useEffect(() => {
    if (currentStep === "location") checkLocation();
  }, [currentStep, checkLocation]);

  useEffect(() => {
    if (currentStep === "liveness" && modelsLoaded) {
      startCamera().then(() => {
        setTimeout(() => {
          isRunningRef.current = true;
          setStatusMessage("Đưa mặt vào camera");
          runDetection();
        }, 500);
      });
    }
    return () => {
      isRunningRef.current = false;
      stopCamera();
    };
  }, [currentStep, modelsLoaded, runDetection]);

  // Render
  if (currentStep === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Đang tải AI models...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <StudentHeader />

        <main className="max-w-2xl mx-auto px-6 py-8">
          {slotInfo && (
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 mb-6 text-white shadow-lg">
              <div className="font-bold text-lg mb-1">
                {slotInfo.subjectCode} - {slotInfo.subjectName}
              </div>
              <div className="text-sm text-orange-100 flex flex-wrap gap-3">
                <span>{slotInfo.className}</span>
                <span>•</span>
                <span>{slotInfo.roomName}</span>
                <span>•</span>
                <span>
                  {slotInfo.startTime} - {slotInfo.endTime}
                </span>
              </div>
            </div>
          )}

          {!["processing", "result"].includes(currentStep) && (
            <div className="flex items-center justify-center mb-8">
              {[
                { key: "otp", label: "OTP" },
                { key: "location", label: "Vị trí" },
                { key: "liveness", label: "Khuôn mặt" },
              ].map((step, idx, arr) => {
                const stepIdx = arr.findIndex((s) => s.key === currentStep);
                const done = idx < stepIdx;
                const active = step.key === currentStep;
                
                const getStepIcon = (key: string, isDone: boolean) => {
                  if (isDone) {
                    return (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    );
                  }
                  switch (key) {
                    case "otp":
                      return (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      );
                    case "location":
                      return (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      );
                    case "liveness":
                      return (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      );
                    default:
                      return null;
                  }
                };
                
                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          done
                            ? "bg-green-500 text-white"
                            : active
                            ? "bg-orange-500 text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {getStepIcon(step.key, done)}
                      </div>
                      <span
                        className={`text-xs mt-2 ${
                          done ? "text-green-600" : active ? "text-orange-600" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className={`w-12 h-1 mx-2 ${idx < stepIdx ? "bg-green-500" : "bg-gray-200"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {currentStep === "otp" && (
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Nhập mã điểm danh</h2>
                <p className="text-gray-500 mb-8">Mã 6 ký tự từ giảng viên</p>

                <div className="flex justify-center gap-3 mb-6">
                  {otpCode.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpInputRefs.current[i] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  ))}
                </div>

                {otpError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6">{otpError}</div>}

                <button
                  onClick={verifyOtp}
                  disabled={otpLoading}
                  className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50"
                >
                  {otpLoading ? "Đang xác thực..." : "Tiếp tục"}
                </button>
              </div>
            )}

            {currentStep === "location" && (
              <div className="text-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                    locationStatus === "checking"
                      ? "bg-blue-100"
                      : locationStatus === "success"
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  <span className="text-4xl">
                    {locationStatus === "checking" ? "🔍" : locationStatus === "success" ? "✅" : "❌"}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {locationStatus === "checking"
                    ? "Đang kiểm tra..."
                    : locationStatus === "success"
                    ? "Vị trí OK!"
                    : "Lỗi vị trí"}
                </h2>
                {locationStatus === "failed" && (
                  <>
                    <p className="text-red-500 mb-6">{locationError}</p>
                    <button onClick={checkLocation} className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold">
                      Thử lại
                    </button>
                  </>
                )}
              </div>
            )}

            {currentStep === "liveness" && (
              <div>
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Xác thực khuôn mặt</h2>
                  <p className="text-gray-500 text-sm">So sánh với dữ liệu đã đăng ký</p>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-gray-900 mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full aspect-[4/3] object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ transform: "scaleX(-1)" }}
                  />

                  <div className="absolute top-3 left-3 right-3 flex justify-between">
                    <div className="px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      AI sẵn sàng
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        faceMatchResult === "matched"
                          ? "bg-green-500"
                          : faceMatchResult === "not_matched"
                          ? "bg-red-500"
                          : faceDetected
                          ? "bg-blue-500"
                          : "bg-gray-500"
                      } text-white`}
                    >
                      {faceMatchResult === "matched" ? (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          Khớp
                        </>
                      ) : faceMatchResult === "not_matched" ? (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Sai
                        </>
                      ) : faceDetected
                        ? "Đang so..."
                        : "Chưa thấy"}
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                    <p className="text-white text-center text-lg font-medium mb-3">{statusMessage}</p>
                    <div className="h-3 bg-white/30 rounded-full overflow-hidden max-w-xs mx-auto">
                      <div
                        className={`h-full transition-all rounded-full ${
                          faceMatchResult === "matched"
                            ? "bg-green-500"
                            : faceMatchResult === "not_matched"
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "processing" && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{processingStatus}</h2>
              </div>
            )}

            {currentStep === "result" && (
              <div className="text-center py-8">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                    checkInResult === "success" ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {checkInResult === "success" ? (
                    <svg className="w-14 h-14 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <h2
                  className={`text-3xl font-bold mb-4 ${
                    checkInResult === "success" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {checkInResult === "success" ? "Thành công!" : "Thất bại"}
                </h2>
                <p className="text-gray-600 mb-8">{resultMessage}</p>
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt=""
                    className="w-24 h-24 rounded-full mx-auto mb-6 object-cover border-4 border-white shadow-lg"
                    style={{ transform: "scaleX(-1)" }}
                  />
                )}

                {checkInResult === "success" ? (
                  <button
                    onClick={() => navigate("/student/dashboard")}
                    className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold"
                  >
                    Về trang chủ
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button onClick={retryLiveness} className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold">
                      Thử lại
                    </button>
                    <button
                      onClick={() => navigate("/student/dashboard")}
                      className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold"
                    >
                      Về trang chủ
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default StudentCheckIn;
