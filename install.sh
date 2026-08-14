#!/usr/bin/env bash
#
# dsh-hide-reasoning 一键安装脚本（macOS / DeepSeek Harness）
#
# 用法:  ./install.sh [目标安装目录]
# 默认把插件安装到 ~/Documents/dsh-hide-reasoning
#
# 脚本会:
#   1. 检查本机 DeepSeek Harness web profile 是否存在
#   2. 探测当前 DSH 版本的「思考」行样式类名（不同 DSH 版本类名哈希不同）
#   3. 把插件复制到目标目录并写入探测到的类名
#   4. 注册到 ~/.dsh/profiles/web/package.json
#   5. pnpm install 链接依赖，并尝试重启 dsh web

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_SRC="$SCRIPT_DIR/dsh-hide-reasoning"
WEB_PROFILE="$HOME/.dsh/profiles/web"
PKG_NAME="@dsh-external/dsh-hide-reasoning"
DEST="${1:-$HOME/Documents/dsh-hide-reasoning}"

say()  { printf '\n==> %s\n' "$*"; }

say "1/5 检查 DeepSeek Harness web profile"
if [ ! -f "$WEB_PROFILE/package.json" ]; then
  echo "错误：找不到 $WEB_PROFILE/package.json" >&2
  echo "请先在本机安装并运行过一次 DeepSeek Harness（dsh web），再执行本脚本。" >&2
  exit 1
fi

say "2/5 探测当前 DSH 版本的「思考」行类名"
# 探测 root 类名与 thinkBody 类名（两行输出；失败时为空）
DETECTED_ROOT=""
DETECTED_BODY=""
if command -v curl >/dev/null 2>&1 && command -v python3 >/dev/null 2>&1; then
  read -r DETECTED_ROOT DETECTED_BODY <<<"$(python3 - <<'PY' 2>/dev/null || true
import json, re, urllib.request
try:
    html = urllib.request.urlopen('http://127.0.0.1:3080/', timeout=5).read().decode('utf-8')
    m = re.search(r'window\.__DSH_BOOT__ = (\{.*\})\s*</script>', html, re.S)
    if not m:
        raise SystemExit(1)
    boot = json.loads(m.group(1))
    url = None
    for e in boot['entries']:
        if e['id'] == '@deepseek-ai/dsh-client-ui-conversation':
            url = 'http://127.0.0.1:3080' + e['url'].split('?')[0] + '?rev=' + e['rev']
            break
    if not url:
        raise SystemExit(1)
    js = urllib.request.urlopen(url, timeout=8).read().decode('utf-8')
    i = js.find('ReasoningRow_module_css_default = {')
    if i < 0:
        raise SystemExit(1)
    seg = js[i:i + 400]
    m2 = re.search(r'"root":\s*"([A-Za-z0-9_]+)"', seg)
    m3 = re.search(r'"thinkBody":\s*"([A-Za-z0-9_]+)"', seg)
    print((m2.group(1) if m2 else ''), (m3.group(1) if m3 else ''))
except Exception:
    raise SystemExit(1)
PY
)"
fi

if [ -n "$DETECTED_ROOT" ] || [ -n "$DETECTED_BODY" ]; then
  echo "    检测到 root 类名: ${DETECTED_ROOT:-（无）}  thinkBody 类名: ${DETECTED_BODY:-（无）}"
else
  echo "    未能自动探测（可能 dsh web 未运行），改用稳定属性选择器 [data-variant=\"think\"]"
  echo "    提示：该属性由 DSH 前端语义提供，跨构建有效；若失效可先启动 dsh web 再重跑本脚本。"
fi

say "3/5 安装插件到 $DEST"
# 安全校验：只拒绝绝对危险的路径（空、根、家目录本身），
# 不要用 "$HOME/"* 通配——那会误伤 $HOME/Documents/... 等合法安装位置。
case "$DEST" in
  ""|"/"|"$HOME")
    echo "错误：目标路径不安全：$DEST" >&2
    exit 1
    ;;
esac
DEST_BASENAME="$(basename "$DEST")"
if [ "$DEST_BASENAME" != "dsh-hide-reasoning" ]; then
  echo "错误：目标目录名必须是 dsh-hide-reasoning（当前: $DEST）" >&2
  echo "用法: ./install.sh [目标安装目录]（目录名固定为 dsh-hide-reasoning）" >&2
  exit 1
fi
# 防御性校验：探测到的类名只允许字母数字下划线（防 sed/CSS 注入）
if [ -n "$DETECTED_ROOT" ] && ! [[ "$DETECTED_ROOT" =~ ^[A-Za-z0-9_]+$ ]]; then
  echo "警告：探测到的 root 类名含非法字符（$DETECTED_ROOT），已忽略" >&2
  DETECTED_ROOT=""
fi
if [ -n "$DETECTED_BODY" ] && ! [[ "$DETECTED_BODY" =~ ^[A-Za-z0-9_]+$ ]]; then
  echo "警告：探测到的 thinkBody 类名含非法字符（$DETECTED_BODY），已忽略" >&2
  DETECTED_BODY=""
fi
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -R "$PLUGIN_SRC" "$DEST"
# 把 client.js 里的占位选择器替换为探测到的类名。
# 注意：占位符位于 JS 字符串字面量内（var X = "__X__"），所以只能替换为
# 纯类名 token（如 .QWLzlG_root），不能替换成含引号的选择器，否则语法破坏。
# 探测失败时保留占位符：client.js 运行时会对 BODY_SELECTOR 做 fallback，
# HIDE_SELECTOR 占位符是合法但不匹配任何元素的 CSS 规则，且属性选择器已兜底。
if [ -n "$DETECTED_ROOT" ]; then
  sed -i '' "s|__HIDE_REASONING_SELECTOR__|.${DETECTED_ROOT}|g" "$DEST/lib/client.js"
  echo "    client.js 隐藏选择器已更新为 .${DETECTED_ROOT}"
else
  echo "    未探测到 root 类名，保留属性选择器兜底（[data-variant=\"think\"]）"
fi
if [ -n "$DETECTED_BODY" ]; then
  sed -i '' "s|__THINKBODY_SELECTOR__|.${DETECTED_BODY}|g" "$DEST/lib/client.js"
  echo "    client.js 正文选择器已更新为 .${DETECTED_BODY}"
else
  echo "    未探测到 thinkBody 类名，保留运行时 fallback（[class*=\"thinkBody\"]）"
fi

say "4/5 注册到 web profile（$WEB_PROFILE/package.json）"
python3 - "$WEB_PROFILE/package.json" "$DEST" <<'PY'
import json, sys
pkg_path, dest = sys.argv[1], sys.argv[2]
with open(pkg_path) as f:
    pkg = json.load(f)
pkg.setdefault('dependencies', {})['@dsh-external/dsh-hide-reasoning'] = 'link:' + dest
bundles = pkg.setdefault('dsh', {}).setdefault('profile', {}).setdefault('bundles', [])
if '@dsh-external/dsh-hide-reasoning' not in bundles:
    bundles.append('@dsh-external/dsh-hide-reasoning')
with open(pkg_path, 'w') as f:
    json.dump(pkg, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('    package.json 已更新（bundles 含 @dsh-external/dsh-hide-reasoning）')
PY

say "5/5 链接依赖并重启 dsh web"
if command -v pnpm >/dev/null 2>&1; then
  (cd "$WEB_PROFILE" && pnpm install)
else
  echo "警告：未找到 pnpm，请手动执行：cd $WEB_PROFILE && pnpm install" >&2
fi

UID_NUM="$(id -u)"
if launchctl print "gui/$UID_NUM/com.jblam.deepseek-harness" >/dev/null 2>&1; then
  launchctl kickstart -k "gui/$UID_NUM/com.jblam.deepseek-harness"
  echo "    已通过 launchd 重启 dsh web，稍等几秒后刷新页面即可。"
else
  echo "    未检测到 launchd 托管的 dsh web，请手动重启后刷新页面。"
fi

cat <<EOF

完成 ✅
刷新 DeepSeek Harness 页面（建议 Cmd+Shift+R 强制刷新），
对话里的「思考」推理过程折叠行应变成可点击的 Thinking 摘要卡片。

如需卸载：运行 ./uninstall.sh
EOF
