"use client";
import { useEffect, useState } from "react";
import { ref as dbRef, onValue, update } from "firebase/database";
import { database } from "../../../firebase";
import Image from "next/image";

interface DataItem {
  id: string;
  vehicleNumber: string;
  timestamp: string;
  imageUrl: string;
}

interface FirebaseRecord {
  vehicleNumber?: string;
  timestamp: string;
  imageUrl?: string;
}

export default function AdminPanel() {
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Listen to realtime updates from the "data" node in your DB
  useEffect(() => {
    const dataReference = dbRef(database, "data");
    const unsubscribe = onValue(dataReference, (snapshot) => {
      const data = snapshot.val();
      const items: DataItem[] = [];
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          const record = value as FirebaseRecord;
          items.push({
            id: key,
            vehicleNumber: record.vehicleNumber || "No Vehicle Number",
            timestamp: record.timestamp,
            imageUrl: record.imageUrl || "",
          });
        });
      }
      // Sort records by timestamp descending
      items.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setDataItems(items);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle LED update for approval/disapproval
  const handleLED = async (approved: boolean) => {
    try {
      const ledRef = dbRef(database, "led");
      await update(ledRef, { led: approved ? "on" : "off" });
      alert(`LED turned ${approved ? "on" : "off"}`);
    } catch (error) {
      console.error("Error updating LED:", error);
      alert("Failed to update LED status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Panel</h1>

        {/* Table view for larger screens */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dataItems.length > 0 ? (
                dataItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {item.imageUrl ? (
                        <div
                          className="relative w-16 h-16 cursor-pointer transition-transform hover:scale-105"
                          onClick={() => setModalImage(item.imageUrl)}
                        >
                          <Image
                            src={item.imageUrl}
                            alt="Submission"
                            layout="fill"
                            objectFit="cover"
                            className="rounded-md"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400">No Image</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {item.vehicleNumber}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center space-x-2">
                      <button
                        onClick={() => handleLED(true)}
                        className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleLED(false)}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                      >
                        Disapprove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    No submissions available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card view for mobile devices */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {dataItems.length > 0 ? (
            dataItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 rounded-lg shadow p-4 flex flex-col space-y-3"
              >
                <div className="flex justify-center">
                  {item.imageUrl ? (
                    <div
                      className="relative w-full h-48 cursor-pointer transition-transform hover:scale-105"
                      onClick={() => setModalImage(item.imageUrl)}
                    >
                      <Image
                        src={item.imageUrl}
                        alt="Submission"
                        layout="fill"
                        objectFit="cover"
                        className="rounded-md"
                      />
                    </div>
                  ) : (
                    <span className="text-gray-400">No Image</span>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-700">
                  <span className="block">Vehicle: {item.vehicleNumber}</span>
                  <span className="block">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-around">
                  <button
                    onClick={() => handleLED(true)}
                    className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleLED(false)}
                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                  >
                    Disapprove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">
              No submissions available.
            </div>
          )}
        </div>
      </div>

      {/* Modal for full screen image display */}
      {modalImage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75 p-4">
          <div className="relative max-w-3xl max-h-full">
            <div className="relative w-full h-auto">
              <Image
                src={modalImage}
                alt="Full view"
                layout="responsive"
                width={700}
                height={500}
                className="rounded-lg"
              />
            </div>
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
