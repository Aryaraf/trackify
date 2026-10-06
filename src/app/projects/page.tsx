// File: src/app/projects/page.tsx
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { FolderKanban, Check, Trash2, Plus } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { ToggleTaskButton } from "@/components/ToggleTaskButton";

export default async function ProjectsPage() {
  // --- QUERY DATABASE ---
  const projects = await prisma.project.findMany({
    include: { tasks: { orderBy: { id: "asc" } } },
    orderBy: { id: "desc" }
  });

  // --- SERVER ACTIONS ---
  async function createProject(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    if (!title) return;
    await prisma.project.create({ data: { title } });
    revalidatePath("/projects");
    revalidatePath("/"); // Update dashboard juga
  }

  async function addSubTask(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const projectId = formData.get("projectId") as string;
    if (!title || !projectId) return;
    await prisma.task.create({ data: { title, isCompleted: false, projectId } });
    revalidatePath("/projects");
    revalidatePath("/");
  }

  async function toggleTask(formData: FormData) {
    "use server";
    const id = formData.get("id") as string; 
    const currentStatus = formData.get("status") === "true";
    await prisma.task.update({ where: { id }, data: { isCompleted: !currentStatus } });
    revalidatePath("/projects");
    revalidatePath("/");
  }

  async function deleteTask(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await prisma.task.delete({ where: { id } });
    revalidatePath("/projects");
    revalidatePath("/");
  }

  async function deleteProject(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await prisma.task.deleteMany({ where: { projectId: id } }); // Hapus semua sub-task dulu
    await prisma.project.delete({ where: { id } }); // Baru hapus project-nya
    revalidatePath("/projects");
    revalidatePath("/");
  }

  // --- UI RENDERING ---
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-mono">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER & TAMBAH PROJECT BARU */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Project</h1>
            <p className="text-muted-foreground mt-1">Kelola tugas kompleks dengan sub-task</p>
          </div>

          <form action={createProject} className="flex gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm md:w-96">
            <Input name="title" placeholder="Nama project baru..." className="h-9 text-sm bg-transparent border-none focus-visible:ring-0" required />
            <SubmitButton size="sm"><Plus className="h-4 w-4 mr-1" /> Buat</SubmitButton>
          </form>
        </div>

        {/* DAFTAR PROJECT (GRID) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4">
          {projects.length === 0 && (
            <div className="col-span-full text-center py-16 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
              Belum ada project aktif.<br/>Buat project baru menggunakan form di atas.
            </div>
          )}

          {projects.map((project) => {
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter((t) => t.isCompleted).length;
            const progressValue = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

            return (
              <Card key={project.id} className="overflow-hidden shadow-sm flex flex-col">
                {/* HEADER PROJECT (Judul, Progress, Hapus) */}
                <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 flex-none">
                  <div className="flex justify-between items-start mb-3">
                    <CardTitle className="text-lg leading-tight pr-4">{project.title}</CardTitle>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-slate-500">{progressValue}%</span>
                      <form action={deleteProject}>
                        <input type="hidden" name="id" value={project.id} />
                        <SubmitButton variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                  <p className="text-xs text-slate-500 mt-2">
                    {completedTasks} dari {totalTasks} selesai
                  </p>
                </CardHeader>

                {/* DAFTAR SUB-TASK */}
                <CardContent className="p-0 flex-1">
                  <div className="p-2 space-y-1">
                    {project.tasks.length === 0 && (
                       <p className="text-xs text-slate-400 text-center py-4 italic">Belum ada tugas.</p>
                    )}
                    {project.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between group p-1 rounded-md hover:bg-slate-100 transition-colors">
                        <form action={toggleTask} className="flex-1">
                          <input type="hidden" name="id" value={task.id} />
                          <input type="hidden" name="status" value={String(task.isCompleted)} />
                          <ToggleTaskButton isCompleted={task.isCompleted} title={task.title} />
                        </form>
                        <form action={deleteTask}>
                          <input type="hidden" name="id" value={task.id} />
                          <SubmitButton variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3 w-3" />
                          </SubmitButton>
                        </form>
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* FORM TAMBAH SUB-TASK BAWAH */}
                <CardFooter className="p-3 bg-slate-50 border-t border-slate-100 mt-auto flex-none">
                  <form action={addSubTask} className="flex gap-2 w-full">
                    <input type="hidden" name="projectId" value={project.id} />
                    <Input name="title" placeholder="Tambah tugas..." className="h-8 text-sm bg-white" required />
                    <SubmitButton size="sm" variant="secondary"><Plus className="h-4 w-4" /></SubmitButton>
                  </form>
                </CardFooter>
              </Card>
            );
          })}
        </div>

      </div>
    </div>
  );
}