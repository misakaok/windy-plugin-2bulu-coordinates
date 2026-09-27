export type CoordinateSystem = 'GCJ02' | 'WGS84' | 'BD09';
export type PairOrder = 'latlon' | 'lonlat';
export type Coordinates = { lat: number; lon: number };

export function detectSourceSystem(text: string): CoordinateSystem | null {
    const tag = text.match(/【\s*(GCJ[-－]?0?2|WGS[-－]?84|BD[-－]?0?9)\s*】/i)?.[1];
    if (!tag) return null;
    const normalized = tag.toUpperCase().replace(/[-－]/g, '');
    return normalized.startsWith('GCJ') ? 'GCJ02' : normalized.startsWith('BD') ? 'BD09' : 'WGS84';
}

const numberPattern = '[-+]?\\d+(?:\\.\\d+)?';
const latitudeLabel = new RegExp(`(?:纬度|北纬|南纬|latitude|lat)\\s*[:：=]?\\s*(${numberPattern})`, 'i');
const longitudeLabel = new RegExp(`(?:经度|东经|西经|longitude|lon|lng)\\s*[:：=]?\\s*(${numberPattern})`, 'i');
const numberRegex = new RegExp(numberPattern, 'g');

export function parseCoordinates(text: string, order: PairOrder): Coordinates {
    const cleaned = text.replace(/GCJ[-－]?0?2|BD[-－]?0?9|WGS[-－]?84|两步路/gi, '');
    const latMatch = cleaned.match(latitudeLabel);
    const lonMatch = cleaned.match(longitudeLabel);
    let lat: number;
    let lon: number;
    if (latMatch && lonMatch) {
        lat = Number(latMatch[1]);
        lon = Number(lonMatch[1]);
    } else if (!latMatch && !lonMatch) {
        const values = cleaned.match(numberRegex);
        if (!values || values.length !== 2) throw new Error('请输入一组十进制坐标，例如 39.908823, 116.397470。');
        const first = Number(values[0]);
        const second = Number(values[1]);
        [lat, lon] = order === 'latlon' ? [first, second] : [second, first];
    } else {
        throw new Error('请同时提供纬度和经度。');
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        throw new Error('坐标超出范围：纬度应在 -90 到 90，经度应在 -180 到 180。请检查输入顺序。');
    }
    return { lat, lon };
}

// Invert the common GCJ-02 forward transform numerically.
const pi = Math.PI;
const a = 6378245.0;
const ee = 0.006693421622965943;

function inGcjRegion({ lat, lon }: Coordinates): boolean {
    return lon >= 72.004 && lon <= 137.8347 && lat >= 0.8293 && lat <= 55.8271;
}

function latitudeOffset(x: number, y: number): number {
    let value = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    value += (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3;
    value += (20 * Math.sin(y * pi) + 40 * Math.sin(y / 3 * pi)) * 2 / 3;
    return value + (160 * Math.sin(y / 12 * pi) + 320 * Math.sin(y * pi / 30)) * 2 / 3;
}

function longitudeOffset(x: number, y: number): number {
    let value = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    value += (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3;
    value += (20 * Math.sin(x * pi) + 40 * Math.sin(x / 3 * pi)) * 2 / 3;
    return value + (150 * Math.sin(x / 12 * pi) + 300 * Math.sin(x / 30 * pi)) * 2 / 3;
}

export function wgs84ToGcj02(point: Coordinates): Coordinates {
    if (!inGcjRegion(point)) return point;
    const x = point.lon - 105;
    const y = point.lat - 35;
    const radLat = point.lat / 180 * pi;
    const sinLat = Math.sin(radLat);
    const magic = 1 - ee * sinLat * sinLat;
    const sqrtMagic = Math.sqrt(magic);
    const dLat = latitudeOffset(x, y) * 180 / (a * (1 - ee) / (sqrtMagic ** 3) * pi);
    const dLon = longitudeOffset(x, y) * 180 / (a / sqrtMagic * Math.cos(radLat) * pi);
    return { lat: point.lat + dLat, lon: point.lon + dLon };
}

export function gcj02ToWgs84(point: Coordinates): Coordinates {
    if (!inGcjRegion(point)) return point;
    let estimate = { ...point };
    for (let i = 0; i < 10; i++) {
        const projected = wgs84ToGcj02(estimate);
        const latError = projected.lat - point.lat;
        const lonError = projected.lon - point.lon;
        estimate = { lat: estimate.lat - latError, lon: estimate.lon - lonError };
        if (Math.max(Math.abs(latError), Math.abs(lonError)) < 1e-9) break;
    }
    return estimate;
}

export function bd09ToGcj02({ lat, lon }: Coordinates): Coordinates {
    const x = lon - 0.0065;
    const y = lat - 0.006;
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * pi * 3000 / 180);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * pi * 3000 / 180);
    return { lat: z * Math.sin(theta), lon: z * Math.cos(theta) };
}

export function toWgs84(point: Coordinates, source: CoordinateSystem): Coordinates {
    if (source === 'WGS84') return point;
    return gcj02ToWgs84(source === 'BD09' ? bd09ToGcj02(point) : point);
}
