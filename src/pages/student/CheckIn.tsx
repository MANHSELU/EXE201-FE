// @ts-nocheck
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
const REQUIRED_MATCH_RATE = 0.75;  // 75% frame phải khớp
const REQUIRED_FRAMES = 10;       // cần 10 lần verify
const MATCH_THRESHOLD = 0.4;      // Euclidean distance threshold (nghiêm hơn)
const EAR_THRESHOLD = 0.25;
const MAR_THRESHOLD = 0.55;
const YAW_THRESHOLD = 0.13;
const PITCH_THRESHOLD = 0.07;
const CHALLENGE_TIMEOUT_MS = 30000;   // 30 giây mỗi challenge
const DETECT_INTERVAL_MS = 150;       // Chạy AI detect mỗi 150ms (nhanh hơn để bắt blink)
const FACE_LOST_TOLERANCE = 10;       // Cho phép mất mặt 10 lần detect liên tiếp (cần cho look up/down)
const HOLD_FRAMES_REQUIRED = 12;      // Phải giữ hành động ~2 giây (12 frames x 150ms)

// Anti-spoofing CONFIG (calibrated từ data thực tế)
// Video/ảnh ĐT: movement=12-35, frameSim=0.42-0.76
// Mặt thật:     movement=128-166, frameSim=0.07-0.19
const SPOOF_MIN_MOVEMENT_VARIANCE = 60;    // Mặt thật > 100, fake < 40
const SPOOF_MAX_FRAME_SIMILARITY = 0.35;   // Mặt thật < 0.2, fake > 0.4
const SPOOF_MIN_BRIGHTNESS_VARIANCE = 0;   // Tắt (không phân biệt đủ rõ)
const SPOOF_EDGE_SHARPNESS_THRESHOLD = 99; // Tắt (không phân biệt đủ rõ)
const SPOOF_COLOR_INDEPENDENCE = 99;       // Tắt (không phân biệt đủ rõ)
const SPOOF_HISTORY_FRAMES = 10;

type LivenessChallenge =
  | "BLINK"
  | "TURN_LEFT"
  | "TURN_RIGHT"
  | "LOOK_UP"
  | "LOOK_DOWN"
  | "OPEN_MOUTH";

const CHALLENGE_TEXT: Record<LivenessChallenge, string> = {
  BLINK: "Chớp mắt 1 lần",
  TURN_LEFT: "Quay đầu sang trái",
  TURN_RIGHT: "Quay đầu sang phải",
  LOOK_UP: "Nhìn lên",
  LOOK_DOWN: "Nhìn xuống",
  OPEN_MOUTH: "Mở miệng",
};

const distance2D = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const averagePoint = (pts: { x: number; y: number }[]) => {
  const sum = pts.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / pts.length, y: sum.y / pts.length };
};

const calcEAR = (eye: { x: number; y: number }[]) => {
  const p1 = eye[0], p2 = eye[1], p3 = eye[2], p4 = eye[3], p5 = eye[4], p6 = eye[5];
  return (distance2D(p2, p6) + distance2D(p3, p5)) / (2 * distance2D(p1, p4));
};

const calcMAR = (mouth: { x: number; y: number }[]) => {
  const p1 = mouth[0], p2 = mouth[1], p3 = mouth[2], p4 = mouth[3], p5 = mouth[4], p6 = mouth[5], p7 = mouth[6], p8 = mouth[7];
  return (distance2D(p3, p7) + distance2D(p4, p6) + distance2D(p2, p8)) / (2 * distance2D(p1, p5));
};

const getPose = (positions: { x: number; y: number }[]) => {
  const leftEye = averagePoint(positions.slice(36, 42));
  const rightEye = averagePoint(positions.slice(42, 48));
  const nose = positions[30];
  const mouth = averagePoint(positions.slice(48, 60));
  const eyeDist = distance2D(leftEye, rightEye) || 1;
  const midEye = averagePoint([leftEye, rightEye]);
  const yaw = (nose.x - midEye.x) / eyeDist;
  const pitch = (nose.y - midEye.y) / (distance2D(midEye, mouth) || 1);
  return { yaw, pitch };
};

// ========== ANTI-SPOOFING HELPERS ==========

// Lấy pixel data từ video frame
const getFrameData = (video: HTMLVideoElement): ImageData | null => {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

// Tính grayscale brightness trung bình của vùng mặt
const getRegionBrightness = (imageData: ImageData, box: { x: number; y: number; width: number; height: number }): number => {
  const { data, width } = imageData;
  let sum = 0;
  let count = 0;
  const startX = Math.max(0, Math.floor(box.x));
  const startY = Math.max(0, Math.floor(box.y));
  const endX = Math.min(imageData.width, Math.floor(box.x + box.width));
  const endY = Math.min(imageData.height, Math.floor(box.y + box.height));
  // Sample every 4th pixel for performance
  for (let y = startY; y < endY; y += 4) {
    for (let x = startX; x < endX; x += 4) {
      const idx = (y * width + x) * 4;
      sum += data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
};

// Tính edge density (Sobel-like) - ảnh từ màn hình có pattern moiré
const getEdgeDensity = (imageData: ImageData, box: { x: number; y: number; width: number; height: number }): number => {
  const { data, width } = imageData;
  let edgeSum = 0;
  let count = 0;
  const startX = Math.max(1, Math.floor(box.x));
  const startY = Math.max(1, Math.floor(box.y));
  const endX = Math.min(imageData.width - 1, Math.floor(box.x + box.width));
  const endY = Math.min(imageData.height - 1, Math.floor(box.y + box.height));
  for (let y = startY; y < endY; y += 3) {
    for (let x = startX; x < endX; x += 3) {
      const idx = (y * width + x) * 4;
      const idxRight = (y * width + x + 1) * 4;
      const idxDown = ((y + 1) * width + x) * 4;
      const gx = Math.abs((data[idxRight] - data[idx]) + (data[idxRight + 1] - data[idx + 1]) + (data[idxRight + 2] - data[idx + 2])) / 3;
      const gy = Math.abs((data[idxDown] - data[idx]) + (data[idxDown + 1] - data[idx + 1]) + (data[idxDown + 2] - data[idx + 2])) / 3;
      edgeSum += Math.sqrt(gx * gx + gy * gy);
      count++;
    }
  }
  return count > 0 ? edgeSum / count : 0;
};

// Tính high-frequency energy (phát hiện moiré pattern từ screen)
const getHighFrequencyEnergy = (imageData: ImageData, box: { x: number; y: number; width: number; height: number }): number => {
  const { data, width } = imageData;
  let energy = 0;
  let count = 0;
  const startX = Math.max(2, Math.floor(box.x));
  const startY = Math.max(2, Math.floor(box.y));
  const endX = Math.min(imageData.width - 2, Math.floor(box.x + box.width));
  const endY = Math.min(imageData.height - 2, Math.floor(box.y + box.height));
  // Laplacian filter (detect rapid intensity changes = screen pixels)
  for (let y = startY; y < endY; y += 3) {
    for (let x = startX; x < endX; x += 3) {
      const getGray = (px: number, py: number) => {
        const i = (py * width + px) * 4;
        return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      };
      const laplacian = Math.abs(
        -4 * getGray(x, y) + getGray(x - 1, y) + getGray(x + 1, y) + getGray(x, y - 1) + getGray(x, y + 1)
      );
      energy += laplacian;
      count++;
    }
  }
  return count > 0 ? energy / count : 0;
};

// Phát hiện màn hình qua color channel independence (RGB subpixel pattern)
// Màn hình: R,G,B thay đổi độc lập → chênh lệch lớn giữa các kênh ở pixel lân cận
// Da thật: R,G,B tương quan với nhau
const getColorChannelIndependence = (imageData: ImageData, box: { x: number; y: number; width: number; height: number }): number => {
  const { data, width } = imageData;
  let totalDiff = 0;
  let count = 0;
  const startX = Math.max(1, Math.floor(box.x));
  const startY = Math.max(1, Math.floor(box.y));
  const endX = Math.min(imageData.width - 1, Math.floor(box.x + box.width));
  const endY = Math.min(imageData.height - 1, Math.floor(box.y + box.height));
  for (let y = startY; y < endY; y += 4) {
    for (let x = startX; x < endX; x += 4) {
      const i = (y * width + x) * 4;
      const iR = (y * width + x + 1) * 4;
      // Chênh lệch R giữa 2 pixel lân cận
      const dR = Math.abs(data[i] - data[iR]);
      const dG = Math.abs(data[i + 1] - data[iR + 1]);
      const dB = Math.abs(data[i + 2] - data[iR + 2]);
      // Nếu 3 kênh thay đổi không đồng đều → nghi ngờ screen
      const maxD = Math.max(dR, dG, dB);
      const minD = Math.min(dR, dG, dB);
      if (maxD > 3) { // chỉ xét pixel có thay đổi đáng kể
        totalDiff += (maxD - minD) / (maxD + 1);
        count++;
      }
    }
  }
  return count > 0 ? totalDiff / count : 0;
};

// Phân tích color temperature vùng mặt
// Màn hình: ánh sáng xanh hơn (blue ratio cao), saturation thấp hơn
// Mặt thật: da ấm hơn (red ratio cao), saturation tự nhiên
const getColorStats = (imageData: ImageData, box: { x: number; y: number; width: number; height: number }) => {
  const { data, width } = imageData;
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  const startX = Math.max(0, Math.floor(box.x));
  const startY = Math.max(0, Math.floor(box.y));
  const endX = Math.min(imageData.width, Math.floor(box.x + box.width));
  const endY = Math.min(imageData.height, Math.floor(box.y + box.height));
  for (let y = startY; y < endY; y += 4) {
    for (let x = startX; x < endX; x += 4) {
      const idx = (y * width + x) * 4;
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      count++;
    }
  }
  if (count === 0) return { blueRatio: 0, redRatio: 0, avgBrightness: 0 };
  const total = rSum + gSum + bSum || 1;
  return {
    blueRatio: bSum / total,        // Màn hình: cao hơn ~0.35+
    redRatio: rSum / total,          // Mặt thật: cao hơn ~0.38+
    avgBrightness: (rSum + gSum + bSum) / (count * 3),
  };
};

// So sánh 2 frame xem có quá giống nhau không (ảnh tĩnh/video loop)
const framesSimilarity = (prev: ImageData, curr: ImageData): number => {
  if (prev.width !== curr.width || prev.height !== curr.height) return 0;
  let matchPixels = 0;
  let totalPixels = 0;
  // Sample every 8th pixel
  for (let i = 0; i < prev.data.length; i += 32) {
    const diff = Math.abs(prev.data[i] - curr.data[i]) + Math.abs(prev.data[i + 1] - curr.data[i + 1]) + Math.abs(prev.data[i + 2] - curr.data[i + 2]);
    if (diff < 10) matchPixels++;
    totalPixels++;
  }
  return totalPixels > 0 ? matchPixels / totalPixels : 0;
};

interface SpoofAnalysis {
  isSpoof: boolean;
  reasons: string[];
  scores: {
    movementVariance: number;
    frameSimilarity: number;
    brightnessVariance: number;
    highFreqEnergy: number;
    colorIndependence: number;
  };
}

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
  useAuth();
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
  const [livenessChallenges, _setLivenessChallenges] = useState<LivenessChallenge[]>([]);
  const livenessChallengesRef = useRef<LivenessChallenge[]>([]);
  const setLivenessChallenges = (v: LivenessChallenge[]) => { livenessChallengesRef.current = v; _setLivenessChallenges(v); };
  const [livenessNonce, _setLivenessNonce] = useState("");
  const livenessNonceRef = useRef("");
  const setLivenessNonce = (v: string) => { livenessNonceRef.current = v; _setLivenessNonce(v); };
  const [livenessToken, _setLivenessToken] = useState("");
  const livenessTokenRef = useRef("");
  const setLivenessToken = (v: string) => { livenessTokenRef.current = v; _setLivenessToken(v); };
  const [livenessPassed, _setLivenessPassed] = useState(false);
  const livenessPassedRef = useRef(false);
  const setLivenessPassed = (v: boolean) => { livenessPassedRef.current = v; _setLivenessPassed(v); };
  const [challengeIndex, _setChallengeIndex] = useState(0);
  const challengeIndexRef = useRef(0);
  const setChallengeIndex = (v: number) => { challengeIndexRef.current = v; _setChallengeIndex(v); };

  const isRunningRef = useRef(false);
  const frameCountRef = useRef(0);
  const matchCountRef = useRef(0);
  const livenessResultsRef = useRef<Record<string, { pass: boolean; ts: number }>>({});
  const livenessStartRef = useRef<number>(0);
  const challengeStartRef = useRef<number>(0);
  const baselinePoseRef = useRef<{ yaw: number; pitch: number } | null>(null);
  const blinkFramesRef = useRef(0);
  const earHistoryRef = useRef<number[]>([]);  // Track EAR values for baseline
  const waitingForNeutralRef = useRef(false);  // Chờ về trung lập trước challenge tiếp
  const holdFramesRef = useRef(0);             // Đếm số frame giữ hành động liên tiếp
  const livenessStartedRef = useRef(false);
  const faceLostCountRef = useRef(0);

  // Smooth rendering refs
  const lastDetectionRef = useRef<any>(null);         // Last full detection result
  const lastBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const smoothBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const lastDetectTimeRef = useRef(0);
  const animFrameRef = useRef(0);
  const lastMatchedRef = useRef(false);

  // Store verified data in refs to preserve through re-renders
  const verifiedCodeRef = useRef<string>("");
  const slotInfoRef = useRef<SlotInfo | null>(null);

  // Anti-spoofing refs
  const prevFrameRef = useRef<ImageData | null>(null);
  const landmarkHistoryRef = useRef<{ x: number; y: number }[][]>([]);
  const brightnessHistoryRef = useRef<number[]>([]);
  const frameSimilarityHistoryRef = useRef<number[]>([]);
  const highFreqHistoryRef = useRef<number[]>([]);
  const colorIndepHistoryRef = useRef<number[]>([]);
  const blueRedRatioHistoryRef = useRef<number[]>([]);
  const spoofScoreRef = useRef<SpoofAnalysis | null>(null);
  const [spoofWarning, setSpoofWarning] = useState<string | null>(null);

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

  const resetLivenessState = useCallback(() => {
    setLivenessChallenges([]);
    setLivenessNonce("");
    setLivenessToken("");
    setLivenessPassed(false);
    setChallengeIndex(0);
    livenessResultsRef.current = {};
    livenessStartRef.current = Date.now();
    challengeStartRef.current = Date.now();
    baselinePoseRef.current = null;
    blinkFramesRef.current = 0;
    earHistoryRef.current = [];
    waitingForNeutralRef.current = false;
    holdFramesRef.current = 0;
    // Reset anti-spoofing
    prevFrameRef.current = null;
    landmarkHistoryRef.current = [];
    brightnessHistoryRef.current = [];
    frameSimilarityHistoryRef.current = [];
    highFreqHistoryRef.current = [];
    colorIndepHistoryRef.current = [];
    blueRedRatioHistoryRef.current = [];
    spoofScoreRef.current = null;
    setSpoofWarning(null);
  }, []);

  const fetchLivenessChallenge = useCallback(async () => {
    try {
      const res = await api.get("/student/face/liveness-challenge");
      const data = res.data?.data;
      if (!data?.nonce || !data?.challenges?.length) {
        throw new Error("Invalid challenge");
      }
      setLivenessNonce(data.nonce);
      setLivenessChallenges(data.challenges);
      setChallengeIndex(0);
      livenessStartRef.current = Date.now();
      challengeStartRef.current = Date.now();
      baselinePoseRef.current = null;
      blinkFramesRef.current = 0;
      setStatusMessage(`Liveness: ${CHALLENGE_TEXT[data.challenges[0]]}`);
    } catch (err) {
      console.error("Liveness challenge error:", err);
      setStatusMessage("Không lấy được thử thách liveness");
    }
  }, []);

  const verifyLivenessOnServer = useCallback(async () => {
    const durationMs = Date.now() - livenessStartRef.current;
    const res = await api.post("/student/face/liveness-verify", {
      nonce: livenessNonceRef.current,
      results: livenessResultsRef.current,
      durationMs,
    });
    const token = res.data?.data?.livenessToken;
    if (!token) throw new Error("No liveness token");
    setLivenessToken(token);
    setLivenessPassed(true);
    setStatusMessage("Liveness đạt. Đang xác thực khuôn mặt...");
    frameCountRef.current = 0;
    matchCountRef.current = 0;
    // Reset anti-spoofing data để thu thập mới cho face matching phase
    landmarkHistoryRef.current = [];
    frameSimilarityHistoryRef.current = [];
    brightnessHistoryRef.current = [];
    highFreqHistoryRef.current = [];
    colorIndepHistoryRef.current = [];
    blueRedRatioHistoryRef.current = [];
    prevFrameRef.current = null;
    spoofScoreRef.current = null;
  }, []);

  const failLiveness = useCallback((message: string) => {
    setCheckInResult("failed");
    setResultMessage(message);
    setCurrentStep("result");
  }, []);

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

  // ===== SMOOTH RENDER LOOP (60fps) - chỉ vẽ, không detect =====
  const drawFrame = useCallback(() => {
    if (!isRunningRef.current) return;

    if (canvasRef.current && videoRef.current && smoothBoxRef.current) {
      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvasRef.current, displaySize);
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Lerp smooth box toward target box
        const target = lastBoxRef.current;
        const smooth = smoothBoxRef.current;
        if (target) {
          const t = 0.3; // interpolation speed
          smooth.x += (target.x - smooth.x) * t;
          smooth.y += (target.y - smooth.y) * t;
          smooth.width += (target.width - smooth.width) * t;
          smooth.height += (target.height - smooth.height) * t;
        }

        const box = smooth;
        const isSpoof = spoofScoreRef.current?.isSpoof;
        const matched = lastMatchedRef.current;
        const inLiveness = !livenessPassedRef.current;

        // Pick color
        const color = isSpoof ? "#f59e0b" : inLiveness ? "#FF7043" : matched ? "#22c55e" : "#ef4444";

        // Corner bracket style (modern look)
        const cornerLen = Math.min(25, box.width * 0.15);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        // Top-left
        ctx.beginPath(); ctx.moveTo(box.x, box.y + cornerLen); ctx.lineTo(box.x, box.y); ctx.lineTo(box.x + cornerLen, box.y); ctx.stroke();
        // Top-right
        ctx.beginPath(); ctx.moveTo(box.x + box.width - cornerLen, box.y); ctx.lineTo(box.x + box.width, box.y); ctx.lineTo(box.x + box.width, box.y + cornerLen); ctx.stroke();
        // Bottom-left
        ctx.beginPath(); ctx.moveTo(box.x, box.y + box.height - cornerLen); ctx.lineTo(box.x, box.y + box.height); ctx.lineTo(box.x + cornerLen, box.y + box.height); ctx.stroke();
        // Bottom-right
        ctx.beginPath(); ctx.moveTo(box.x + box.width - cornerLen, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height - cornerLen); ctx.stroke();

        // Thin connecting lines between corners
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.globalAlpha = 1;

        // Spoof warning label
        if (isSpoof) {
          ctx.fillStyle = "rgba(245, 158, 11, 0.85)";
          const labelW = 180;
          ctx.fillRect(box.x + (box.width - labelW) / 2, box.y - 30, labelW, 24);
          ctx.fillStyle = "white";
          ctx.font = "bold 12px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⚠ NGHI NGỜ GIAN LẬN", box.x + box.width / 2, box.y - 12);
        }
      }
    } else if (canvasRef.current && !smoothBoxRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, []);

  // ===== AI DETECTION LOOP (mỗi 200ms) - nặng nhưng chạy thưa =====
  const runDetection = useCallback(async () => {
    if (!isRunningRef.current || !videoRef.current || !modelsLoaded) return;

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.1 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setFaceDetected(true);
        faceLostCountRef.current = 0;
        lastDetectionRef.current = detection;

        // Update target box for smooth rendering
        if (videoRef.current) {
          const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
          const resized = faceapi.resizeResults(detection, displaySize);
          const b = resized.detection.box;
          lastBoxRef.current = { x: b.x, y: b.y, width: b.width, height: b.height };
          if (!smoothBoxRef.current) {
            smoothBoxRef.current = { ...lastBoxRef.current };
          }
        }

        // Anti-spoofing data collection
        if (videoRef.current) {
          const _frameData = getFrameData(videoRef.current);
          if (_frameData) {
            const _noseTip = detection.landmarks.positions[30];
            landmarkHistoryRef.current.push([_noseTip]);
            if (landmarkHistoryRef.current.length > SPOOF_HISTORY_FRAMES * 2) landmarkHistoryRef.current.shift();

            if (prevFrameRef.current) {
              const _sim = framesSimilarity(prevFrameRef.current, _frameData);
              frameSimilarityHistoryRef.current.push(_sim);
              if (frameSimilarityHistoryRef.current.length > SPOOF_HISTORY_FRAMES * 2) frameSimilarityHistoryRef.current.shift();
            }
            prevFrameRef.current = _frameData;

            const _brightness = getRegionBrightness(_frameData, detection.detection.box);
            brightnessHistoryRef.current.push(_brightness);
            if (brightnessHistoryRef.current.length > SPOOF_HISTORY_FRAMES * 2) brightnessHistoryRef.current.shift();

            const _hf = getHighFrequencyEnergy(_frameData, detection.detection.box);
            highFreqHistoryRef.current.push(_hf);
            if (highFreqHistoryRef.current.length > SPOOF_HISTORY_FRAMES * 2) highFreqHistoryRef.current.shift();

            const _ci = getColorChannelIndependence(_frameData, detection.detection.box);
            colorIndepHistoryRef.current.push(_ci);
            if (colorIndepHistoryRef.current.length > SPOOF_HISTORY_FRAMES * 2) colorIndepHistoryRef.current.shift();

            // So sánh ánh sáng vùng mặt vs 4 GÓC khung hình (phòng thật)
            const faceBox = detection.detection.box;
            const faceColor = getColorStats(_frameData, faceBox);
            const fw = _frameData.width;
            const fh = _frameData.height;
            const cornerSize = Math.floor(Math.min(fw, fh) * 0.15); // 15% góc
            // Lấy 4 góc khung hình
            const corners = [
              { x: 0, y: 0, width: cornerSize, height: cornerSize },                       // top-left
              { x: fw - cornerSize, y: 0, width: cornerSize, height: cornerSize },          // top-right
              { x: 0, y: fh - cornerSize, width: cornerSize, height: cornerSize },          // bottom-left
              { x: fw - cornerSize, y: fh - cornerSize, width: cornerSize, height: cornerSize }, // bottom-right
            ];
            let bgBlueSum = 0, bgRedSum = 0, bgCount = 0;
            for (const corner of corners) {
              const c = getColorStats(_frameData, corner);
              if (c.redRatio > 0) {
                bgBlueSum += c.blueRatio;
                bgRedSum += c.redRatio;
                bgCount++;
              }
            }
            if (faceColor.redRatio > 0 && bgCount > 0) {
              const faceBR = faceColor.blueRatio / faceColor.redRatio;
              const bgBR = (bgBlueSum / bgCount) / (bgRedSum / bgCount);
              const brDiff = Math.abs(faceBR - bgBR);
              blueRedRatioHistoryRef.current.push(brDiff);
              if (blueRedRatioHistoryRef.current.length > SPOOF_HISTORY_FRAMES * 2) blueRedRatioHistoryRef.current.shift();
              console.log("[LightDiff]", { faceBR: faceBR.toFixed(4), bgBR: bgBR.toFixed(4), diff: brDiff.toFixed(4) });
            }
          }
        }

        // ===== LIVENESS PHASE =====
        if (!livenessPassedRef.current) {
          const currentChallenge = livenessChallengesRef.current[challengeIndexRef.current];
          if (!currentChallenge) {
            setStatusMessage("Đang chuẩn bị liveness...");
          } else {
            if (Date.now() - challengeStartRef.current > CHALLENGE_TIMEOUT_MS) {
              failLiveness("Không hoàn thành thử thách liveness đúng thời gian.");
              return;
            }

            const positions = detection.landmarks.positions;
            const leftEye = positions.slice(36, 42);
            const rightEye = positions.slice(42, 48);
            const mouth = positions.slice(60, 68);
            const ear = (calcEAR(leftEye) + calcEAR(rightEye)) / 2;
            const mar = calcMAR(mouth);
            const pose = getPose(positions);

            // Kiểm tra vị trí trung lập (nhìn gần thẳng, miệng đóng)
            // pitch baseline ~0.55 khi nhìn thẳng, yaw ~0 khi nhìn thẳng
            const isNeutral = Math.abs(pose.yaw) < 0.12 && Math.abs(pose.pitch - 0.55) < 0.15 && mar < 0.45;

            // Phải về trung lập trước khi bắt đầu challenge mới
            if (waitingForNeutralRef.current) {
              if (isNeutral) {
                waitingForNeutralRef.current = false;
                baselinePoseRef.current = pose;
                challengeStartRef.current = Date.now();
                setStatusMessage(`Liveness: ${CHALLENGE_TEXT[currentChallenge]}`);
              } else {
                setStatusMessage("Nhìn thẳng vào camera...");
              }
            } else {
              if (!baselinePoseRef.current) baselinePoseRef.current = pose;

              // Kiểm tra hành động có đang đúng không
              let actionDetected = false;
              switch (currentChallenge) {
                case "BLINK": {
                  earHistoryRef.current.push(ear);
                  if (earHistoryRef.current.length > 20) earHistoryRef.current.shift();
                  if (ear < EAR_THRESHOLD) blinkFramesRef.current += 1;
                  if (earHistoryRef.current.length >= 3) {
                    const recent = earHistoryRef.current.slice(-6, -1);
                    if (recent.length >= 2) {
                      const baseline = recent.reduce((a, b) => a + b, 0) / recent.length;
                      if (ear < baseline * 0.75) blinkFramesRef.current += 1;
                    }
                  }
                  // Blink không cần giữ lâu, chỉ cần detect 1 lần
                  if (blinkFramesRef.current >= 1) actionDetected = true;
                  break;
                }
                case "OPEN_MOUTH": actionDetected = mar > MAR_THRESHOLD; break;
                case "TURN_LEFT": actionDetected = pose.yaw < (baselinePoseRef.current?.yaw || 0) - YAW_THRESHOLD; break;
                case "TURN_RIGHT": actionDetected = pose.yaw > (baselinePoseRef.current?.yaw || 0) + YAW_THRESHOLD; break;
                case "LOOK_UP": actionDetected = pose.pitch < (baselinePoseRef.current?.pitch || 0.55) - PITCH_THRESHOLD; break;
                case "LOOK_DOWN": actionDetected = pose.pitch > (baselinePoseRef.current?.pitch || 0.55) + PITCH_THRESHOLD; break;
              }

              // Đếm số frame giữ hành động liên tiếp
              if (actionDetected) {
                holdFramesRef.current += 1;
              } else {
                holdFramesRef.current = 0; // Reset nếu ngừng giữ
              }

              const holdProgress = Math.min(holdFramesRef.current / HOLD_FRAMES_REQUIRED, 1);
              const holdSeconds = (holdFramesRef.current * DETECT_INTERVAL_MS / 1000).toFixed(1);

              if (actionDetected && holdFramesRef.current < HOLD_FRAMES_REQUIRED) {
                setStatusMessage(`Liveness: ${CHALLENGE_TEXT[currentChallenge]} - Giữ (${holdSeconds}s)...`);
              } else {
                setStatusMessage(`Liveness: ${CHALLENGE_TEXT[currentChallenge]}`);
              }

              const passed = currentChallenge === "BLINK"
                ? actionDetected  // Blink không cần giữ
                : holdFramesRef.current >= HOLD_FRAMES_REQUIRED;

              if (passed) {
                livenessResultsRef.current[currentChallenge] = { pass: true, ts: Date.now() };
                const nextIndex = challengeIndexRef.current + 1;
                setChallengeIndex(nextIndex);
                baselinePoseRef.current = null;
                blinkFramesRef.current = 0;
                holdFramesRef.current = 0;

                if (nextIndex >= livenessChallengesRef.current.length) {
                  try { await verifyLivenessOnServer(); }
                  catch { failLiveness("Xác thực liveness thất bại. Vui lòng thử lại."); return; }
                } else {
                  // Yêu cầu về trung lập trước challenge tiếp theo
                  waitingForNeutralRef.current = true;
                  setStatusMessage("Nhìn thẳng vào camera...");
                }
              }
            }
          }
        }
        // ===== FACE MATCHING PHASE =====
        else {
          frameCountRef.current += 1;
          const matched = isMatch(detection.descriptor);
          if (matched) matchCountRef.current += 1;
          lastMatchedRef.current = matched;

          const currentProgress = Math.min((frameCountRef.current / REQUIRED_FRAMES) * 100, 100);
          const matchRate = frameCountRef.current > 0 ? Math.round((matchCountRef.current / frameCountRef.current) * 100) : 0;
          setProgress(currentProgress);

          if (frameCountRef.current < REQUIRED_FRAMES) {
            setStatusMessage(`Xác thực... ${matchRate}% khớp (${frameCountRef.current}/${REQUIRED_FRAMES})`);
          }

          // Check if done
          if (frameCountRef.current >= REQUIRED_FRAMES) {
            const finalMatchRate = matchCountRef.current / frameCountRef.current;
            const img = captureFrame();
            const spoof = spoofScoreRef.current;

            if (spoof?.isSpoof) {
              setFaceMatchResult("not_matched");
              setStatusMessage(`Phát hiện gian lận: ${spoof.reasons[0]}`);
              setTimeout(() => {
                setCapturedImage(img); isRunningRef.current = false; stopCamera();
                setCheckInResult("failed");
                setResultMessage(`Phát hiện hành vi gian lận!\n${spoof.reasons.join(", ")}\nVui lòng sử dụng khuôn mặt thật.`);
                setCurrentStep("result");
              }, 1000);
              return;
            }

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
        }
      } else {
        faceLostCountRef.current += 1;
        if (faceLostCountRef.current >= FACE_LOST_TOLERANCE) {
          setFaceDetected(false);
          smoothBoxRef.current = null;
          setStatusMessage("Đưa mặt vào camera");
        }
      }
    } catch (e) {
      console.error("Detection error:", e);
    }

    if (isRunningRef.current) {
      setTimeout(runDetection, DETECT_INTERVAL_MS);
    }
  }, [
    modelsLoaded,
    storedDescriptors,
    verifyLivenessOnServer,
    failLiveness,
  ]);

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
      
      const completed = Object.keys(livenessResultsRef.current).filter(
        (k) => livenessResultsRef.current[k]?.pass
      );

      const res = await api.post("/student/attendance/checkin", {
        slotId: currentSlotInfo.slotId,
        sessionId: currentSlotInfo.sessionId,
        code: code,
        faceImage: img,
        faceVerified: faceVerified,
        faceMatchRate: matchRate,
        location: userLocation,
        livenessToken: livenessTokenRef.current,
        livenessCompleted: completed,
        antiSpoofing: spoofScoreRef.current ? {
          passed: !spoofScoreRef.current.isSpoof,
          scores: spoofScoreRef.current.scores,
          reasons: spoofScoreRef.current.reasons,
        } : null,
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
    resetLivenessState();
    setCurrentStep("liveness");
  };

  // Effects
  useEffect(() => {
    if (currentStep === "location") checkLocation();
  }, [currentStep, checkLocation]);

  useEffect(() => {
    if (currentStep === "liveness" && modelsLoaded && !livenessStartedRef.current) {
      livenessStartedRef.current = true;
      resetLivenessState();
      startCamera().then(() => {
        setTimeout(() => {
          isRunningRef.current = true;
          setStatusMessage("Đưa mặt vào camera");
          runDetection();
          drawFrame();
        }, 500);
      });
      fetchLivenessChallenge();
    }

    if (currentStep !== "liveness") {
      livenessStartedRef.current = false;
    }
    return () => {
      isRunningRef.current = false;
      cancelAnimationFrame(animFrameRef.current);
      stopCamera();
    };
  }, [currentStep, modelsLoaded, runDetection, drawFrame, resetLivenessState, fetchLivenessChallenge]);

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

                  {spoofWarning && (
                    <div className="absolute top-14 left-3 right-3 bg-amber-500/90 text-white text-center py-2 px-3 rounded-lg text-sm font-semibold animate-pulse">
                      ⚠ {spoofWarning}
                    </div>
                  )}

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
