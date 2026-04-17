import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, Plus, Check } from "lucide-react";
import { searchStocks, type StockInfo } from "@/lib/api";
import { useAppStore } from "@/features/store/appStore";

export default function StockSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedStocks = useAppStore(s => s.selectedStocks);
  const addStock = useAppStore(s => s.addStock);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchStocks(query);
        setResults(data);
        setOpen(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query]);

  const isAdded = (fullCode: string) => selectedStocks.some(s => s.fullCode === fullCode);

  const handleAdd = (stock: StockInfo) => {
    addStock(stock);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative w-64" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="添加 A股/港股/美股..."
          className="h-8 w-full rounded-md border border-zinc-800 bg-zinc-950 pl-9 pr-8 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-2 h-4 w-4 animate-spin text-zinc-500" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950 p-1 shadow-xl">
          {results.map((stock) => {
            const added = isAdded(stock.fullCode);
            return (
              <div
                key={stock.fullCode}
                className="flex items-center justify-between rounded-sm px-2 py-1.5 text-xs hover:bg-zinc-800/50 cursor-pointer"
                onClick={() => !added && handleAdd(stock)}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-200">{stock.name}</span>
                  <span className="text-[10px] text-zinc-500">{stock.fullCode.toUpperCase()}</span>
                </div>
                {added ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Plus className="h-3 w-3 text-zinc-500 hover:text-cyan-400" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
