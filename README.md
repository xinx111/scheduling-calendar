# 排班日历

本地优先的排班管理应用：人员排班、周期模式、日历视图与提醒。支持 PWA 与 Android（Capacitor），数据保存在设备本地 IndexedDB。

## 功能

- 按人员手动排班，日历以周一为一周开始
- 排班周期：一人可设多个周期，按起始日期和 dayOffset 计算
- 备忘录与提醒：Android 原生通知 / Web 浏览器通知，支持每天、每周、按班次重复
- 法定节假日：内置国务院历年放假安排（含调休补班日），日历与日详情自动展示
- 班次模板管理、数据导出、本地数据清理

## 更新节假日数据

每年国务院公布新的放假安排后，在 `src/data/holidays.js` 里按现有格式新增一个年份块即可（`offDays` 为放假日区间，`workDays` 为调休补班日）。数据核对可参考 [holiday-cn](https://github.com/NateScarlet/holiday-cn) 项目，其中附有官方公告链接。

## 常用命令

```bash
npm install
npm run dev     # 本地开发
npm run test    # 单元测试（node:test）
npm run build   # 构建到 dist/
npx cap copy android   # 将 dist 同步到 Android 工程
```

Android 打包：用 Android Studio 打开 `android/` 目录构建，或在 `android/` 下执行 `./gradlew assembleDebug`。

## 目录结构

- `src/pages` 页面（首页 / 日历 / 日详情 / 人员 / 提醒 / 设置）
- `src/components` UI 组件
- `src/hooks` 数据 Hook
- `src/db` IndexedDB 存储层
- `src/notifications.js` 提醒调度（原生 + Web 兜底）
