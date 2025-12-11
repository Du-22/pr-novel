import React from "react";

export default function ChapterInfo({ chapters }) {
  // 計算總字數
  const getTotalWords = () => {
    if (!chapters || chapters.length === 0) return 0;
    return chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-dark mb-4">章節資訊（唯讀）</h2>
      <div className="space-y-2 text-gray-700">
        <p>
          共 <span className="font-semibold text-dark">{chapters.length}</span>{" "}
          章
        </p>
        <p>
          總字數：
          <span className="font-semibold text-dark">
            {getTotalWords().toLocaleString()}
          </span>{" "}
          字
        </p>
        <p className="text-sm text-gray-500 mt-3">
          💡 章節內容無法編輯。若需修改，請刪除此小說後重新上傳。
        </p>
      </div>
    </div>
  );
}
