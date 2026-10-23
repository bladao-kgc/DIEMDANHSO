import React, { useState, useEffect, useRef } from 'react';
import type { Activity, UserProfile, Attendance } from '../types/index.ts';
import { QRScannerHelper } from '../utils/qrScanner.ts';
import { captureAndStampPhoto } from '../utils/photoStamp.ts';
import { api } from '../services/api.ts';
import { 
  Camera, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  SwitchCamera,
  Sparkles,
  Award
} from 'lucide-react';

interface StudentScannerModalProps {
  user: UserProfile;
  activeActivities: Activity[];
  onClose: () => void;
  onSuccess: (attendance: Attendance, awardedDays: number) => void;
}

type CheckinStep = 'scan_qr' | 'verify_gps' | 'capture_photo' | 'submitting' | 'completed';

export const StudentScannerModal: React.FC<StudentScannerModalProps> = ({
  user,
  activeActivities,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<CheckinStep>('scan_qr');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    activeActivities.length === 1 ? activeActivities[0] : null
  );
  const [scannedToken, setScannedToken] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingToken, setIsProcessingToken] = useState<boolean>(false);

  // GPS state
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Photo state
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Result state
  const [resultMessage, setResultMessage] = useState<string>('');
  const [awardedDays, setAwardedDays] = useState<number>(0);
  const [submittedAttendance, setSubmittedAttendance] = useState<Attendance | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const photoVideoRef = useRef<HTMLVideoElement>(null);
  const scannerHelperRef = useRef<QRScannerHelper | null>(null);
  const photoStreamRef = useRef<MediaStream | null>(null);

  // Initialize QR scanner on mount or step change
  useEffect(() => {
    if (step === 'scan_qr') {
      startQRScanner();
    } else {
      stopQRScanner();
    }
    return () => {
      stopQRScanner();
      stopPhotoCamera();
    };
  }, [step, facingMode]);

  const startQRScanner = async () => {
    setCameraError(null);
    if (!scannerHelperRef.current) {
      scannerHelperRef.current = new QRScannerHelper();
    }
    if (!videoRef.current) return;

    try {
      await scannerHelperRef.current.startScanning(videoRef.current, facingMode, (token) => {
        handleTokenDetected(token);
      });
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError('Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera trong cài đặt trình duyệt.');
    }
  };

  const stopQRScanner = () => {
    if (scannerHelperRef.current) {
      scannerHelperRef.current.stopScanning();
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Called when QR code is read from real camera
  const handleTokenDetected = async (token: string) => {
    if (isProcessingToken) return;
    setIsProcessingToken(true);
    setScannedToken(token);

    // Identify which activity this token belongs to
    // Token format: KGCQR_<actId>_<timestamp>_<hash>
    let matchedActivity: Activity | undefined = undefined;
    for (const act of activeActivities) {
      if (token.includes(act.id)) {
        matchedActivity = act;
        break;
      }
    }

    if (!matchedActivity && selectedActivity) {
      matchedActivity = selectedActivity;
    }

    if (!matchedActivity) {
      alert('Mã QR không khớp với hoạt động đang mở nào trong hệ thống!');
      setIsProcessingToken(false);
      return;
    }

    setSelectedActivity(matchedActivity);
    stopQRScanner();

    // Determine next step
    if (matchedActivity.gps_required) {
      setStep('verify_gps');
      runGpsVerification(matchedActivity);
    } else if (matchedActivity.photo_required) {
      setStep('capture_photo');
      startPhotoCamera();
    } else {
      submitCheckin({ activity: matchedActivity, token, coords: undefined, photo: undefined });
    }
  };

  // Demo simulator helper: Allow student to test check-in directly
  const handleSimulateScan = async (act: Activity) => {
    try {
      const tokenData = await api.getQRToken(act.id);
      handleTokenDetected(tokenData.token);
    } catch (e: any) {
      alert('Không thể lấy mã QR hoạt động: ' + (e.message || ''));
    }
  };

  // --- GPS STEP ---
  const runGpsVerification = (act: Activity) => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setGpsCoords(coords);

        const actLat = act.latitude || 10.01254;
        const actLng = act.longitude || 105.08092;
        const dist = calculateDistance(coords.latitude, coords.longitude, actLat, actLng);
        setGpsDistance(dist);
        setGpsLoading(false);

        const allowedRadius = act.gps_radius_meters || 150;
        if (dist > allowedRadius) {
          setGpsError(`Khoảng cách hiện tại là ${Math.round(dist)}m, vượt quá bán kính cho phép (${allowedRadius}m).`);
        }
      },
      (err) => {
        setGpsLoading(false);
        // If GPS is blocked or failed, give clear guidance or option to use KGC default in demo
        setGpsError(`Không thể lấy tọa độ GPS (${err.message}). Vui lòng bật định vị thiết bị.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Demo helper: snap to valid KGC location if testing indoors
  const handleUseDemoLocation = () => {
    if (!selectedActivity) return;
    const coords = {
      latitude: selectedActivity.latitude || 10.01254,
      longitude: selectedActivity.longitude || 105.08092,
      accuracy: 5,
    };
    setGpsCoords(coords);
    setGpsDistance(15);
    setGpsError(null);
  };

  const handleProceedAfterGps = () => {
    if (!selectedActivity) return;
    if (selectedActivity.photo_required) {
      setStep('capture_photo');
      startPhotoCamera();
    } else {
      submitCheckin({
        activity: selectedActivity,
        token: scannedToken,
        coords: gpsCoords || undefined,
        photo: undefined,
      });
    }
  };

  // --- PHOTO PROOF STEP ---
  const startPhotoCamera = async () => {
    setPhotoError(null);
    try {
      photoStreamRef.current = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if (photoVideoRef.current) {
        photoVideoRef.current.srcObject = photoStreamRef.current;
        photoVideoRef.current.setAttribute('playsinline', 'true');
        await photoVideoRef.current.play();
      }
    } catch (e: any) {
      console.warn('Photo camera failed:', e);
      setPhotoError('Không thể mở camera để chụp ảnh minh chứng. Vui lòng cấp quyền.');
    }
  };

  const stopPhotoCamera = () => {
    if (photoStreamRef.current) {
      photoStreamRef.current.getTracks().forEach((track) => track.stop());
      photoStreamRef.current = null;
    }
  };

  const handleCapturePhoto = () => {
    if (!photoVideoRef.current || !selectedActivity) return;

    try {
      const stampedUrl = captureAndStampPhoto(photoVideoRef.current, {
        fullName: user.full_name,
        userCode: user.code,
        className: user.class_name,
        activityTitle: selectedActivity.title,
        organizingUnit: selectedActivity.organizing_unit,
        gpsText: gpsCoords ? `${gpsCoords.latitude.toFixed(5)}, ${gpsCoords.longitude.toFixed(5)}` : undefined,
      });
      setPhotoBase64(stampedUrl);
      stopPhotoCamera();
    } catch (err: any) {
      alert('Lỗi chụp ảnh: ' + err.message);
    }
  };

  const handleRetakePhoto = () => {
    setPhotoBase64(null);
    startPhotoCamera();
  };

  const handleProceedAfterPhoto = () => {
    if (!selectedActivity || !photoBase64) return;
    submitCheckin({
      activity: selectedActivity,
      token: scannedToken,
      coords: gpsCoords || undefined,
      photo: photoBase64,
    });
  };

  // --- FINAL SUBMISSION TO SERVER ---
  const submitCheckin = async (params: {
    activity: Activity;
    token: string;
    coords?: { latitude: number; longitude: number; accuracy?: number };
    photo?: string;
  }) => {
    setStep('submitting');
    try {
      const result = await api.checkIn({
        activity_id: params.activity.id,
        token: params.token,
        gpsCoords: params.coords,
        photoBase64: params.photo,
      });

      setResultMessage(result.message);
      setAwardedDays(result.awardedDays);
      setSubmittedAttendance(result.attendance);
      setStep('completed');
      onSuccess(result.attendance, result.awardedDays);
    } catch (err: any) {
      alert(err.message || 'Lỗi xác thực máy chủ!');
      setStep('scan_qr');
      setIsProcessingToken(false);
    }
  };

  // Helper distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 bg-blue-900 px-4 py-4 text-white sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-xs font-black text-blue-950">
              ĐV
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-tight sm:text-base">
                {step === 'scan_qr' && 'Quét mã QR Điểm danh'}
                {step === 'verify_gps' && 'Xác minh vị trí thực địa GPS'}
                {step === 'capture_photo' && 'Chụp ảnh minh chứng trực tiếp'}
                {step === 'submitting' && 'Máy chủ đang xác thực...'}
                {step === 'completed' && 'Điểm danh thành công!'}
              </h3>
              <span className="block truncate text-[11px] text-blue-200">
                {user.full_name} · {user.code} ({user.class_name})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* STEP 1: SCAN QR */}
          {step === 'scan_qr' && (
            <div className="flex flex-col items-center">
              {/* Camera Video Viewport */}
              <div className="relative w-full aspect-square max-w-[340px] bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-300 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Aiming crosshair frame */}
                <div className="absolute inset-8 border-2 border-amber-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1"></span>
                    <span className="w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1"></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1"></span>
                    <span className="w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1"></span>
                  </div>
                </div>

                {/* Scan line effect */}
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-amber-400 shadow-[0_0_12px_#fbbf24] animate-pulse pointer-events-none" />

                {/* Camera switch button */}
                <button
                  onClick={toggleCamera}
                  className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-slate-800 transition-colors shadow-md border border-white/20"
                  title="Đổi camera trước/sau"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              </div>

              {cameraError && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              <p className="mt-3 text-xs text-slate-500 text-center">
                Hướng camera điện thoại về màn hình chiếu để nhận diện mã QR động tự động.
              </p>

              {/* Simulation fallback for Demo */}
              <div className="mt-4 pt-4 border-t border-slate-200 w-full text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Chế độ thử nghiệm không có camera hoặc thử nhanh
                </span>
                <div className="flex flex-col gap-2">
                  {activeActivities.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => handleSimulateScan(act)}
                      className="px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-900 border border-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between text-left"
                    >
                      <span className="line-clamp-1">{act.title}</span>
                      <span className="font-mono text-amber-600 shrink-0 font-bold ml-2">+{act.ctxh_days} ngày</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GPS VERIFICATION */}
          {step === 'verify_gps' && selectedActivity && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin className="w-8 h-8 animate-bounce" />
              </div>

              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Kiểm tra vị trí GPS tại {selectedActivity.location}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Yêu cầu bán kính cho phép: <strong>{selectedActivity.gps_radius_meters}m</strong>
                </p>
              </div>

              {gpsLoading ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-xs text-slate-700">Đang thu thập tín hiệu vệ tinh GPS...</span>
                </div>
              ) : gpsDistance !== null ? (
                <div
                  className={`p-4 rounded-2xl border w-full text-left space-y-2 ${
                    gpsDistance <= (selectedActivity.gps_radius_meters || 150)
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">
                      {gpsDistance <= (selectedActivity.gps_radius_meters || 150)
                        ? '✓ Vị trí đạt yêu cầu'
                        : '✕ Vị trí ngoài phạm vi'}
                    </span>
                    <span className="font-mono font-bold text-xs">
                      Cách địa điểm: {Math.round(gpsDistance)}m
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Tọa độ của bạn: {gpsCoords?.latitude.toFixed(5)}, {gpsCoords?.longitude.toFixed(5)}
                  </div>
                </div>
              ) : null}

              {gpsError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex flex-col gap-2 border border-red-200 text-left w-full">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{gpsError}</span>
                  </div>
                  <button
                    onClick={handleUseDemoLocation}
                    className="self-end text-[11px] font-bold text-blue-800 underline hover:text-blue-900"
                  >
                    [Thử nghiệm]: Gán tọa độ trường CĐ Kiên Giang (Cơ sở 425 Mạc Cửu)
                  </button>
                </div>
              )}

              <div className="w-full flex gap-3 pt-2">
                <button
                  onClick={() => runGpsVerification(selectedActivity)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                >
                  Đo lại vị trí
                </button>
                <button
                  onClick={handleProceedAfterGps}
                  disabled={gpsDistance === null || gpsDistance > (selectedActivity.gps_radius_meters || 150)}
                  className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PHOTO PROOF */}
          {step === 'capture_photo' && selectedActivity && (
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-700 mb-2">
                Chụp ảnh minh chứng trực tiếp (Tự động đóng dấu thông tin thực địa)
              </span>

              {/* Live Preview or Captured Photo */}
              <div className="relative w-full aspect-square max-w-[340px] bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-300 shadow-md flex items-center justify-center">
                {!photoBase64 ? (
                  <>
                    <video
                      ref={photoVideoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="absolute bottom-3 left-3 right-3 text-center pointer-events-none">
                      <span className="bg-slate-900/75 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[11px]">
                        Hướng camera chụp khuôn mặt hoặc bối cảnh hoạt động
                      </span>
                    </div>
                  </>
                ) : (
                  <img
                    src={photoBase64}
                    alt="Captured Proof"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {photoError && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{photoError}</span>
                </div>
              )}

              {/* Controls */}
              <div className="w-full mt-4 flex gap-3">
                {!photoBase64 ? (
                  <button
                    onClick={handleCapturePhoto}
                    className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    Chụp ảnh ngay
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleRetakePhoto}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Chụp lại
                    </button>
                    <button
                      onClick={handleProceedAfterPhoto}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                    >
                      Xác nhận nộp minh chứng
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: SUBMITTING */}
          {step === 'submitting' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
              <div>
                <h4 className="font-bold text-base text-slate-900">Máy chủ đang xác thực...</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Kiểm tra token QR động · Kiểm tra chống trùng · Xác nhận ngày CTXH
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: COMPLETED */}
          {step === 'completed' && submittedAttendance && (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                  ĐIỂM DANH HỢP LỆ THÀNH CÔNG!
                </span>
                <h4 className="font-bold text-lg text-slate-900 mt-1">
                  {submittedAttendance.activity_title}
                </h4>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] text-amber-800 uppercase font-bold block">
                      Tích lũy ngày Công tác xã hội
                    </span>
                    <span className="text-xl font-extrabold text-blue-900 font-mono">
                      +{awardedDays} ngày CTXH
                    </span>
                  </div>
                </div>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>

              <div className="w-full text-left bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 text-slate-600">
                <div>
                  <strong>Thời gian:</strong> {new Date(submittedAttendance.checkin_time).toLocaleString('vi-VN')}
                </div>
                <div>
                  <strong>Trạng thái:</strong> <span className="text-emerald-700 font-semibold">Đã xác thực phía máy chủ</span>
                </div>
                {submittedAttendance.gps_verified && (
                  <div>
                    <strong>GPS:</strong> Đạt (cách {submittedAttendance.gps_distance_meters}m)
                  </div>
                )}
                {submittedAttendance.photo_stamped && (
                  <div>
                    <strong>Minh chứng:</strong> Đã lưu trữ ảnh đóng dấu điện tử
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
