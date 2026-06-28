#!/usr/bin/env python3
"""
仙侠探索游戏 — 3D模型处理工具
功能：格式转换 / 减面优化 / 信息查看 / 坐标修正

用法:
  python3 process_model.py info models/pagoda.glb          # 查看模型信息
  python3 process_model.py simplify models/pagoda.glb 0.5  # 减面到50%
  python3 process_model.py center models/pagoda.glb        # 居中+落地
  python3 process_model.py scale models/pagoda.glb 5.0     # 统一缩放
"""

import argparse
import sys
import os
import json
import struct
import numpy as np

try:
    import trimesh
except ImportError:
    print("❌ 需要安装 trimesh: pip3 install trimesh")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("⚠️  Pillow未安装，无法处理纹理: pip3 install pillow")
    Image = None


def load_model(path):
    """加载任意格式的3D模型"""
    if not os.path.exists(path):
        print(f"❌ 文件不存在: {path}")
        sys.exit(1)

    ext = os.path.splitext(path)[1].lower()
    print(f"📦 加载: {path} (格式: {ext})")

    if ext == '.glb' or ext == '.gltf':
        mesh = trimesh.load(path, force='mesh')
    else:
        mesh = trimesh.load(path, force='mesh')

    return mesh


def save_model(mesh, path, is_binary=True):
    """保存模型为GLB或glTF"""
    ext = os.path.splitext(path)[1].lower()
    if not ext:
        path += '.glb'
        ext = '.glb'

    print(f"💾 保存: {path}")
    if ext == '.glb':
        mesh.export(path, file_type='glb')
    elif ext == '.gltf':
        mesh.export(path, file_type='gltf')
    else:
        mesh.export(path)
    print(f"✅ 已保存: {path}")


def cmd_info(args):
    """查看模型详细信息"""
    mesh = load_model(args.path)

    print("\n" + "="*60)
    print("📊 模型信息")
    print("="*60)

    if isinstance(mesh, trimesh.Scene):
        print(f"类型: Scene (包含 {len(mesh.geometry)} 个几何体)")
        total_verts = 0
        total_faces = 0
        for name, geo in mesh.geometry.items():
            v = len(geo.vertices)
            f = len(geo.faces)
            total_verts += v
            total_faces += f
            mat_name = "无材质"
            if hasattr(geo, 'visual') and hasattr(geo.visual, 'material'):
                mat = geo.visual.material
                if hasattr(mat, 'name'):
                    mat_name = mat.name
            print(f"  - {name}: {v}顶点, {f}面, 材质: {mat_name}")
        print(f"\n总计: {total_verts:,}顶点, {total_faces:,}面")
    else:
        mesh_obj = mesh
        print(f"类型: 单一网格")
        print(f"顶点数: {len(mesh_obj.vertices):,}")
        print(f"面数: {len(mesh_obj.faces):,}")
        print(f"是否有UV: {'是' if hasattr(mesh_obj.visual, 'uv') and mesh_obj.visual.uv is not None else '否'}")
        print(f"是否有材质: {'是' if hasattr(mesh_obj.visual, 'material') else '否'}")

    # 包围盒
    if isinstance(mesh, trimesh.Scene):
        bounds = mesh.bounds
    else:
        bounds = mesh.bounds

    if bounds is not None:
        size = bounds[1] - bounds[0]
        center = (bounds[0] + bounds[1]) / 2
        print(f"\n包围盒:")
        print(f"  最小: {bounds[0]}")
        print(f"  最大: {bounds[1]}")
        print(f"  尺寸: {size} (宽{size[0]:.2f} x 深{size[1]:.2f} x 高{size[2]:.2f})")
        print(f"  中心: {center}")

        # 游戏引擎建议
        print(f"\n💡 建议:")
        if size[0] > 20 or size[1] > 20 or size[2] > 20:
            print(f"  ⚠️ 模型较大，建议缩放到5-15米范围（当前{max(size):.1f}米）")
            target = 10.0
            s = target / max(size)
            print(f"  → 建议缩放因子: {s:.3f}")
            print(f"  → 命令: python3 {sys.argv[0]} scale {args.path} {s:.3f}")
        if abs(center[0]) > 0.1 or abs(center[2]) > 0.1:
            print(f"  ⚠️ 模型未居中，建议居中")
            print(f"  → 命令: python3 {sys.argv[0]} center {args.path}")

    # 面数建议
    if isinstance(mesh, trimesh.Scene):
        total_faces = sum(len(g.faces) for g in mesh.geometry.values())
    else:
        total_faces = len(mesh.faces)

    if total_faces > 100_000:
        print(f"  ⚠️ 面数偏高({total_faces:,})，在M1 8GB上可能卡顿")
        ratio = 50_000 / total_faces
        print(f"  → 建议减面到{ratio:.0%}: python3 {sys.argv[0]} simplify {args.path} {ratio:.2f}")


def cmd_simplify(args):
    """减面优化"""
    mesh = load_model(args.path)
    ratio = args.ratio

    original_faces = 0
    if isinstance(mesh, trimesh.Scene):
        print(f"\n🔧 减面中... (目标: {ratio:.0%} 面数)")

        new_geometries = {}
        for name, geo in mesh.geometry.items():
            original_faces += len(geo.faces)
            target = max(4, int(len(geo.faces) * ratio))
            simplified = geo.simplify_quadric_decimation(target)
            new_geometries[name] = simplified
            print(f"  {name}: {len(geo.faces):,} → {len(simplified.faces):,} 面")

        mesh.geometry = new_geometries
        new_total = sum(len(g.faces) for g in new_geometries.values())

    else:
        original_faces = len(mesh.faces)
        target = max(4, int(original_faces * ratio))
        print(f"\n🔧 减面中... {original_faces:,} → {target:,} 面 (比例: {ratio:.0%})")
        mesh = mesh.simplify_quadric_decimation(target)
        new_total = len(mesh.faces)

    print(f"\n总计: {original_faces:,} → {new_total:,} 面 (保留 {new_total/original_faces:.1%})")

    save_model(mesh, args.output or args.path.replace('.glb', '_simplified.glb').replace('.gltf', '_simplified.glb'))


def cmd_center(args):
    """居中模型并把底部放在地面上"""
    mesh = load_model(args.path)

    if isinstance(mesh, trimesh.Scene):
        bounds = mesh.bounds
    else:
        bounds = mesh.bounds

    center_xz = (bounds[0] + bounds[1]) / 2
    bottom_y = bounds[0][1]

    offset = [-center_xz[0], -bottom_y, -center_xz[2]]

    if isinstance(mesh, trimesh.Scene):
        for geo in mesh.geometry.values():
            geo.vertices += offset
    else:
        mesh.vertices += offset

    print(f"✅ 已居中并落地")
    print(f"   偏移量: {offset}")

    save_model(mesh, args.output or args.path.replace('.glb', '_centered.glb').replace('.gltf', '_centered.glb'))


def cmd_scale(args):
    """统一缩放"""
    mesh = load_model(args.path)
    factor = args.factor

    if isinstance(mesh, trimesh.Scene):
        for geo in mesh.geometry.values():
            geo.vertices *= factor
    else:
        mesh.vertices *= factor

    if isinstance(mesh, trimesh.Scene):
        size = mesh.bounds[1] - mesh.bounds[0]
    else:
        size = mesh.bounds[1] - mesh.bounds[0]

    print(f"✅ 已缩放 (因子: {factor})")
    print(f"   新尺寸: {size[0]:.2f} x {size[1]:.2f} x {size[2]:.2f} 米")

    save_model(mesh, args.output or args.path.replace('.glb', '_scaled.glb').replace('.gltf', '_scaled.glb'))


def main():
    parser = argparse.ArgumentParser(description='仙侠探索 - 3D模型处理工具')
    subparsers = parser.add_subparsers(dest='command', help='子命令')

    # info
    p = subparsers.add_parser('info', help='查看模型信息')
    p.add_argument('path', help='模型文件路径')
    p.set_defaults(func=cmd_info)

    # simplify
    p = subparsers.add_parser('simplify', help='减面优化')
    p.add_argument('path', help='模型文件路径')
    p.add_argument('ratio', type=float, help='保留面数比例 (0.0-1.0)')
    p.add_argument('--output', '-o', help='输出文件路径')
    p.set_defaults(func=cmd_simplify)

    # center
    p = subparsers.add_parser('center', help='居中并落地')
    p.add_argument('path', help='模型文件路径')
    p.add_argument('--output', '-o', help='输出文件路径')
    p.set_defaults(func=cmd_center)

    # scale
    p = subparsers.add_parser('scale', help='统一缩放')
    p.add_argument('path', help='模型文件路径')
    p.add_argument('factor', type=float, help='缩放因子')
    p.add_argument('--output', '-o', help='输出文件路径')
    p.set_defaults(func=cmd_scale)

    if len(sys.argv) < 2:
        parser.print_help()
        return

    args = parser.parse_args()
    if args.command:
        args.func(args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
