import { ClipboardCheck, ClipboardCopy, FileText, History, Search, Sparkles, Trash2 } from "lucide-react";
import { FormEvent, MouseEvent, useMemo, useState } from "react";

type ReportForm = {
  studentName: string;
  attendanceDays: string;
  homeworkCount: string;
};

type HistoryItem = {
  id: string;
  studentName: string;
  attendanceDays: number;
  homeworkCount: number;
  report: string;
  createdAt: string;
};

type CopyStatus = "idle" | "success" | "error";

const HISTORY_STORAGE_KEY = "student-weekly-report-history";
const HISTORY_LIMIT = 10;

const initialForm: ReportForm = {
  studentName: "",
  attendanceDays: "",
  homeworkCount: "",
};

function buildReport({ studentName, attendanceDays, homeworkCount }: ReportForm) {
  const name = studentName.trim();
  const days = Number(attendanceDays);
  const homework = Number(homeworkCount);
  const attendanceText = days >= 5 ? "出勤表现非常稳定" : days >= 3 ? "本周出勤情况整体良好" : "本周出勤还可以继续提升";
  const homeworkText = homework >= 5 ? "作业完成积极，学习节奏保持得很好" : homework >= 3 ? "作业完成情况较好，能够跟上本周学习安排" : "作业完成数量偏少，后续可以加强练习与巩固";

  return `${name}同学本周共考勤${days}天，${attendanceText}；本周完成作业${homework}次，${homeworkText}。整体来看，${name}同学能够参与课堂学习并逐步积累知识点，希望下周继续保持良好的学习习惯，按时完成练习，争取取得更明显的进步。`;
}

function validateForm({ studentName, attendanceDays, homeworkCount }: ReportForm) {
  if (!studentName.trim()) {
    return "请输入学生姓名";
  }

  if (attendanceDays === "" || Number(attendanceDays) < 0 || Number.isNaN(Number(attendanceDays))) {
    return "请输入有效的考勤天数";
  }

  if (homeworkCount === "" || Number(homeworkCount) < 0 || Number.isNaN(Number(homeworkCount))) {
    return "请输入有效的作业完成数";
  }

  return "";
}

function readHistoryItems() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawHistory = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!rawHistory) {
      return [];
    }

    const parsedHistory = JSON.parse(rawHistory);
    return Array.isArray(parsedHistory) ? (parsedHistory as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function saveHistoryItems(items: HistoryItem[]) {
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
}

function createHistoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatHistoryTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Home() {
  const [form, setForm] = useState<ReportForm>(initialForm);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => readHistoryItems());
  const [historyQuery, setHistoryQuery] = useState("");

  const canCopy = useMemo(() => report.trim().length > 0, [report]);
  const filteredHistoryItems = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();

    if (!query) {
      return historyItems;
    }

    return historyItems.filter((item) => {
      return item.studentName.toLowerCase().includes(query) || item.report.toLowerCase().includes(query);
    });
  }, [historyItems, historyQuery]);

  const updateField = (field: keyof ReportForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setCopyStatus("idle");
  };

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationMessage = validateForm(form);

    if (validationMessage) {
      setError(validationMessage);
      setReport("");
      return;
    }

    const generatedReport = buildReport(form);
    const historyItem: HistoryItem = {
      id: createHistoryId(),
      studentName: form.studentName.trim(),
      attendanceDays: Number(form.attendanceDays),
      homeworkCount: Number(form.homeworkCount),
      report: generatedReport,
      createdAt: new Date().toISOString(),
    };
    const nextHistoryItems = [historyItem, ...historyItems].slice(0, HISTORY_LIMIT);

    setReport(generatedReport);
    setHistoryItems(nextHistoryItems);
    saveHistoryItems(nextHistoryItems);
    setCopyStatus("idle");
  };

  const handleCopy = async () => {
    if (!canCopy) {
      setError("请先生成周报内容");
      return;
    }

    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  };

  const handleUseHistoryItem = (item: HistoryItem) => {
    setReport(item.report);
    setCopyStatus("idle");
    setError("");
  };

  const handleCopyHistoryItem = async (event: MouseEvent<HTMLButtonElement>, item: HistoryItem) => {
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(item.report);
      setCopyStatus("success");
      setReport(item.report);
    } catch {
      setCopyStatus("error");
    }
  };

  const handleClearHistory = () => {
    if (!historyItems.length) {
      return;
    }

    const confirmed = window.confirm("确定要清空所有历史记录吗？此操作无法撤销。");

    if (!confirmed) {
      return;
    }

    setHistoryItems([]);
    setHistoryQuery("");
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#d9f99d_0,#ecfdf5_30%,#f7fee7_62%,#ffffff_100%)] text-[#12372f]">
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <div className="absolute left-[-7rem] top-[-7rem] h-80 w-80 rounded-full bg-emerald-300/35 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-lime-200/60 blur-3xl" />
        <div className="absolute right-[20%] top-[12%] h-44 w-44 rounded-full bg-teal-200/35 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(22,101,52,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(22,101,52,0.055)_1px,transparent_1px)] bg-[size:42px_42px] opacity-70" />

        <div className="relative z-10 mb-8 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-lg shadow-emerald-900/5 backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-lime-600" />
            教学反馈效率工具
          </div>
          <div className="hidden rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-emerald-700/20 sm:block">
            历史查询 · 本地保存
          </div>
        </div>

        <div className="relative z-10 grid flex-1 items-center gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="inline-flex rounded-full bg-white/75 px-5 py-2 text-sm font-bold text-emerald-700 shadow-xl shadow-emerald-900/5 ring-1 ring-emerald-100 backdrop-blur-xl">
                Weekly Report Maker
              </div>
              <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-emerald-950 sm:text-6xl lg:text-7xl">
                清新周报，一键生成。
              </h1>
              <p className="max-w-xl text-lg leading-8 text-emerald-900/70">
                输入学生姓名、考勤天数和作业完成数，系统会自动整理成一段适合发送给家长或归档记录的周报文字，并保存最近 10 条历史记录方便查询。
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["01", "填写信息"],
                ["02", "生成周报"],
                ["03", "查询历史"],
              ].map(([step, label]) => (
                <div key={step} className="rounded-[2rem] border border-white/80 bg-white/65 p-5 shadow-xl shadow-emerald-900/8 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/12">
                  <div className="text-xs font-black tracking-[0.3em] text-lime-600">{step}</div>
                  <div className="mt-2 text-base font-bold text-emerald-950">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <form onSubmit={handleGenerate} className="rounded-[2.25rem] border border-white/80 bg-white/80 p-7 shadow-[0_28px_80px_rgba(6,78,59,0.16)] backdrop-blur-2xl">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-emerald-500/25">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-emerald-950">填写本周数据</h2>
                  <p className="text-sm text-emerald-900/55">生成后会自动保存到历史</p>
                </div>
              </div>

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-emerald-800">学生姓名</span>
                  <input
                    value={form.studentName}
                    onChange={(event) => updateField("studentName", event.target.value)}
                    className="w-full rounded-3xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 text-base font-semibold text-emerald-950 shadow-inner shadow-emerald-900/5 outline-none transition placeholder:text-emerald-900/30 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-200/70"
                    placeholder="例如：小明"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-emerald-800">考勤天数</span>
                  <input
                    type="number"
                    min="0"
                    value={form.attendanceDays}
                    onChange={(event) => updateField("attendanceDays", event.target.value)}
                    className="w-full rounded-3xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 text-base font-semibold text-emerald-950 shadow-inner shadow-emerald-900/5 outline-none transition placeholder:text-emerald-900/30 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-200/70"
                    placeholder="例如：5"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-emerald-800">作业完成数</span>
                  <input
                    type="number"
                    min="0"
                    value={form.homeworkCount}
                    onChange={(event) => updateField("homeworkCount", event.target.value)}
                    className="w-full rounded-3xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 text-base font-semibold text-emerald-950 shadow-inner shadow-emerald-900/5 outline-none transition placeholder:text-emerald-900/30 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-200/70"
                    placeholder="例如：6"
                  />
                </label>
              </div>

              {error ? <p className="mt-5 rounded-3xl bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700 shadow-inner shadow-rose-900/5 ring-1 ring-rose-100">{error}</p> : null}

              <button className="mt-7 w-full rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-base font-black text-white shadow-2xl shadow-emerald-600/25 transition hover:-translate-y-1 hover:from-emerald-600 hover:to-teal-600 hover:shadow-emerald-700/30" type="submit">
                生成周报文字
              </button>
            </form>

            <section className="flex min-h-[30rem] flex-col rounded-[2.25rem] border border-emerald-100 bg-white/82 p-7 text-emerald-950 shadow-[0_28px_80px_rgba(6,78,59,0.16)] backdrop-blur-2xl">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-lime-600">生成结果</p>
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-emerald-950">本周反馈</h2>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                  disabled={!canCopy}
                >
                  {copyStatus === "success" ? <ClipboardCheck className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                  复制
                </button>
              </div>

              <div className="relative flex flex-1 rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-6 shadow-inner shadow-emerald-900/8">
                {report ? (
                  <p className="whitespace-pre-wrap text-lg leading-9 text-emerald-950">{report}</p>
                ) : (
                  <div className="m-auto max-w-xs text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-white text-emerald-600 shadow-xl shadow-emerald-900/10">
                      <FileText className="h-8 w-8" />
                    </div>
                    <p className="text-base font-bold text-emerald-950">等待生成周报</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-900/55">填写左侧信息后点击生成，这里会显示可复制的完整周报。</p>
                  </div>
                )}
              </div>

              <div className="mt-4 min-h-6 text-sm font-bold">
                {copyStatus === "success" ? <span className="text-emerald-700">已复制到剪贴板</span> : null}
                {copyStatus === "error" ? <span className="text-rose-700">复制失败，请手动选中文字复制</span> : null}
              </div>
            </section>

            <section className="xl:col-span-2 rounded-[2.25rem] border border-white/80 bg-white/78 p-7 shadow-[0_28px_80px_rgba(6,78,59,0.14)] backdrop-blur-2xl">
              <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 shadow-lg shadow-emerald-900/8">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-lime-600">历史信息查询</p>
                    <h2 className="text-2xl font-black tracking-[-0.04em] text-emerald-950">最近 {historyItems.length} 条记录</h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  disabled={!historyItems.length}
                  className="inline-flex items-center justify-center gap-2 rounded-3xl bg-white px-4 py-3 text-sm font-black text-emerald-800 shadow-lg shadow-emerald-900/8 ring-1 ring-emerald-100 transition hover:-translate-y-0.5 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Trash2 className="h-4 w-4" />
                  清空历史
                </button>
              </div>

              <label className="relative block">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-700/55" />
                <input
                  value={historyQuery}
                  onChange={(event) => setHistoryQuery(event.target.value)}
                  className="w-full rounded-3xl border border-emerald-100 bg-emerald-50/60 py-4 pl-12 pr-5 text-base font-semibold text-emerald-950 shadow-inner shadow-emerald-900/5 outline-none transition placeholder:text-emerald-900/35 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-200/70"
                  placeholder="按学生姓名或周报内容搜索"
                />
              </label>

              <div className="mt-5 grid max-h-[24rem] gap-4 overflow-y-auto pr-1">
                {!historyItems.length ? (
                  <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center text-emerald-900/60">
                    还没有历史记录，生成周报后会自动保存到这里。
                  </div>
                ) : filteredHistoryItems.length ? (
                  filteredHistoryItems.map((item) => (
                    <article
                      key={item.id}
                      onClick={() => handleUseHistoryItem(item)}
                      className="cursor-pointer rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/80 p-5 shadow-lg shadow-emerald-900/6 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/10"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-emerald-950">{item.studentName}同学</h3>
                            <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-bold text-lime-700">{formatHistoryTime(item.createdAt)}</span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-emerald-800/70">
                            考勤 {item.attendanceDays} 天 · 作业 {item.homeworkCount} 次
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => handleCopyHistoryItem(event, item)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-700/15 transition hover:bg-emerald-700"
                        >
                          <ClipboardCopy className="h-4 w-4" />
                          复制
                        </button>
                      </div>
                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-emerald-950/70">{item.report}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center text-emerald-900/60">
                    没有对应的内容，换个关键词试试。
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
