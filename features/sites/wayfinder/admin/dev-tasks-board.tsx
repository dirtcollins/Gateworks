"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminBtn,
  Field,
  FilterChips,
  Ico,
  Kpi,
  Mono,
  Notice,
  PageHead,
  Panel,
  Pill,
  SelectInput,
  TextInput,
  wf
} from "./admin-kit";
import {
  devTaskPhases,
  devTasks,
  type DevTask,
  type DevTaskPriority,
  type DevTaskStatus
} from "@/lib/dev-tasks";

type StatusFilter = DevTaskStatus | "all";
type PriorityFilter = DevTaskPriority | "all";

const STORAGE_KEY = "gateworks-dev-tasks-v1";

const statusOptions: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "not_started", label: "Not started" },
  { id: "in_progress", label: "In progress" },
  { id: "blocked", label: "Blocked" },
  { id: "needs_review", label: "Needs review" },
  { id: "completed", label: "Completed" },
  { id: "skipped", label: "Skipped" }
];

const priorityOptions: { id: PriorityFilter; label: string }[] = [
  { id: "all", label: "All priorities" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" }
];

const statusLabels: Record<DevTaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  needs_review: "Needs review",
  completed: "Completed",
  skipped: "Skipped"
};

const priorityLabels: Record<DevTaskPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low"
};

const statusTone: Record<DevTaskStatus, "neutral" | "open" | "active" | "done" | "warn" | "stop"> = {
  not_started: "neutral",
  in_progress: "active",
  blocked: "stop",
  needs_review: "warn",
  completed: "done",
  skipped: "neutral"
};

const priorityTone: Record<DevTaskPriority, "neutral" | "open" | "active" | "done" | "warn" | "stop"> = {
  critical: "stop",
  high: "warn",
  medium: "open",
  low: "neutral"
};

function percent(tasks: DevTask[]) {
  if (!tasks.length) return 0;
  return Math.round(tasks.reduce((sum, task) => sum + task.progressPercent, 0) / tasks.length);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeProgress(status: DevTaskStatus, progress: number) {
  if (status === "completed") return 100;
  if (status === "not_started") return 0;
  return Math.min(99, Math.max(0, progress));
}

function loadStoredTasks() {
  if (typeof window === "undefined") return devTasks;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return devTasks;
    const overrides = JSON.parse(raw) as Record<string, Partial<DevTask>>;
    return devTasks.map((task) => ({ ...task, ...overrides[task.id] }));
  } catch {
    return devTasks;
  }
}

export function WayfinderDevTasksBoard() {
  const [tasks, setTasks] = useState<DevTask[]>(devTasks);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [phase, setPhase] = useState("all");
  const [openTaskId, setOpenTaskId] = useState<string | null>(devTasks[0]?.id || null);

  useEffect(() => {
    setTasks(loadStoredTasks());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const overrides = tasks.reduce<Record<string, Partial<DevTask>>>((acc, task) => {
      const base = devTasks.find((seed) => seed.id === task.id);
      if (!base) return acc;
      if (
        base.status !== task.status ||
        base.priority !== task.priority ||
        base.progressPercent !== task.progressPercent ||
        base.owner !== task.owner ||
        base.updatedAt !== task.updatedAt ||
        base.completedAt !== task.completedAt
      ) {
        acc[task.id] = {
          status: task.status,
          priority: task.priority,
          progressPercent: task.progressPercent,
          owner: task.owner,
          updatedAt: task.updatedAt,
          completedAt: task.completedAt
        };
      }
      return acc;
    }, {});
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [ready, tasks]);

  const summary = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "completed").length;
    const blocked = tasks.filter((task) => task.status === "blocked").length;
    const activePhase =
      devTaskPhases
        .map((phaseName) => ({
          phase: phaseName,
          score: tasks
            .filter((task) => task.phase === phaseName)
            .reduce((sum, task) => sum + (task.status === "in_progress" ? 2 : task.progressPercent > 0 ? 1 : 0), 0)
        }))
        .sort((a, b) => b.score - a.score)[0]?.phase || devTaskPhases[0];
    return { completed, blocked, activePhase, overall: percent(tasks) };
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const textHit =
        !q ||
        task.title.toLowerCase().includes(q) ||
        task.phase.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.backendNotes.toLowerCase().includes(q) ||
        task.frontendNotes.toLowerCase().includes(q) ||
        task.databaseNotes.toLowerCase().includes(q);
      return (
        textHit &&
        (status === "all" || task.status === status) &&
        (priority === "all" || task.priority === priority) &&
        (phase === "all" || task.phase === phase)
      );
    });
  }, [phase, priority, query, status, tasks]);

  const grouped = useMemo(
    () =>
      devTaskPhases
        .map((phaseName) => ({
          phase: phaseName,
          tasks: filtered.filter((task) => task.phase === phaseName),
          allTasks: tasks.filter((task) => task.phase === phaseName)
        }))
        .filter((group) => group.tasks.length),
    [filtered, tasks]
  );

  function updateTask(id: string, patch: Partial<DevTask>) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== id) return task;
        const nextStatus = patch.status || task.status;
        const nextProgress = normalizeProgress(
          nextStatus,
          patch.progressPercent ?? task.progressPercent
        );
        return {
          ...task,
          ...patch,
          status: nextStatus,
          progressPercent: nextProgress,
          updatedAt: today(),
          completedAt: nextStatus === "completed" ? patch.completedAt || today() : undefined
        };
      })
    );
  }

  function resetLocalProgress() {
    setTasks(devTasks);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <PageHead
        eyebrow="Internal roadmap"
        title="Dev Tasks"
        desc="Internal development roadmap for the Gateworks app."
        action={
          <AdminBtn variant="ghost" size="sm" onClick={resetLocalProgress}>
            Reset local progress
          </AdminBtn>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12
        }}
      >
        <Kpi label="Overall progress" value={`${summary.overall}%`} hint={`${tasks.length} seeded tasks`} tone="pine" />
        <Kpi label="Completed tasks" value={`${summary.completed} / ${tasks.length}`} hint="Completed tasks show 100%" />
        <Kpi label="Active phase" value={summary.activePhase.replace("Phase ", "P")} hint="Highest current activity" tone="safety" />
        <Kpi label="Blocked tasks" value={summary.blocked} hint="Needs decision or dependency" tone={summary.blocked ? "red" : "ink"} />
      </div>

      <Panel
        title="Roadmap controls"
        meta="Search, filter, update status, and open task instructions."
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(220px, 1.4fr) minmax(190px, 0.7fr)",
              gap: 10
            }}
            className="wf-devtask-controls"
          >
            <Field label="Search">
              <TextInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks, phases, notes..."
              />
            </Field>
            <Field label="Phase">
              <SelectInput value={phase} onChange={(event) => setPhase(event.target.value)}>
                <option value="all">All phases</option>
                {devTaskPhases.map((phaseName) => (
                  <option key={phaseName} value={phaseName}>
                    {phaseName}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <FilterChips value={status} options={statusOptions} onChange={setStatus} />
          <FilterChips value={priority} options={priorityOptions} onChange={setPriority} />
          <Notice>
            This first pass keeps task updates in this browser so the tracker is usable now.
            The task file already defines the later Supabase-backed upgrade path.
          </Notice>
        </div>
      </Panel>

      {grouped.map((group) => (
        <Panel
          key={group.phase}
          title={group.phase}
          meta={`${group.tasks.length} visible / ${group.allTasks.length} total tasks`}
          action={<Mono>{percent(group.allTasks)}%</Mono>}
          pad={false}
        >
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${wf.hairline}` }}>
            <div
              style={{
                height: 7,
                borderRadius: 999,
                background: wf.bone,
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  width: `${percent(group.allTasks)}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: wf.pine
                }}
              />
            </div>
          </div>
          <div style={{ display: "grid" }}>
            {group.tasks.map((task) => {
              const open = openTaskId === task.id;
              return (
                <article
                  key={task.id}
                  style={{
                    display: "grid",
                    gap: 12,
                    padding: "15px 18px",
                    borderBottom: `1px solid ${wf.hairline}`
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      gap: 12,
                      alignItems: "start"
                    }}
                    className="wf-devtask-row"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenTaskId(open ? null : task.id)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "18px minmax(0, 1fr)",
                        gap: 8,
                        padding: 0,
                        border: 0,
                        background: "transparent",
                        textAlign: "left",
                        cursor: "pointer"
                      }}
                    >
                      <span style={{ color: wf.muted, paddingTop: 2 }}>
                        {open ? <Ico.chevronDown size={15} /> : <Ico.chevronRight size={15} />}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: "block",
                            margin: 0,
                            color: wf.ink,
                            fontSize: 13.5,
                            fontWeight: 600,
                            lineHeight: 1.3
                          }}
                        >
                          {task.title}
                        </span>
                        <span style={{ display: "block", marginTop: 4, color: wf.muted, fontSize: 12.5 }}>
                          {task.description}
                        </span>
                      </span>
                    </button>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                        gap: 7
                      }}
                    >
                      <Pill tone={statusTone[task.status]}>{statusLabels[task.status]}</Pill>
                      <Pill tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Pill>
                      <Pill>{task.progressPercent}%</Pill>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(120px, 1fr) auto",
                      gap: 10,
                      alignItems: "center"
                    }}
                  >
                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: wf.bone,
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          width: `${task.progressPercent}%`,
                          height: "100%",
                          background: task.status === "blocked" ? wf.red : wf.pine,
                          borderRadius: 999
                        }}
                      />
                    </div>
                    <Mono>{task.updatedAt}</Mono>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(120px, 1fr))",
                      gap: 8
                    }}
                    className="wf-devtask-editgrid"
                  >
                    <Field label="Status">
                      <SelectInput
                        value={task.status}
                        onChange={(event) =>
                          updateTask(task.id, { status: event.target.value as DevTaskStatus })
                        }
                      >
                        {statusOptions
                          .filter((option) => option.id !== "all")
                          .map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                      </SelectInput>
                    </Field>
                    <Field label="Priority">
                      <SelectInput
                        value={task.priority}
                        onChange={(event) =>
                          updateTask(task.id, { priority: event.target.value as DevTaskPriority })
                        }
                      >
                        {priorityOptions
                          .filter((option) => option.id !== "all")
                          .map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                      </SelectInput>
                    </Field>
                    <Field label="Progress">
                      <TextInput
                        type="number"
                        min={0}
                        max={100}
                        value={task.progressPercent}
                        onChange={(event) =>
                          updateTask(task.id, {
                            progressPercent: Number.parseInt(event.target.value || "0", 10)
                          })
                        }
                      />
                    </Field>
                    <Field label="Owner">
                      <TextInput
                        value={task.owner}
                        onChange={(event) => updateTask(task.id, { owner: event.target.value })}
                      />
                    </Field>
                  </div>

                  {open ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 12
                      }}
                      className="wf-devtask-detailgrid"
                    >
                      <TaskNote title="Backend" body={task.backendNotes} />
                      <TaskNote title="Frontend" body={task.frontendNotes} />
                      <TaskNote title="Database" body={task.databaseNotes} />
                      <TaskNote title="Testing" body={task.testingNotes} />
                      <TaskNote
                        title="Dependencies"
                        body={task.dependencies.length ? task.dependencies.join(", ") : "No explicit dependencies."}
                      />
                      <TaskNote title="Codex instructions" body={task.codexInstructions} />
                      <div
                        style={{
                          gridColumn: "1 / -1",
                          padding: 12,
                          border: `1px solid ${wf.rail}`,
                          borderRadius: 10,
                          background: wf.bone
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: wf.muted
                          }}
                        >
                          Acceptance criteria
                        </p>
                        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 5 }}>
                          {task.acceptanceCriteria.map((item) => (
                            <li key={item} style={{ fontSize: 12.5, color: wf.steel }}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </Panel>
      ))}
    </div>
  );
}

function TaskNote({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        padding: 12,
        border: `1px solid ${wf.rail}`,
        borderRadius: 10,
        background: "#fff"
      }}
    >
      <p
        style={{
          margin: "0 0 5px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: wf.muted
        }}
      >
        {title}
      </p>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: wf.steel }}>{body}</p>
    </div>
  );
}
