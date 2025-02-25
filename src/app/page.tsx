"use client";
import { useRef, useState, useEffect } from "react";
import { push, ref as dbRef } from "firebase/database";
import { uploadBytes, getDownloadURL, ref as storageRef } from "firebase/storage";
import { database, storage } from "../../firebase";

export default function Capture() {
  const [preview, setPreview] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Start the camera when the component mounts
  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        alert("Unable to access the camera.");
      }
    }
    startCamera();

    return () => {
      // Clean up the camera stream on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Capture a photo from the live video feed
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      setPreview(dataUrl);
      // Show overlay for preview and vehicle input
      setShowOverlay(true);
    }
  };

  // Upload the captured image to Firebase Storage and save metadata to Realtime Database
  const handleUpload = async () => {
    if (!preview) return alert("Please capture a photo first.");
    if (!vehicleNumber.trim())
      return alert("Please enter the vehicle number.");
    setUploading(true);
    try {
      // Convert the data URL to a Blob
      const response = await fetch(preview);
      const blob = await response.blob();
      const fileName = `photo-${Date.now()}.png`;
      const imgRef = storageRef(storage, `images/${fileName}`);
      await uploadBytes(imgRef, blob);
      const downloadURL = await getDownloadURL(imgRef);

      // Save image URL, timestamp, and vehicle number to Realtime Database
      await push(dbRef(database, "data"), {
        imageUrl: downloadURL,
        timestamp: new Date().toISOString(),
        vehicleNumber: vehicleNumber.trim(),
      });

      alert("Upload successful!");
      setPreview(null);
      setVehicleNumber("");
      setShowOverlay(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black">
      {/* Full-screen video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Capture button overlayed on the video */}
      {!showOverlay && (
        <div className="absolute inset-0 flex items-end justify-center pb-10">
          <button
            onClick={capturePhoto}
            className="bg-green-600 text-white py-3 px-6 rounded-full text-lg shadow-lg hover:bg-green-700 transition"
          >
            Capture Photo
          </button>
        </div>
      )}

      {/* Overlay for preview and vehicle number input */}
      {showOverlay && preview && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center p-4">
          <img src={preview} alt="Captured" className="w-full max-h-3/4 object-contain rounded-md mb-4" />
          <input
            type="text"
            placeholder="Enter Vehicle Number"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            className="w-full max-w-sm p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <div className="flex space-x-4">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Send"}
            </button>
            <button
              onClick={() => {
                setShowOverlay(false);
                setPreview(null);
              }}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Hidden canvas for capturing the photo */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
