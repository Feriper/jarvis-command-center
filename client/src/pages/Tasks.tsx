import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CheckCircle2, Circle, AlertCircle, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [loading, setLoading] = useState(true);

  const { data: tasksList } = trpc.tasks.list.useQuery();
  const createTaskMutation = trpc.tasks.create.useMutation();
  const updateStatusMutation = trpc.tasks.updateStatus.useMutation();
  const deleteTaskMutation = trpc.tasks.delete.useMutation();

  useEffect(() => {
    if (tasksList) {
      setTasks(tasksList);
      setLoading(false);
    }
  }, [tasksList]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      await createTaskMutation.mutateAsync({
        title: newTaskTitle,
        priority: newTaskPriority as any,
      });
      setNewTaskTitle("");
      setNewTaskPriority("medium");
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
    }
  };

  const handleToggleStatus = async (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await updateStatusMutation.mutateAsync({
        id: taskId,
        status: newStatus as any,
      });
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    return true;
  });

  const priorityColors = {
    low: "bg-blue-500/20 text-blue-300",
    medium: "bg-yellow-500/20 text-yellow-300",
    high: "bg-orange-500/20 text-orange-300",
    urgent: "bg-red-500/20 text-red-300",
  };

  const priorityIcons = {
    low: null,
    medium: null,
    high: <AlertCircle className="w-4 h-4" />,
    urgent: <Zap className="w-4 h-4" />,
  };



  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-accent/30 pb-4">
        <h1 className="text-3xl font-bold neon-glow bracket-left bracket-right">
          TAREFAS & AGENDA
        </h1>
        <p className="text-sm terminal-text opacity-70 mt-2">
          [TASK_MANAGER_ACTIVE] | {filteredTasks.length} tarefas
        </p>
      </div>

      {/* Input de Nova Tarefa */}
      <Card className="bg-card border-accent/30 p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
            placeholder="[NOVA_TAREFA]..."
            className="bg-input border-accent/30 text-foreground"
          />
          <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
            <SelectTrigger className="w-32 bg-input border-accent/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleAddTask}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-card border-accent/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="in_progress">Em Progresso</SelectItem>
            <SelectItem value="completed">Concluídas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40 bg-card border-accent/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Prioridades</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-3">
        {loading ? (
          <Card className="bg-card border-accent/30 p-4 text-center text-muted-foreground">
            Carregando tarefas...
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card className="bg-card border-accent/30 p-4 text-center text-muted-foreground">
            Nenhuma tarefa encontrada
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={`bg-card border-accent/30 p-4 flex items-start gap-4 transition-all ${
                task.status === "completed" ? "opacity-60" : ""
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggleStatus(task.id, task.status)}
                className="mt-1 flex-shrink-0"
              >
                {task.status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                ) : (
                  <Circle className="w-5 h-5 text-accent/50" />
                )}
              </button>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className={`font-semibold ${
                      task.status === "completed"
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </h3>
                  <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                    <span className="flex items-center gap-1">
                      {priorityIcons[task.priority as keyof typeof priorityIcons]}
                      {task.priority}
                    </span>
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                )}
                {task.dueDate && (
                  <p className="text-xs terminal-text opacity-50 mt-2">
                    Vencimento: {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>

              {/* Ações */}
              <Button
                onClick={() => handleDeleteTask(task.id)}
                variant="ghost"
                size="icon"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))
        )}
      </div>

      {/* Estatísticas */}
      <Card className="bg-card border-accent/30 p-4 grid grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">
            {tasks.filter((t) => t.status === "completed").length}
          </p>
          <p className="text-xs terminal-text opacity-70">Concluídas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {tasks.filter((t) => t.status === "pending").length}
          </p>
          <p className="text-xs terminal-text opacity-70">Pendentes</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-400">
            {tasks.filter((t) => t.priority === "high" || t.priority === "urgent").length}
          </p>
          <p className="text-xs terminal-text opacity-70">Prioritárias</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">
            {Math.round(
              (tasks.filter((t) => t.status === "completed").length / tasks.length) * 100 || 0
            )}%
          </p>
          <p className="text-xs terminal-text opacity-70">Progresso</p>
        </div>
      </Card>
    </div>
  );
}
