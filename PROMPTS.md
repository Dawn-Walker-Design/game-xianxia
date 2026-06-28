# 仙侠探索游戏 — AI 资源生成提示词全集

> **使用方式**：按优先级从上到下生成。每个资源有两组提示词：
> - **图生3D路线**：先用 Seedream/海艺出高清大图，再用腾讯混元图文3D/Tripo 图生3D
> - **文生3D路线**：直接用腾讯混元3D/Tripo 输入提示词生成3D模型
>
> 建议两种都试一个，对比效果再决定后续用哪种。

---

## 🖼️ 一、高清概念图（Seedream / 海艺 / 你公司的AI）

> 这些图有两个用途：(1) 确定整体美术风格 (2) 作为图生3D的输入

### 1.1 仙侠山谷全景（最重要，先出这张）
```
Prompt:
Epic wide landscape of a xianxia cultivation valley, ancient Chinese fantasy style. 
Emerald green mountains shrouded in swirling mist, floating islands suspended mid-air 
with waterfalls cascading down into a jade-colored lake below. A winding stone path 
leads through bamboo groves towards a distant temple with curved golden roofs. 
Pink cherry blossom petals drift through the air. Spirit lights glow softly among the trees. 
Atmospheric fog, golden hour lighting, cinematic composition, 8K, photorealistic fantasy art.
Style: Stylized realism, Chinese ink painting influence, ethereal and mystical atmosphere.

```
```
中文版：
史诗级仙侠山谷全景，中国古代奇幻风格。翠绿的山峦在云雾中若隐若现，
悬空浮岛漂浮半空，瀑布从浮岛飞流直下落入碧绿湖面。蜿蜒石阶穿过竹林通向
远处金色穹顶的道观。粉色桃花瓣漫天飘落，林间灵光点点。氛围雾气，黄金时段的
光线，电影级构图，8K，超写实奇幻艺术。风格：风格化写实融合水墨意境。
```

### 1.2 道观/大殿
```
Prompt:
Ancient Chinese Taoist temple hall floating on a mountain peak, xianxia fantasy style.
Curved golden glazed tile roofs with dragon ridge ornaments, vermillion columns with 
golden inscriptions, stone steps leading up through clouds. Lanterns with spirit flames 
hanging from eaves. Surrounded by ancient pine trees and swirling mist. Background: 
distant snow-capped peaks and purple twilight sky. Rich details on wood carvings and 
stone reliefs. Cinematic lighting from below, mysterious and sacred atmosphere, 8K.

Negative: modern buildings, western architecture, neon lights, cartoon style
```

### 1.3 灵树
```
Prompt:
A massive ancient spirit cherry blossom tree, xianxia fantasy art. The tree trunk is 
thick and twisted, covered in glowing mystical runes and luminescent moss. Branches spread 
wide with translucent pink petals that emit soft light. Floating crystal shards orbit 
around the tree. Root system visible above ground, glowing blue veins pulsing through bark. 
Sits on a small floating island with a serene pond reflecting the tree. Firefly-like 
spirits dance around. Nighttime scene with starry sky, bioluminescent aesthetic, 8K, 
ethereal and sacred.

Negative: dark horror tree, dead tree, modern elements, cartoon style
```

### 1.4 仙桥
```
Prompt:
An elegant ancient Chinese jade bridge arching between two floating mountain peaks, 
xianxia fantasy style. The bridge is carved from white jade and stone, with delicate 
railings featuring cloud motifs and spirit beast carvings. Mist flows underneath the 
bridge. Glowing spirit lanterns line both sides. Cherry blossom petals falling around it.
Below: a sea of clouds with mountain peaks emerging. Above: golden sky at dawn. 
The bridge seems to glow from within. Cinematic far shot, 8K, breathtaking.

Negative: modern bridge, rope bridge, damaged structure, cartoon
```

### 1.5 山门
```
Prompt:
Grand Chinese mountain gate (Shanmen) entrance to a xianxia cultivation world.
A massive ancient stone archway with intricate carvings of dragons and phoenixes,
flanked by two giant stone guardian lion statues. Red silk banners hanging from 
the gate with golden mystical calligraphy. The gate stands at the edge of a cliff,
beyond it: a vast fantasy landscape of floating mountains and cloud seas.
Golden light radiates through the gate as a portal. Morning mist, god rays,
epic scale, 8K, awe-inspiring.

Negative: modern architecture, simple design, western style
```

### 1.6 七层宝塔
```
Prompt:
A seven-story ancient Chinese pagoda standing on a misty mountain peak, xianxia fantasy.
Each tier has curved golden eaves with small bronze bells hanging from the corners.
Vermillion wooden structure with intricate lattice windows. A golden spire at the top
emits a soft divine light upward. The pagoda is surrounded by circling white cranes.
Ancient pine trees frame the scene. The building glows warmly against a purple-blue
twilight sky. Mysterious and sacred, 8K, highly detailed architecture.

Negative: modern skyscraper, simple tower, cartoon
```

### 1.7 场景纹理贴图（可选，用于程序化地形）
- **草地纹理** `ancient Chinese grassland with wildflowers, mossy ground, 4K seamless PBR texture`
- **岩石纹理** `weathered Chinese mountain rock face with moss and mineral veins, 4K seamless PBR texture`
- **水面法线** `calm jade lake water surface with gentle ripples, seamless normal map, 4K`

---

## 🧊 二、3D模型生成（腾讯混元3D / Tripo）

> ⚠️ 两个路线都试试，每个模型生成后导出为 **GLB/glTF 2.0** 格式。
> 放到 `public/models/` 目录下。

### 路线A：图生3D（推荐先试这条）
**步骤**：用上面生成的高清大图 → 上传到腾讯混元3D的"图生3D" → 得到3D模型
- 优点：风格与概念图一致
- 缺点：需要先生成图

### 路线B：文生3D（更直接）
**步骤**：直接输入以下提示词到混元3D或Tripo

#### 🏯 道观大殿 — 替换紫色 placeholder
```
A stylized Chinese Taoist temple hall with curved golden tile roof, vermillion red columns,
intricate wooden brackets (dougong), raised stone platform base. 
Front-facing, symmetrical. Game-ready low-poly with PBR textures.
Scale: approximately 8 meters wide, 6 meters tall, 5 meters deep.
```

#### 🌳 灵树 — 替换绿色 placeholder  
```
A fantasy spirit cherry blossom tree with twisted ancient trunk, wide-spreading canopy
of pink petals, exposed roots, and small glowing crystal formations around the base.
Organic natural shape suitable for 360-degree viewing. 
Game asset with semi-transparent petal clusters.
Scale: approximately 4 meters tall, 6 meters canopy width.
```

#### 🌉 仙桥 — 替换蓝色 placeholder
```
An arched Chinese stone bridge with jade-white stone material, cloud-pattern carvings
on railings, and small lantern posts at both ends. 
Designed to span between two elevated points.
Game asset, straight bridge with gentle arch, 12 meters long, 2 meters wide.
Low-poly optimized with PBR stone texture.
```

#### ⛩️ 山门 — 替换橙色 placeholder
```
A Chinese mountain gate archway (pailou style), three openings, stone and wood structure,
with red lacquered pillars, golden tiles on top, and two small stone lion statues at sides.
Symmetrical front-facing structure. 
Game asset, approximately 10 meters wide, 8 meters tall.
PBR materials: stone, wood, gold leaf.
```

#### 🗼 七层宝塔 — 替换红色 placeholder
```
A seven-story Chinese pagoda with hexagonal shape, golden curved roof eaves on each tier,
wooden lattice windows, central pillar visible. Bronze bells at eave corners.
Game-ready model with PBR materials. 
Scale: approximately 3 meters diameter, 12 meters tall.
Symmetrical, can be viewed from all angles.
```

---

## 🎬 三、视频生成（Seedance / 海艺）

> 视频用于：(1) 游戏片头 (2) 加载画面背景 (3) 关键场景过场动画

### 3.1 片头动画（御剑飞行视角）
```
航拍视角飞越中国仙侠山谷，镜头在云层中穿行。
下方是翠绿山峦、悬空浮岛和碧绿湖泊。远处金色道观在晨光中闪耀。
粉色桃花瓣从镜头前飘过。镜头缓缓下降穿过云层，
接近山谷中央的宝塔。电影级画质，平滑运镜，8秒。
```

### 3.2 场景氛围视频（可做加载画面或环境投影）
```
固定镜头：仙侠山谷的云雾缓慢飘动，灵光在林间闪烁，
瀑布从浮岛流下，水面泛起微微涟漪。仙鹤在远山盘旋。
黄金时段到蓝调时段的过渡。宁静、空灵、循环10秒。
```

---

## 🎵 四、音频（你公司的AI实验室）

### 4.1 背景音乐
```
曲风：中国古风 + 环境音乐 (Ambient)
乐器：古筝、笛子、二胡、大提琴、合成器Pad
情绪：宁静中带着神秘感，适合探索类游戏
时长：3-5分钟循环
参考：类似《原神》璃月地区BGM、《仙剑奇侠传》场景音乐
```

### 4.2 环境音效
- 山间风声（柔和，持续）
- 溪流水声（近中景）
- 竹林沙沙声
- 鸟鸣（远山，偶发）
- 铃铛轻响（宝塔飞檐）

### 4.3 UI音效
- 飞行切换：一阵风声 + 古筝刮奏
- 加速：清脆的玉石碰撞声
- 靠近可交互物体：风铃轻响

---

## 📋 五、推荐生成顺序

| 优先级 | 资源 | 类型 | 用途 |
|--------|------|------|------|
| 🔴 1 | 仙侠山谷全景图 | 2D图 | 确定美术风格，作参考 |
| 🔴 2 | 宝塔 | 3D模型 | 尝试两条路线对比效果 |
| 🟡 3 | 道观大殿 | 3D模型 | 场景核心建筑 |
| 🟡 4 | 灵树 | 3D模型 | 场景地标 |
| 🟡 5 | 山门 | 3D模型 | 入口标识 |
| 🟢 6 | 仙桥 | 3D模型 | 连接元素 |
| 🟢 7 | 片头视频 | 视频 | 游戏启动画面 |
| 🟢 8 | BGM + 音效 | 音频 | 氛围营造 |
| ⚪ 9 | 地面/岩石纹理 | 贴图 | 地形美化 |

---

## 🔧 六、模型导入指南

生成3D模型后，按以下步骤导入：

```bash
# 1. 将 GLB/glTF 文件放到
/Users/hyf/xianxia-explorer/public/models/

# 2. 使用 Python 脚本检查和优化模型
python3 process_model.py --input public/models/pagoda.glb --output public/models/pagoda_opt.glb

# 3. 在 main.js 中添加加载代码（参考下方模板）
```

### Three.js 模型加载代码模板：
```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('/models/pagoda.glb', (gltf) => {
  const model = gltf.scene;
  model.position.set(5, getTerrainHeight(5, 5), 5);
  model.scale.set(1, 1, 1);
  scene.add(model);
});
```

---

## 💡 七、建议

1. **先只做宝塔**，用图生3D和文生3D各做一次，放到场景里看哪个效果好
2. 3D模型面数控制在 **5万面以内**（M1 8GB承载能力范围内）
3. 纹理分辨率建议 **1024x1024** 或 **2048x2048**（太大M1吃不消）
4. 如果模型太大，用 `trimesh` 库做减面处理
