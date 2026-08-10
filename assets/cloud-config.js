// ============================================================
// 云端课程评价配置（Supabase）
// ------------------------------------------------------------
// 已启用云端共享评价。数据表与 RLS 策略已在 Supabase 中创建完成。
// 注意：publishable key 用于匿名公开读取/提交评价（仅限 SELECT/INSERT），
// 请勿放置数据库的 service_role secret key。
// ============================================================
window.CLOUD_CONFIG = {
  supabaseUrl: "https://xifkjcdpbyeknrhiknyb.supabase.co",
  supabaseAnonKey: "sb_publishable_Yf3PoJ0hFDELzmackZF_BQ_aqdw2k-e",
};
