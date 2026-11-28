#!/usr/bin/env bash
# Cloudflare Pages 一键配置（委托 AI 代操作用）
# 前提：NS 已切到 Cloudflare（已确认生效）
# 用法：CLOUDFLARE_API_TOKEN=<Token> bash scripts/cf-setup.sh
# Token 需要的权限（Zone Resources 选 toolwild.com）：
#   Account -> Cloudflare Pages -> Edit
#   Zone -> Zone -> Read
#   Zone -> DNS -> Edit
#   Zone -> Zone Settings -> Edit
#   Zone -> Zone Rulesets -> Edit
set -euo pipefail

API="https://api.cloudflare.com/client/v4"
TOKEN="${CLOUDFLARE_API_TOKEN:?缺少 CLOUDFLARE_API_TOKEN}"
PROJECT="toolwild"
DOMAIN="www.toolwild.com"
APEX="toolwild.com"
HDR=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

jget() { python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d.get('success'):
    print('API 错误:', json.dumps(d.get('errors'), ensure_ascii=False))
    sys.exit(1)
print(json.dumps(d['result'], ensure_ascii=False))
"; }

step() { echo; echo "======== $1 ========"; }

step "1/7 验证 Token"
curl -sS "${HDR[@]}" "$API/user/tokens/verify" | jget > /dev/null && echo "Token 有效"

step "2/7 获取 Account ID"
ACCOUNT_ID=$(curl -sS "${HDR[@]}" "$API/accounts" | jget | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['id'])")
echo "Account: $ACCOUNT_ID"

step "3/7 确认 Pages 项目 $PROJECT"
STATUS=$(curl -sS -o /tmp/cf_proj.json -w "%{http_code}" "${HDR[@]}" "$API/accounts/$ACCOUNT_ID/pages/projects/$PROJECT")
if [ "$STATUS" = "404" ]; then
  curl -sS "${HDR[@]}" -X POST "$API/accounts/$ACCOUNT_ID/pages/projects" \
    -d "{\"name\":\"$PROJECT\",\"production_branch\":\"main\"}" | jget > /dev/null
  echo "已创建项目 $PROJECT"
else
  echo "项目已存在（跳过创建）"
fi

step "4/7 部署 dist/ 到 Pages"
CLOUDFLARE_API_TOKEN="$TOKEN" npx wrangler pages deploy dist --project-name "$PROJECT" --branch main --commit-dirty=true

step "5/7 绑定自定义域 $DOMAIN"
curl -sS "${HDR[@]}" -X POST "$API/accounts/$ACCOUNT_ID/pages/projects/$PROJECT/domains" \
  -d "{\"name\":\"$DOMAIN\"}" | jget > /dev/null && echo "绑定请求已提交（证书签发需几分钟）" || echo "可能已绑定，继续"

step "6/7 zone 修正：SSL 模式 / 删除停放 A 记录 / 根域 301"
ZONE_ID=$(curl -sS "${HDR[@]}" "$API/zones?name=$APEX" | jget | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['id'])")
echo "Zone: $ZONE_ID"

curl -sS "${HDR[@]}" -X PATCH "$API/zones/$ZONE_ID/settings" -d '{"value":"full"}' | jget > /dev/null
echo "SSL/TLS 模式 -> full"

python3 - "$ZONE_ID" <<'PY' && echo "停放 A 记录已清理" || echo "无停放 A 记录或删除失败（可手动检查 DNS）"
import json, os, subprocess, sys
zone = sys.argv[1]
tok = os.environ["CLOUDFLARE_API_TOKEN"]
api = "https://api.cloudflare.com/client/v4"
hdr = ["-H", f"Authorization: Bearer {tok}", "-H", "Content-Type: application/json"]
parked = {"34.216.117.25", "54.149.79.189"}
out = subprocess.run(["curl", "-sS", *hdr, f"{api}/zones/{zone}/dns_records?type=A"], capture_output=True, text=True).stdout
d = json.loads(out)
if not d.get("success"):
    sys.exit(1)
for rec in d["result"]:
    if rec.get("content") in parked or (rec.get("name") == "toolwild.com" and rec.get("type") == "A"):
        subprocess.run(["curl", "-sS", *hdr, "-X", "DELETE",
                        f"{api}/zones/{zone}/dns_records/{rec['id']}"], capture_output=True, text=True)
        print("已删除:", rec["name"], rec["content"])
PY

curl -sS "${HDR[@]}" -X PUT \
  "$API/zones/$ZONE_ID/rulesets/phases/http_request_dynamic_redirect/entrypoint" \
  -d '{"rules":[{"expression":"(http.host eq \"toolwild.com\")","action":"redirect","action_parameters":{"redirect":{"target_url":"https://www.toolwild.com{uri.path}?{uri.query}","status_code":301}},"description":"apex -> www"}]}' \
  | jget > /dev/null && echo "根域 301 -> https://www.toolwild.com 已配置"

step "7/7 验证"
sleep 5
curl -sS -o /dev/null -w "https://www.toolwild.com -> %{http_code}\n" --max-time 20 "https://$DOMAIN/" || true
curl -sS -o /dev/null -w "https://toolwild.com    -> %{http_code} (redirect: %{redirect_url})\n" --max-time 20 "https://$APEX/" || true
curl -sS --max-time 12 "https://dns.alidns.com/resolve?name=$DOMAIN&type=A" | python3 -c "import sys,json;d=json.load(sys.stdin);print('www A 记录:',[a.get('data') for a in d.get('Answer',[])] or '暂无（证书/DNS 生效需几分钟到几小时）')"
echo
echo "完成。若 www 首次访问 5xx/522，等待证书 Active 后重试即可。"
