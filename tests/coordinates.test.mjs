import test from 'node:test';
import assert from 'node:assert/strict';
import { detectSourceSystem, parseCoordinates, toWgs84, wgs84ToGcj02 } from '../src/coordinates.ts';

test('official 2bulu WGS84 / GCJ-02 example converts back to the original point', () => {
    const gcj = { lat: 19.99792574, lon: 120.00396255 };
    const wgs = toWgs84(gcj, 'GCJ02');
    assert.ok(Math.abs(wgs.lat - 20) < 0.000001);
    assert.ok(Math.abs(wgs.lon - 120) < 0.000001);
    const forward = wgs84ToGcj02({ lat: 20, lon: 120 });
    assert.ok(Math.abs(forward.lat - gcj.lat) < 0.000001);
    assert.ok(Math.abs(forward.lon - gcj.lon) < 0.000001);
});

test('WGS84 passes through and coordinate labels override pair order', () => {
    assert.deepEqual(parseCoordinates('GCJ-02 经度：116.397470 纬度：39.908823', 'latlon'), { lat: 39.908823, lon: 116.39747 });
    assert.deepEqual(parseCoordinates('116.397470,39.908823', 'lonlat'), { lat: 39.908823, lon: 116.39747 });
    assert.deepEqual(toWgs84({ lat: 1.2, lon: -2.3 }, 'WGS84'), { lat: 1.2, lon: -2.3 });
    assert.throws(() => parseCoordinates('116.397470,39.908823', 'latlon'), /超出范围/);
});

test('2bulu copied GCJ02 text converts to the Windy location', () => {
    const raw = '【GCJ02】 32.07251351°N, 98.92266165°E';
    assert.equal(detectSourceSystem(raw), 'GCJ02');
    const parsed = parseCoordinates(raw, 'latlon');
    assert.deepEqual(parsed, { lat: 32.07251351, lon: 98.92266165 });
    const converted = toWgs84(parsed, 'GCJ02');
    assert.equal(converted.lat.toFixed(6), '32.075038');
    assert.equal(converted.lon.toFixed(6), '98.922132');
    const roundtrip = wgs84ToGcj02(converted);
    assert.ok(Math.abs(roundtrip.lat - parsed.lat) < 1e-8);
    assert.ok(Math.abs(roundtrip.lon - parsed.lon) < 1e-8);
});
