import { Color } from "./color";

export const IS_LOCALHOST: boolean = location.hostname == 'localhost';

export const WPLACE_TILE_SIZE = 1000;

export const AUTO_UPDATE_INTERVAL = 60000; // 1 minute in milliseconds

// Global constants
export const MIN_REMAINING_FOR_BUTTON = 100;

/**
 * Cooldown period for failed tile downloads (10 seconds)
 */
export const COOLDOWN_PERIOD_MS: number = 10000;

export type WplaceColorDefinition = {
    id: number,
    name: string;
    // rgb: number[];
    premium: boolean;
    color: Color;
}

// https://github.com/SwingTheVine/Wplace-BlueMarble/blob/main/src/utils.js
export const WplacePalette: WplaceColorDefinition[] = [
    { id: 0, premium: false, name: "Transparent", color: new Color(0, 0, 0) },
    { id: 1, premium: false, name: "Black", color: new Color(0, 0, 0) },
    { id: 2, premium: false, name: "Dark Gray", color: new Color(60, 60, 60) },
    { id: 3, premium: false, name: "Gray", color: new Color(120, 120, 120) },
    { id: 4, premium: false, name: "Light Gray", color: new Color(210, 210, 210) },
    { id: 5, premium: false, name: "White", color: new Color(255, 255, 255) },
    { id: 6, premium: false, name: "Deep Red", color: new Color(96, 0, 24) },
    { id: 7, premium: false, name: "Red", color: new Color(237, 28, 36) },
    { id: 8, premium: false, name: "Orange", color: new Color(255, 127, 39) },
    { id: 9, premium: false, name: "Gold", color: new Color(246, 170, 9) },
    { id: 10, premium: false, name: "Yellow", color: new Color(249, 221, 59) },
    { id: 11, premium: false, name: "Light Yellow", color: new Color(255, 250, 188) },
    { id: 12, premium: false, name: "Dark Green", color: new Color(14, 185, 104) },
    { id: 13, premium: false, name: "Green", color: new Color(19, 230, 123) },
    { id: 14, premium: false, name: "Light Green", color: new Color(135, 255, 94) },
    { id: 15, premium: false, name: "Dark Teal", color: new Color(12, 129, 110) },
    { id: 16, premium: false, name: "Teal", color: new Color(16, 174, 166) },
    { id: 17, premium: false, name: "Light Teal", color: new Color(19, 225, 190) },
    { id: 18, premium: false, name: "Dark Blue", color: new Color(40, 80, 158) },
    { id: 19, premium: false, name: "Blue", color: new Color(64, 147, 228) },
    { id: 20, premium: false, name: "Cyan", color: new Color(96, 247, 242) },
    { id: 21, premium: false, name: "Indigo", color: new Color(107, 80, 246) },
    { id: 22, premium: false, name: "Light Indigo", color: new Color(153, 177, 251) },
    { id: 23, premium: false, name: "Dark Purple", color: new Color(120, 12, 153) },
    { id: 24, premium: false, name: "Purple", color: new Color(170, 56, 185) },
    { id: 25, premium: false, name: "Light Purple", color: new Color(224, 159, 249) },
    { id: 26, premium: false, name: "Dark Pink", color: new Color(203, 0, 122) },
    { id: 27, premium: false, name: "Pink", color: new Color(236, 31, 128) },
    { id: 28, premium: false, name: "Light Pink", color: new Color(243, 141, 169) },
    { id: 29, premium: false, name: "Dark Brown", color: new Color(104, 70, 52) },
    { id: 30, premium: false, name: "Brown", color: new Color(149, 104, 42) },
    { id: 31, premium: false, name: "Beige", color: new Color(248, 178, 119) },
    { id: 32, premium: true, name: "Medium Gray", color: new Color(170, 170, 170) },
    { id: 33, premium: true, name: "Dark Red", color: new Color(165, 14, 30) },
    { id: 34, premium: true, name: "Light Red", color: new Color(250, 128, 114) },
    { id: 35, premium: true, name: "Dark Orange", color: new Color(228, 92, 26) },
    { id: 36, premium: true, name: "Light Tan", color: new Color(214, 181, 148) },
    { id: 37, premium: true, name: "Dark Goldenrod", color: new Color(156, 132, 49) },
    { id: 38, premium: true, name: "Goldenrod", color: new Color(197, 173, 49) },
    { id: 39, premium: true, name: "Light Goldenrod", color: new Color(232, 212, 95) },
    { id: 40, premium: true, name: "Dark Olive", color: new Color(74, 107, 58) },
    { id: 41, premium: true, name: "Olive", color: new Color(90, 148, 74) },
    { id: 42, premium: true, name: "Light Olive", color: new Color(132, 197, 115) },
    { id: 43, premium: true, name: "Dark Cyan", color: new Color(15, 121, 159) },
    { id: 44, premium: true, name: "Light Cyan", color: new Color(187, 250, 242) },
    { id: 45, premium: true, name: "Light Blue", color: new Color(125, 199, 255) },
    { id: 46, premium: true, name: "Dark Indigo", color: new Color(77, 49, 184) },
    { id: 47, premium: true, name: "Dark Slate Blue", color: new Color(74, 66, 132) },
    { id: 48, premium: true, name: "Slate Blue", color: new Color(122, 113, 196) },
    { id: 49, premium: true, name: "Light Slate Blue", color: new Color(181, 174, 241) },
    { id: 50, premium: true, name: "Light Brown", color: new Color(219, 164, 99) },
    { id: 51, premium: true, name: "Dark Beige", color: new Color(209, 128, 81) },
    { id: 52, premium: true, name: "Light Beige", color: new Color(255, 197, 165) },
    { id: 53, premium: true, name: "Dark Peach", color: new Color(155, 82, 73) },
    { id: 54, premium: true, name: "Peach", color: new Color(209, 128, 120) },
    { id: 55, premium: true, name: "Light Peach", color: new Color(250, 182, 164) },
    { id: 56, premium: true, name: "Dark Tan", color: new Color(123, 99, 82) },
    { id: 57, premium: true, name: "Tan", color: new Color(156, 132, 107) },
    { id: 58, premium: true, name: "Dark Slate", color: new Color(51, 57, 65) },
    { id: 59, premium: true, name: "Slate", color: new Color(109, 117, 141) },
    { id: 60, premium: true, name: "Light Slate", color: new Color(179, 185, 209) },
    { id: 61, premium: true, name: "Dark Stone", color: new Color(109, 100, 63) },
    { id: 62, premium: true, name: "Stone", color: new Color(148, 140, 107) },
    { id: 63, premium: true, name: "Light Stone", color: new Color(205, 197, 158) }
];
