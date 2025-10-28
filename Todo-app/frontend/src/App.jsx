import { useState, useEffect } from "react";

function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const backendUrl = "http://127.0.0.1:8000/todos";

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(backendUrl);
      if (!res.ok) throw new Error("Failed to fetch todos");
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      setError("Unable to connect to server. Make sure the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!input.trim()) {
      setError("Please enter a todo item");
      return;
    }
    setError("");
    try {
      const res = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input, completed: false }),
      });
      if (!res.ok) throw new Error("Failed to add todo");
      const data = await res.json();
      setTodos([...todos, data]);
      setInput("");
    } catch (err) {
      setError("Failed to add todo");
      console.error(err);
    }
  };

  const toggleTodo = async (id) => {
    const todo = todos.find((t) => t.id === id);
    try {
      // Try PATCH first, fall back to PUT if needed
      const res = await fetch(`${backendUrl}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: todo.title,
          completed: !todo.completed 
        }),
      });
      if (!res.ok) throw new Error("Failed to update todo");
      const data = await res.json();
      setTodos(todos.map((t) => (t.id === id ? data : t)));
    } catch (err) {
      // Fallback: update locally if backend fails
      setTodos(todos.map((t) => 
        t.id === id ? { ...t, completed: !t.completed } : t
      ));
      console.error("Backend update failed, updated locally:", err);
    }
  };

  const deleteTodo = async (id) => {
    // Optimistically remove from UI first
    const originalTodos = [...todos];
    setTodos(todos.filter((t) => t.id !== id));
    
    try {
      const res = await fetch(`${backendUrl}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Delete failed. Status:", res.status, "Response:", errorText);
        throw new Error(`Failed to delete (${res.status})`);
      }
      console.log("Successfully deleted todo", id);
    } catch (err) {
      // If backend doesn't support DELETE, just keep it deleted locally
      console.warn("Backend delete failed, keeping local change:", err);
      setError(`Note: Deleted locally only. Backend error: ${err.message}`);
      // Don't rollback - keep the todo deleted in UI
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") addTodo();
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const stats = {
    total: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl border border-slate-700/50">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Todo Master
          </h1>
          <p className="text-slate-400 text-sm">Organize your tasks efficiently</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-grow px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-gray-100 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
            placeholder="What needs to be done?"
            disabled={loading}
          />
          <button
            onClick={addTodo}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex gap-2">
            {["all", "active", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="text-sm text-slate-400">
            {stats.active} active · {stats.completed} done
          </div>
        </div>

        <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-slate-400">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading todos...
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-slate-400 italic">
                {filter === "all" ? "No todos yet — start adding some!" : `No ${filter} todos`}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 bg-slate-700/40 rounded-xl p-4 border border-slate-600/50 hover:border-cyan-500/50 transition-all group"
              >
                <input
                  type="checkbox"
                  checked={todo.completed || false}
                  onChange={() => toggleTodo(todo.id)}
                  className="w-5 h-5 rounded border-slate-500 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                />
                <span
                  className={`flex-grow text-gray-100 transition-all ${
                    todo.completed ? "line-through text-slate-500" : ""
                  }`}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-slate-400 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete todo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={fetchTodos}
          disabled={loading}
          className="w-full py-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-cyan-400 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh List
        </button>
      </div>
    </div>
  );
}

export default App;