export class Color {
    public r: number;
    public g: number;
    public b: number;
    public a: number;

    /**
     * Creates a new Color instance
     * @param r Red component (0-255)
     * @param g Green component (0-255)
     * @param b Blue component (0-255)
     * @param a Alpha component (0-255, defaults to 255)
     */
    constructor(r: number, g: number, b: number, a: number = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    /**
     * Compares this color to another color for equality
     * @param other The other color to compare with
     * @returns True if all RGBA components are equal, false otherwise
     */
    public compareTo(other: Color): boolean {
        return (this.r === other.r) && (this.g === other.g) && (this.b === other.b) && (this.a === other.a);
    }

    /**
     * Converts the color to a hex string representation
     * @returns Hex string in the format #rrggbbaa
     */
    public toString(): string {
        return '#' + [this.r, this.g, this.b, this.a].map(n => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('');
    }

    /**
     * Creates a Color instance from a numeric array
     * @param arr Array with 3 [r, g, b] or 4 [r, g, b, a] components
     * @returns New Color instance
     * @throws Error if array length is not 3 or 4
     */
    public static fromArray(arr: number[]): Color {
        if (arr.length === 3) {
            return new Color(arr[0], arr[1], arr[2]);
        }
        if (arr.length === 4) {
            return new Color(arr[0], arr[1], arr[2], arr[3]);
        }
        throw new Error(`Can't create color from array [ ${arr.join(', ')} ] with length ${arr.length}`);
    }

    /**
     * Creates a Color instance from a CSS color string
     * Supports rgb(), rgba(), and hex formats
     * @param cssValue CSS color string
     * @returns New Color instance
     */
    public static fromCss(cssValue: string): Color {
        // Handle rgb() and rgba() formats
        const rgbMatch = cssValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
            return new Color(r, g, b, Math.round(a * 255));
        }

        // Handle hex format
        const hexMatch = cssValue.match(/^#([0-9A-Fa-f]{3,8})$/);
        if (hexMatch) {
            let hex = hexMatch[1];
            if (hex.length === 3 || hex.length === 4) {
                hex = hex.split('').map(c => c + c).join('');
            }

            if (hex.length === 6) {
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                return new Color(r, g, b, 255);
            } else if (hex.length === 8) {
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                const a = parseInt(hex.substring(6, 8), 16);
                return new Color(r, g, b, a);
            }
        }

        // Default to black if parsing fails
        return new Color(0, 0, 0, 255);
    }

    /**
     * Creates a Color instance from ImageData array at specified index
     * @param data ImageData array (Uint8ClampedArray)
     * @param i Starting index in the array (typically 4 * pixel index)
     * @returns New Color instance
     */
    public static fromImageData(data: ImageDataArray, i: number): Color {
        return new Color(
            data[i],
            data[i + 1],
            data[i + 2],
            data[i + 3]
        );
    }
}
