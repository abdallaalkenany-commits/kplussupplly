// Logos shown in the animated "partners" strips (home + about).
// To add one: put a trimmed logo (webp/png, ~160px tall) in public/assets/partners/ and add a row here.
// [file slug, Arabic name, English name, width, height]
export type Partner = [string, string, string, number, number];

export const CLIENTS: Partner[] = [
  ["kharafi-national", "الخرافي ناشيونال", "Kharafi National", 271, 160],
  ["sodic", "سوديك", "SODIC", 124, 30],
  ["ccc", "اتحاد المقاولين CCC", "Consolidated Contractors (CCC)", 184, 160],
  ["redcon", "ريدكون للإنشاءات", "Redcon Construction", 152, 48],
  ["el-hazek", "الحاذق للإنشاءات", "El Hazek Construction", 205, 61],
  ["maven", "مافن للتطوير العقاري", "Maven Developments", 440, 130],
  ["mabany-edris", "مباني إدريس", "Mabany Edris", 273, 90],
  ["jidaar", "جدار للإنشاء والتطوير", "Jidaar Construction & Development", 194, 65],
  ["dar-al-alamia", "دار العالمية للإنشاءات", "Dar Al Alamia Construction", 297, 58],
  ["genedy", "الجنيدي للإنشاءات", "Genedy Construction", 440, 141],
  ["smart-roads", "الشركة المصرية لإنشاء وصيانة مرافق النقل والمطارات (Smart Roads)", "Smart Roads", 226, 160],
  ["ejc-north-upper-egypt", "شركة شمال الصعيد للمقاولات العامة", "North Upper Egypt Contracting (E.J.C)", 154, 160],
];

export const BRANDS: Partner[] = [
  ["ideal-standard", "إيديال ستاندرد", "Ideal Standard", 305, 160],
  ["cleopatra", "سيراميكا كليوباترا", "Ceramica Cleopatra", 440, 101],
  ["gemma", "جيما للسيراميك والبورسلين", "Gemma Ceramic & Porcelain", 221, 44],
  ["camsan", "تشامسان باركيه", "Çamsan Parkelam", 192, 55],
  ["terraclick", "تيراكليك", "TerraClick", 227, 38],
  ["bmic", "BMIC لصناعات مواد البناء", "BMIC Building Materials", 127, 50],
  ["misr-beni-suef-cement", "أسمنت مصر بني سويف", "Misr Beni Suef Cement", 164, 160],
  ["amreyah-cement", "أسمنت العامرية", "Amreyah Cement", 166, 101],
];
