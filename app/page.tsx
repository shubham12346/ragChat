"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();

      // Expecting: { sessionId: string }
      console.log("data--------", data);
      router.push(`/chat?sessionId=${data.sessionId}`);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-6 border rounded-lg">
        <h1 className="text-xl font-semibold text-center">
          📄 Upload a document
        </h1>

        <input
          type="file"
          accept=".pdf,.txt,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full"
        />

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload & Chat"}
        </button>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      </div>
    </div>
  );
}
