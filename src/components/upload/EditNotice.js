import React from "react";

export default function EditNotice() {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-blue-800 font-medium">
        💡 目前只能編輯基本資料。若要修改章節內容，請刪除後重新上傳。
      </p>
      <p className="text-sm text-blue-600 mt-1">
        ⏰ 升級 Firebase 後將支援線上章節編輯功能！
      </p>
    </div>
  );
}
