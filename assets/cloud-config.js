// ============================================================
// 云端课程评价配置（Supabase）
// ------------------------------------------------------------
// 已启用云端共享评价。数据表与 RLS 策略已在 Supabase 中创建完成。
//
// adminEmail：管理员邮箱。管理员可删除任意评价；普通用户只能删除
// 自己提交的评价（通过浏览器生成的 user_key 识别）。
// 需要先在 Supabase Dashboard → Authentication → Users 中创建该邮箱
// 的登录账号，并将邮箱填入此处，同时执行 CLOUD_DATABASE.md 中的
// 「管理员删除策略」SQL。
//
// 注意：publishable key 用于匿名公开读取/提交评价，
// 请勿放置数据库的 service_role secret key。
// ============================================================
window.CLOUD_CONFIG = {
  supabaseUrl: "https://xifkjcdpbyeknrhiknyb.supabase.co",
  supabaseAnonKey: "sb_publishable_Yf3PoJ0hFDELzmackZF_BQ_aqdw2k-e",
  adminEmail: "fomalhautskywalker@gmail.com",
};
