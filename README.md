# CityU 课程综合系统 · 测试版 4.2

> **当前版本：测试版 4.2（Test v4.2）**
> 本次更新为网页版功能增强，**不包含微信小程序包体**。小程序版本将在后续独立发布。
> 完整的版本变更记录请查看 [更新日志（CHANGELOG.md）](CHANGELOG.md)。

CityU 课程综合系统是一个为**香港城市大学（CityU）授课型硕士生**打造的一站式课程综合平台，涵盖排课规划与课程评价两大核心功能。整合课程时间表查询、班次选择与学生评价汇总，帮你做出更明智的决定。

> ⚠️ **免责声明：** 课程评价内容均整理自公开社交平台（小红书、知乎、Reddit 等），仅供参考，不构成建议。请以学校官方信息为准。
>
> 当前数据适用于 **Semester A 2026/27**。课表快照时间为 **2026-08-05 12:00（Asia/Beijing）**，名额、教师、教室及注册状态可能随时变化，请以 CityU AIMS 的最新信息为准。

## 在线访问

**https://Famalhaut04.github.io/Cityu-course-selection/**

## 测试版 4.2 更新内容

> 新增登录体系（学生邮箱注册登录、管理员登录删评）与密码重置；课程评价中心界面改版（参考 [cupedia.org/courses](https://cupedia.org/courses)）并优化使用逻辑。

### 登录体系（新增）

- **登录页面**：独立登录页（侧边栏「登录 / 注册」入口），双模式 Tab——**学生登录**（可注册，登录后提交评价）与**管理员登录**（登录后可删除任意云端评价）
- **学生账号**：Supabase Auth 邮箱注册/登录，可填昵称；未登录提交评价时自动跳转登录页并回跳原课程
- **数据库升级**：`course_reviews` 新增 `user_id` 列，仅登录用户可提交；升级脚本见 `tools/login_setup.sql`（需在 Supabase SQL Editor 执行一次）

### 评价中心界面改版

- **列表行课程浏览**：评价中心课程列表由卡片网格改为列表行模式，每行展示课程代码、学分、课程名称与"平均分/5 + 评价条数"，浏览更高效
- **综合推荐指数**：课程详情顶部新增"综合推荐指数"大号分数与星级，云端评价为空时自动回退本地口碑分
- **评价卡片升级**：每条评价突出大号评分与星级，展示昵称、学期、教授、时间与评语

### 使用逻辑优化

- **点击课程直接跳转**：评价中心课程列表行点击后直接跳转到课程详情页，不再在页内展开详情，页面更简洁
- **提交评价入口统一**：评价中心不再内嵌提交表单，点击「写评价」跳转到课程详情页评价区（`course.html#course-reviews`），复用完整表单（星级、昵称、评语、云端同步、删除）
- **自动定位高亮**：跳转后自动滚动到评价区并高亮提示；详情页返回链接自动变为「← 返回课程评价」
- **课程行跳转箭头**：悬停时滑出，明确可点击

## 测试版 4.0 更新内容

### 项目更名

- **课程综合系统**：项目由「CityU 课程评价系统」更名为「CityU 课程综合系统」（Course Hub），定位为涵盖**排课规划**与**课程评价**两大核心功能的一站式课程平台

### 新增功能

- **课程评价中心**：全新独立页面（侧边栏「课程评价」入口），两级下拉菜单（学院 → 院系）浏览各系课程，点击课程直接查看云端共享评价并提交自己的评价；课程卡片显示平均评分与评价数
- **云端共享评价**：课程详情页与评价中心共用同一套云端数据（Supabase `course_reviews` 表），单独评价课程与排课时评价课程全部收录；提交评价时可填写昵称。接入方式见 [CLOUD_DATABASE.md](CLOUD_DATABASE.md)，未配置时自动回退本地模式
- **个人课程评价**：每门课程详情页支持星级评分与评语，保存后展示"已评 N★"标记，数据保存在浏览器本地，刷新不丢失；云端评价支持删除自己提交的内容

### 界面优化

- 全站加载 Inter + Noto Sans SC 字体，开启抗锯齿渲染，中文显示更清晰
- 评价卡片增加阴影与悬停动效；课程详情头部圆角加大、阴影增强
- 全站新增 favicon（CSSA Logo）

### 不包含内容

- **微信小程序包体**：本次更新仅包含网页版，小程序版本将在后续版本中独立发布

## 已录入项目（Semester A 2026/27）

| 项目代码 | 项目名称 | 所属院系 |
| --- | --- | --- |
| MSBIOS | 生物统计学理学硕士（MSc Biostatistics） | Department of Biostatistics |
| MSCS | 计算机科学理学硕士（MSc Computer Science） | Department of Computer Science |
| MSAI | 人工智能理学硕士（MSc Artificial Intelligence） | Department of Computer Science |
| MSCY | 网络安全理学硕士（MSc Cybersecurity） | Department of Computer Science |
| MSEC | 电子商贸理学硕士（MSc Electronic Commerce） | Department of Computer Science |
| MSDS | 数据科学理学硕士（MSc Data Science） | Department of Data Science |
| MSAIFS | 人工智能与科学理学硕士（MSc AI for Sciences） | Department of Data Science |

## 网页版主要功能

### 课程浏览与筛选

- 三级级联选择学院、院系与硕士项目，逐级展开
- 按课程编号或课程英文名称搜索；按核心课、选修课、上课星期和开课学期（SemA/SemB）筛选
- 选修分组（如 MSCY 的 Group I/II）筛选与分组学分进度统计
- 快速查看课程学分、主课班次数量、上课时间、星级口碑分和学生评价摘要

### 可视化课表规划

- 将课程加入每周课表，并分别选择主课和 Tutorial 班次
- 自动统计已加入课表的课程数量、核心课/选修课数量及总学分
- 自动检测时间冲突，并在课表中标记冲突课程
- 各项目课表在本地独立保存

### 课程详情与学生经验

- 展示课程类型、所属项目、学分、先修要求等
- 展示班次时间、日期、地点、教师、CRN 及网页注册状态
- 汇总学生评价、星级口碑分、课程特点和课程提示

### 详细课程文件与中文翻译

- 课程详情页提供「课程详情 PDF」按钮，可直接下载对应课程的官方课程文件
- 对部分课程提供"查看详细课程介绍"入口（中英逐页对照）
- 英文 PDF 原文转换为网页页图，无需下载本地文件
- 英文页图与对应中文翻译同步切换

## 本地运行

项目使用原生 HTML、CSS 和 JavaScript，无需安装依赖或执行构建。

```powershell
git clone https://github.com/Famalhaut04/Cityu-course-selection.git
cd Cityu-course-selection
python -m http.server 8090
```

然后在浏览器打开 `http://127.0.0.1:8090/`

请通过 HTTP 服务访问，不建议直接双击 `index.html`（`fetch` 读取本地 JSON 在 `file://` 下可能被阻止）。

## 项目结构

```text
├── index.html                 # 课程浏览、项目切换与课表规划主页
├── course.html                # 课程详情页（含课程详情 PDF 下载）
├── syllabus.html              # PDF 原文与中文翻译页面
├── about.html                 # 关于我们（CityUHK CSSA）
├── feedback.html              # 问题反馈页
├── assets/
│   ├── styles.css             # 全站样式与响应式布局
│   ├── shared.js              # 数据加载、存储、i18n 和公共工具
│   ├── planner.js             # 项目切换、课程筛选、课表规划逻辑
│   ├── course.js              # 课程详情渲染逻辑
│   ├── syllabus.js            # 课程文件与翻译渲染逻辑
│   ├── cssa-logo.png          # CSSA 官方 Logo
│   └── course-pages/          # 课程英文原文页图
├── data/
│   ├── courses/index.json     # 多项目注册表、学期和课程索引
│   ├── course-documents/      # PDF 映射、页图索引与逐页中文翻译
│   ├── sections/              # 各课程班次数据
│   ├── reviews/               # 各课程评价摘要
│   ├── source-reviews/        # 按来源整理的课程评价原文
│   └── sources.json           # 评价来源及原文链接
├── docs/                      # 课程官方 PDF 资料（按课程代码命名）
└── tools/
    └── build-web-course-images.mjs # 课程页图生成工具
```

## 发布

仓库通过 GitHub Pages 直接发布 `main` 分支根目录。推送到 `main` 后会自动更新线上网站。

## 联系与贡献

任何问题、建议或合作意向，欢迎联系：

📧 **fomalhautskywalker@gmail.com**

也欢迎在 [Issues](https://github.com/Famalhaut04/Cityu-course-selection/issues) 中提交 Bug 或功能需求。

## 使用提示与免责声明

- 本系统仅为课程评价与课表参考工具，个人最终课表需要在香港城市大学系统中自行确认
- 课程名额、教师、地点、考核方式和注册规则可能变化，请以 CityU 官方系统和课程文件为准
- 学生评价具有主观性，且可能对应往届教学安排，不应作为唯一课程依据
- 原始评价与课程资料的相关权利归各自作者或发布机构所有
