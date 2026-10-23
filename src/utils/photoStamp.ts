export interface WatermarkData {
  fullName: string;
  userCode: string;
  className: string;
  activityTitle: string;
  organizingUnit: string;
  gpsText?: string;
  timestamp?: string;
}

export function captureAndStampPhoto(
  videoElement: HTMLVideoElement,
  data: WatermarkData
): string {
  const canvas = document.createElement('canvas');
  const width = videoElement.videoWidth || 640;
  const height = videoElement.videoHeight || 480;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể khởi tạo bộ xử lý hình ảnh.');

  // Draw camera frame
  ctx.drawImage(videoElement, 0, 0, width, height);

  // Overlay gradient bar at bottom for high legibility
  const bannerHeight = Math.max(100, Math.floor(height * 0.28));
  const gradient = ctx.createLinearGradient(0, height - bannerHeight, 0, height);
  gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
  gradient.addColorStop(0.25, 'rgba(15, 23, 42, 0.75)');
  gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

  // Red & Yellow Youth Union brand accent ribbon
  ctx.fillStyle = '#0f4c81'; // Navy blue
  ctx.fillRect(0, height - bannerHeight + 25, 4, bannerHeight - 25);

  // Draw texts
  const nowStr = data.timestamp || new Date().toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const baseFontSize = Math.max(11, Math.floor(width * 0.024));

  // Title / Unit
  ctx.font = `bold ${baseFontSize + 2}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillStyle = '#fbbf24'; // Amber-400
  ctx.fillText('★ MINH CHỨNG ĐIỂM DANH THỰC ĐỊA - ĐOÀN KHOA CƠ KHÍ', 16, height - bannerHeight + 35);

  // Full Name & Code
  ctx.font = `bold ${baseFontSize + 1}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${data.fullName}  |  Mã ĐV: ${data.userCode}  |  ${data.className}`, 16, height - bannerHeight + 58);

  // Activity Title
  ctx.font = `normal ${baseFontSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillStyle = '#e2e8f0';
  const cleanTitle = data.activityTitle.length > 55 ? data.activityTitle.substring(0, 52) + '...' : data.activityTitle;
  ctx.fillText(`Hoạt động: ${cleanTitle}`, 16, height - bannerHeight + 78);

  // Timestamp & GPS
  ctx.font = `${baseFontSize - 1}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = '#94a3b8';
  const gpsInfo = data.gpsText ? `  ·  GPS: ${data.gpsText}` : '';
  ctx.fillText(`Thời gian: ${nowStr}${gpsInfo}`, 16, height - bannerHeight + 96);

  return canvas.toDataURL('image/jpeg', 0.85);
}
