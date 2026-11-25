/* 计算器纯逻辑 */

/** 去掉浮点运算产生的尾数（如 110.00000000000001），保留 12 位有效数字 */
const clean = (v) => Number(v.toPrecision(12));

/** mode: 1=X 的 Y% | 2=X 是 Y 的百分之几 | 3=X 增减 Y% | 4=X→Y 变化率 */
export function percentage(mode, x, y, direction = 'increase') {
  const a = Number(x), b = Number(y);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return { valid: false, value: 0 };
  switch (mode) {
    case 1: return { valid: true, value: clean(a * b / 100) };
    case 2: return b === 0 ? { valid: false, value: 0, reason: 'zero' } : { valid: true, value: clean(a / b * 100) };
    case 3: return { valid: true, value: clean(a * (1 + (direction === 'decrease' ? -1 : 1) * b / 100)) };
    case 4: return a === 0 ? { valid: false, value: 0, reason: 'zero' } : { valid: true, value: clean((b - a) / Math.abs(a) * 100) };
    default: return { valid: false, value: 0 };
  }
}

export function profitMargin(cost, price, quantity, extra = 0) {
  const c = Number(cost) || 0, p = Number(price) || 0;
  const q = Number(quantity) || 0, e = Number(extra) || 0;
  const revenue = p * q;
  const totalCost = c * q + e;
  const profit = revenue - totalCost;
  return {
    revenue, totalCost, profit,
    unitProfit: q > 0 ? profit / q : 0,
    margin: revenue !== 0 ? profit / revenue * 100 : null,
    markup: totalCost !== 0 ? profit / totalCost * 100 : null,
  };
}
