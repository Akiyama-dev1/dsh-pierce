#!/system/bin/sh
# 一条命令把仓库推到 GitHub，并打印安装链接
#   sh publish.sh <用户名> <个人访问令牌> [仓库名]
# 令牌需要 repo 权限（classic PAT 勾 repo；fine-grained 勾 Contents: Read/Write + Administration: Read/Write）
set -e

USER_NAME="$1"
TOKEN="$2"
REPO="$3"
[ -z "$REPO" ] && REPO="dsh-pierce"

[ -z "$USER_NAME" ] && { echo "用法: sh publish.sh <用户名> <token> [仓库名]"; exit 1; }
[ -z "$TOKEN" ] && { echo "用法: sh publish.sh <用户名> <token> [仓库名]"; exit 1; }

cd "$(dirname "$0")"

echo "[1/5] 把 README 里的 USER 换成 $USER_NAME"
for f in README.md package.json; do
  sed -i "s/USER\/dsh-pierce/$USER_NAME\/$REPO/g; s/github.com\/USER\//github.com\/$USER_NAME\//g" "$f"
done

echo "[2/5] 提交改动"
git add -A
git -c commit.gpgsign=false commit -q -m "docs: point links at $USER_NAME/$REPO" 2>/dev/null || echo "  （无改动，跳过）"

echo "[3/5] 确保远端仓库存在"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/$USER_NAME/$REPO")
if [ "$CODE" = "404" ]; then
  curl -s -o /dev/null -X POST -H "Authorization: token $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -d "{\"name\":\"$REPO\",\"description\":\"Pierce — prompt takeover plugin for DeepSeek Harness\",\"private\":false}" \
    "https://api.github.com/user/repos"
  echo "  已创建 $USER_NAME/$REPO"
else
  echo "  已存在（HTTP $CODE）"
fi

echo "[4/5] 推送"
git remote remove origin 2>/dev/null || true
git remote add origin "https://$USER_NAME:$TOKEN@github.com/$USER_NAME/$REPO.git"
git push -u origin HEAD:main --force
git remote set-url origin "https://github.com/$USER_NAME/$REPO.git"

echo "[5/5] 完成"
echo ""
echo "仓库: https://github.com/$USER_NAME/$REPO"
echo "安装链接（发给别人这条）:"
echo ""
echo "curl -fsSL https://raw.githubusercontent.com/$USER_NAME/$REPO/main/install.sh | sh -s -- https://raw.githubusercontent.com/$USER_NAME/$REPO/main/dsh-pierce-0.2.0.tgz"
echo ""
