import { useEffect, useRef, useState } from "react";
import { attributeCriteria } from "./data/attributeCriteria";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://tli0107.candidsandbox.academy/webhook";
const PERSONA_URL = `${API_BASE}/persona`;
const PERSONA_SAVE_URL = `${API_BASE}/persona/save`;
const CHAT_URL = `${API_BASE}/chat/quick`;
const CHAT_QUICK_URL = `${API_BASE}/chat/quick`;

function resolveCriteria(attrKey, starValue) {
  const def = attributeCriteria[attrKey];
  if (!def || !starValue) return "ไม่มีข้อมูล";
  const found = def.stars.find((s) => s.star === Number(starValue));
  if (!found) return "ไม่มีข้อมูล";
  return found.criteria;
}

const neonBorderStyle = {
  border: "1.5px solid #3366dd",
  boxShadow:
    "0 0 10px rgba(0,80,255,0.4), inset 2px 2px 6px rgba(255,255,255,0.15), inset -2px -2px 6px rgba(0,40,180,0.2)",
};

const personaOptions = [
  { id: 1, key: "G01", label: "The Commander" },
  { id: 2, key: "G02", label: "The Visionary" },
  { id: 3, key: "G03", label: "The Moral Anchor" },
  { id: 4, key: "G05", label: "The Strategist" },
  { id: 5, key: "G07", label: "The Mentor" },
  { id: 6, key: "G08", label: "The Stabilizer" },
  { id: 7, key: "G10", label: "The Catalyst" },
];

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
      <label className="mb-2 block text-sm font-semibold text-white">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-2xl bg-transparent px-5 py-3 text-xl font-bold text-white transition"
        style={neonBorderStyle}
      >
        <span className="flex-1 text-center">{value?.label || "เลือก..."}</span>
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
          {options.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between border-b border-white/20 px-5 py-3 text-sm font-medium text-white transition last:border-b-0 hover:bg-white/30"
            >
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin({ onBack }) {
  const [persona, setPersona] = useState(personaOptions[0]);
  const [personId, setPersonId] = useState("");
  const [personIdError, setPersonIdError] = useState("");
  const [attrValues, setAttrValues] = useState({
    recruit: 0,
    management: 0,
    salesskill: 0,
    technology: 0,
  });
  const [personaLoading, setPersonaLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Welcome! How can I assist you on your mission today?",
      time: "",
    },
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef(null);
  const lastMsgRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    const lastMsg = messages[messages.length - 1];
    if (!chatLoading && lastMsg?.role !== "user" && lastMsgRef.current) {
      const msgTop = lastMsgRef.current.getBoundingClientRect().top;
      const containerTop = container.getBoundingClientRect().top;
      container.scrollTop += msgTop - containerTop - 12;
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, chatLoading]);

  useEffect(() => {
    if (!persona?.key) return;
    setPersonaLoading(true);
    fetch(PERSONA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: persona.key }),
    })
      .then((res) => res.json())
      .then((data) => {
        const item = Array.isArray(data) ? data[0] : data;
        if (item?.success && item.data) {
          const d = item.data;
          setPersonId(d.personid ?? "");
          setAttrValues({
            recruit: d.attribute?.recruit ?? "",
            management: d.attribute?.management ?? "",
            salesskill: d.attribute?.salesskill ?? "",
            technology: d.attribute?.technology ?? "",
          });
        } else {
          setPersonId("");
          setAttrValues({
            recruit: "",
            management: "",
            salesskill: "",
            technology: "",
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        setPersonaLoading(false);
        setInitialLoad(false);
      });
  }, [persona?.key]);

  const callSaveAttr = (values, pid) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const digits = (pid ?? personId).replace(/\s/g, "");
      fetch(PERSONA_SAVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personid: digits,
          bestgroup: persona?.key ?? "",
          recruit: Number(values.recruit),
          management: Number(values.management),
          salesskill: Number(values.salesskill),
          technology: Number(values.technology),
        }),
      }).catch(() => {});
    }, 1000);
  };

  const handleBack = () => onBack();
  const handlePersonaChange = (item) => {
    setPersona(item);
    setMessages([
      {
        role: "assistant",
        text: "Welcome! How can I assist you on your mission today?",
        time: "",
      },
    ]);
  };

  const sendChat = async (rawText, endpoint = CHAT_URL, customBody = null) => {
    const text = (rawText ?? "").trim();
    if (!text || chatLoading) return;
    const now = new Date().toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [...prev, { role: "user", text, time: now }]);
    setChatLoading(true);
    try {
      const body = customBody ?? { message: text };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => null);
      const item = Array.isArray(data) ? data[0] : data;
      const reply =
        item?.answer ?? item?.reply ?? item?.message ?? item?.output ?? "";
      if (!reply || (typeof reply === "string" && !reply.trim())) {
        throw new Error("empty response");
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: reply,
          suggestions: item.suggestions ?? [],
          time: new Date().toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "⚠️ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
          time: new Date().toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSend = () => {
    const text = input.trim();
    if (!text || chatLoading) return;
    setInput("");
    sendChat(text, CHAT_URL, { personId: persona?.key ?? "", prompt: text });
  };

  const buildAdminQuickPayload = (promptText) => {
    const attibute =
      `Recruit ${resolveCriteria("recruit", attrValues.recruit)} ` +
      `Management ${resolveCriteria("management", attrValues.management)} ` +
      `Sales Skills ${resolveCriteria("salesskill", attrValues.salesskill)} ` +
      `Technology ${resolveCriteria("technology", attrValues.technology)}`;
    return {
      prompt: promptText,
      custer: persona?.label ?? "",
      attibute,
    };
  };

  const handleQuickPrompt = (promptText) => {
    const payload = buildAdminQuickPayload(promptText);
    sendChat(promptText, CHAT_QUICK_URL, payload);
  };

  const handleChatKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  const otpRefs = useRef(Array.from({ length: 8 }, () => null));

  const handleOtpChange = (idx, e) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = personId.split("");
    arr[idx] = val;
    const next = arr.join("").padEnd(8, "").slice(0, 8);
    setPersonId(next);
    setPersonIdError("");
    if (val && idx < 7) otpRefs.current[idx + 1]?.focus();
    if (next.trim().replace(/\s/g, "").length === 8)
      callSaveAttr(attrValues, next);
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      const arr = personId.split("");
      if (!arr[idx] && idx > 0) {
        arr[idx - 1] = "";
        setPersonId(arr.join("").padEnd(8, "").slice(0, 8));
        otpRefs.current[idx - 1]?.focus();
      } else {
        arr[idx] = "";
        setPersonId(arr.join("").padEnd(8, "").slice(0, 8));
      }
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col text-white">
      <img
        src="/img/admin-bg.png"
        alt=""
        className="absolute inset-0 w-full h-full z-0"
        style={{ objectFit: "fill" }}
      />
      {(initialLoad || personaLoading) && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
        </div>
      )}
      <div
        className="absolute top-4 right-16 z-50 group cursor-pointer"
        onClick={handleBack}
      >
        <img
          src="/img/home.png"
          alt="Back"
          className="h-20 w-20 object-contain drop-shadow-lg transition hover:scale-110"
        />
        <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 z-[9999]">
          Back to the Catalyst
        </span>
      </div>

      <div className="relative z-10 w-full flex flex-col lg:flex-row pt-0 px-6 lg:px-12 flex-1">
        {/* Left 40% */}
        <div className="w-full lg:w-[40%] flex flex-col items-center justify-center">
          {/* Top: form */}
          <div className="px-6 pb-6 pt-0 flex flex-col justify-center gap-4 items-center w-full mt-12">
            <div className="w-full max-w-[400px]">
              <h2
                className="text-2xl font-bold text-left mb-4"
                style={{ color: "#7DF9FF" }}
              >
                PERSONA
              </h2>
              <GlassDropdown
                label=""
                options={personaOptions}
                value={persona}
                onChange={handlePersonaChange}
              />
              <div className="mt-6 relative">
                <h2
                  className="text-2xl font-bold text-left mb-4"
                  style={{ color: "#7DF9FF" }}
                >
                  PERSON ID
                </h2>
                <div className="relative flex justify-between gap-2">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={personId[idx] || ""}
                      onChange={(e) => handleOtpChange(idx, e)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="flex-1 min-w-0 h-12 rounded-xl bg-transparent text-center text-lg font-bold text-white outline-none transition"
                      style={neonBorderStyle}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Bottom: logo */}
          <div className="flex items-start justify-center pt-2 pb-8 mt-2">
            <img
              src="/img/logo-admin.png"
              alt="Logo"
              className="object-contain object-top max-w-[90%] h-[90%]"
            />
          </div>
        </div>

        {/* Right 60% */}
        <div className="w-full lg:w-[60%] flex flex-col relative z-10 self-stretch overflow-hidden">
          <div
            className="relative flex-shrink-0 flex items-center justify-center pl-6"
            style={{ height: "115px" }}
          >
            <img
              src="/img/setting-title.png"
              alt=""
              className="w-full h-full object-fill pointer-events-none"
            />
            <h2 className="absolute text-4xl font-bold text-white uppercase tracking-wide text-center px-4">
              Attribute Analysis Setting
            </h2>
          </div>
          <div className="w-full flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Row 1 */}
            <div
              className="grid gap-0 flex-shrink-0"
              style={{ gridTemplateColumns: "60% 40%", height: "240px" }}
            >
              {/* Col left — form */}
              <div className="relative flex flex-col gap-3 rounded-2xl py-2 px-4 overflow-visible justify-center">
                {[
                  { key: "recruit", label: "Recruit" },
                  { key: "management", label: "Management" },
                  { key: "salesskill", label: "Sales Skills" },
                  { key: "technology", label: "Technology" },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className="relative z-10 flex items-center gap-4"
                  >
                    <span className="w-40 shrink-0 text-right text-xl font-bold text-white">
                      {label}
                    </span>
                    <div
                      className="flex items-center rounded-3xl bg-transparent overflow-visible flex-1"
                      style={{ height: "44px", ...neonBorderStyle }}
                    >
                      <div className="flex-shrink-0 flex items-center justify-center overflow-visible">
                        <img
                          src="/img/icon-star.png"
                          alt=""
                          className="object-contain"
                          style={{
                            height: "80px",
                            marginLeft: "-20px",
                            marginTop: "-45px",
                            marginBottom: "-38px",
                          }}
                        />
                      </div>
                      <div className="flex flex-1 items-center justify-center pr-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={attrValues[key]}
                          onChange={(e) => {
                            const raw = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 1);
                            // ไม่อัปเดต state ถ้าพิม 0 (แสดงค่าเดิมไว้)
                            if (raw === "0") return;
                            const next = { ...attrValues, [key]: raw };
                            setAttrValues(next);
                            if (!initialLoad) callSaveAttr(next);
                          }}
                          onBlur={(e) => {
                            const val = Math.min(
                              5,
                              Math.max(1, Number(e.target.value) || 1),
                            );
                            const next = { ...attrValues, [key]: val };
                            setAttrValues(next);
                            if (!initialLoad) callSaveAttr(next);
                          }}
                          className="w-14 bg-transparent text-center text-xl font-bold text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Col right — Quick Prompts */}
              <div className="flex flex-col gap-2 px-3 py-2 justify-center">
                <div className="text-xs font-bold tracking-widest text-sky-400 uppercase mb-1 px-2">
                  Quick Prompts
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      label: "วิเคราะห์ด้าน Recruit",
                      img: "/img/chat/icon-chat-1.png",
                    },
                    {
                      label: "วิเคราะห์ด้าน Management",
                      img: "/img/chat/icon-chat-2.png",
                    },
                    {
                      label: "วิเคราะห์ด้าน Sales Skills",
                      img: "/img/chat/icon-chat-3.png",
                    },
                    {
                      label: "วิเคราะห์ด้าน Technology",
                      img: "/img/chat/icon-chat-4.png",
                    },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => handleQuickPrompt(p.label)}
                      disabled={chatLoading}
                      className="flex flex-row items-center gap-2 rounded-lg border border-sky-400/40 bg-sky-500/10 px-2.5 py-2 text-left text-xs font-medium text-white transition hover:bg-sky-500/25 hover:border-sky-400 active:scale-95 disabled:opacity-50"
                    >
                      <img
                        src={p.img}
                        alt=""
                        className="h-6 w-6 object-contain flex-shrink-0"
                      />
                      <span className="leading-snug">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Row 2 — chat */}
            <div
              className="relative flex flex-col overflow-hidden flex-shrink-0"
              style={{ height: "clamp(320px, 46vh, 600px)" }}
            >
              <img
                src="/img/chat/4.png"
                alt=""
                className="absolute inset-0 w-full h-full object-fill pointer-events-none"
              />
              <div
                ref={chatScrollRef}
                className="relative flex-1 overflow-y-auto flex flex-col gap-4"
                style={{ margin: "16px 20px 8px 20px", padding: "0 8px" }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    ref={i === messages.length - 1 ? lastMsgRef : null}
                    className={`flex items-end gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role !== "user" && (
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <img
                          src="/img/chat/11.png"
                          alt="AI"
                          className="h-10 w-10 object-contain"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-1 max-w-[70%]">
                      {msg.role !== "user" && (
                        <span className="text-xs font-bold text-sky-400 ml-1">
                          {persona?.label?.toUpperCase().replace("THE ", "") +
                            " AI" || "AI"}
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-5 py-3 text-sm font-medium leading-relaxed ${msg.role === "user" ? "bg-sky-600 text-white rounded-br-sm" : "bg-white/10 backdrop-blur-sm text-white rounded-bl-sm border border-white/20"}`}
                      >
                        {msg.role === "user" ? (
                          <span className="whitespace-pre-wrap">
                            {msg.text}
                          </span>
                        ) : (
                          <div
                            className="prose prose-invert prose-sm max-w-none [&_li]:my-2 [&_ul]:my-3 [&_p]:my-2"
                            dangerouslySetInnerHTML={{ __html: msg.text }}
                          />
                        )}
                        {msg.time && (
                          <div className="text-right text-xs text-white/40 mt-1">
                            {msg.time}
                          </div>
                        )}
                      </div>
                      {msg.suggestions?.length > 0 && (
                        <div className="flex flex-col gap-1.5 pl-1">
                          {msg.suggestions.map((s, si) => (
                            <button
                              key={si}
                              onClick={() => setInput(s)}
                              className="text-left text-xs text-sky-300 border border-sky-500/40 rounded-xl px-4 py-2 bg-sky-500/10 hover:bg-sky-500/25 hover:border-sky-400 transition active:scale-95"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-end gap-3 justify-start">
                    <img
                      src="/img/chat/11.png"
                      alt="AI"
                      className="h-10 w-10 object-contain flex-shrink-0 mb-1"
                    />
                    <div className="bg-white/10 border border-white/20 rounded-2xl rounded-bl-sm px-5 py-3 flex gap-1 items-center">
                      <span
                        className="h-2 w-2 rounded-full bg-sky-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-2 w-2 rounded-full bg-sky-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-2 w-2 rounded-full bg-sky-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="relative px-10 py-4 pb-6 flex gap-3 items-end">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder={`Ask ${persona?.label || "Commander"} AI`}
                  disabled={chatLoading}
                  className="flex-1 resize-none rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 text-sm text-white placeholder-slate-400 outline-none focus:border-sky-400 transition disabled:opacity-50"
                  style={{ maxHeight: "120px" }}
                />
                <button
                  onClick={handleChatSend}
                  disabled={!input.trim() || chatLoading}
                  className="flex-shrink-0 transition hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <img
                    src="/img/chat/5.png"
                    alt="Send"
                    className="object-contain"
                    style={{ height: "48px", width: "48px" }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <img
        src="/img/admin-footer.png"
        alt=""
        className="fixed bottom-0 left-0 w-full z-5 pointer-events-none"
        style={{ objectFit: "fill", zIndex: 5 }}
      />
    </div>
  );
}
