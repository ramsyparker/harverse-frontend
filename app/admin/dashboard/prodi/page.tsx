"use client"

import { useState, useEffect } from "react"
import { Card, CardContent} from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Plus, Pencil, Trash2, Search, X, Filter } from "lucide-react"
import { prodiApi, fakultasApi, type ApiResponse } from "@/lib/api"
import { toast } from "sonner"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Fakultas {
  _id: string
  nama: string
  kode: string
}

interface Prodi {
  _id: string
  nama: string
  kode: string
  fakultas_id: string | Fakultas
  jenjang_pendidikan?: string
  createdAt?: string
  updatedAt?: string
}

const ITEMS_PER_PAGE = 5

export default function ProdiPage() {
  const [prodi, setProdi] = useState<Prodi[]>([])
  const [fakultas, setFakultas] = useState<Fakultas[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nama: "",
    kode: "",
    fakultas_id: "",
    jenjang_pendidikan: "",
  })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState("")

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [filterFakultas, setFilterFakultas] = useState<string>("")
  const [filterJenjang, setFilterJenjang] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadFakultas()
    loadProdi()
  }, [])

  const loadFakultas = async () => {
    try {
      const response = await fakultasApi.getAll()
      if (response.success && response.data && Array.isArray(response.data)) {
        setFakultas(response.data)
      } else {
        setFakultas([])
      }
    } catch (err) {
      console.error("Error loading fakultas:", err)
      setFakultas([])
    }
  }

  const loadProdi = async () => {
    setLoading(true)
    try {
      const response = await prodiApi.getAll()
      if (response.success && response.data && Array.isArray(response.data)) {
        setProdi(response.data)
      } else {
        setProdi([])
      }
    } catch (err) {
      console.error("Error loading prodi:", err)
      setProdi([])
    } finally {
      setLoading(false)
    }
  }

  const getFakultasName = (fakultasId: string | Fakultas) => {
    if (typeof fakultasId === "object") {
      return fakultasId.nama
    }
    const found = fakultas.find((f) => f._id === fakultasId)
    return found ? found.nama : "-"
  }

  const handleOpenDialog = (item?: Prodi) => {
    if (item) {
      setEditingId(item._id)
      setFormData({
        nama: item.nama,
        kode: item.kode,
        fakultas_id:
          typeof item.fakultas_id === "object"
            ? item.fakultas_id._id
            : item.fakultas_id,
        jenjang_pendidikan: item.jenjang_pendidikan || "",
      })
    } else {
      setEditingId(null)
      setFormData({ nama: "", kode: "", fakultas_id: "", jenjang_pendidikan: "" })
    }
    setError("")
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setFormData({ nama: "", kode: "", fakultas_id: "", jenjang_pendidikan: "" })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.nama || !formData.kode || !formData.fakultas_id || !formData.jenjang_pendidikan) {
      setError("Semua field wajib diisi")
      return
    }

    try {
      let response: ApiResponse
      if (editingId) {
        response = await prodiApi.update(editingId, formData)
      } else {
        response = await prodiApi.create(formData)
      }

      if (response.success) {
        handleCloseDialog()
        loadProdi()
        if (editingId) {
          toast.success("Program studi berhasil diupdate")
        } else {
          toast.success("Program studi berhasil ditambahkan")
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
      const response = await prodiApi.delete(deleteId)
      if (response.success) {
        setDeleteDialogOpen(false)
        setDeleteId(null)
        loadProdi()
      }
    } catch (err) {
      console.error("Error deleting prodi:", err)
    }
  }

  const handleOpenDeleteDialog = (id: string) => {
    setDeleteId(id)
    setDeleteDialogOpen(true)
  }

  // Filter dan Search Logic
  const filteredProdi = prodi.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getFakultasName(item.fakultas_id).toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFakultas =
      filterFakultas === "" ||
      (typeof item.fakultas_id === "object"
        ? item.fakultas_id._id === filterFakultas
        : item.fakultas_id === filterFakultas)

    const matchesJenjang =
      filterJenjang === "" ||
      item.jenjang_pendidikan === filterJenjang

    return matchesSearch && matchesFakultas && matchesJenjang
  })

  // Pagination Logic
  const totalPages = Math.ceil(filteredProdi.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProdi = filteredProdi.slice(startIndex, endIndex)

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterFakultas, filterJenjang])

  const handleResetFilters = () => {
    setSearchQuery("")
    setFilterFakultas("")
    setFilterJenjang("")
    setCurrentPage(1)
  }

  // Count active filters
  const activeFilterCount = (filterFakultas ? 1 : 0) + (filterJenjang ? 1 : 0)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("ellipsis")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("ellipsis")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Program Studi</h1>
          <p className="text-muted-foreground">
            Kelola data program studi
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Prodi
        </Button>
      </div>

      <Card>
        <CardContent>
          {/* Search and Filter Section */}
          <div className="flex items-center justify-end gap-3 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Filter Button with Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Filter</h4>
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilters}
                        className="h-7 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="filter-fakultas" className="text-xs">Fakultas</Label>
                      <Select
                        value={filterFakultas || "all"}
                        onValueChange={(value) => setFilterFakultas(value === "all" ? "" : value)}
                      >
                        <SelectTrigger id="filter-fakultas">
                          <SelectValue placeholder="Semua Fakultas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Fakultas</SelectItem>
                          {fakultas.map((fak) => (
                            <SelectItem key={fak._id} value={fak._id}>
                              {fak.nama} ({fak.kode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filter-jenjang" className="text-xs">Jenjang Pendidikan</Label>
                      <Select
                        value={filterJenjang || "all"}
                        onValueChange={(value) => setFilterJenjang(value === "all" ? "" : value)}
                      >
                        <SelectTrigger id="filter-jenjang">
                          <SelectValue placeholder="Semua Jenjang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Jenjang</SelectItem>
                          <SelectItem value="D3">D3 - Diploma 3</SelectItem>
                          <SelectItem value="D4">D4 - Diploma 4</SelectItem>
                          <SelectItem value="S1">S1 - Sarjana</SelectItem>
                          <SelectItem value="S2">S2 - Magister</SelectItem>
                          <SelectItem value="S3">S3 - Doktor</SelectItem>
                          <SelectItem value="PROFESI">Profesi</SelectItem>
                          <SelectItem value="SPESIALIS">Spesialis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground mb-4">
            Menampilkan {paginatedProdi.length} dari {filteredProdi.length} program studi
            {filteredProdi.length !== prodi.length && ` (dari total ${prodi.length})`}
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data...
            </div>
          ) : filteredProdi.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {prodi.length === 0
                ? "Belum ada data program studi"
                : "Tidak ada data yang sesuai dengan filter"}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Fakultas</TableHead>
                    <TableHead>Jenjang</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProdi.map((item, index) => (
                    <TableRow key={item._id}>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell className="font-medium">{item.kode}</TableCell>
                      <TableCell>{item.nama}</TableCell>
                      <TableCell>{getFakultasName(item.fakultas_id)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {item.jenjang_pendidikan || "-"}
                        </span>
                      </TableCell>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center bg-transparent">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="cursor-pointer"
                        />
                      </PaginationItem>

                      {getPageNumbers().map((page, index) => (
                        <PaginationItem key={index}>
                          {page === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => setCurrentPage(page as number)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="cursor-pointer"
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Program Studi" : "Tambah Program Studi"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Ubah data program studi yang dipilih"
                  : "Tambahkan program studi baru ke dalam sistem"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fakultas_id">Fakultas *</Label>
                <Select
                  value={formData.fakultas_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, fakultas_id: value })
                  }
                  required
                >
                  <SelectTrigger id="fakultas_id">
                    <SelectValue placeholder="Pilih Fakultas" />
                  </SelectTrigger>
                  <SelectContent>
                    {fakultas.map((fak) => (
                      <SelectItem key={fak._id} value={fak._id}>
                        {fak.nama} ({fak.kode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kode">Kode *</Label>
                <Input
                  id="kode"
                  value={formData.kode}
                  onChange={(e) =>
                    setFormData({ ...formData, kode: e.target.value.toUpperCase() })
                  }
                  placeholder="TI"
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
                  placeholder="Teknik Informatika"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jenjang_pendidikan">Jenjang Pendidikan *</Label>
                <Select
                  value={formData.jenjang_pendidikan}
                  onValueChange={(value) =>
                    setFormData({ ...formData, jenjang_pendidikan: value })
                  }
                  required
                >
                  <SelectTrigger id="jenjang_pendidikan">
                    <SelectValue placeholder="Pilih Jenjang Pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D3">D3 - Diploma 3</SelectItem>
                    <SelectItem value="D4">D4 - Diploma 4</SelectItem>
                    <SelectItem value="S1">S1 - Sarjana</SelectItem>
                    <SelectItem value="S2">S2 - Magister</SelectItem>
                    <SelectItem value="S3">S3 - Doktor</SelectItem>
                    <SelectItem value="PROFESI">Profesi</SelectItem>
                    <SelectItem value="SPESIALIS">Spesialis</SelectItem>
                  </SelectContent>
                </Select>
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
            <AlertDialogTitle>Hapus Program Studi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Program studi ini akan
              dihapus secara permanen dari sistem.
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

