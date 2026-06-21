'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Upload, Scan, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface CameraScannerProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraScanner({ onCapture, onClose }: CameraScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Detect if device is mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error('Camera not supported in this browser. Use Choose File instead.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Camera access denied. Use Choose File to take a photo.');
    }
  }, []);

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    videoRef.current.srcObject = stream;
    void videoRef.current.play().catch((error) => {
      console.error('Video play error:', error);
    });
  }, [stream]);

  useEffect(() => {
    if (!isMobile || stream || capturedImage) return;
    void startCamera();
  }, [isMobile, stream, capturedImage, startCamera]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const processImage = async () => {
    if (!capturedImage || !canvasRef.current) return;

    setIsScanning(true);
    try {
      // Convert image to File
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Process with AI (this will happen in the upload handler)
      onCapture(file);
      toast.success('Document captured! Processing...');
      onClose();
    } catch (error) {
      console.error('Image processing error:', error);
      toast.error('Failed to process image');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setCapturedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // Direct upload for non-images
        onCapture(file);
        onClose();
      }
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChooseFile = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        console.error('File input ref not available');
        toast.error('File input not available. Please try again.');
      }
    }, 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Scan Document</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!stream && !capturedImage && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={startCamera}
                  className="flex-1"
                  leftIcon={<Camera className="w-5 h-5" />}
                >
                  Use Camera
                </Button>
                <Button
                  onClick={handleChooseFile}
                  variant="outline"
                  className="flex-1"
                  leftIcon={<Upload className="w-5 h-5" />}
                >
                  Choose File
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                {...(isMobile ? { capture: 'environment' } : {})}
                multiple={false}
              />
            </div>
          )}

          {stream && !capturedImage && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={capturePhoto}
                  className="flex-1"
                  leftIcon={<Camera className="w-5 h-5" />}
                >
                  Capture
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="space-y-4">
              <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured document"
                  className="w-full h-auto"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={processImage}
                  className="flex-1"
                  disabled={isScanning}
                  leftIcon={isScanning ? <Scan className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                >
                  {isScanning ? 'Processing...' : 'Process Document'}
                </Button>
                <Button
                  onClick={() => {
                    setCapturedImage(null);
                    if (stream) {
                      stopCamera();
                    }
                  }}
                  variant="outline"
                >
                  Retake
                </Button>
                <Button
                  onClick={handleChooseFile}
                  variant="outline"
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Choose Different
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

