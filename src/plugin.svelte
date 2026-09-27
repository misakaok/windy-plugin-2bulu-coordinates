<div class="plugin__mobile-header">{title}</div>
<section class="plugin__content converter">
    <div class="plugin__title plugin__title--chevron-back" on:click={() => bcast.emit('rqstOpen', 'menu')}>{title}</div>
    <p>粘贴两步路显示的十进制经纬度，选择它当前的坐标系。</p>
    <label for="source">两步路坐标系</label>
    <select id="source" bind:value={source} on:change={clearResult}>
        <option value="GCJ02">GCJ-02（国测局，常见默认值）</option>
        <option value="WGS84">WGS84（GPS）</option>
        <option value="BD09">BD-09（百度）</option>
    </select>
    <label for="coordinates">两步路坐标</label>
    <textarea id="coordinates" bind:value={input} on:input={clearResult} placeholder="例如：39.908823, 116.397470" rows="3"></textarea>
    <label for="order">无标签的两个数字按什么顺序排列？</label>
    <select id="order" bind:value={order} on:change={clearResult}>
        <option value="latlon">纬度, 经度</option>
        <option value="lonlat">经度, 纬度</option>
    </select>
    <p class="hint">“【GCJ02】”等坐标系标签及“纬度/经度”标签会自动识别。无标签时请与两步路地图顶部显示的坐标系保持一致。</p>
    <button type="button" on:click={convert}>转换并在地图定位</button>
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    {#if result}
        <div class="result" aria-live="polite">
            <strong>Windy 坐标（WGS84）</strong>
            <div>纬度：{result.lat.toFixed(6)}</div>
            <div>经度：{result.lon.toFixed(6)}</div>
            <div class="actions">
                <button type="button" on:click={copyCoordinates}>复制坐标</button>
                <a href={windyUrl} target="_blank" rel="noopener noreferrer">打开此处天气</a>
            </div>
            {#if copied}<p class="hint">已复制：纬度, 经度</p>{/if}
        </div>
    {/if}
</section>

<script lang="ts">
    import bcast from '@windy/broadcast';
    import { map, markers } from '@windy/map';
    import { onDestroy } from 'svelte';
    import config from './pluginConfig';
    import { detectSourceSystem, parseCoordinates, toWgs84, type Coordinates, type CoordinateSystem, type PairOrder } from './coordinates';

    const { title } = config;
    let source: CoordinateSystem = 'GCJ02';
    let order: PairOrder = 'latlon';
    let input = '';
    let result: Coordinates | null = null;
    let error = '';
    let copied = false;
    let marker: L.Marker | null = null;

    $: windyUrl = result
        ? `https://www.windy.com/${result.lat.toFixed(6)}/${result.lon.toFixed(6)}?${result.lat.toFixed(6)},${result.lon.toFixed(6)},11`
        : '';

    function clearResult(): void {
        result = null;
        error = '';
        copied = false;
        marker?.remove();
        marker = null;
    }

    function convert(): void {
        clearResult();
        try {
            const parsed = parseCoordinates(input, order);
            source = detectSourceSystem(input) ?? source;
            result = toWgs84(parsed, source);
            marker?.remove();
            marker = new L.Marker([result.lat, result.lon], { icon: markers.pulsatingIcon }).addTo(map);
            map.setView([result.lat, result.lon], 11);
        } catch (cause) {
            error = cause instanceof Error ? cause.message : '坐标转换失败';
        }
    }

    async function copyCoordinates(): Promise<void> {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(`${result.lat.toFixed(6)}, ${result.lon.toFixed(6)}`);
            copied = true;
            error = '';
        } catch {
            error = '复制失败，请手动复制上面的坐标。';
        }
    }

    onDestroy(() => marker?.remove());
</script>

<style lang="less">
    .converter {
        padding-bottom: 24px;
        label { display: block; margin: 16px 0 6px; font-weight: 600; }
        select, textarea { box-sizing: border-box; width: 100%; padding: 9px; border: 1px solid #aaa; border-radius: 5px; background: white; color: #222; font: inherit; }
        textarea { resize: vertical; }
        button, .actions a { display: inline-block; margin-top: 12px; padding: 9px 12px; border: 0; border-radius: 5px; background: #f05a28; color: white; font: inherit; cursor: pointer; text-decoration: none; }
        .hint { font-size: 12px; color: #777; }
        .error { color: #c32222; }
        .result { margin-top: 20px; padding: 14px; border: 1px solid #ccc; border-radius: 5px; line-height: 1.8; }
        .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    }
</style>
