import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://tli0107.candidsandbox.academy/webhook";
const ZONE_API_URL = `${API_BASE}/zone`;
const CALCULATE_URL = `${API_BASE}/calculate`;
const affiliations = ["ทั่วประเทศ", "นครหลวง", "ภูมิภาค"];

// module-level cache — fetched once for the lifetime of the page
let zoneCache = null;
let zoneFetchPromise = null;
export function __resetZoneCache() { zoneCache = null; zoneFetchPromise = null; }

function fetchZones() {
  if (zoneCache) return Promise.resolve(zoneCache);
  if (zoneFetchPromise) return zoneFetchPromise;
  zoneFetchPromise = fetch(ZONE_API_URL)
    .then((res) => res.text())
    .then((text) => {
      if (!text || !text.trim()) {
        console.warn("[Zone API] Empty response from", ZONE_API_URL);
        zoneCache = {};
        return zoneCache;
      }
      try {
        const data = JSON.parse(text);
        zoneCache = data && typeof data === "object" ? data : {};
        return zoneCache;
      } catch (e) {
        console.error("[Zone API] Failed to parse JSON:", e);
        zoneCache = {};
        return zoneCache;
      }
    })
    .catch((e) => {
      console.error("[Zone API] Fetch error:", e);
      zoneCache = {};
      return zoneCache;
    });
  return zoneFetchPromise;
}

function GlassDropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/40 bg-white/20 backdrop-blur-md px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white/30"
      >
        <span>{value}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-white/40 bg-white/20 backdrop-blur-md shadow-lg max-h-48 overflow-y-auto">
          {options.map((item, idx) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between border-b border-white/20 px-5 py-3 text-sm font-medium text-slate-800 transition last:border-b-0 hover:bg-white/30"
            >
              <span className="font-semibold">{item}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GlassMultiDropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (item) => {
    onChange(
      value.includes(item) ? value.filter((v) => v !== item) : [...value, item],
    );
  };

  return (
    <div ref={ref} className="relative">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/40 bg-white/20 backdrop-blur-md px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white/30"
      >
        <span className={value.length === 0 ? "text-slate-400" : ""}>
          {value.length === 0 ? "เลือก..." : value.join(", ")}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-white/40 bg-white/20 backdrop-blur-md shadow-lg max-h-48 overflow-y-auto">
          {options.map((item) => {
            const selected = value.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className="flex w-full items-center justify-between border-b border-white/20 px-5 py-3 text-sm font-medium text-slate-800 transition last:border-b-0 hover:bg-white/30"
              >
                <span className="font-semibold">{item}</span>
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                    selected
                      ? "border-sky-500 bg-sky-500"
                      : "border-slate-300 bg-transparent"
                  }`}
                >
                  {selected && (
                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Filter({ onLogout, onDashboard, onBack, onAdmin, savedFilter }) {
  const [ageMin, setAgeMin] = useState(savedFilter?.ageMin ?? 30);
  const [ageMax, setAgeMax] = useState(savedFilter?.ageMax ?? 40);
  const [draggingThumb, setDraggingThumb] = useState(null);
  const trackRef = useRef(null);
  const [affiliation, setAffiliation] = useState(savedFilter?.affiliation ?? affiliations[0]);
  const [zone, setZone] = useState(savedFilter?.zone ?? []);
  const [allZones, setAllZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (zoneCache) {
      setAllZones(zoneCache);
      setZonesLoading(false);
      return;
    }
    setZonesLoading(true);
    fetchZones()
      .then((data) => {
        if (!data || Object.keys(data).length === 0) setZonesError(true);
        setAllZones(data);
      })
      .catch(() => setZonesError(true))
      .finally(() => setZonesLoading(false));
  }, []);

  // derive zone options based on selected affiliation
  const zoneOptions = (() => {
    if (!allZones || !Object.keys(allZones).length) return [];

    let items = [];
    if (affiliation === "ทั่วประเทศ") {
      items = Object.values(allZones).flat();
    } else {
      items = allZones[affiliation] ?? [];
    }

    return [...new Set(items.map((item) => item.zone))]
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b), "th"));
  })();

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const updateAgeFromPointer = (clientX, thumb) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = clamp(
      Math.round((((clientX - rect.left) / rect.width) * 100) / 5) * 5,
      0,
      100,
    );
    if (thumb === "min") {
      setAgeMin((prev) => Math.min(percent, ageMax));
    } else {
      setAgeMax((prev) => Math.max(percent, ageMin));
    }
  };

  const handlePointerMove = (event) => {
    if (!draggingThumb) return;
    updateAgeFromPointer(event.clientX, draggingThumb);
  };

  const handlePointerUp = () => {
    setDraggingThumb(null);
  };

  const onSubmit = () => {
    const body = {
      age_min: ageMin,
      age_max: ageMax,
      area: zone.length > 0 || affiliation === "ทั่วประเทศ" ? "" : affiliation,
      zone: zone,
    };

    fetch(CALCULATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});

    onDashboard?.(body, { ageMin, ageMax, affiliation, zone });
  };

  return (
    <div className="relative h-screen w-screen text-slate-900 overflow-hidden flex flex-col">
      <img src="/img/filter-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="relative z-20 flex items-center justify-between gap-4 bg-transparent px-4 py-4 lg:px-10">
        <div></div>
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
      <div className="relative z-20 flex flex-1 items-center justify-center px-4 py-4 lg:px-8">
        <div className="grid w-full max-w-[1200px] gap-6 lg:grid-cols-[1fr_1fr] items-center">
          <div className="flex flex-col space-y-6 rounded-[32px] p-6 -mt-32">
            <div>
              <div className="mb-4 flex items-center text-sm font-semibold text-slate-700">
                <span>ช่วงอายุ ({ageMin} - {ageMax} ปี)</span>
              </div>
              <div
                ref={trackRef}
                className="relative h-10"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="h-2 w-full rounded-full bg-slate-500/70" />
                  <div
                    className="absolute h-2 rounded-full bg-sky-600"
                    style={{
                      left: `${ageMin}%`,
                      right: `${100 - ageMax}%`,
                    }}
                  />
                </div>

                <div style={{ left: `calc(${ageMin}% - 0.75rem)` }} className="absolute top-1/2 -translate-y-1/2">
                  {draggingThumb === "min" && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-white">
                      {ageMin}
                    </span>
                  )}
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-sky-400 shadow-md transition hover:border-sky-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-grab"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      setDraggingThumb("min");
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                  />
                </div>

                <div style={{ left: `calc(${ageMax}% - 0.75rem)` }} className="absolute top-1/2 -translate-y-1/2">
                  {draggingThumb === "max" && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-white">
                      {ageMax}
                    </span>
                  )}
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-sky-400 shadow-md transition hover:border-sky-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-grab"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      setDraggingThumb("max");
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                  />
                </div>
              </div>
            </div>

            <GlassDropdown
              label="สังกัด"
              options={affiliations}
              value={affiliation}
              onChange={(val) => { setAffiliation(val); setZone([]); }}
            />

            <GlassMultiDropdown
              label="โซน"
              options={zoneOptions}
              value={zone}
              onChange={setZone}
            />
            {zonesError && (
              <p className="text-xs font-medium text-rose-500 bg-rose-50/80 rounded-xl px-4 py-2">
                ⚠️ ไม่สามารถโหลดข้อมูลโซนได้ กรุณาลองใหม่อีกครั้ง
              </p>
            )}

            <div className="flex justify-center mt-auto pt-16">
              <div className="relative group">
              <button
                onClick={onSubmit}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200"
                aria-label="ไปหน้า Dashboard"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>
              <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 z-50">
                Play
              </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
