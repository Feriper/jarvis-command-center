import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Trash2, Plus } from "lucide-react";

export default function Tasks() {
  const [tasks, setTasks] = useState<Array<{ id: number; title: string; completed: boolean }>>([
    { id: 1, title: "[TASK_001] Revisar métricas de Ads", completed: false },
    { id: 2, title: "[TASK_002] Atualizar perfil Jarvis", completed: true },
  ]);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), title: newTask, completed: false },
    ]);
    setNewTask("");
  };

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="h-full bg-background text-foreground scanlines p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-accent/30 pb-4">
        <h1 className="text-2xl font-semibold neon-glow bracket-left bracket-right">
          AGENDA_TAREFAS
        </h1>
        <p className="text-xs terminal-text opacity-50 mt-2">
          [SYSTEM_TASKS] | [PRIORITY_QUEUE] | [{tasks.length}_ITEMS]
        </p>
      </div>

      {/* Add Task */}
      <Card className="bg-card/50 border-accent/30 p-4">
        <div className="flex gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addTask()}
            placeholder="[NEW_TASK_INPUT]..."
            className="bg-input border-accent/30"
          />
          <Button
            onClick={addTask}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Tasks List */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className="bg-card/50 border-accent/30 p-4 flex items-center justify-between hover:bg-card/70 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => toggleTask(task.id)}
                className="text-accent hover:text-accent/80"
              >
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <span
                className={`font-mono text-sm ${
                  task.completed ? "line-through opacity-50" : ""
                }`}
              >
                {task.title}
              </span>
            </div>
            <button
              onClick={() => deleteTask(task.id)}
              className="text-destructive hover:text-destructive/80"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <Card className="bg-card/50 border-accent/30 p-4 mt-auto">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs terminal-text opacity-50">TOTAL</p>
            <p className="text-xl font-semibold text-accent">{tasks.length}</p>
          </div>
          <div>
            <p className="text-xs terminal-text opacity-50">CONCLUÍDO</p>
            <p className="text-xl font-semibold text-accent">
              {tasks.filter((t) => t.completed).length}
            </p>
          </div>
          <div>
            <p className="text-xs terminal-text opacity-50">PENDENTE</p>
            <p className="text-xl font-semibold text-accent">
              {tasks.filter((t) => !t.completed).length}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
