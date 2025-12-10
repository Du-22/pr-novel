//小說資料
export const mockNovels = [
  {
    id: "novel-001",
    title: "七彩魔女學徒",
    author: "陳默",
    summary:
      "阿黛爾入讀七彩學院,卻只擁有「大地棕色」魔法。她必須通過火焰、月光和迷宮等試煉,在質疑中學會接納自我,證明她的棕色才是承載一切力量的根基。",
    coverImage: "/images/covers/rainbow-witch.png",
    tags: ["校園", "奇幻"],
    txtFile: "/data/novels/七彩魔女學徒.txt",
    createdAt: "2024-06-15",
    stats: { views: 1250, favorites: 89 },
  },
  {
    id: "novel-002",
    title: "巨木之心",
    author: "李清風",
    summary:
      "森語聽者艾琳聽到巨木老祖母的求救,發現森林正被「腐朽之疫」吞噬。她必須找到生命核心「巨木之心」並修補其裂痕,以自身的希望歌聲,帶來森林的重生。",
    coverImage: "https://source.unsplash.com/400x500/?forest",
    tags: ["冒險", "奇幻"],
    txtFile: "/data/novels/巨木之心.txt",
    createdAt: "2024-07-03",
    stats: { views: 10, favorites: 76 },
  },
  {
    id: "novel-003",
    title: "灰燼王子",
    author: "張曉宇",
    summary:
      "里奧王子因「灰燼詛咒」變成活雕像被遺忘。灰燼魔法師艾拉發現里奧的詛咒是政治陰謀。她潛入廢棄城堡,必須在里奧徹底化為塵土前,打破詛咒,揭露真相。",
    coverImage: "https://source.unsplash.com/400x500/?castle",
    tags: ["奇幻", "浪漫"],
    txtFile: "/data/novels/灰燼王子.txt",
    createdAt: "2024-07-20",
    stats: { views: 1430, favorites: 102 },
  },
  {
    id: "novel-004",
    title: "狐狸新娘",
    author: "王雅婷",
    summary:
      "人類畫家李景被紅尾狐族繼承人紅葉選為新郎。他必須通過狐嫁考驗,並用他的愛與畫筆,幫助紅葉彌合妖界與人界之間不斷擴大的空間裂縫。",
    coverImage: "https://source.unsplash.com/400x500/?fox",
    tags: ["妖怪", "奇幻", "浪漫"],
    txtFile: "/data/novels/狐狸新娘.txt",
    createdAt: "2024-08-05",
    stats: { views: 1105, favorites: 95 },
  },
  {
    id: "novel-005",
    title: "花木蘭：影與鋼之歌",
    author: "劉芳",
    summary:
      "木蘭代父從軍,卻捲入帝國與柔然人背後的「影」之陰謀。她必須在戰場上證明自己,並與神秘的「鋼之影」組織對抗,保衛的不僅是長城,更是帝國的靈魂。",
    coverImage: "https://source.unsplash.com/400x500/?warrior",
    tags: ["武俠", "奇幻"],
    txtFile: "/data/novels/花木蘭：影與鋼之歌.txt",
    createdAt: "2024-08-22",
    stats: { views: 1320, favorites: 110 },
  },
  {
    id: "novel-006",
    title: "海底圖書館",
    author: "陳海",
    summary:
      "女孩艾莉絲在海邊發現一本奇書,引領她來到神祕的「海底圖書館」。她在那裡結識了海族圖書管理員,並發現圖書館建立的真正目的:封印一本記載著希望與黑暗的「最終書頁」,最終引來海巫婆的爭奪。",
    coverImage: "https://source.unsplash.com/400x500/?underwater,books",
    tags: ["童話", "冒險"],
    txtFile: "/data/novels/海底圖書館.txt",
    createdAt: "2024-09-10",
    stats: { views: 1180, favorites: 87 },
  },
  {
    id: "novel-007",
    title: "海霧之島：浦島新傳",
    author: "林海",
    summary:
      "漁夫海人意外救下龍宮信使海龜。他踏上尋找失落的浦島傳說之路,捲入海族與陸地之間的千年戰爭,並在時間的迷霧中,找回自己的真實身份與海族語言。",
    coverImage: "https://source.unsplash.com/400x500/?island,fog",
    tags: ["奇幻", "冒險"],
    txtFile: "/data/novels/海霧之島：浦島新傳.txt",
    createdAt: "2024-09-28",
    stats: { views: 1275, favorites: 93 },
  },
  {
    id: "novel-008",
    title: "雪女的春天",
    author: "雪莉",
    summary:
      "雪女凝霜救了藥師蘇白,兩人結下不解之緣。凝霜在凡間的溫暖中學會愛,卻因此失去對寒冰力量的控制,最終她必須對抗冰雪之源的守護者,爭取她留下的春天。",
    coverImage: "https://source.unsplash.com/400x500/?snow,woman",
    tags: ["奇幻", "浪漫", "東方", "妖怪"],
    txtFile: "/data/novels/雪女的春天.txt",
    createdAt: "2024-10-15",
    stats: { views: 1150, favorites: 90 },
  },
  {
    id: "novel-009",
    title: "森林旅店怪談錄",
    author: "周子墨",
    summary:
      "小女孩莉莉誤入霧之息旅店,發現這是一間接待來自各維度旅者的中轉站。她在這裡結識了奇特客人,並幫助旅店主人米可,共同維護這個充滿魔力的歇腳處。",
    coverImage: "https://source.unsplash.com/400x500/?forest,hotel",
    tags: ["溫馨", "奇幻"],
    txtFile: "/data/novels/森林旅店怪談錄.txt",
    createdAt: "2024-10-30",
    stats: { views: 1050, favorites: 85 },
  },
  {
    id: "novel-010",
    title: "猴王再起：西遊後記",
    author: "吳天行",
    summary:
      "鬥戰勝佛孫悟空在太平盛世中感到無趣。當一場神祕的灰霧危機來襲,他必須重新喚醒齊天大聖的狂傲戰意,解開佛法束縛,阻止一個來自三界的古老威脅。",
    coverImage: "https://source.unsplash.com/400x500/?monkey,king",
    tags: ["奇幻", "修仙"],
    txtFile: "/data/novels/猴王再起：西遊後記.txt",
    createdAt: "2024-11-12",
    stats: { views: 1400, favorites: 120 },
  },
  {
    id: "novel-011",
    title: "雲端披薩店",
    author: "陳美玲",
    summary:
      "莉歐在平流層經營「雲酥皮披薩店」,專門為眾神與精靈送外賣。他必須用創意美食和溫暖人情,應對雷神的訂位、雲精靈的罷工,以及烤爐暴走等魔幻日常。",
    coverImage: "https://source.unsplash.com/400x500/?pizza,clouds",
    tags: ["喜劇", "溫馨"],
    txtFile: "/data/novels/雲端披薩店.txt",
    createdAt: "2024-11-25",
    stats: { views: 1230, favorites: 88 },
  },
  {
    id: "novel-012",
    title: "影子市集",
    author: "吳夢琪",
    summary:
      "林曜發現午夜開啟的影子市集,這裡交易著人類的慾望與記憶。當他面對影傀儡師,發現自己叛逆的影子竟是為了保護他最珍貴的記憶時,他必須學會接納完整的自我。",
    coverImage: "https://source.unsplash.com/400x500/?shadow,market",
    tags: ["奇幻", "都市"],
    txtFile: "/data/novels/影子市集.txt",
    createdAt: "2024-12-01",
    stats: { views: 1100, favorites: 80 },
  },
  {
    id: "novel-013",
    title: "龍燈小鎮的星夜祭",
    author: "林若溪",
    summary:
      "林墨回鄉整理外婆遺物,發現一盞有生命的龍燈,捲入守護小鎮古老榕樹的任務。他必須在星夜祭前,對抗偷獵者與榕樹的腐敗願望,成為新的提燈者。",
    coverImage: "https://source.unsplash.com/400x500/?lantern,festival",
    tags: ["奇幻", "都市"],
    txtFile: "/data/novels/龍燈小鎮的星夜祭.txt",
    createdAt: "2024-12-08",
    stats: { views: 1150, favorites: 92 },
  },
  {
    id: "novel-014",
    title: "鯨歌少女",
    author: "張婉",
    summary:
      "少女林澈能聽到深海的「鯨歌」。她必須學會與海洋共鳴的古老旋律,喚醒沉睡的巨鯨阿古斯,並以她的歌聲作為橋樑,平衡海洋之主的力量與人類世界的心靈。",
    coverImage: "https://source.unsplash.com/400x500/?whale,ocean",
    tags: ["奇幻", "海洋"],
    txtFile: "/data/novels/鯨歌少女.txt",
    createdAt: "2024-12-15",
    stats: { views: 1200, favorites: 100 },
  },
  {
    id: "novel-015",
    title: "魔法郵差的最後一封信",
    author: "李明",
    summary:
      "魔法郵差亞倫的工作是投遞寄往時空彼端的信件。當他收到一封來自年輕自己的信時,他必須在時間回收者來臨前,完成這項最具挑戰性、關於自我救贖的投遞。",
    coverImage: "https://source.unsplash.com/400x500/?magic,letter",
    tags: ["溫馨", "冒險"],
    txtFile: "/data/novels/魔法郵差的最後一封信.txt",
    createdAt: "2024-12-20",
    stats: { views: 1300, favorites: 110 },
  },
];

// 計算每個標籤的數量並排序 (由多到少)
const tagCounts = {};
mockNovels.forEach((novel) => {
  novel.tags.forEach((tag) => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  });
});

export const allTags = Object.keys(tagCounts).sort((a, b) => {
  // 先按數量排序 (由多到少)
  if (tagCounts[b] !== tagCounts[a]) {
    return tagCounts[b] - tagCounts[a];
  }
  // 數量相同時按字母排序
  return a.localeCompare(b);
});
