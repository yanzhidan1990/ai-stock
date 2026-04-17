export interface StockInfo {
  market: string; // sh, sz, hk, us
  code: string;   // 000001
  name: string;   // 平安银行
  fullCode: string; // sz000001
}

export async function searchStocks(keyword: string): Promise<StockInfo[]> {
  if (!keyword) return [];
  try {
    const res = await fetch(`/api/suggest/?v=2&q=${encodeURIComponent(keyword)}&t=all`);
    const text = await res.text();
    // format: v_hint="sz000001^平安银行^PAYH^...~sh601318^中国平安^ZGPA^...";
    const match = text.match(/v_hint="([^"]*)"/);
    if (!match || !match[1]) return [];
    
    const items = match[1].split('~');
    return items.map(item => {
      const parts = item.split('^');
      const fullCode = parts[0]; // e.g. sz000001
      const name = parts[1];
      const market = fullCode.substring(0, 2);
      const code = fullCode.substring(2);
      return { market, code, name, fullCode };
    }).filter(s => s.fullCode);
  } catch (e) {
    console.error('Search error', e);
    return [];
  }
}

export async function getQuotes(fullCodes: string[]) {
  if (!fullCodes.length) return [];
  try {
    const q = fullCodes.join(',');
    const res = await fetch(`/api/quote/?q=${q}`);
    const text = await res.text();
    // format: v_sz000001="1~平安银行~000001~11.51~11.60...;
    
    const items = text.split(';').map(s => s.trim()).filter(Boolean);
    return items.map(item => {
      const match = item.match(/v_(.*?)="(.*)"/);
      if (!match) return null;
      const fullCode = match[1];
      const parts = match[2].split('~');
      
      // indices based on tencent api
      const name = parts[1];
      const price = parseFloat(parts[3]) || 0;
      const changeAmt = parseFloat(parts[31]) || 0;
      const changePct = parseFloat(parts[32]) || 0;
      const turnoverRate = parseFloat(parts[38]) || 0;
      const amplitude = parseFloat(parts[43]) || 0;
      const volumeRatio = parseFloat(parts[45]) || 0;
      const volumeMoney = parseFloat(parts[37]) || 0; // 万
      
      return {
        fullCode,
        name,
        price,
        changeAmt,
        changePct,
        turnoverRate,
        amplitude,
        volumeRatio,
        volumeMoney
      };
    }).filter(Boolean);
  } catch (e) {
    console.error('Quote error', e);
    return [];
  }
}
