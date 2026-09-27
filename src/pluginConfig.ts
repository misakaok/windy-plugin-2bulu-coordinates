import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-2bulu-coordinates',
    version: '0.1.2',
    icon: '📍',
    title: '两步路坐标转换插件',
    description: '将两步路的 GCJ-02、BD-09 或 WGS84 经纬度转换为 Windy 坐标并在地图定位。',
    author: 'misakaok',
    repository: 'https://github.com/misakaok/windy-plugin-2bulu-coordinates',
    desktopUI: 'rhpane',
    mobileUI: 'fullscreen',
    routerPath: '/2bulu-coordinates',
    private: true,
};

export default config;
