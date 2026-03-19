import React from "react";

export default function EditNotice() {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-blue-800 font-medium">
        💡 目前只能編輯基本資料。若要修改章節內容，請刪除後重新上傳。
      </p>
      <p className="text-sm text-blue-600 mt-1">
        若需修改章節內容，請刪除整本後重新上傳。
      </p>
    </div>
  );
}
