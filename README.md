# 陇上行 · 电影级 3D 环形全景长卷相册

> **Gansu Cinematic 3D Panoramic Carousel**
> 
> 基于 **React 18 + TypeScript + Vite + WebGL 活化流体着色器 + CSS 3D 双轴空间引擎** 打造的沉浸式中国古典山河相册。

---

## 🌟 核心特性

- 🏛️ **3D 环形圆柱长卷舞台（3D Cylinder Ring Rig）**：
  - 18 张甘肃大片在 3D 空间中环绕陈列，支持鼠标左键 **水平环绕 + 垂直俯仰** 全方位空间拖拽与惯性阻尼漫游；
  - 精确透视缩放与 3D Dolly 推进，画面 100% 完整展现无黑边裁切。

- 🖌️ **左图右书 · 苍劲狂草竖排挥毫（Poetic Calligraphy Unfolding）**：
  - 点击任意照片，照片平滑在 3D 空间向左微移浮凸；
  - 右侧以 **《狂草行书》（`Zhi Mang Xing`）** 苍劲焦墨玄黑（`#17110c`）双列竖排自然挥毫题诗，气势磅礴。

- 🎵 **丝路古韵 · 合成古琴琵琶苍茫配乐（Ambient Cinematic Audio Engine）**：
  - 基于 Web Audio API 物理合成的中国古典五声羽调式曲调（《阳关曲·陇上长歌》），伴以温暖微风与深沉空弦泛音。

- 🎛️ **古典宋体宣纸金丝播放台（Unified Bottom HUD）**：
  - 严格定宽 940px 零抖动底座，集成切景、漫游启停、镜头推拉焦距、气象景深虚化与俯仰角度调控抽屉。

- 🌊 **WebGL 活化丝路大漠画布（Living Silk Road Canvas）**：
  - 真实河流液态波动波光、热浪扰动、浮岚流云与空气飞沙景深粒子系统。

---

## 🚀 快速启动

### 1. 安装依赖
```bash
npm install
```

### 2. 本地开发运行
```bash
npm run dev
```
打开浏览器访问：`http://localhost:3001`

### 3. 生产打包构建
```bash
npm run build
```

---

## 📂 项目结构

```text
├── public/
│   ├── images/               # 18 张甘肃名胜大片 (page-01.png ~ page-18.png)
│   └── silk-road-bg.jpg      # 丝路长卷高清背景底图
├── src/
│   ├── components/
│   │   ├── CinematicAudioPlayer.tsx       # Web Audio API 古典古琴琵琶合成器
│   │   ├── CinematicLighting.tsx          # 聚光灯与环境光场
│   │   ├── CinematicPhotoCard.tsx         # 3D 空间典藏画框与焦点光照
│   │   ├── CinematicRingStage.tsx         # 3D 双轴环形舞台与控制台
│   │   ├── FloatingPoeticParchment.tsx     # 竖排狂草水墨挥毫题诗
│   │   └── SilkRoadLivingCanvas.tsx       # WebGL 活化流体背景与飞沙粒子
│   ├── data/
│   │   └── photo-manifest.ts              # 18 景名胜历史、诗词与地理 Manifest
│   ├── App.tsx                            # 主应用入口
│   ├── cinematic-carousel.css             # 全局电影级汉唐古风样式表
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## ⌨️ 快捷操作指南

| 按键 / 操作 | 功能描述 |
| :--- | :--- |
| **鼠标左键按住拖动** | 全方位 3D 空间拖动环绕与俯仰旋转 |
| **鼠标滚轮 / 触摸板** | 顺滑旋转切换照片 |
| **Ctrl + 滚轮** | 镜头焦距推拉缩放 |
| **点击照片 / Enter / F** | 进入 / 退出照片左移与题诗模式 |
| **Esc / 点击背景** | 归卷还原全景视角 |
| **空格键 (Space)** | 启停 3D 自动环游漫步 |
| **← / → 方向键** | 切换上一景 / 下一景 |
| **I 键** | 展开 / 收起《陇上名胜志》典籍详注 |

---

## 📜 开源许可
MIT License.
