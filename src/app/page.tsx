// pages/capture.tsx
"use client"
import { useState } from "react";
import { push, ref as dbRef } from "firebase/database";
import { uploadBytes, getDownloadURL, ref as storageRef } from "firebase/storage";
import { database, storage } from "./../../firebase";

export default function Capture() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Handle file selection from the camera or file system
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  // Upload image to Firebase Storage then save its URL with a timestamp to Realtime Database
  const handleUpload = async () => {
    if (!file) return alert("Please capture a photo first.");
    setUploading(true);
    try {
      const fileName = `${file.name}-${Date.now()}`;
      const imgRef = storageRef(storage, `images/${fileName}`);
      await uploadBytes(imgRef, file);
      const downloadURL = await getDownloadURL(imgRef);

      // Push image URL and timestamp to Realtime Database
      await push(dbRef(database, "data"), {
        imageUrl: downloadURL,
        timestamp: new Date().toISOString(),
      });

      alert("Upload successful!");
      setFile(null);
      setPreview(null);
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
          Capture emergency situation and send to get approval.
        </p>
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        {preview && (
          <div className="mb-4">
            <img src={preview} alt="Preview" className="w-full rounded-md" />
          </div>
        )}
        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Send"}
        </button>
      </div>
    </div>
  );
}
