# 运营大脑 (yydn)

Next.js + shadcn/ui 前端，对接 KB 对话后端 [kb-chat-python-service](https://github.com/Fasthei/kb-chat-python-service)。

## 本地开发

```bash
npm ci
cp .env.example .env.local
# 编辑 NEXT_PUBLIC_KB_API_BASE 指向本地或 Azure 上的 kb-chat 服务
npm run dev
```

## 构建（静态导出，用于 Azure Static Web Apps）

```bash
npm run build
# 输出目录: out/
```

## CI/CD

推送 `main` 分支触发 [`.github/workflows/azure-static-web-apps.yml`](.github/workflows/azure-static-web-apps.yml)。

在 GitHub 仓库 Secrets 中配置：

- `AZURE_STATIC_WEB_APPS_API_TOKEN` — Azure Portal → Static Web App → Manage deployment token

## 环境变量

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_KB_API_BASE` | kb-chat 后端根 URL（无尾斜杠），如 `https://aichatgongdan-xxx.azurewebsites.net` |
