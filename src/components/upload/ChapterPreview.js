import React from "react";

export default function ChapterPreview({ chapters }) {
  return (
    <div className="mt-4 max-h-60 overflow-y-auto space-y-1">
      {chapters.map((ch, idx) => (
        <div key={idx} className="text-sm text-gray-600 py-1 border-b">
          {ch.title} ({ch.wordCount?.toLocaleString() || 0} 字)
        </div>
      ))}
    </div>
  );
}
