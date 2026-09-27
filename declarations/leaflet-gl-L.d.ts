declare namespace L {
    interface MarkerOptions { icon?: unknown; }
    class Marker {
        constructor(latlng: [number, number], options?: MarkerOptions);
        addTo(map: unknown): this;
        remove(): this;
    }
}
