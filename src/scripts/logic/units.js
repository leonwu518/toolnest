/* 单位换算数据与纯逻辑（标签内置双语，避免客户端额外请求） */
const L = (zh, en) => ({ zh, en });

export const unitGroups = [
  { id: 'length', label: L('长度', 'Length'), units: [
    { id: 'mm', label: L('毫米 (mm)', 'Millimeter (mm)'), factor: 0.001 },
    { id: 'cm', label: L('厘米 (cm)', 'Centimeter (cm)'), factor: 0.01 },
    { id: 'm', label: L('米 (m)', 'Meter (m)'), factor: 1 },
    { id: 'km', label: L('千米 (km)', 'Kilometer (km)'), factor: 1000 },
    { id: 'in', label: L('英寸 (in)', 'Inch (in)'), factor: 0.0254 },
    { id: 'ft', label: L('英尺 (ft)', 'Foot (ft)'), factor: 0.3048 },
    { id: 'yd', label: L('码 (yd)', 'Yard (yd)'), factor: 0.9144 },
    { id: 'mi', label: L('英里 (mi)', 'Mile (mi)'), factor: 1609.344 },
  ] },
  { id: 'weight', label: L('重量', 'Weight'), units: [
    { id: 'mg', label: L('毫克 (mg)', 'Milligram (mg)'), factor: 0.000001 },
    { id: 'g', label: L('克 (g)', 'Gram (g)'), factor: 0.001 },
    { id: 'kg', label: L('千克 (kg)', 'Kilogram (kg)'), factor: 1 },
    { id: 't', label: L('吨 (t)', 'Metric ton (t)'), factor: 1000 },
    { id: 'oz', label: L('盎司 (oz)', 'Ounce (oz)'), factor: 0.028349523125 },
    { id: 'lb', label: L('磅 (lb)', 'Pound (lb)'), factor: 0.45359237 },
  ] },
  { id: 'force', label: L('力', 'Force'), units: [
    { id: 'n', label: L('牛顿 (N)', 'Newton (N)'), factor: 1 },
    { id: 'kn', label: L('千牛 (kN)', 'Kilonewton (kN)'), factor: 1000 },
    { id: 'kgf', label: L('千克力 (kgf)', 'Kilogram-force (kgf)'), factor: 9.80665 },
    { id: 'lbf', label: L('磅力 (lbf)', 'Pound-force (lbf)'), factor: 4.4482216152605 },
    { id: 'dyn', label: L('达因 (dyn)', 'Dyne (dyn)'), factor: 0.00001 },
  ] },
  { id: 'energy', label: L('能量', 'Energy'), units: [
    { id: 'j', label: L('焦耳 (J)', 'Joule (J)'), factor: 1 },
    { id: 'kj', label: L('千焦 (kJ)', 'Kilojoule (kJ)'), factor: 1000 },
    { id: 'mj', label: L('兆焦 (MJ)', 'Megajoule (MJ)'), factor: 1e6 },
    { id: 'cal', label: L('卡路里 (cal)', 'Calorie (cal)'), factor: 4.184 },
    { id: 'kcal', label: L('千卡 (kcal)', 'Kilocalorie (kcal)'), factor: 4184 },
    { id: 'wh', label: L('瓦时 (Wh)', 'Watt-hour (Wh)'), factor: 3600 },
    { id: 'kwh', label: L('千瓦时 (kWh)', 'Kilowatt-hour (kWh)'), factor: 3.6e6 },
    { id: 'btu', label: L('英热单位 (BTU)', 'British thermal unit (BTU)'), factor: 1055.05585262 },
  ] },
  { id: 'temperature', label: L('温度', 'Temperature'), units: [
    { id: 'c', label: L('摄氏度 (°C)', 'Celsius (°C)') },
    { id: 'f', label: L('华氏度 (°F)', 'Fahrenheit (°F)') },
    { id: 'k', label: L('开尔文 (K)', 'Kelvin (K)') },
  ] },
  { id: 'area', label: L('面积', 'Area'), units: [
    { id: 'cm2', label: L('平方厘米 (cm²)', 'Square cm (cm²)'), factor: 0.0001 },
    { id: 'm2', label: L('平方米 (m²)', 'Square meter (m²)'), factor: 1 },
    { id: 'km2', label: L('平方千米 (km²)', 'Square km (km²)'), factor: 1000000 },
    { id: 'ha', label: L('公顷 (ha)', 'Hectare (ha)'), factor: 10000 },
    { id: 'ft2', label: L('平方英尺 (ft²)', 'Square foot (ft²)'), factor: 0.09290304 },
    { id: 'acre', label: L('英亩 (acre)', 'Acre (acre)'), factor: 4046.8564224 },
  ] },
  { id: 'volume', label: L('体积', 'Volume'), units: [
    { id: 'ml', label: L('毫升 (mL)', 'Milliliter (mL)'), factor: 0.000001 },
    { id: 'l', label: L('升 (L)', 'Liter (L)'), factor: 0.001 },
    { id: 'cm3', label: L('立方厘米 (cm³)', 'Cubic cm (cm³)'), factor: 0.000001 },
    { id: 'm3', label: L('立方米 (m³)', 'Cubic meter (m³)'), factor: 1 },
    { id: 'gal', label: L('美制加仑 (gal)', 'US gallon (gal)'), factor: 0.003785411784 },
    { id: 'qt', label: L('美制夸脱 (qt)', 'US quart (qt)'), factor: 0.000946352946 },
    { id: 'ft3', label: L('立方英尺 (ft³)', 'Cubic foot (ft³)'), factor: 0.028316846592 },
  ] },
  { id: 'speed', label: L('速度', 'Speed'), units: [
    { id: 'ms', label: L('米/秒 (m/s)', 'Meter/sec (m/s)'), factor: 1 },
    { id: 'kmh', label: L('千米/时 (km/h)', 'Kilometer/hour (km/h)'), factor: 0.2777777778 },
    { id: 'mph', label: L('英里/时 (mph)', 'Mile/hour (mph)'), factor: 0.44704 },
    { id: 'knot', label: L('节 (kn)', 'Knot (kn)'), factor: 0.5144444444 },
    { id: 'fts', label: L('英尺/秒 (ft/s)', 'Foot/sec (ft/s)'), factor: 0.3048 },
  ] },
  { id: 'data', label: L('数据存储', 'Data storage'), units: [
    { id: 'b', label: L('字节 (B)', 'Byte (B)'), factor: 1 },
    { id: 'kb', label: L('千字节 (KB)', 'Kilobyte (KB)'), factor: 1000 },
    { id: 'mb', label: L('兆字节 (MB)', 'Megabyte (MB)'), factor: 1e6 },
    { id: 'gb', label: L('吉字节 (GB)', 'Gigabyte (GB)'), factor: 1e9 },
    { id: 'tb', label: L('太字节 (TB)', 'Terabyte (TB)'), factor: 1e12 },
  ] },
  { id: 'time', label: L('时间', 'Time'), units: [
    { id: 'ms', label: L('毫秒 (ms)', 'Millisecond (ms)'), factor: 0.001 },
    { id: 's', label: L('秒 (s)', 'Second (s)'), factor: 1 },
    { id: 'min', label: L('分钟 (min)', 'Minute (min)'), factor: 60 },
    { id: 'h', label: L('小时 (h)', 'Hour (h)'), factor: 3600 },
    { id: 'day', label: L('天 (day)', 'Day (day)'), factor: 86400 },
    { id: 'week', label: L('周 (week)', 'Week (week)'), factor: 604800 },
  ] },
];

export const unitGroupById = Object.fromEntries(unitGroups.map((g) => [g.id, g]));

const toCelsius = { c: (v) => v, f: (v) => (v - 32) * 5 / 9, k: (v) => v - 273.15 };
const fromCelsius = { c: (v) => v, f: (v) => v * 9 / 5 + 32, k: (v) => v + 273.15 };

/** 线性单位使用 factor；温度使用带零点偏移的专用公式 */
export function convertUnit(value, groupId, fromId, toId) {
  const v = Number(value);
  if (!Number.isFinite(v)) return NaN;
  if (groupId === 'temperature') {
    if (!toCelsius[fromId] || !fromCelsius[toId]) return NaN;
    return fromCelsius[toId](toCelsius[fromId](v));
  }
  const group = unitGroupById[groupId];
  if (!group) return NaN;
  const from = group.units.find((u) => u.id === fromId);
  const to = group.units.find((u) => u.id === toId);
  if (!from || !to || !from.factor || !to.factor) return NaN;
  return v * from.factor / to.factor;
}
