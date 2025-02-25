// pages/admin.tsx
"use client"
import { useEffect, useState } from "react";
import { ref as dbRef, onValue, update } from "firebase/database";
import { database } from "../../../firebase";

interface DataItem {
  id: string;
  email?: string;
  timestamp: string;
  imageUrl?: string;
}

export default function AdminPanel() {
  const [dataItems, setDataItems] = useState<DataItem[]>([]);

  // Listen to realtime updates from the "data" node in your DB
  useEffect(() => {
    const dataReference = dbRef(database, "data");
    const unsubscribe = onValue(dataReference, (snapshot) => {
      const data = snapshot.val();
      const items: DataItem[] = [];
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          items.push({
            id: key,
            email: (value as any).email || "No Email",
            timestamp: (value as any).timestamp,
            imageUrl: (value as any).imageUrl || "",
          });
        });
      }
      // Optionally sort the records by timestamp descending
      items.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setDataItems(items);
    });

    return () => {
      // Clean up the listener on unmount
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
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Panel</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dataItems.length > 0 ? (
                dataItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleLED(true)}
                        className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded mr-2"
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
                    colSpan={3}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No submissions available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
