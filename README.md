# 两步路 → Windy 坐标转换插件

基于 [Windy 官方插件模板](https://github.com/windycom/windy-plugin-template)。将两步路显示的十进制经纬度按所选坐标系转换为 Windy 地图使用的 WGS84 经纬度，并在地图上定位。无需账号、API key 或外部坐标转换服务；坐标只在浏览器本地处理。

当前版本安装 URL：[0.1.1 插件链接](https://windy-plugins.com/10506671/windy-plugin-2bulu-coordinates/0.1.1/plugin.min.js)。在 Windy 的“从 URL 加载插件”中粘贴此链接。

## 使用

1. 在两步路地图顶部确认当前坐标系（GCJ-02、WGS84 或 BD-09），点击经纬度复制。
2. 在插件中选择同一种坐标系，粘贴坐标。无标签数字默认是 **纬度, 经度**；若是 **经度, 纬度**，切换下拉框。带“纬度/经度”标签的文本会自动识别顺序。
3. 点击“转换并在地图定位”。可复制 WGS84 坐标，或在当前页面打开该地点天气。

两步路官方曾说明默认坐标系为 GCJ-02，后来增加了地图顶部快速切换 GCJ-02、WGS84 和 BD-09 的功能。所以请以 App 当前显示为准，不要仅凭默认值判断。

## 本地开发

需要 Node.js 和 npm。

```sh
npm install
npm start
```

打开 [Windy 开发者模式](https://www.windy.com/developer-mode)，从 `https://localhost:9999/plugin.js` 加载插件。首次访问本地 HTTPS 服务时，浏览器可能需要接受开发证书。

生成构建产物：

```sh
npm run build
```

运行坐标转换测试（需要 Node.js 22 或更新版本）：`npm test`。

源码在 `src/`，输出在 `dist/`。

## 发布和分享安装 URL

Windy 要求正式插件从 `windy-plugins.com` 提供。仓库包含官方模板的 `publish-plugin` GitHub Actions 工作流。发布前：

1. 登录 [Windy API Keys](https://api.windy.com/keys)，创建类型为 **Windy Plugins API** 的密钥。
2. 在 [本仓库的 GitHub Actions secrets](https://github.com/misakaok/windy-plugin-2bulu-coordinates/settings/secrets/actions) 新建名为 `WINDY_API_KEY` 的 secret，粘贴密钥。不要把密钥写入源码或发在聊天中。
3. 在 [Actions](https://github.com/misakaok/windy-plugin-2bulu-coordinates/actions/workflows/publish-plugin.yml) 运行 `publish-plugin` 工作流。成功后，展开 `Publish Plugin` 日志，复制 Windy 返回的安装 URL。

插件目前设置为 `private: true`，可通过安装 URL 分享给其他人。若要进入 Windy 公开插件列表，还需改为 `private: false` 并提交给 Windy 审核。

## 转换范围

- GCJ-02 → WGS84：在常用 GCJ-02 中国区域范围内做数值逆变换；范围外直接保留原坐标。
- BD-09 → WGS84：先转 GCJ-02，再做上述逆变换。
- WGS84 → WGS84：原样保留。

GCJ-02 逆变换采用常见公开近似算法。位置结果适合地图和天气查询，不应用作测绘或救援的唯一定位依据；实际精度还受两步路显示精度和原始定位误差影响。
