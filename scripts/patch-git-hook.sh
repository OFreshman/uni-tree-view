#!/bin/sh

HOOK=".git/hooks/pre-commit"
echo "[patch-git-hook] patching hook: $HOOK"

if [ ! -f "$HOOK" ]; then
  echo "[patch-git-hook] ERROR: hook file not found: $HOOK" >&2
  exit 1
fi

# 插入 SKIP_SIMPLE_GIT_HOOKS 判断（如果尚未插入）
grep -q 'SKIP_SIMPLE_GIT_HOOKS' "$HOOK" || {
  sed -i '' '1i\
if [ \"$SKIP_SIMPLE_GIT_HOOKS\" = \"1\" ]; then\
  echo \"[INFO] SKIP_SIMPLE_GIT_HOOKS is set to 1, skipping hook.\"\
  exit 0\
fi' "$HOOK"
  echo "[patch-git-hook] inserted SKIP_SIMPLE_GIT_HOOKS logic"
}

# 插入初始化逻辑（如果尚未插入）
grep -q 'SIMPLE_GIT_HOOKS_RC' "$HOOK" || {
  sed -i '' '1i\
if [ -f "$SIMPLE_GIT_HOOKS_RC" ]; then\
  . "$SIMPLE_GIT_HOOKS_RC"\
fi' "$HOOK"
  echo "[patch-git-hook] inserted SIMPLE_GIT_HOOKS_RC logic"
}

# 替换最后一行 “npx lint-staged” 为拥有 fallback 的脚本
sed -i '' '$d' "$HOOK"  # 删除最后一行
cat >> "$HOOK" << 'EOF'
if command -v npx >/dev/null 2>&1; then
  npx lint-staged
else
  ./node_modules/.bin/lint-staged
fi
EOF
echo "[patch-git-hook] replaced lint-staged invocation with fallback"

echo "[patch-git-hook] patching done."
