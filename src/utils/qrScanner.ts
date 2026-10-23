import jsQR from 'jsqr';

export interface ScanResult {
  data: string;
}

export class QRScannerHelper {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isScanning: boolean = false;
  private onResultCallback: ((result: string) => void) | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  public async startScanning(
    videoElement: HTMLVideoElement,
    facingMode: 'environment' | 'user' = 'environment',
    onResult: (result: string) => void
  ): Promise<void> {
    this.stopScanning();
    this.video = videoElement;
    this.onResultCallback = onResult;
    this.isScanning = true;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      this.video.srcObject = this.stream;
      this.video.setAttribute('playsinline', 'true');
      await this.video.play();
      this.tick();
    } catch (err) {
      this.isScanning = false;
      throw err;
    }
  }

  private tick = () => {
    if (!this.isScanning || !this.video || !this.ctx) return;

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && code.data.trim().length > 0) {
        if (this.onResultCallback) {
          this.onResultCallback(code.data);
          return; // Pause or stop after finding valid code
        }
      }
    }

    if (this.isScanning) {
      this.animationFrameId = requestAnimationFrame(this.tick);
    }
  };

  public stopScanning(): void {
    this.isScanning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }
}
