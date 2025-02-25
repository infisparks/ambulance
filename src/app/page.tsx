"use client";
import { useRef, useState, useEffect } from "react";
import { push, ref as dbRef } from "firebase/database";
import { uploadBytes, getDownloadURL, ref as storageRef } from "firebase/storage";
import { database, storage } from "../../firebase";

export default function Capture() {
  const [preview, setPreview] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [uploading, setUploading] = useState(false);
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
  }, [stream]);

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
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center mb-2">Emergency Capture</h1>
        <p className="text-gray-600 text-center mb-6">
          Capture emergency situation and send for approval.
        </p>
        <div className="mb-4">
          {/* Video feed from the camera */}
          <video ref={videoRef} autoPlay className="w-full rounded-md" />
          <button
            onClick={capturePhoto}
            className="mt-2 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            Capture Photo
          </button>
        </div>
        {preview && (
          <div className="mb-4">
            <img src={preview} alt="Preview" className="w-full rounded-md" />
          </div>
        )}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter Vehicle Number"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleUpload}
          disabled={uploading || !preview}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Send"}
        </button>
        {/* Hidden canvas for capturing the photo */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
