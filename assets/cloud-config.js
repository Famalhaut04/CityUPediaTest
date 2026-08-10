// ============================================================
// 云端课程评价配置（Supabase）
// ------------------------------------------------------------
// 填入下面的两个参数即可启用“云端共享评价”：
//   1. 在 https://supabase.com 注册免费账号并创建项目
//   2. 打开项目 Dashboard → Settings → API，复制 Project URL 与 anon public key
//   3. 在 SQL Editor 中执行 CLOUD_DATABASE.md 里的建表 SQL
//   4. 将下面的 supabaseUrl / supabaseAnonKey 替换为你的值
//
// 未配置（保持 null）时网站自动回退到“仅本机保存”模式，不影响其他功能。
// 注意：anon key 用于匿名公开读写评价，请勿放置数据库的 service_role key。
// ============================================================
window.CLOUD_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
};
