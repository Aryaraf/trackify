// File: src/app/keuangan/page.tsx
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, TrendingDown, History, Trash2, Calendar } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton"; // Menggunakan komponen dari update sebelumnya

const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
const formatTanggal = (tanggal: Date) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(tanggal);

export default async function KeuanganPage({ searchParams }: { searchParams: Promise<{ month?: string, page?: string }> }) {
  const params = await searchParams;
  
  // 1. SETUP FILTER BULAN & PAGINATION
  const currentDate = new Date();
  // Format bawaan input type="month" adalah YYYY-MM
  const defaultMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const selectedMonth = params.month || defaultMonth;
  const currentPage = Number(params.page) || 1;
  const limit = 10; // Jumlah transaksi maksimum per halaman

  // Ekstrak hari pertama dan terakhir pada bulan yang dipilih
  const [year, month] = selectedMonth.split("-");
  const startDate = new Date(Number(year), Number(month) - 1, 1);
  const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

  // 2. QUERY DATABASE PRISMA
  const whereCondition = { date: { gte: startDate, lte: endDate } };

  // Hitung total data untuk angka halaman maksimal
  const totalRecords = await prisma.transaction.count({ where: whereCondition });
  const totalPages = Math.ceil(totalRecords / limit) || 1;

  // Tarik data dengan metode offset pagination (skip & take)
  const transactions = await prisma.transaction.findMany({
    where: whereCondition,
    orderBy: { date: "desc" },
    skip: (currentPage - 1) * limit,
    take: limit,
  });

  // Kalkulasi rekap kartu atas khusus untuk bulan yang dipilih
  const incomeResult = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { ...whereCondition, type: "INCOME" } });
  const expenseResult = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { ...whereCondition, type: "EXPENSE" } });
  const netTotal = (incomeResult._sum.amount || 0) - (expenseResult._sum.amount || 0);

  // 3. SERVER ACTION PENGHAPUSAN
  async function deleteTransaction(formData: FormData) {
    "use server";
    await prisma.transaction.delete({ where: { id: formData.get("id") as string } });
    revalidatePath("/keuangan"); 
    revalidatePath("/"); // Update saldo di dashboard juga
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-mono">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER & FILTER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Semua Transaksi</h1>
            <p className="text-muted-foreground mt-1">Kelola riwayat keuangan bulanan</p>
          </div>

          {/* Form Native GET: Submit form akan mengubah URL parameter otomatis */}
          <form method="GET" className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <input type="hidden" name="page" value="1" /> {/* Paksa kembali ke halaman 1 saat filter diubah */}
            <Calendar className="h-5 w-5 text-slate-400 ml-2" />
            <input 
              type="month" 
              name="month" 
              defaultValue={selectedMonth} 
              className="bg-transparent border-none focus:ring-0 text-sm font-medium outline-none px-2"
              required
            />
            <Button type="submit" size="sm" className="h-8">Filter</Button>
          </form>
        </div>

        {/* RINGKASAN BULANAN (Menyesuaikan dengan filter) */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2 flex flex-row justify-between"><CardTitle className="text-sm">Saldo ({selectedMonth})</CardTitle><Wallet className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatRupiah(netTotal)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 flex flex-row justify-between"><CardTitle className="text-sm">Pemasukan</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">+{formatRupiah(incomeResult._sum.amount || 0)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 flex flex-row justify-between"><CardTitle className="text-sm">Pengeluaran</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">-{formatRupiah(expenseResult._sum.amount || 0)}</div></CardContent></Card>
        </div>

        {/* TABEL TRANSAKSI */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5" /> Riwayat Transaksi</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {transactions.length === 0 ? (
              <p className="text-center py-8 text-slate-500 italic">Tidak ada transaksi pada bulan ini.</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((trx) => (
                  <div key={trx.id} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0 group">
                    <div>
                      <p className="text-sm font-medium">{trx.category}</p>
                      <p className="text-xs text-slate-500">{formatTanggal(trx.date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-sm font-bold ${trx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                        {trx.type === "INCOME" ? "+" : "-"}{formatRupiah(trx.amount)}
                      </div>
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
            )}
          </CardContent>
        </Card>

        {/* KONTROL PAGINATION */}
        <div className="flex justify-between items-center px-2 py-4">
          {currentPage > 1 ? (
            <Link href={`/keuangan?month=${selectedMonth}&page=${currentPage - 1}`}>
              <Button variant="outline" size="sm">Sebelumnya</Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>Sebelumnya</Button>
          )}
          
          <span className="text-sm font-medium text-slate-500">
            Halaman {currentPage} dari {totalPages}
          </span>
          
          {currentPage < totalPages ? (
            <Link href={`/keuangan?month=${selectedMonth}&page=${currentPage + 1}`}>
              <Button variant="outline" size="sm">Selanjutnya</Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>Selanjutnya</Button>
          )}
        </div>

      </div>
    </div>
  );
}