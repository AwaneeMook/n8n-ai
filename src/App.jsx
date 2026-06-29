import { useEffect, useState } from "react";
import Filter from "./Filter";
import MainMenu from "./MainMenu";
import Detail from "./Detail";
import Admin from "./Admin";
import Chat from "./Chat";

const LOGIN_URL = "https://tli0107.candidsandbox.academy/webhook/login";

const loadFromSession = (key, fallback = null) => {
  try {
    const v = sessionStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [username, setUsername] = useState("9007485");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(
    () => sessionStorage.getItem("loggedIn") === "true",
  );
  const [page, setPage] = useState(() =>
    loggedIn ? sessionStorage.getItem("currentPage") || "main" : "login",
  );
  const [selectedPersona, setSelectedPersona] = useState(() =>
    loadFromSession("selectedPersona"),
  );
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMemberContext, setSelectedMemberContext] = useState(null);
  const [detailMembers, setDetailMembers] = useState([]);
  const [filterValues, setFilterValues] = useState(() =>
    loadFromSession("filterValues"),
  );
  const [savedFilter, setSavedFilter] = useState(() =>
    loadFromSession("savedFilter", {
      ageMin: 30,
      ageMax: 40,
      affiliation: "ทั่วประเทศ",
      zone: [],
    }),
  );

  useEffect(() => {
    if (loggedIn) {
      sessionStorage.setItem("loggedIn", "true");
    } else {
      [
        "loggedIn",
        "currentPage",
        "selectedPersona",
        "filterValues",
        "savedFilter",
      ].forEach((k) => sessionStorage.removeItem(k));
    }
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn) sessionStorage.setItem("currentPage", page);
  }, [page, loggedIn]);
  useEffect(() => {
    if (selectedPersona)
      sessionStorage.setItem(
        "selectedPersona",
        JSON.stringify(selectedPersona),
      );
  }, [selectedPersona]);
  useEffect(() => {
    if (filterValues)
      sessionStorage.setItem("filterValues", JSON.stringify(filterValues));
  }, [filterValues]);
  useEffect(() => {
    sessionStorage.setItem("savedFilter", JSON.stringify(savedFilter));
  }, [savedFilter]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => null);
      const item = Array.isArray(data) ? data[0] : data;
      if (item?.success) {
        setLoggedIn(true);
        setPage("main");
      } else {
        setError("Username หรือ Password ไม่ถูกต้อง");
      }
    } catch {
      setError("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setPassword("");
    setError("");
    setPage("login");
    setSelectedPersona(null);
  };

  if (page === "admin") return <Admin onBack={() => setPage("main")} />;

  if (page === "chat")
    return (
      <Chat
        member={selectedMember}
        persona={selectedPersona}
        personaData={selectedMemberContext}
        members={detailMembers}
        onBack={() => setPage("detail")}
        onSelectMember={(member, personaData) => {
          setSelectedMember(member);
          setSelectedMemberContext(personaData);
        }}
      />
    );

  if (page === "detail")
    return (
      <Detail
        persona={selectedPersona}
        filterValues={filterValues}
        onBack={() => setPage("main")}
        onLogout={handleLogout}
        onSelectMember={(member, personaData) => {
          setSelectedMember(member);
          setSelectedMemberContext(personaData);
          setPage("chat");
        }}
        onMembersLoaded={setDetailMembers}
      />
    );

  if (page === "main")
    return (
      <MainMenu
        onLogout={handleLogout}
        onBack={() => setPage("login")}
        onSelect={(persona) => {
          setSelectedPersona(persona);
          setPage("detail");
        }}
        onAdmin={() => setPage("admin")}
      />
    );

  if (loggedIn)
    return (
      <Filter
        onLogout={handleLogout}
        onBack={() => setPage("login")}
        onDashboard={(values, raw) => {
          setFilterValues(values);
          setSavedFilter(raw);
          setPage("main");
        }}
        onAdmin={() => setPage("admin")}
        savedFilter={savedFilter}
      />
    );

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <img
        src="/img/login-bg.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative h-full w-full shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[60%_40%]">
        <div className="hidden md:block relative">
          <img
            src="/img/login-page.png"
            alt="Login Page"
            className="object-none w-full h-[90%]"
          />
        </div>
        <div className="relative flex h-[90%] items-center justify-center p-8 sm:p-10 md:p-14">
          <div className="w-full max-w-[360px]">
            <div className="flex justify-center">
              <img
                src="/img/login-icon.png"
                alt="avatar"
                className="relative z-10 -mb-20 h-48 w-auto object-contain drop-shadow-xl"
              />
            </div>
            <div className="w-full rounded-3xl border border-sky-200/60 bg-white/30 backdrop-blur-md shadow-xl px-8 pt-24 pb-8 flex flex-col items-center gap-6">
              <form onSubmit={handleLogin} className="w-full space-y-5">
                {[
                  {
                    label: "Username",
                    type: "text",
                    value: username,
                    onChange: setUsername,
                  },
                  {
                    label: "Password",
                    type: "password",
                    value: password,
                    onChange: setPassword,
                  },
                ].map(({ label, type, value, onChange }) => (
                  <div key={label} className="space-y-2">
                    <label className="text-xs font-bold tracking-widest text-slate-700 uppercase">
                      {label}
                    </label>
                    <input
                      type={type}
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder={label}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-800 placeholder-slate-400 outline-none text-sm font-medium transition focus:border-slate-400"
                    />
                  </div>
                ))}
                {error && (
                  <p className="text-xs text-rose-500 font-medium">{error}</p>
                )}
                <button
                  type="submit"
                  className="w-full rounded-full border border-sky-300/50 bg-white/30 backdrop-blur-sm py-3 text-sm font-bold tracking-widest text-slate-700 shadow-md transition hover:bg-white/50"
                >
                  LOGIN
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-50 text-sm font-semibold text-white drop-shadow-lg">
        Powered by Amigo Rangers
      </div>
    </div>
  );
}
