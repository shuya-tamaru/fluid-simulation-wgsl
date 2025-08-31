# WebGPU 流体シミュレーション

> **[English](../../README.md)** | **日本語**

WebGPU と WGSL（WebGPU Shading Language）を使用したリアルタイム SPH（Smoothed Particle Hydrodynamics）流体シミュレーションです。

## 🚀 ライブデモ & 動画

<div align="center">

### [🌊 **ライブデモを試す**](https://sph-wgsl.vercel.app/) | [📺 **動画を見る**](https://youtu.be/hxalb1aCo4g)

[![ライブデモ](https://img.shields.io/badge/🌊_ライブデモ-インタラクティブ-4285f4?style=for-the-badge&logo=webcomponents&logoColor=white)](https://sph-wgsl.vercel.app/)
[![YouTube デモ](https://img.shields.io/badge/📺_YouTube-デモ動画-red?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/hxalb1aCo4g)

[![デモプレビュー](https://img.youtube.com/vi/hxalb1aCo4g/maxresdefault.jpg)](https://youtu.be/hxalb1aCo4g)

_上の画像をクリックして詳細デモをご覧ください_

</div>

## 特徴

- **WebGPU**：最新のグラフィックス API を使用した高性能な並列計算
- **SPH 法**：粒子ベースの流体シミュレーション手法
- **リアルタイム**：インタラクティブな 3D 流体シミュレーション
- **WGSL**：WebGPU 専用シェーダー言語による計算シェーダー実装

## シミュレーション機能

### 物理計算

- **密度計算**（Density）：近傍粒子による密度算出
- **圧力計算**（Pressure）：状態方程式による圧力導出
- **圧力勾配力**（Pressure Force）：圧力による粒子間相互作用
- **粘性力**（Viscosity）：流体の粘性効果
- **重力**（Gravity）：重力による加速度
- **統合**（Integration）：運動方程式の数値積分

### 最適化技術

- **空間ハッシュグリッド**：効率的な近傍探索
- **粒子並び替え**：メモリアクセス最適化
- **ピンポンバッファ**：GPU 上での効率的なデータ更新

## 技術スタック

- **WebGPU**：グラフィックス・計算 API
- **WGSL**：シェーダー言語
- **TypeScript**：型安全な開発
- **Vite**：高速ビルドツール
- **lil-gui**：リアルタイムパラメータ調整 UI

## セットアップ

### 必要環境

- Node.js 16+
- WebGPU 対応ブラウザ（Chrome 113+, Edge 113+等）

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

## プロジェクト構成

```
src/
├── compute/sph/          # SPH計算ロジック
│   ├── Density.ts        # 密度計算
│   ├── Pressure.ts       # 圧力計算
│   ├── PressureForce.ts  # 圧力勾配力
│   ├── Viscosity.ts      # 粘性力
│   ├── Gravity.ts        # 重力
│   ├── Integrate.ts      # 運動方程式積分
│   └── SphSimulator.ts   # シミュレーター本体
├── core/                 # コアシステム
│   ├── Device.ts         # WebGPUデバイス管理
│   ├── Renderer.ts       # レンダリングエンジン
│   └── OrbitCamera.ts    # カメラコントロール
├── gfx/                  # グラフィックス
│   ├── Particles.ts      # 粒子レンダリング
│   └── WireBox.ts        # 境界ボックス表示
├── shaders/              # WGSLシェーダー
│   ├── density.wgsl      # 密度計算シェーダー
│   ├── pressure.wgsl     # 圧力計算シェーダー
│   └── ...               # その他計算シェーダー
└── utils/                # ユーティリティ
    ├── FluidGui.ts       # パラメータUI
    └── TimeStep.ts       # 時間管理
```

## 使用方法

1. ブラウザでアプリケーションを開く
2. 右上の GUI パネルでパラメータを調整
   - 粒子数
   - 流体密度
   - 粘性係数
   - 圧力係数
   - 境界サイズ
3. リアルタイムで流体シミュレーションを観察

---

**注意**：このアプリケーションは WebGPU を使用するため、対応ブラウザでの実行が必要です。
