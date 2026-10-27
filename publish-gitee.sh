#!/system/bin/sh
# 推到 Gitee（国内直连，不会被 GitHub 那种限流卡住）
#   sh publish-gitee.sh <用户名> <私人令牌> [仓库名]
# 令牌: https://gitee.com/profile/personal_access_tokens 勾 projects
set -e

USER_NAME="$1"
TOKEN="$2"
REPO="$3"
[ -z "$REPO" ] && REPO="dsh-pierce"
[ -z "$USER_NAME" ] && { echo "用法: sh publish-gitee.sh <用户名> <令牌> [仓库名]"; exit 1; }
[ -z "$TOKEN" ] && { echo "用法: sh publish-gitee.sh <用户名> <令牌> [仓库名]"; exit 1; }

cd "$(dirname "$0")"

echo "[1/5] 替换链接占位符"
for f in README.md package.json; do
  sed -i "s/USER\/dsh-pierce/$USER_NAME\/$REPO/g; s/github.com\/USER\//gitee.com\/$USER_NAME\//g" "$f"
done

echo "[2/5] 提交"
git add -A
git -c commit.gpgsign=false commit -q -m "docs: point links at gitee/$USER_NAME/$REPO" 2>/dev/null || echo "  （无改动）"

echo "[3/5] 确保仓库存在"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "https://gitee.com/api/v5/repos/$USER_NAME/$REPO?access_token=$TOKEN")
if [ "$CODE" = "404" ]; then
  curl -s -o /dev/null -X POST "https://gitee.com/api/v5/user/repos" \
    -d "access_token=$TOKEN&name=$REPO&private=false&description=Pierce%20for%20DeepSeek%20Harness&auto_init=false"
  echo "  已创建 $USER_NAME/$REPO"
else
  echo "  已存在（HTTP $CODE）"
fi

echo "[4/5] 推送"
git remote remove origin 2>/dev/null || true
git remote add origin "https://$USER_NAME:$TOKEN@gitee.com/$USER_NAME/$REPO.git"
git push -u origin HEAD:main --force
git remote set-url origin "https://gitee.com/$USER_NAME/$REPO.git"

echo "[5/5] 完成"
echo ""
echo "仓库: https://gitee.com/$USER_NAME/$REPO"
echo "安装链接:"
echo ""
echo "curl -fsSL https://gitee.com/$USER_NAME/$REPO/raw/main/install.sh | sh -s -- https://gitee.com/$USER_NAME/$REPO/raw/main/dsh-pierce-0.2.0.tgz"
echo ""
