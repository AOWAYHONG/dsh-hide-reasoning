#!/usr/bin/env bash
#
# dsh-hide-reasoning 卸载脚本（macOS / DeepSeek Harness）
#
# 用法:  ./uninstall.sh [插件安装目录]
# 默认移除 ~/Documents/dsh-hide-reasoning
#
# 会从 ~/.dsh/profiles/web/package.json 移除注册，删除插件目录，并重启 dsh web。

set -euo pipefail

WEB_PROFILE="$HOME/.dsh/profiles/web"
PKG_NAME="@dsh-external/dsh-hide-reasoning"
DEST="${1:-$HOME/Documents/dsh-hide-reasoning}"

if [ ! -f "$WEB_PROFILE/package.json" ]; then
  echo "错误：找不到 $WEB_PROFILE/package.json" >&2
  exit 1
fi

echo "==> 从 web profile 移除 $PKG_NAME"
python3 - "$WEB_PROFILE/package.json" <<'PY'
import json, sys
pkg_path = sys.argv[1]
with open(pkg_path) as f:
    pkg = json.load(f)
changed = False
if pkg.get('dependencies', {}).pop('@dsh-external/dsh-hide-reasoning', None) is not None:
    changed = True
bundles = pkg.get('dsh', {}).get('profile', {}).get('bundles', [])
if '@dsh-external/dsh-hide-reasoning' in bundles:
    bundles.remove('@dsh-external/dsh-hide-reasoning')
    changed = True
if changed:
    with open(pkg_path, 'w') as f:
        json.dump(pkg, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print('    package.json 已更新')
else:
    print('    package.json 中未发现该插件，无需修改')
PY

echo "==> 删除插件目录 $DEST"
rm -rf "$DEST"

echo "==> 更新依赖"
if command -v pnpm >/dev/null 2>&1; then
  (cd "$WEB_PROFILE" && pnpm install)
else
  echo "警告：未找到 pnpm，请手动执行：cd $WEB_PROFILE && pnpm install" >&2
fi

UID_NUM="$(id -u)"
if launchctl print "gui/$UID_NUM/com.jblam.deepseek-harness" >/dev/null 2>&1; then
  launchctl kickstart -k "gui/$UID_NUM/com.jblam.deepseek-harness"
  echo "==> 已重启 dsh web，刷新页面后「思考」行将恢复显示。"
else
  echo "==> 未检测到 launchd 托管的 dsh web，请手动重启后刷新页面。"
fi
