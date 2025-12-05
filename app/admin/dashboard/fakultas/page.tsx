"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { fakultasApi, type ApiResponse } from "@/lib/api"
import { toast } from "sonner"

interface Fakultas {
  _id: string
  nama: string
  kode: string
  createdAt?: string
  updatedAt?: string
}

export default function FakultasPage() {
  const [fakultas, setFakultas] = useState<Fakultas[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ nama: "", kode: "" })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    loadFakultas()
  }, [])

  const loadFakultas = async () => {
    setLoading(true)
    try {
      const response = await fakultasApi.getAll()
      if (response.success && response.data && Array.isArray(response.data)) {
        setFakultas(response.data)
      } else {
        setFakultas([])
      }
    } catch (err) {
      console.error("Error loading fakultas:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (item?: Fakultas) => {
    if (item) {
      setEditingId(item._id)
      setFormData({ nama: item.nama, kode: item.kode })
    } else {
      setEditingId(null)
      setFormData({ nama: "", kode: "" })
    }
    setError("")
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setFormData({ nama: "", kode: "" })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.nama || !formData.kode) {
      setError("Nama dan kode wajib diisi")
      return
    }

    try {
      let response: ApiResponse
      if (editingId) {
        response = await fakultasApi.update(editingId, formData)
      } else {
        response = await fakultasApi.create(formData)
      }

      if (response.success) {
        handleCloseDialog()
        loadFakultas()
        if (editingId) {
          toast.success("Fakultas berhasil diupdate")
        } else {
          toast.success("Fakultas berhasil ditambahkan")
        }
      } else {
        setError(response.message || "Gagal menyimpan data")
        toast.error(response.message || "Gagal menyimpan data")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan"
      setError(errorMessage)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fakultasApi.delete(deleteId)
      if (response.success) {
        setDeleteDialogOpen(false)
        setDeleteId(null)
        loadFakultas()
      }
    } catch (err) {
      console.error("Error deleting fakultas:", err)
    }
  }

  const handleOpenDeleteDialog = (id: string) => {
    setDeleteId(id)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fakultas</h1>
          <p className="text-muted-foreground">
            Kelola data fakultas
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Fakultas
        </Button>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data...
            </div>
          ) : fakultas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data fakultas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fakultas.map((item, index) => (
                  <TableRow key={item._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.kode}</TableCell>
                    <TableCell>{item.nama}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDeleteDialog(item._id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Fakultas" : "Tambah Fakultas"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Ubah data fakultas yang dipilih"
                  : "Tambahkan fakultas baru ke dalam sistem"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="kode">Kode *</Label>
                <Input
                  id="kode"
                  value={formData.kode}
                  onChange={(e) =>
                    setFormData({ ...formData, kode: e.target.value.toUpperCase() })
                  }
                  placeholder="FT"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama">Nama *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  placeholder="Fakultas Teknik"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Batal
              </Button>
              <Button type="submit">
                {editingId ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Fakultas?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Fakultas ini akan dihapus
              secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

