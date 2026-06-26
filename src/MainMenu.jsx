import { useEffect, useState } from "react";
import { clusterByKey } from "./data/clusterData";

const ALL_PERSONA_URL = "https://tli0107.candidsandbox.academy/webhook/all_persona";

const KEY_TO_ID = { G01: 1, G02: 2, G03: 3, G05: 4, G07: 5, G08: 6, G10: 7 };
const KEY_TO_LABEL = { G01: "The Commander", G02: "The Visionary", G03: "The Moral Anchor", G05: "The Strategist", G07: "The Mentor", G08: "The Stabilizer", G10: "The Catalyst" };

let _personaCache = null;

function buildRows(items) {
  const n = items.length;
  if (n <= 3) return [items];
  if (n === 4) return [items.slice(0, 2), items.slice(2)];
  if (n === 5) return [items.slice(0, 2), items.slice(2)];
  if (n === 6) return [items.slice(0, 3), items.slice(3)];
  if (n === 7) return [items.slice(0, 2), items.slice(2, 5), items.slice(5)];
  if (n === 8) return [items.slice(0, 3), items.slice(3, 6), items.slice(6)];
  // 9+: rows of 3
  const rows = [];
  for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));
  return rows;
}

export default function MainMenu({ onLogout, onBack, onSelect, onAdmin }) {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleJson = (json) => {
      const list = (json?.data ?? []).map((p) => {
        const key = p.key ?? p.bestgroup ?? "";
        return {
          key,
          id: KEY_TO_ID[key] ?? 1,
          label: p.name ?? KEY_TO_LABEL[key] ?? clusterByKey[key]?.persona ?? key,
        };
      });
      _personaCache = list;
      setPersonas(list);
      setLoading(false);
    };

    if (_personaCache) {
      setPersonas(_personaCache);
      setLoading(false);
      return;
    }

    fetch(ALL_PERSONA_URL)
      .then((r) => r.json())
      .then(handleJson)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rows = buildRows(personas);

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col">
      <img src="/img/main-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="relative z-20 flex items-center justify-between gap-4 bg-transparent px-4 py-4 lg:px-10">
        <div className="flex items-center gap-4 h-[60px]"></div>
        <div className="flex items-center gap-2">
          <div className="relative group cursor-pointer" onClick={onLogout}>
            <img src="/img/icon-logout.png" alt="Logout" className="h-20 w-20 object-contain drop-shadow-lg transition hover:scale-110" />
            <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 z-[9999]">
              Logout
            </span>
          </div>
          <div className="relative group cursor-pointer" onClick={onAdmin}>
            <img src="/img/icon-admin.png" alt="Admin" className="h-20 w-20 object-contain drop-shadow-lg transition hover:scale-110" />
            <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 z-[9999]">
              Setting
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full pb-32 px-4 z-10">
        <div className="flex h-full w-full items-center justify-center">
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            </div>
          ) : (
            <div className="flex w-full max-w-[1200px] flex-col gap-10">
              {rows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex flex-wrap w-full gap-4 justify-center"
                >
                  {row.map((item) => (
                    <div
                      key={item.key}
                      onClick={() => onSelect?.(item)}
                      className="group flex min-h-[160px] cursor-pointer flex-row items-center justify-center gap-1 rounded-3xl p-4 text-center transition"
                      style={{ flex: `0 1 ${row.length === 1 ? "400px" : row.length === 2 ? "calc(50% - 1rem)" : "calc(33% - 1rem)"}`, maxWidth: row.length === 1 ? "450px" : "450px" }}
                    >
                      <img
                        src={`/img/icon/${item.id}.png`}
                        alt="Logo"
                        className="h-20 w-20 sm:h-24 sm:w-24 object-contain transition-transform duration-200 group-hover:scale-125"
                      />
                      <h1 className="text-lg font-semibold text-white sm:text-[30px] drop-shadow">
                        {item.label}
                      </h1>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
