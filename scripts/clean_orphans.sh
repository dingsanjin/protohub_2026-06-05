#!/bin/bash
# 清理历史孤儿文件：db 不再引用的物理文件/目录
# 用法：bash scripts/clean_orphans.sh
set -e
cd "$(dirname "$0")/.."
cd backend
DB="database/dev.sqlite3"
STORAGE="${FILE_STORAGE_PATH:-./uploads}"
[ -f "$DB" ] || { echo "找不到 db: $DB"; exit 1; }

# 找出所有 user_id 目录
for udir in "$STORAGE"/*/; do
  [ -d "$udir" ] || continue
  uid=$(basename "$udir")
  # 跳过非数字目录
  [[ "$uid" =~ ^[0-9]+$ ]] || continue

  for entry in "$udir"*/ "$udir"*.html; do
    [ -e "$entry" ] || continue
    if [ -d "$entry" ]; then
      name=$(basename "$entry")
      # 解压目录：db 中以 "$uid/$name/" 开头的 storage_path 才算引用
      if ! sqlite3 "$DB" "SELECT 1 FROM files WHERE user_id=$uid AND storage_path LIKE '${uid}/${name}/%';" | grep -q 1; then
        echo "  清孤儿目录: $entry"
        rm -rf "$entry"
      fi
    else
      name=$(basename "$entry")
      if ! sqlite3 "$DB" "SELECT 1 FROM files WHERE user_id=$uid AND storage_path='${uid}/${name}';" | grep -q 1; then
        echo "  清孤立文件: $entry"
        rm -f "$entry"
      fi
    fi
  done
done
echo "完成"
