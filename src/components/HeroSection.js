import React from "react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <div className="bg-gradient-to-r from-secondary to-primary py-20">
      <div className="container mx-auto px-4 text-center">
        {/* 主標題 */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          ✨ 歡迎來到 PR 小說網 ✨
        </h1>

        {/* 副標題 */}
        <p className="text-lg md:text-xl text-white/90 mb-8">
          收藏經典與創意,發現新故事的魔法之地
        </p>

        {/* CTA 按鈕 */}
        <Link
          to="/tags"
          className="inline-block bg-pink hover:bg-pink/90 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          開始探索
        </Link>
      </div>
    </div>
  );
};

export default HeroSection;
