import { useEffect, useRef, useState } from "react";
import {
  buildQuickPayload,
  buildAttibute,
  buildPersonalContext,
} from "./data/promptBuilders";
import { cleanHtml } from "./utils/cleanHtml";

// soft black backdrop that fades out at the edges to blend with the page
const columnBgGradient =
  "radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://tli0107.candidsandbox.academy/webhook";
const CHAT_URL = `${API_BASE}/chat/quick`;
const CHAT_QUICK_URL = `${API_BASE}/chat/quick`;
const PERSONA_URL = `${API_BASE}/persona`;
const DISTANCE_URL = `${API_BASE}/persona/member`;

const QUICK_PROMPTS = [
  {
    label: "วิเคราะห์ Insight",
    img: "/img/chat/icon-chat-1.png",
    promptFn: "insight",
    title: "วิเคราะห์หา Insight",
    connector: "ของกลุ่ม",
  },
  {
    label: "แนะนำกลยุทธ์การพัฒนาจุดแข็งจุดอ่อน",
    img: "/img/chat/icon-chat-2.png",
    promptFn: "strategy",
    title: "แนะนำกลยุทธ์การพัฒนาจุดแข็งจุดอ่อน",
    connector: "ของกลุ่ม",
  },
  {
    label: "แนะนำแนวการขาย",
    img: "/img/chat/icon-chat-3.png",
    promptFn: "sales",
    title: "แนะนำแนวการขาย",
    connector: "สำหรับกลุ่ม",
  },
  {
    label: "แนะนำ CRM Strategy",
    img: "/img/chat/icon-chat-4.png",
    promptFn: "activity",
    title: "แนะนำ CRM Strategy",
    connector: "สำหรับกลุ่ม",
  },
  {
    label: "แนะนำ Course เรียน",
    img: "/img/chat/icon-chat-5.png",
    promptFn: "training",
    title: "แนะนำ Course เรียน",
    connector: "สำหรับกลุ่ม",
  },
  {
    label: "AI Role Play",
    img: "/img/chat/icon-chat-1.png",
    promptFn: "roleplay",
    title: "AI Role Play",
    connector: "ของกลุ่ม",
  },
];

export default function Chat({
  member,
  persona,
  personaData,
  members: membersProp = [],
  onBack,
  onSelectMember,
}) {
  const [activeMember, setActiveMember] = useState(member);
  const [activePersonaData, setActivePersonaData] = useState(personaData);
  const [members, setMembers] = useState(membersProp);
  const [top3, setTop3] = useState(personaData?.top3 ?? []);
  const personId = activeMember?.personid ?? activeMember?.id ?? "";
  const name = personId || activeMember?.name || "Agent";

  const now = () =>
    new Date().toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const welcomeMsg = {
    role: "system",
    text: `Welcome back, ${name}! How can I assist you on your mission today?`,
    time: now(),
  };

  const [messages, setMessages] = useState([welcomeMsg]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memberPage, setMemberPage] = useState(0);
  const [bootLoading, setBootLoading] = useState(
    !personaData || membersProp.length === 0,
  );
  const chatScrollRef = useRef(null);
  const lastMsgRef = useRef(null);

  // Fetch persona data if missing (e.g. after page refresh)
  useEffect(() => {
    if (!persona?.key) return;
    const tasks = [];
    if (!activePersonaData) {
      tasks.push(
        fetch(PERSONA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: persona.key }),
        })
          .then((r) => r.json())
          .then((data) => {
            const item = Array.isArray(data) ? data[0] : data;
            if (item?.success) setActivePersonaData(item.data);
          })
          .catch(() => {}),
      );
    }
    if (members.length === 0 || top3.length === 0) {
      tasks.push(
        fetch(DISTANCE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: persona.key,
            age_min: 30,
            age_max: 100,
            area: "",
            zone: [],
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            const m = data?.members ?? [];
            const t3 = (data?.top3 ?? []).map((t) => ({ name: t.name }));
            setMembers(m);
            setTop3(t3);
            if (!activePersonaData)
              setActivePersonaData((prev) =>
                prev ? { ...prev, top3: t3 } : null,
              );
          })
          .catch(() => {}),
      );
    }
    if (tasks.length === 0) {
      setBootLoading(false);
    } else {
      Promise.all(tasks).finally(() => setBootLoading(false));
    }
  }, [persona?.key]);

  const membersPerPage = 5;
  const memberPageCount = Math.ceil(members.length / membersPerPage);
  const visibleMembers = members.slice(
    memberPage * membersPerPage,
    memberPage * membersPerPage + membersPerPage,
  );

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    const lastMsg = messages[messages.length - 1];
    // AI ตอบกลับ → scroll ให้หัวข้อความอยู่ที่บนของ container
    if (!loading && lastMsg?.role !== "user" && lastMsgRef.current) {
      const msgTop = lastMsgRef.current.getBoundingClientRect().top;
      const containerTop = container.getBoundingClientRect().top;
      container.scrollTop += msgTop - containerTop - 12;
    } else {
      // user ส่งข้อความ หรือ loading → scroll ลงล่างเพื่อเห็น typing indicator
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  const appendUserAndFetch = async (
    displayText,
    apiPrompt,
    customBody,
    endpoint = CHAT_URL,
  ) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: displayText, time: now() },
    ]);
    setLoading(true);
    try {
      const body = customBody ?? {
        // เลือก member → personId ของคนนั้น | ไม่เลือก → label ของ persona (เช่น "The Mentor")
        personId: personId || persona?.label || "",
        prompt: apiPrompt,
      };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => null);
      const item = Array.isArray(data) ? data[0] : data;
      const reply =
        item?.answer ??
        item?.data ??
        item?.reply ??
        item?.message ??
        item?.output ??
        item?.text ??
        "";
      if (!reply || (typeof reply === "string" && !reply.trim())) {
        throw new Error("empty response");
      }
      const suggestions = Array.isArray(item?.suggestions)
        ? item.suggestions
        : [];
      setMessages((prev) => [
        ...prev,
        { role: "system", text: reply, suggestions, time: now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          text: "⚠️ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
          time: now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const withTop3 = () => ({ ...activePersonaData, top3 });

  // เลือก member อยู่ไหม → ตัดข้อมูลส่วนตัว+top3 ออก ส่งแค่ personId (query คนนั้นแยกที่ backend)
  const memberSelected = !!(activeMember?.personid ?? activeMember?.id);

  const handlePromptClick = (p) => {
    const displayText = memberSelected
      ? `${p.label} ${p.connector.replace("กลุ่ม", "").trim()} ${personId}`
      : `${p.label} ${p.connector} ${persona?.label ?? ""}`;
    const payload = buildQuickPayload({
      persona,
      personaData: withTop3(),
      memberMode: memberSelected,
      personId,
      title: p.title ?? p.label,
    });
    appendUserAndFetch(displayText, null, payload, CHAT_QUICK_URL);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    // แชทพิมพ์เอง — ส่ง custer + attibute ไปด้วยเหมือน Quick Prompt
    // ไม่เลือก member → ต่อท้าย prompt ด้วยข้อมูลส่วนตัวของกลุ่ม
    // เลือก member → ส่ง personId (backend query ข้อมูลคนนั้นเอง)
    const apiPrompt = memberSelected
      ? text
      : text + buildPersonalContext(activePersonaData);
    const body = {
      prompt: apiPrompt,
      custer: persona?.label ?? "",
      attibute: buildAttibute(activePersonaData),
      ...(memberSelected ? { personId } : {}),
    };
    appendUserAndFetch(text, apiPrompt, body);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMemberClick = (m) => {
    const clickedId = m?.personid ?? m?.id;
    const activeId = activeMember?.personid ?? activeMember?.id;

    // คลิกคนเดิมซ้ำ → ยกเลิกการเลือก กลับเป็นสถานะยังไม่เลือก
    if (clickedId && clickedId === activeId) {
      setActiveMember(null);
      if (onSelectMember) onSelectMember(null, activePersonaData);
      setMessages([
        {
          role: "system",
          text: `Welcome back, Agent! How can I assist you on your mission today?`,
          time: now(),
        },
      ]);
      return;
    }

    setActiveMember(m);
    if (onSelectMember) onSelectMember(m, activePersonaData);
    setMessages([
      {
        role: "system",
        text: `Switched to ${m.personid}. How can I assist you?`,
        time: now(),
      },
    ]);
  };

  return (
    <div className="relative h-screen w-screen flex flex-col text-white overflow-hidden">
      <img
        src="/img/chat-bg.png"
        alt=""
        className="fixed inset-0 z-0 h-full w-full object-cover"
      />

      {bootLoading && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
        </div>
      )}

      {/* Body */}
      <div className="relative z-20 flex flex-1 overflow-hidden px-6 pt-2">
        {/* LEFT — Personal Data */}
        <div
          className="flex flex-col flex-shrink-0"
          style={{
            width: "25%",
            minWidth: "230px",
            backgroundImage: `url('/img/chat/1.png'), ${columnBgGradient}`,
            backgroundSize: "100% 100%, 100% 100%",
            backgroundRepeat: "no-repeat, no-repeat",
          }}
        >
          {/* Row top — logo frame */}
          <div
            className="flex-shrink-0 relative w-full pl-4 pr-8 pt-4 mb-4"
            style={{ height: "150px" }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src="/img/chat/3.png"
                alt=""
                className="w-full h-full object-fill"
              />
              <img
                src="/img/chat/2.png"
                alt=""
                className="absolute w-1/2 object-contain"
              />
            </div>
          </div>

          {/* spacer */}
          <div style={{ flex: "0.3" }} />

          {/* Row middle — content */}
          <div className="flex flex-col px-6 gap-2 items-center">
            {/* Info */}
            <div className="flex flex-col gap-2">
              {[
                {
                  label: "Gender :",
                  value:
                    activePersonaData?.sex === "M"
                      ? "Male"
                      : activePersonaData?.sex === "F"
                        ? "Female"
                        : (activePersonaData?.sex ?? ""),
                },
                { label: "Age :", value: activePersonaData?.age ?? "" },
                {
                  label: "Education :",
                  value: activePersonaData?.education ?? "",
                },
                {
                  label: "Occupation :",
                  value: activePersonaData?.occupation_descript ?? "",
                },
                {
                  label: "Experience :",
                  value:
                    activePersonaData?.workingYears != null
                      ? `${activePersonaData.workingYears} years`
                      : "",
                },
                {
                  label: "District :",
                  value: activePersonaData?.district ?? "",
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start text-sm">
                  <span className="w-28 text-white/70 font-medium flex-shrink-0">
                    {label}
                  </span>
                  <span className="font-bold text-white">{value}</span>
                </div>
              ))}
            </div>

            {/* Product */}
            <div className="flex flex-row gap-0 justify-center w-full pt-2">
              {(top3.length > 0 ? top3 : (activePersonaData?.top3 ?? []))
                .slice(0, 3)
                .map((p, idx) => (
                  <div
                    key={p.name}
                    className="relative flex items-center justify-center flex-shrink-0"
                    style={{ width: "100px", height: "100px" }}
                  >
                    <img
                      src={`/img/detail/ring${idx + 1}.png`}
                      alt=""
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    <span
                      className={`relative z-10 text-center text-xs font-bold text-black leading-tight break-words ${idx === 2 ? "pr-1 pl-0" : "px-1"}`}
                      style={{
                        maxWidth: "70px",
                        fontSize: "10px",
                        textShadow: "0 0 8px rgba(255,255,255,0.8)",
                      }}
                    >
                      {p.name}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* spacer */}
          <div className="flex-1" />

          {/* Row bottom */}
          <div
            className="flex-shrink-0 relative w-full px-4 pb-4"
            style={{ height: "270px" }}
          >
            <img
              src="/img/chat/1.png"
              alt=""
              className="absolute object-fill"
              style={{
                left: "12px",
                right: "12px",
                top: "0",
                bottom: "12px",
                width: "calc(100% - 24px)",
                height: "calc(100% - 18px)",
              }}
            />
            <img
              src={`/img/half/${persona?.id || 1}.png`}
              alt=""
              className="absolute"
              style={{
                top: "45%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "auto",
                height: "230px",
                maxWidth: "none",
              }}
            />
          </div>
        </div>

        {/* CENTER — Chat */}
        <div
          className="flex flex-col flex-1 overflow-hidden"
          style={{ backgroundImage: columnBgGradient }}
        >
          {/* Row 1 — profile info (no bg) */}
          <div
            className="flex-shrink-0 relative flex items-center gap-2 py-3"
            style={{
              paddingLeft: "12px",
              paddingRight: "12px",
              paddingBottom: "0px",
            }}
          >
            {/* Block 1 — AI command icon */}
            <div
              className="relative flex items-center justify-center flex-shrink-0"
              style={{ width: "50px", height: "50px" }}
            >
              <img
                src="/img/chat/icon-ai-command.png"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>

            {/* Block 2 — profile info */}
            <div className="relative flex-1 flex flex-col justify-center gap-0 pl-2">
              <span
                className="text-2xl font-bold leading-tight uppercase"
                style={{
                  background: "linear-gradient(90deg, #38bdf8, #e0f2fe)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                AI COMMAND CENTER
              </span>
              {/* <div className="flex items-center gap-1 mt-1">
                <img
                  src="/img/gemini_icon.svg"
                  alt="Gemini"
                  className="h-4 w-4 object-contain"
                />
                <span className="text-xs text-white/70 font-medium">
                  Powered by Gemini 2.5
                </span>
              </div> */}
            </div>

            {/* Block 3 — Gemini connected */}
            <div
              className="relative flex items-end justify-start pr-4 pb-3 flex-shrink-0 self-end"
              style={{ minWidth: "180px" }}
            >
              {/* <div className="flex items-center gap-1.5">
                <div className="flex items-center justify-center h-4 w-4 rounded-full bg-green-500 flex-shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-2.5 w-2.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-green-400">
                  Gemini 2.5 Connected
                </span>
              </div> */}
            </div>
          </div>

          {/* Row 2 — 7.png bg with 3 blocks */}
          <div className="flex-shrink-0 relative flex items-center px-6 gap-2 py-3">
            <img
              src="/img/chat/7.png"
              alt=""
              className="absolute object-fill pointer-events-none"
              style={{
                top: "0",
                bottom: "0",
                left: "16px",
                right: "32px",
                width: "calc(100% - 40px)",
                height: "100%",
              }}
            />

            {/* Block 1 — head image with frame */}
            <div
              className="relative flex items-center justify-center flex-shrink-0 mx-3"
              style={{ width: "70px", height: "70px" }}
            >
              <img
                src="/img/detail/footer/dashboard.png"
                alt=""
                className="absolute object-contain pointer-events-none"
                style={{
                  top: "50%",
                  left: "48px",
                  transform: "translate(-50%, -50%)",
                  width: "100px",
                  height: "100px",
                  maxWidth: "none",
                }}
              />
              <img
                src={`/img/head-remove/${persona?.id || 1}.png`}
                alt=""
                className="relative object-contain"
                style={{
                  width: "95%",
                  height: "95%",
                  transform: "translateX(6px)",
                }}
              />
            </div>

            {/* Block 2 — profile info */}
            <div className="relative flex-1 flex flex-col justify-center gap-1 pl-2">
              <span className="text-xs text-sky-200/80 font-semibold tracking-widest uppercase">
                Your Ranger Profile
              </span>
              <span className="text-xl font-bold text-sky-400 leading-tight uppercase">
                {persona?.label || "The Commander"}
              </span>
              <div className="flex items-center gap-1">
                <img
                  src="/img/chat/icon-leader.png"
                  alt=""
                  className="h-3.5 w-3.5 object-contain opacity-80"
                />
                <span className="text-xs text-white/70 font-medium">
                  Strategic Leader
                </span>
              </div>
            </div>

            {/* Block 3 — Attribute */}
            <div
              className="relative flex flex-col justify-center gap-0.5 pr-16 flex-shrink-0"
              style={{ minWidth: "180px" }}
            >
              {(() => {
                const a = activePersonaData?.attribute;
                return [
                  { label: "Recruit", value: a?.recruit ?? 0 },
                  { label: "Management", value: a?.management ?? 0 },
                  { label: "Sales Skills", value: a?.salesskill ?? 0 },
                  { label: "Technology", value: a?.technology ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-24 text-white/80 font-medium text-sm">
                      {label}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <img
                          key={i}
                          src="/img/detail/icon-star.png"
                          alt="★"
                          className={`h-4 w-4 object-contain ${i < value ? "block" : "hidden"}`}
                        />
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Row 3 — chat with 4.png bg */}
          <div className="relative flex flex-col flex-[2] overflow-hidden">
            <img
              src="/img/chat/4.png"
              alt=""
              className="absolute object-fill pointer-events-none"
              style={{
                top: "0",
                bottom: "0",
                left: "16px",
                right: "16px",
                width: "calc(100% - 28px)",
                height: "100%",
              }}
            />
            <div
              ref={chatScrollRef}
              className="relative flex-1 overflow-y-auto flex flex-col gap-4"
              style={{ margin: "16px 20px 8px 20px", padding: "0 28px" }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  ref={i === messages.length - 1 ? lastMsgRef : null}
                  className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role !== "user" && (
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <img
                        src="/img/chat/11.png"
                        alt="AI"
                        className="h-14 w-14 object-contain"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[70%]">
                    {msg.role !== "user" && (
                      <span className="text-xs font-bold text-sky-400 ml-1">
                        {persona?.label?.toUpperCase().replace("THE ", "") +
                          " AI" || "COMMANDER AI"}
                      </span>
                    )}
                    <div
                      className="relative px-5 py-3 text-sm font-medium leading-relaxed text-white"
                      style={{
                        borderRadius: "12px",
                        background: msg.role === "user" ? "#0284c7" : "#2a4665",
                      }}
                    >
                      {/* speech tail pointing to avatar */}
                      {msg.role === "user" ? (
                        <span
                          className="absolute right-0 top-4 translate-x-full w-0 h-0 border-y-[7px] border-y-transparent border-l-[10px]"
                          style={{ borderLeftColor: "#0284c7" }}
                        />
                      ) : (
                        <span
                          className="absolute left-0 top-4 -translate-x-full w-0 h-0 border-y-[7px] border-y-transparent border-r-[10px]"
                          style={{ borderRightColor: "#2a4665" }}
                        />
                      )}
                      {msg.role === "user" ? (
                        <span className="whitespace-pre-wrap">{msg.text}</span>
                      ) : (
                        <div
                          className="prose prose-invert prose-sm max-w-none [&_li]:my-1 [&_ul]:my-2 [&_p]:my-1 [&_p:empty]:hidden"
                          dangerouslySetInnerHTML={{ __html: cleanHtml(msg.text) }}
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
                            onClick={() => appendUserAndFetch(s, s)}
                            disabled={loading}
                            className="text-left text-xs text-sky-300 border border-sky-500/40 rounded-xl px-4 py-2 bg-sky-500/10 hover:bg-sky-500/25 hover:border-sky-400 transition active:scale-95 disabled:opacity-50"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-end gap-3 justify-start">
                  <img
                    src="/img/chat/11.png"
                    alt="AI"
                    className="h-14 w-14 object-contain flex-shrink-0 mb-1"
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

            {/* Input */}
            <div className="relative px-10 py-4 pb-6 flex gap-3 items-end">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${persona?.label || "Commander"} AI`}
                disabled={loading}
                className="flex-1 resize-none rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 text-sm text-white placeholder-slate-400 outline-none focus:border-sky-400 transition disabled:opacity-50"
                style={{ maxHeight: "120px" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
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

        {/* RIGHT — Top Persona Match + Member List + Quick Prompts */}
        <div
          className="flex flex-col overflow-hidden px-3 pt-3 pb-4"
          style={{
            width: "27%",
            minWidth: "240px",
            backgroundImage: `url('/img/chat/1.png'), ${columnBgGradient}`,
            backgroundSize: "100% 100%, 100% 100%",
            backgroundRepeat: "no-repeat, no-repeat",
          }}
        >
          {/* Top Persona Match banner + Back */}
          <div
            className="flex items-center justify-between px-2 flex-shrink-0"
            style={{
              backgroundImage: "url('/img/detail/top-match.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              height: "52px",
            }}
          >
            <span className="font-bold text-white text-2xl tracking-wide text-center flex-1">
              Top Persona Match
            </span>
            <div
              className="relative group cursor-pointer flex-shrink-0 -mr-2"
              onClick={onBack}
            >
              <img
                src="/img/home.png"
                alt="Back"
                className="h-24 w-24 object-contain drop-shadow-lg transition"
              />
              <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 z-[9999]">
                Back
              </span>
            </div>
          </div>

          {/* Member list */}
          <div
            className="flex flex-col overflow-hidden px-2 pt-0 pb-0"
            style={{ marginTop: "-2px" }}
          >
            <div className="flex flex-col gap-1">
              {members.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-xs text-slate-400">
                  ไม่พบข้อมูล
                </div>
              ) : (
                visibleMembers.map((m) => (
                  <div
                    key={m.personid}
                    onClick={() => handleMemberClick(m)}
                    className="group flex items-center gap-1 overflow-hidden px-2 cursor-pointer transition"
                    style={{
                      height: "68px",
                      backgroundImage: "url('/img/chat/6.png')",
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    <div className="flex-shrink-0 w-14 flex items-center justify-center overflow-hidden">
                      <img
                        src={`/img/head/${persona?.id || 1}.png`}
                        alt="Person"
                        className="object-contain"
                        style={{
                          height: "60px",
                          maxWidth: "70px",
                        }}
                      />
                    </div>
                    <div
                      className={`flex-1 font-bold text-center pr-2 truncate transition-all text-2xl ${m.personid === activeMember?.personid ? "text-sky-400" : "text-white group-hover:text-sky-400"}`}
                    >
                      {m.personid}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {memberPageCount > 1 && (
              <div className="flex items-center justify-center gap-4 flex-shrink-0 py-1">
                <button
                  type="button"
                  onClick={() => setMemberPage((p) => Math.max(p - 1, 0))}
                  disabled={memberPage === 0}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition hover:bg-white/80 disabled:bg-white/15 disabled:text-white/30 disabled:cursor-not-allowed"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
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
                    setMemberPage((p) => Math.min(p + 1, memberPageCount - 1))
                  }
                  disabled={memberPage >= memberPageCount - 1}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition hover:bg-white/80 disabled:bg-white/15 disabled:text-white/30 disabled:cursor-not-allowed"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-col gap-2 px-3 py-3 flex-shrink-0">
            <div className="text-xs font-bold tracking-widest text-sky-400 uppercase mb-1 px-2">
              Quick Prompts
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePromptClick(p)}
                  disabled={loading}
                  className="flex flex-row items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/10 px-2 py-3 text-left text-xs font-medium text-white transition hover:bg-sky-500/25 hover:border-sky-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <img src={p.img} alt="" className="h-8 w-8 object-contain" />
                  <span className="leading-snug">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
