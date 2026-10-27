#!/system/bin/sh
# dsh-pierce 一键安装
#   sh install.sh https://example.com/dsh-pierce-0.2.0.tgz
#   sh install.sh ./dsh-pierce-0.2.0.tgz --profile /path/to/profiles/web
#   curl -fsSL https://example.com/install.sh | sh -s -- https://example.com/dsh-pierce-0.2.0.tgz
set -e

URL="$1"
[ -z "$URL" ] && { echo "用法: sh install.sh <tgz 的 URL 或本地路径> [--profile DIR]"; exit 1; }
shift || true

# 逐级找一个能写的临时目录（Android 上 /tmp 往往存在但不可写）
TMP=""
for C in "$TMPDIR" "$HOME/tmp" "$(dirname "$0")" "$PWD"; do
  if [ -n "$C" ]; then
    if mkdir -p "$C/dsh-pierce-install-$$" 2>/dev/null; then
      TMP="$C/dsh-pierce-install-$$"
      break
    fi
  fi
done
[ -z "$TMP" ] && { echo "[pierce] 没有可写的临时目录"; exit 1; }
echo "[pierce] 临时目录 $TMP"

case "$URL" in
  http://*|https://*)
    echo "[pierce] 下载 $URL"
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL "$URL" -o "$TMP/p.tgz"
    elif command -v wget >/dev/null 2>&1; then
      wget -qO "$TMP/p.tgz" "$URL"
    else
      echo "[pierce] 需要 curl 或 wget"; rm -rf "$TMP"; exit 1
    fi
    ;;
  *)
    cp "$URL" "$TMP/p.tgz"
    ;;
esac

echo "[pierce] 解包"
tar xzf "$TMP/p.tgz" -C "$TMP"
set +e
node "$TMP/package/bin/install.mjs" "$@"
RC=$?
set -e
rm -rf "$TMP"
exit $RC
