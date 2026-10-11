import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { getCurrentUser, getTasks, loginAccount, registerAccount, type Task } from "./api";
import { clearToken, hasValidToken, saveToken } from "./auth";

type AuthMode = "login" | "register";
type DashboardView = "overview" | "tasks" | "team";

function ProtectedRoute({ children }: { children: ReactNode }) {
  return hasValidToken() ? children : <Navigate to="/login" replace />;
}

function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  if (hasValidToken()) return <Navigate to="/dashboard" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = isRegister
        ? await registerAccount({ name, email, password })
        : await loginAccount({ email, password });
      saveToken(result.token);
      navigate("/dashboard", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link className="brand" to="/"><span>T</span>TaskMatrix</Link>
        <div><p className="eyebrow">SPRINT 14 · WALKING SKELETON</p><h1>Secure access for focused software teams.</h1><p>Register, authenticate, and enter a protected workspace through one connected full-stack pipeline.</p></div>
        <small>Passwords are salted and hashed before MongoDB persistence.</small>
      </section>
      <section className="auth-panel">
        <form onSubmit={submit}>
          <p className="eyebrow">SECURE WORKSPACE</p>
          <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
          <p className="form-intro">{isRegister ? "Start your protected TaskMatrix workspace." : "Sign in to continue to your dashboard."}</p>
          {error && <div className="error" role="alert">{error}</div>}
          {isRegister && <label>Full name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} required placeholder="Harmanpreet Singh" /></label>}
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></label>
          <label>Password<input type="password" autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required placeholder="Minimum 8 characters" /></label>
          <button className="primary" disabled={loading}>{loading ? "Please wait…" : isRegister ? "Create account" : "Sign in securely"}</button>
          <p className="switch">{isRegister ? "Already registered?" : "New to TaskMatrix?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link></p>
        </form>
      </section>
    </main>
  );
}

function TaskTable({ tasks }: { tasks: Task[] }) {
  return (
    <div className="task-table">
      <div className="table-head"><span>Task</span><span>Status</span><span>Priority</span></div>
      {tasks.map((task) => (
        <article key={task.id}>
          <div><b>{task.id}</b><strong>{task.title}</strong></div>
          <span>{task.status}</span>
          <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
        </article>
      ))}
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState<DashboardView>("overview");

  useEffect(() => {
    Promise.all([getCurrentUser(), getTasks()])
      .then(([profile, taskData]) => { setUser(profile.user); setTasks(taskData.tasks); })
      .catch((caught) => {
        clearToken();
        setError(caught instanceof Error ? caught.message : "Your session expired.");
        window.setTimeout(() => navigate("/login", { replace: true }), 900);
      });
  }, [navigate]);

  function logout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "TM";

  return (
    <div className="dashboard-shell">
      <aside>
        <Link className="brand" to="/dashboard" onClick={() => setActiveView("overview")}><span>T</span>TaskMatrix</Link>
        <nav aria-label="Dashboard navigation">
          <button className={activeView === "overview" ? "active" : ""} onClick={() => setActiveView("overview")}>Overview</button>
          <button className={activeView === "tasks" ? "active" : ""} onClick={() => setActiveView("tasks")}>My tasks</button>
          <button className={activeView === "team" ? "active" : ""} onClick={() => setActiveView("team")}>Team</button>
        </nav>
        <div className="security-note"><i />JWT protected session</div>
      </aside>
      <main>
        <header><div><p>Protected workspace</p><strong>{user?.email || "Verifying session…"}</strong></div><button onClick={logout}>Log out</button></header>
        <section className="dashboard-content">
          {error ? <div className="error">{error}</div> : (
            <div className="view-content">
              {activeView === "overview" && (
                <>
                  <div className="page-heading"><div><p className="eyebrow">AUTHENTICATED DASHBOARD</p><h1>Welcome, {user?.name || "team member"}</h1><p>Your JWT was verified before protected workspace data was returned.</p></div><span className="auth-badge">Session verified</span></div>
                  <div className="metrics"><article><span>Active sprint</span><strong>14</strong><small>Walking Skeleton</small></article><article><span>Protected tasks</span><strong>{tasks.length}</strong><small>JWT-gated records</small></article><article><span>Auth pipeline</span><strong>Connected</strong><small>React → Express → MongoDB</small></article></div>
                  <section className="content-panel"><div className="panel-heading"><div><h2>Sprint priorities</h2><p>Protected data returned from the authenticated API.</p></div><button onClick={() => setActiveView("tasks")}>View all tasks</button></div><TaskTable tasks={tasks} /></section>
                </>
              )}

              {activeView === "tasks" && (
                <>
                  <div className="page-heading"><div><p className="eyebrow">PROTECTED DATA</p><h1>My tasks</h1><p>These records are available only after JWT verification.</p></div><span className="count-badge">{tasks.length} tasks</span></div>
                  <section className="content-panel"><TaskTable tasks={tasks} /></section>
                </>
              )}

              {activeView === "team" && (
                <>
                  <div className="page-heading"><div><p className="eyebrow">WORKSPACE ACCESS</p><h1>Team</h1><p>Authenticated members with access to this protected workspace.</p></div></div>
                  <div className="team-grid">
                    <article className="member-card"><div className="member-avatar">{initials}</div><div><strong>{user?.name || "Workspace member"}</strong><span>{user?.email}</span></div><b>Workspace admin</b></article>
                    <article className="invite-card"><span>+</span><div><strong>Walking Skeleton workspace</strong><p>Member invitations will be introduced after the authentication MVP.</p></div></article>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return <Routes><Route path="/" element={<Navigate to={hasValidToken() ? "/dashboard" : "/login"} replace />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}
