import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://tli0107.candidsandbox.academy/webhook";
const DISTANCE_URL = `${API_BASE}/persona/member`;
const PERSONA_URL = `${API_BASE}/persona`;

function ExportButton({ onClick }) {
  const ref = useRef(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [visible, setVisible] = useState(false);

  const handleMouseEnter = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipW = 110;
    const tooltipH = 32;
    const gap = 8;
    let top, left, transform;
    if (rect.top > tooltipH + gap) {
      top = rect.top - tooltipH - gap;
      left = rect.left + rect.width / 2;
      transform = "translateX(-50%)";
    } else if (rect.bottom + tooltipH + gap < vh) {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2;
      transform = "translateX(-50%)";
    } else if (rect.left > tooltipW + gap) {
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - gap;
      transform = "none";
    } else {
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.right + gap;
      transform = "none";
    }
    left = Math.max(8, Math.min(left, vw - tooltipW - 8));
    setTooltipStyle({ top, left, transform, position: "fixed" });
    setVisible(true);
  };

  return (
    <div
      ref={ref}
      className="cursor-pointer"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      <img
        src="/img/detail/excel-icon.png"
        alt="Export"
        className="h-28 w-28 object-contain drop-shadow-lg transition hover:scale-110"
      />
      {visible && (
        <span
          className="pointer-events-none whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white z-[9999]"
          style={tooltipStyle}
        >
          Export Excel
        </span>
      )}
    </div>
  );
}

export default function Detail({
  persona,
  filterValues,
  onBack,
  onSelectMember,
  onMembersLoaded,
}) {
  const [personPage, setPersonPage] = useState(0);
  const [members, setMembers] = useState([]);
  const [top3, setTop3] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [personaData, setPersonaData] = useState(null);
  const [personaLoading, setPersonaLoading] = useState(true);
  const personsPerPage = 5;
  const pageCount = Math.ceil(members.length / personsPerPage);
  const visiblePersons = members.slice(
    personPage * personsPerPage,
    personPage * personsPerPage + personsPerPage,
  );

  useEffect(() => {
    setPersonaLoading(true);
    fetch(PERSONA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: persona?.key }),
    })
      .then((res) => res.json())
      .then((data) => {
        const item = Array.isArray(data) ? data[0] : data;
        if (item?.success) setPersonaData(item.data);
      })
      .catch(() => {})
      .finally(() => setPersonaLoading(false));
  }, [persona?.key]);

  useEffect(() => {
    setPersonPage(0);
    setMembersLoading(true);
    fetch(DISTANCE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: persona?.key,
        age_min: filterValues?.age_min ?? 30,
        age_max: filterValues?.age_max ?? 100,
        area: filterValues?.area ?? "",
        zone: filterValues?.zone ?? [],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const m = data?.members ?? [];
        setMembers(m);
        setTop3((data?.top3 ?? []).map((t) => t.name));
        onMembersLoaded?.(m);
      })
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false));
  }, [persona?.key]);

  const handleExport = () => {
    const groupName = persona?.label || "Group";
    const wb = XLSX.utils.book_new();
    const wsData = [
      [groupName],
      ["ลำดับ", "Person ID"],
      ...members.map((m, i) => [i + 1, m.personid]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    if (ws["A1"])
      ws["A1"].s = {
        font: { bold: true, sz: 18 },
        alignment: { horizontal: "center" },
      };
    ws["!cols"] = [{ wch: 10 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, groupName);
    XLSX.writeFile(wb, `${groupName}.xlsx`);
  };

  return (
    <div className="relative min-h-screen w-screen text-white overflow-auto flex flex-col items-stretch justify-center">
      {/* BG */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundColor: "rgb(2 9 17)",
          backgroundImage: "url('/img/detail-bg.png')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />

      <div className="flex flex-col">
        {/* ROW 1 — header bar */}
        <div
          className="relative z-30 flex items-end justify-between pr-4 lg:pr-8"
          style={{ height: "100px" }}
        >
          {/* Left: persona title */}
          <div
            className="flex items-center flex-shrink-0"
            style={{
              backgroundImage: "url('/img/detail/title-bg.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              width: "500px",
              height: "95px",
            }}
          >
            <img
              src={`/img/icon/${persona?.id || 1}.png`}
              alt={persona?.label}
              className="object-contain drop-shadow-lg flex-shrink-0 ml-4"
              style={{ height: "85px", width: "85px" }}
            />
            <span className="flex-1 text-center font-bold text-white text-3xl tracking-wide">
              {persona?.label || "The Commander"}
            </span>
          </div>

          {/* Center: spacer */}
          <div className="flex-1" />

          {/* Right: AI Agent + Top Persona Match + Back */}
          <div className="flex items-end flex-shrink-0">
            <button
              type="button"
              onClick={() => onSelectMember?.(null, null)}
              className="ai-coach-btn group mr-3 flex flex-shrink-0 items-center gap-3 rounded-xl px-4 active:scale-95"
              style={{
                height: "60px",
                minHeight: "60px",
                marginBottom: "5px",
              }}
            >
              <span
                className="ai-coach-icon flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: "62px",
                  height: "62px",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="42"
                  height="42"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="5" y="7" width="14" height="11" rx="3" />
                  <path d="M12 7V4" />
                  <circle cx="12" cy="3.5" r="1" fill="#ffffff" />
                  <path d="M3 12v3M21 12v3" />
                  <circle
                    cx="9.5"
                    cy="12"
                    r="1.1"
                    fill="#ffffff"
                    stroke="none"
                  />
                  <circle
                    cx="14.5"
                    cy="12"
                    r="1.1"
                    fill="#ffffff"
                    stroke="none"
                  />
                  <path d="M9.5 15h5" />
                </svg>
              </span>
              <span className="font-bold text-white text-2xl tracking-widest uppercase whitespace-nowrap pr-1">
                AI Coach
              </span>
            </button>
            <div
              className="flex items-center justify-start px-6"
              style={{
                backgroundImage: "url('/img/detail/top-match.png')",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                width: "34vw",
                height: "76px",
              }}
            >
              <span className="font-bold text-white text-2xl tracking-wide">
                Top Persona Match
              </span>
            </div>
            <div
              className="relative group cursor-pointer -ml-10"
              onClick={onBack}
            >
              <img
                src="/img/home.png"
                alt="Back"
                className="h-24 w-24 object-contain drop-shadow-lg transition hover:scale-110"
              />
              <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 z-[9999]">
                Back to Persona
              </span>
            </div>
          </div>
        </div>

        {/* ROW 2 — 3 blocks */}
        <div className="relative z-20 flex flex-1 items-center pl-4 pr-2 pb-6 lg:pl-8 lg:pr-3 mt-4">
          <div className="grid w-full gap-x-4 lg:grid-cols-[440px_auto_0.85fr] items-stretch">
            {/* Block 1: Avatar */}
            <div className="flex items-center justify-center">
              <div
                className="relative overflow-visible"
                style={{ height: "480px", width: "100%" }}
              >
                <img
                  src="/img/detail/avatar-bg.png"
                  alt=""
                  className="absolute left-1/2 -translate-x-1/2 object-contain z-0 pointer-events-none"
                  style={{ width: "200%", bottom: "-25%", minWidth: "200%" }}
                />
                <img
                  src={`/img/character/${persona?.id || 1}.png`}
                  alt={persona?.label}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 object-contain z-10"
                  style={{ width: "clamp(200px, 60vw, 300px)", height: "auto" }}
                />
              </div>
            </div>

            {/* Block 2: Data */}
            <div
              className="relative px-3 py-4 lg:p-6 h-full"
              style={{
                backgroundImage: "url('/img/detail/block-bg.png')",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              {personaLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-[24px]">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
                </div>
              )}
              <div className="flex flex-col gap-2 pt-2">
                {/* Info */}
                <div className="grid gap-2" style={{ paddingLeft: "24px" }}>
                  {[
                    {
                      label: "Gender :",
                      value:
                        personaData?.sex === "M"
                          ? "Male"
                          : personaData?.sex === "F"
                            ? "Female"
                            : (personaData?.sex ?? ""),
                    },
                    { label: "Age :", value: personaData?.age ?? "" },
                    {
                      label: "Education :",
                      value: personaData?.education ?? "",
                    },
                    {
                      label: "Occupation :",
                      value: personaData?.occupation_descript ?? "",
                    },
                    {
                      label: "Experience :",
                      value:
                        personaData?.workingYears != null
                          ? `${personaData.workingYears} years`
                          : "",
                    },
                    { label: "District :", value: personaData?.district ?? "" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center text-base">
                      <span className="w-36 text-white font-medium">
                        {label}
                      </span>
                      <span className="font-bold text-white">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Attribute */}
                <div className="mt-2">
                  <div
                    className="flex items-center justify-start mb-2 px-4"
                    style={{
                      backgroundImage: "url('/img/detail/attribute-bg.png')",
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                      width: "100%",
                      height: "32px",
                    }}
                  >
                    <span className="font-bold text-white text-sm pl-4">
                      Attribute
                    </span>
                  </div>
                  <div className="grid gap-0" style={{ paddingLeft: "24px" }}>
                    {(() => {
                      const a = personaData?.attribute;
                      return [
                        { label: "Recruit", value: a?.recruit ?? 0 },
                        { label: "Management", value: a?.management ?? 0 },
                        { label: "Sales Skills", value: a?.salesskill ?? 0 },
                        { label: "Technology", value: a?.technology ?? 0 },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex items-center text-base"
                        >
                          <div className="w-36 font-medium text-white">
                            {label}
                          </div>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <img
                                key={i}
                                src="/img/detail/icon-star.png"
                                alt="★"
                                className={`h-5 w-5 object-contain ${i < value ? "block" : "hidden"}`}
                              />
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Product */}
                <div className="mt-2">
                  <div
                    className="flex items-center justify-start mb-2 px-4"
                    style={{
                      backgroundImage: "url('/img/detail/attribute-bg.png')",
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                      width: "100%",
                      height: "32px",
                    }}
                  >
                    <span className="font-bold text-white text-sm pl-4">
                      Product
                    </span>
                  </div>
                  <div className="flex flex-nowrap gap-4 justify-center">
                    {top3.slice(0, 3).map((product, idx) => (
                      <div
                        key={product}
                        className="relative flex items-center justify-center"
                        style={{ width: "120px", height: "120px" }}
                      >
                        <img
                          src={`/img/detail/ring${idx + 1}.png`}
                          alt=""
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                        <span
                          className="relative z-10 text-center text-sm font-bold text-black px-3 leading-tight break-words drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]"
                          style={{
                            maxWidth: "100px",
                            fontSize: "12px",
                            textShadow: "0 0 8px rgba(255,255,255,0.8)",
                          }}
                        >
                          {product}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Block 3: Member list */}
            <div
              className="relative flex flex-col py-4 px-2"
              style={{
                backgroundImage: "url('/img/detail/block-bg.png')",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="w-full mt-4 px-0">
                {membersLoading ? (
                  <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                    Loading...
                  </div>
                ) : members.length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                    ไม่พบข้อมูล
                  </div>
                ) : (
                  visiblePersons.map((member) => (
                    <div
                      key={member.personid}
                      className="flex items-center gap-1 overflow-visible px-2 transition"
                      style={{
                        height: "80px",
                        backgroundImage: "url('/img/chat/6.png')",
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                      }}
                    >
                      <div className="flex-shrink-0 w-20 flex items-center justify-center overflow-visible">
                        <img
                          src={`/img/head/${persona?.id || 1}.png`}
                          alt="Person"
                          className="object-contain"
                          style={{
                            height: "auto",
                            maxWidth: "90px",
                            marginTop: "-10px",
                          }}
                        />
                      </div>
                      <div className="flex-1 text-2xl font-bold text-white text-center pr-4">
                        {member.personid}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination — framed with top-match.png, white buttons */}
              <div className="flex items-center justify-end mt-auto mb-2 gap-3">
                <div
                  className="relative flex items-center justify-center gap-3 pl-10 pr-4"
                  style={{
                    backgroundImage: "url('/img/detail/top-match.png')",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    height: "70px",
                    minWidth: "70%",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPersonPage((p) => Math.max(p - 1, 0))}
                    disabled={personPage === 0 || pageCount <= 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-md transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPersonPage((p) => Math.min(p + 1, pageCount - 1))
                    }
                    disabled={personPage >= pageCount - 1 || pageCount <= 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-md transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                  {members.length > 0 && (
                    <ExportButton onClick={handleExport} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
