import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import {
  createCheckoutSession,
  createTask,
  deleteTask,
  generateTaskSubsteps,
  getCheckoutSession,
  getCurrentUser,
  getTasks,
  loginAccount,
  registerAccount,
  updateTask,
  type Task,
  type TaskInput,
  type User,
} from "./api";
import { clearToken, hasValidToken, saveToken } from "./auth";

type AuthMode = "login" | "register";
type DashboardView = "overview" | "tasks" | "team";
type Toast = { type: "success" | "error"; message: string };

const statusLabels = { todo: "To do", "in-progress": "In progress", done: "Done" } as const;

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
        <div><p className="eyebrow">SPRINT 16 · AI INJECTION & POLISH</p><h1>Plan secure work with an AI copilot.</h1><p>Owner-scoped CRUD, server-side Gemini suggestions, strict validation, throttling, and Stripe Test Mode in one hardened pipeline.</p></div>
        <small>Passwords are hashed, tasks are owner-scoped, and AI/payment secrets stay on the server.</small>
      </section>
      <section className="auth-panel">
        <form onSubmit={submit}>
          <p className="eyebrow">SECURE WORKSPACE</p>
          <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
          <p className="form-intro">{isRegister ? "Start your private TaskMatrix workspace." : "Sign in to manage your tasks."}</p>
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

function TaskTable({ tasks, onEdit, onDelete, onAi }: { tasks: Task[]; onEdit?: (task: Task) => void; onDelete?: (task: Task) => void; onAi?: (task: Task) => void }) {
  const interactive = Boolean(onEdit && onDelete && onAi);
  return (
    <div className="task-table">
      <div className={`table-head ${interactive ? "with-actions" : ""}`}><span>Task</span><span>Status</span><span>Priority</span><span>Due</span>{interactive && <span>Actions</span>}</div>
      {tasks.map((task) => (
        <article className={interactive ? "with-actions" : ""} key={task.id}>
          <div><b>TM-{task.id.slice(-5).toUpperCase()}</b><strong>{task.title}</strong><small>{task.description || "No description"}</small></div>
          <span className={`status status-${task.status}`}>{statusLabels[task.status]}</span>
          <span className={`priority priority-${task.priority}`}>{task.priority}</span>
          <span>{task.dueDate ? new Date(`${task.dueDate}T00:00:00`).toLocaleDateString() : "—"}</span>
          {interactive && <div className="task-actions"><button className="ai-action" onClick={() => onAi?.(task)}>✦ AI steps</button><button onClick={() => onEdit?.(task)}>Edit</button><button className="danger" onClick={() => onDelete?.(task)}>Delete</button></div>}
        </article>
      ))}
    </div>
  );
}

function AiSuggestionModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const result = await generateTaskSubsteps({
        taskTitle: task.title,
        taskDescription: task.description,
        count: 5,
      });
      setSubtasks(result.subtasks);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI suggestions could not be generated.");
    } finally {
      setLoading(false);
    }
  }

  async function copyChecklist() {
    try {
      await navigator.clipboard.writeText(subtasks.map((step) => `☐ ${step}`).join("\n"));
      setCopied(true);
    } catch {
      setError("The checklist could not be copied. Select the text manually instead.");
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="task-modal ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
        <div className="modal-heading"><div><p className="eyebrow">SERVER-SIDE GEMINI</p><h2 id="ai-modal-title">Generate task sub-steps</h2></div><button aria-label="Close AI suggestions" onClick={onClose}>×</button></div>
        <div className="ai-task-context"><span>Protected task</span><strong>{task.title}</strong><p>{task.description || "No description supplied."}</p></div>
        {error && <div className="error" role="alert">{error}</div>}
        {loading ? <div className="ai-loading" aria-label="Generating suggestions"><i /><i /><i /><i /><i /><p>Gemini is building a safe implementation plan…</p></div> : subtasks.length ? <ol className="ai-results">{subtasks.map((subtask) => <li key={subtask}><span>✓</span><p>{subtask}</p></li>)}</ol> : <div className="ai-empty"><span>✦</span><h3>Turn this task into an action plan</h3><p>The request runs through the authenticated Express API. Your Gemini key never reaches the browser.</p></div>}
        <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Close</button>{subtasks.length > 0 && <button type="button" className="secondary ai-copy" onClick={copyChecklist}>{copied ? "Copied ✓" : "Copy checklist"}</button>}<button type="button" className="primary compact" onClick={generate} disabled={loading}>{loading ? "Generating…" : subtasks.length ? "Regenerate" : "Generate 5 steps"}</button></div>
      </section>
    </div>
  );
}

function TaskModal({ task, onClose, onSaved }: { task: Task | null; onClose: () => void; onSaved: (task: Task) => void }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskInput["status"]>(task?.status ?? "todo");
  const [priority, setPriority] = useState<TaskInput["priority"]>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const input: TaskInput = { title, description, status, priority, dueDate: dueDate || null };
    try {
      const result = task ? await updateTask(task.id, input) : await createTask(input);
      onSaved(result.task);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The task could not be saved.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-form-title">
        <div className="modal-heading"><div><p className="eyebrow">{task ? "UPDATE RECORD" : "CREATE RECORD"}</p><h2 id="task-form-title">{task ? "Edit task" : "Add a task"}</h2></div><button aria-label="Close task form" onClick={onClose}>×</button></div>
        <form onSubmit={submit}>
          {error && <div className="error" role="alert">{error}</div>}
          <label>Task title<input value={title} onChange={(event) => setTitle(event.target.value)} minLength={2} maxLength={120} required autoFocus placeholder="Ship the Sprint 16 AI flow" /></label>
          <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={4} placeholder="Add clear acceptance criteria…" /></label>
          <div className="form-grid">
            <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as TaskInput["status"])}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option></select></label>
            <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value as TaskInput["priority"])}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          </div>
          <label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
          <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary compact" disabled={loading}>{loading ? "Saving…" : task ? "Save changes" : "Create task"}</button></div>
        </form>
      </section>
    </div>
  );
}

function EmptyTasks({ onAdd }: { onAdd: () => void }) {
  return <div className="empty-state"><span>✓</span><h3>Your workspace is clear</h3><p>Create your first owner-protected task to start the sprint.</p><button className="primary compact" onClick={onAdd}>Add first task</button></div>;
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState<DashboardView>("overview");
  const [modalTask, setModalTask] = useState<Task | "new" | null>(null);
  const [aiTask, setAiTask] = useState<Task | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  function showToast(nextToast: Toast) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    Promise.all([getCurrentUser(), getTasks()])
      .then(([profile, taskData]) => { setUser(profile.user); setTasks(taskData.tasks); })
      .catch((caught) => {
        if (!hasValidToken()) navigate("/login", { replace: true });
        else setError(caught instanceof Error ? caught.message : "The workspace could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  function logout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  function handleSaved(savedTask: Task) {
    setTasks((current) => current.some((task) => task.id === savedTask.id)
      ? current.map((task) => task.id === savedTask.id ? savedTask : task)
      : [savedTask, ...current]);
    setModalTask(null);
    showToast({ type: "success", message: `Task ${tasks.some((task) => task.id === savedTask.id) ? "updated" : "created"} successfully.` });
  }

  async function handleDelete(taskToDelete: Task) {
    const snapshot = tasks;
    setTasks((current) => current.filter((task) => task.id !== taskToDelete.id));
    showToast({ type: "success", message: `“${taskToDelete.title}” removed.` });
    try {
      await deleteTask(taskToDelete.id);
    } catch (caught) {
      setTasks(snapshot);
      showToast({ type: "error", message: caught instanceof Error ? caught.message : "Delete failed; the task was restored." });
    }
  }

  async function startCheckout() {
    setCheckoutLoading(true);
    try {
      const checkout = await createCheckoutSession();
      window.location.assign(checkout.url);
    } catch (caught) {
      showToast({ type: "error", message: caught instanceof Error ? caught.message : "Checkout could not be started." });
      setCheckoutLoading(false);
    }
  }

  const initials = user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "TM";
  const completedTasks = tasks.filter((task) => task.status === "done").length;

  return (
    <div className="dashboard-shell">
      <aside>
        <Link className="brand" to="/dashboard" onClick={() => setActiveView("overview")}><span>T</span>TaskMatrix</Link>
        <nav aria-label="Dashboard navigation">
          <button className={activeView === "overview" ? "active" : ""} onClick={() => setActiveView("overview")}>Overview</button>
          <button className={activeView === "tasks" ? "active" : ""} onClick={() => setActiveView("tasks")}>My tasks</button>
          <button className={activeView === "team" ? "active" : ""} onClick={() => setActiveView("team")}>Team</button>
        </nav>
        <div className="security-note"><i />JWT + owner protected</div>
      </aside>
      <main>
        <header><div><p>Protected workspace</p><strong>{user?.email || "Verifying session…"}</strong></div><div className="header-actions"><button className="upgrade" onClick={startCheckout} disabled={checkoutLoading}>{checkoutLoading ? "Opening…" : "Upgrade to Pro"}</button><button onClick={logout}>Log out</button></div></header>
        <section className="dashboard-content">
          {loading ? <div className="loading-state"><i /><p>Loading your private workspace…</p></div> : error ? <div className="error workspace-error">{error}<button onClick={() => window.location.reload()}>Retry</button></div> : (
            <div className="view-content">
              {activeView === "overview" && <>
                <div className="page-heading"><div><p className="eyebrow">SPRINT 16 · AI INJECTION & POLISH</p><h1>Welcome, {user?.name || "team member"}</h1><p>Every task is owner-scoped, validated, and ready for secure AI planning.</p></div><span className="auth-badge">API hardened</span></div>
                <div className="metrics"><article><span>Total tasks</span><strong>{tasks.length}</strong><small>Owner-scoped records</small></article><article><span>Completed</span><strong>{completedTasks}</strong><small>{tasks.length ? `${Math.round((completedTasks / tasks.length) * 100)}% completion` : "Ready to begin"}</small></article><article><span>AI microservice</span><strong>Server-side</strong><small>Gemini key stays in Express</small></article></div>
                <section className="content-panel"><div className="panel-heading"><div><h2>Recent tasks</h2><p>Live data from the protected REST API.</p></div><button onClick={() => setActiveView("tasks")}>Manage tasks</button></div>{tasks.length ? <TaskTable tasks={tasks.slice(0, 5)} /> : <EmptyTasks onAdd={() => { setActiveView("tasks"); setModalTask("new"); }} />}</section>
              </>}

              {activeView === "tasks" && <>
                <div className="page-heading"><div><p className="eyebrow">SECURE CRUD + AI</p><h1>My tasks</h1><p>Manage owner-protected records and generate actionable sub-steps through the server.</p></div><button className="primary compact" onClick={() => setModalTask("new")}>+ Add task</button></div>
                <section className="content-panel task-panel">{tasks.length ? <TaskTable tasks={tasks} onEdit={setModalTask} onDelete={handleDelete} onAi={setAiTask} /> : <EmptyTasks onAdd={() => setModalTask("new")} />}</section>
              </>}

              {activeView === "team" && <>
                <div className="page-heading"><div><p className="eyebrow">WORKSPACE ACCESS</p><h1>Team</h1><p>JWT identity controls who can access each task document.</p></div></div>
                <div className="team-grid"><article className="member-card"><div className="member-avatar">{initials}</div><div><strong>{user?.name || "Workspace member"}</strong><span>{user?.email}</span></div><b>Task owner</b></article><article className="pro-card"><p className="eyebrow">STRIPE TEST MODE</p><h3>TaskMatrix Pro</h3><p>Demonstrate the secure server-side Checkout pipeline with a test transaction.</p><button className="primary compact" onClick={startCheckout} disabled={checkoutLoading}>{checkoutLoading ? "Opening Checkout…" : "Upgrade for $9"}</button></article></div>
              </>}
            </div>
          )}
        </section>
      </main>
      {modalTask && <TaskModal task={modalTask === "new" ? null : modalTask} onClose={() => setModalTask(null)} onSaved={handleSaved} />}
      {aiTask && <AiSuggestionModal task={aiTask} onClose={() => setAiTask(null)} />}
      {toast && <div className={`toast toast-${toast.type}`} role="status">{toast.message}</div>}
    </div>
  );
}

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<{ loading: boolean; paid: boolean; message: string }>({ loading: true, paid: false, message: "Verifying your Stripe Checkout session…" });

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setState({ loading: false, paid: false, message: "The checkout session ID is missing." });
      return;
    }
    getCheckoutSession(sessionId)
      .then(({ session }) => setState({ loading: false, paid: session.paymentStatus === "paid", message: session.paymentStatus === "paid" ? "Test payment verified successfully." : `Payment status: ${session.paymentStatus}` }))
      .catch((caught) => setState({ loading: false, paid: false, message: caught instanceof Error ? caught.message : "Checkout verification failed." }));
  }, [searchParams]);

  return <main className="payment-shell"><section className="payment-card"><Link className="brand" to="/dashboard"><span>T</span>TaskMatrix</Link><div className={`payment-icon ${state.paid ? "paid" : ""}`}>{state.loading ? "…" : state.paid ? "✓" : "!"}</div><p className="eyebrow">STRIPE TEST MODE</p><h1>{state.loading ? "Verifying payment" : state.paid ? "Welcome to Pro" : "Payment not verified"}</h1><p>{state.message}</p><Link className="button-link" to="/dashboard">Return to dashboard</Link></section></main>;
}

function PaymentCancelled() {
  return <main className="payment-shell"><section className="payment-card"><Link className="brand" to="/dashboard"><span>T</span>TaskMatrix</Link><div className="payment-icon">×</div><p className="eyebrow">CHECKOUT CANCELLED</p><h1>No payment was made</h1><p>Your workspace is unchanged. You can restart the Stripe Test Mode checkout whenever you are ready.</p><Link className="button-link" to="/dashboard">Return to dashboard</Link></section></main>;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Navigate to={hasValidToken() ? "/dashboard" : "/login"} replace />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
    <Route path="/payment-cancelled" element={<ProtectedRoute><PaymentCancelled /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

