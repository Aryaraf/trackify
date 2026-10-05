import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Wallet, TrendingUp, TrendingDown, Plus, History, Check, ListTodo, Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { ToggleTaskButton } from "@/components/ToggleTaskButton";

const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
const formatTanggal = (tanggal: Date) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(tanggal);

export default async function Dashboard() {
  // --- BAGIAN 1: DATA KEUANGAN ---
  const incomeResult = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "INCOME" } });
  const expenseResult = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "EXPENSE" } });
  const totalBalance = (incomeResult._sum.amount || 0) - (expenseResult._sum.amount || 0);
  const recentTransactions = await prisma.transaction.findMany({ orderBy: { date: "desc" }, take: 5 });

  // --- BAGIAN 2: DATA TO-DO & PROJECT ---
  const generalTasks = await prisma.task.findMany({
    where: { projectId: null },
    orderBy: { id: "desc" }
  });

  const projects = await prisma.project.findMany({
    include: { tasks: { orderBy: { id: "asc" } } },
    orderBy: { id: "desc" }
  });

  // --- BAGIAN 3: SERVER ACTIONS ---
  async function addTransaction(formData: FormData) {
    "use server";
    const type = formData.get("type") as "INCOME" | "EXPENSE";
    const amount = Number(formData.get("amount"));
    const category = formData.get("category") as string;
    const dateInput = formData.get("date") as string;
    if (!amount || !category) return;
    await prisma.transaction.create({ data: { type, amount, category, date: dateInput ? new Date(dateInput) : new Date() } });
    revalidatePath("/");
  }

  async function deleteTransaction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await prisma.transaction.delete({ where: { id } });
    revalidatePath("/");
  }

  async function addMainItem(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const type = formData.get("entryType") as string;
    if (!title) return;

    if (type === "PROJECT") {
      await prisma.project.create({ data: { title: title } });
    } else {
      await prisma.task.create({ data: { title, isCompleted: false, projectId: null } });
    }
    revalidatePath("/");
  }

  async function addSubTask(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const projectId = formData.get("projectId") as string;
    if (!title || !projectId) return;
    await prisma.task.create({ data: { title, isCompleted: false, projectId } });
    revalidatePath("/");
  }

  async function toggleTask(formData: FormData) {
    "use server";
    const id = formData.get("id") as string; 
    const currentStatus = formData.get("status") === "true";
    await prisma.task.update({ where: { id }, data: { isCompleted: !currentStatus } });
    revalidatePath("/");
  }

  async function deleteTask(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await prisma.task.delete({ where: { id } });
    revalidatePath("/");
  }

  async function deleteProject(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await prisma.task.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });
    revalidatePath("/");
  }

  const today = new Date().toISOString().split("T")[0];

  // --- BAGIAN 4: UI ---
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-mono">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hello, Arya! 👋</h1>
          <p className="text-muted-foreground mt-1">Today Summary: {formatTanggal(new Date())}</p>
        </div>
        
        {/* WIDGET KEUANGAN */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2 flex flex-row justify-between"><CardTitle className="text-sm">Total Balance</CardTitle><Wallet className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatRupiah(totalBalance)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 flex flex-row justify-between"><CardTitle className="text-sm">Income</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">+{formatRupiah(incomeResult._sum.amount || 0)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 flex flex-row justify-between"><CardTitle className="text-sm">Expense</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">-{formatRupiah(expenseResult._sum.amount || 0)}</div></CardContent></Card>
        </div>

        {/* FORM TRANSAKSI (Sekarang Vertikal) & RIWAYAT */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card className="border-dashed border-2 bg-slate-50 h-full">
              <CardHeader className="pb-4"><CardTitle className="text-lg">Record New Transaction</CardTitle></CardHeader>
              <CardContent>
                <form action={addTransaction} className="flex flex-col gap-4">
                  {/* Susunan Input Vertikal */}
                  <div className="space-y-2"><label className="text-sm font-medium">Date</label><Input type="date" name="date" defaultValue={today} required /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Type</label><select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required><option value="EXPENSE">Expense</option><option value="INCOME">Income</option></select></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Category</label><Input name="category" placeholder="e.g., Food" required /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Amount</label><Input type="number" name="amount" placeholder="50000" required /></div>
                  <SubmitButton className="w-full mt-2"><Plus className="h-4 w-4 mr-2" />Save Transaction</SubmitButton>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <Card className="h-full">
            <CardHeader className="pb-4 flex flex-row items-center justify-between"><CardTitle className="text-lg">History</CardTitle><History className="h-4 w-4 text-slate-500" /></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((trx) => (
                  <div key={trx.id} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0 group">
                    <div>
                      <p className="text-sm font-medium">{trx.category}</p>
                      <p className="text-xs text-slate-500">{formatTanggal(trx.date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-sm font-bold ${trx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                        {trx.type === "INCOME" ? "+" : "-"}{formatRupiah(trx.amount)}
                      </div>
                      {/* Tombol Hapus Transaksi (Muncul saat di-hover) */}
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={trx.id} />
                        <SubmitButton variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3 w-3" />
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <hr className="border-slate-200" />

        {/* --- WIDGET MANAJEMEN TUGAS & PROJECT --- */}
        <div className="grid gap-8 md:grid-cols-2">
          
          {/* KOLOM KIRI: TO-DO HARIAN */}
          <Card className="flex flex-col h-fit">
            <CardHeader className="pb-4 flex flex-row items-center space-x-2">
              <ListTodo className="h-5 w-5 text-slate-500" />
              <CardTitle>To-Do Today</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              
              <form action={addMainItem} className="flex gap-2">
                <select name="entryType" className="flex h-10 w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-600" required>
                  <option value="TASK">Regular Task</option>
                  <option value="PROJECT">New Project</option>
                </select>
                <Input name="title" placeholder="What do you want to do?" className="flex-1" required />
                <SubmitButton size="icon" className="shrink-0"><Plus className="h-4 w-4" /></SubmitButton>
              </form>
              
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-semibold mb-3">TASKS:</p>
                {generalTasks.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4 italic">No regular tasks yet.</p>
                ) : (
                  generalTasks.map((task) => (
                    // Kontainer flex untuk misahin tombol centang dan tombol hapus
                    <div key={task.id} className="flex items-center justify-between group p-1 -mx-1 rounded-md hover:bg-slate-50 transition-colors">
                      <form action={toggleTask} className="flex-1">
                        <input type="hidden" name="id" value={task.id} />
                        <input type="hidden" name="status" value={String(task.isCompleted)} />
                        <ToggleTaskButton isCompleted={task.isCompleted} title={task.title} />
                      </form>
                      {/* Tombol Hapus Tugas Harian */}
                      <form action={deleteTask}>
                        <input type="hidden" name="id" value={task.id} />
                        <SubmitButton variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3 w-3" />
                        </SubmitButton>
                      </form>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>


          {/* KOLOM KANAN: PROJECT MANAGER */}
          <div className="space-y-6">
            
            {projects.length === 0 && (
               <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                 No active projects yet.<br/>Create one using the To-Do form on the left.
               </div>
            )}

            {projects.map((project) => {
              const totalTasks = project.tasks.length;
              const completedTasks = project.tasks.filter((t) => t.isCompleted).length;
              const progressValue = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

              return (
                <Card key={project.id} className="overflow-hidden shadow-sm">
                  
                  {/* Judul, Progress Project & Hapus Project */}
                  <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                    <div className="flex justify-between items-start mb-3">
                      <CardTitle className="text-lg leading-tight pr-4">{project.title}</CardTitle>
                      
                      {/* Kotak khusus Persentase & Tong Sampah di kanan atas biar nggak nabrak bar */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-slate-500">{progressValue}%</span>
                        <form action={deleteProject}>
                          <input type="hidden" name="id" value={project.id} />
                          <SubmitButton variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-3 w-3" />
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                    
                    <Progress value={progressValue} className="h-2" />
                    <p className="text-xs text-slate-500 mt-2">
                      {completedTasks} of {totalTasks} sub-tasks completed
                    </p>
                  </CardHeader>

                  <CardContent className="p-0">
                    <div className="p-2 space-y-1">
                      {project.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between group p-1 rounded-md hover:bg-slate-100 transition-colors">
                          <form action={toggleTask} className="flex-1">
                            <input type="hidden" name="id" value={task.id} />
                            <input type="hidden" name="status" value={String(task.isCompleted)} />
                            <button type="submit" className="flex items-center space-x-3 text-left w-full p-1">
                              <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${task.isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'border-slate-300'}`}>
                                {task.isCompleted && <Check className="h-2.5 w-2.5" />}
                              </div>
                              <span className={`text-sm ${task.isCompleted ? "line-through text-slate-400" : ""}`}>{task.title}</span>
                            </button>
                          </form>
                          {/* Tombol Hapus Sub-Task */}
                          <form action={deleteTask}>
                            <input type="hidden" name="id" value={task.id} />
                            <SubmitButton variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-3 w-3" />
                            </SubmitButton>
                          </form>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="p-3 bg-slate-50 border-t border-slate-100">
                    <form action={addSubTask} className="flex gap-2 w-full">
                      <input type="hidden" name="projectId" value={project.id} />
                      <Input name="title" placeholder="Tambah sub-task baru..." className="h-8 text-sm bg-white" required />
                      <SubmitButton size="icon" className="shrink-0"><Plus className="h-4 w-4" /></SubmitButton>
                    </form>
                  </CardFooter>

                </Card>
              );
            })}

          </div>
        </div>

      </div>
    </div>
  );
}