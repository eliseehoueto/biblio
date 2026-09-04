"use client";

import { useEffect, useState, useMemo } from "react";
import { libraryApi, type Book } from "@/lib/api";
import {
  IconBook,
  IconBookOpen,
  IconPlus,
  IconSearch,
  IconUser,
  IconClock,
  IconTrash,
  IconRefresh,
  IconArrowReturn,
  IconCheckCircle,
  IconAlertCircle,
  IconX,
  IconTag,
} from "@/components/icons";

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [archivedBooks, setArchivedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingBorrow, setSubmittingBorrow] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "borrowed">("all");
  const [catalogueView, setCatalogueView] = useState<"active" | "archived">("active");

  // Form states
  const [createForm, setCreateForm] = useState({
    title: "",
    author: "",
    isbn: "",
  });

  const [borrowForm, setBorrowForm] = useState({
    bookId: "",
    borrowerName: "",
  });

  // Auto-dismiss notifications after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const activeBooks = await libraryApi.listBooks();
      setBooks(activeBooks);

      try {
        setArchivedBooks(await libraryApi.listArchivedBooks());
      } catch {
        setArchivedBooks([]);
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur de connexion au serveur",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBooks();
  }, []);

  // Operation 1: Create a book
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.author.trim() || !createForm.isbn.trim()) {
      setNotification({
        type: "error",
        message: "Tous les champs obligatoires doivent être renseignés.",
      });
      return;
    }

    setSubmittingCreate(true);
    try {
      const newBook = await libraryApi.createBook({
        title: createForm.title.trim(),
        author: createForm.author.trim(),
        isbn: createForm.isbn.trim(),
      });

      setCreateForm({ title: "", author: "", isbn: "" });
      setNotification({
        type: "success",
        message: `Le livre "${newBook.title}" a été ajouté au catalogue.`,
      });
      await loadBooks();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Échec de l'enregistrement du livre.",
      });
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Operation 3: Borrow a book
  const handleBorrowBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowForm.bookId || !borrowForm.borrowerName.trim()) {
      setNotification({
        type: "error",
        message: "Veuillez sélectionner un livre et renseigner le nom de l'emprunteur.",
      });
      return;
    }

    setSubmittingBorrow(true);
    try {
      const updated = await libraryApi.borrowBook(borrowForm.bookId, {
        borrower_name: borrowForm.borrowerName.trim(),
      });

      setBorrowForm({ bookId: "", borrowerName: "" });
      setNotification({
        type: "success",
        message: `Emprunt confirmé : "${updated.title}" prêté à ${updated.borrowed_by}.`,
      });
      await loadBooks();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Échec de l'enregistrement de l'emprunt.",
      });
    } finally {
      setSubmittingBorrow(false);
    }
  };

  // Operation 4: Return a book
  const handleReturnBook = async (bookId: string, title: string) => {
    setActionLoadingId(bookId);
    try {
      await libraryApi.returnBook(bookId);
      setNotification({
        type: "success",
        message: `Le livre "${title}" a été restitué avec succès.`,
      });
      await loadBooks();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Impossible d'effectuer le retour.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Operation 5: Delete a book
  const handleDeleteBook = async (bookId: string, title: string) => {
    if (!confirm(`Archiver le livre "${title}" ?`)) return;

    setActionLoadingId(bookId);
    try {
      await libraryApi.deleteBook(bookId);
      setNotification({
        type: "success",
        message: `Le livre "${title}" a été archivé.`,
      });
      await loadBooks();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur lors de la suppression.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestoreBook = async (bookId: string, title: string) => {
    setActionLoadingId(bookId);
    try {
      await libraryApi.restoreBook(bookId);
      setNotification({ type: "success", message: `Le livre "${title}" a été restauré.` });
      await loadBooks();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur lors de la restauration.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDestroyBook = async (bookId: string, title: string) => {
    if (!confirm(`Détruire définitivement le livre "${title}" ?`)) return;

    setActionLoadingId(bookId);
    try {
      await libraryApi.destroyBook(bookId);
      setNotification({ type: "success", message: `Le livre "${title}" a été détruit définitivement.` });
      await loadBooks();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur lors de la destruction.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const selectBookForBorrow = (bookId: string) => {
    setBorrowForm((prev) => ({ ...prev, bookId }));
    const formEl = document.getElementById("form-borrow-card");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Filtered books
  const visibleBooks = catalogueView === "active" ? books : archivedBooks;
  const filteredBooks = useMemo(() => {
    return visibleBooks.filter((book) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.isbn.toLowerCase().includes(q) ||
        (book.borrowed_by && book.borrowed_by.toLowerCase().includes(q));

      const matchesStatus = catalogueView === "archived"
        ? true
        : statusFilter === "all" ? true : book.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [visibleBooks, searchQuery, statusFilter, catalogueView]);

  const availableBooks = books.filter((b) => b.status === "available");
  const borrowedBooks = books.filter((b) => b.status === "borrowed");

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans antialiased selection:bg-stone-900 selection:text-white pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#fafaf9]/90 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-stone-900 flex items-center justify-center text-white shadow-xs">
              <IconBook className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-stone-900">
                  BIBLIO
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                  Catalogue
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-normal leading-none mt-0.5">
                Gestion des livres et suivi des emprunts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-medium text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Base connectée
            </div>
            <button
              onClick={loadBooks}
              disabled={loading}
              title="Rafraîchir les livres"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 active:bg-stone-200 border border-stone-200 rounded-lg shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <IconRefresh className={`w-3.5 h-3.5 text-stone-600 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {/* Toast / Notification */}
        {notification && (
          <div
            role="alert"
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-xs transition-all shadow-xs ${
              notification.type === "success"
                ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
                : "bg-rose-50/90 border-rose-200 text-rose-950"
            }`}
          >
            <div className="flex items-center gap-3">
              {notification.type === "success" ? (
                <div className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <IconCheckCircle className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="h-6 w-6 rounded-md bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                  <IconAlertCircle className="w-3.5 h-3.5" />
                </div>
              )}
              <p className="font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-md transition-colors"
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Minimalist Key Stats Bar */}
        <section className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
            {/* Stat 1: Total */}
            <div className="px-2 sm:px-4 py-2 sm:py-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Total des livres
                </span>
                <IconBookOpen className="w-4 h-4 text-stone-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-stone-900">{books.length}</span>
                <span className="text-xs text-stone-500">dans le catalogue</span>
              </div>
            </div>

            {/* Stat 2: Disponibles */}
            <div className="px-2 sm:px-4 py-2 sm:py-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Livres disponibles
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-emerald-800">{availableBooks.length}</span>
                <span className="text-xs text-emerald-700/80">en rayon</span>
              </div>
            </div>

            {/* Stat 3: En prêt */}
            <div className="px-2 sm:px-4 py-2 sm:py-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
                  Livres en prêt
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-amber-900">{borrowedBooks.length}</span>
                <span className="text-xs text-amber-800/80">chez les adhérents</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dual Actions Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Card 1: Add Book */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="h-7 w-7 rounded-md bg-stone-100 text-stone-800 flex items-center justify-center">
                  <IconPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">Ajouter un livre</h2>
                  <p className="text-xs text-stone-500">Enregistrer une nouvelle référence dans le catalogue</p>
                </div>
              </div>

              <form id="form-create" onSubmit={handleCreateBook} className="space-y-4 mt-5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Titre du livre <span className="text-stone-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="Ex: Le Petit Prince"
                    className="w-full h-10 px-3.5 rounded-xl bg-stone-50/70 text-stone-900 text-xs border border-stone-200 focus:bg-white focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 placeholder:text-stone-400 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Auteur <span className="text-stone-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.author}
                      onChange={(e) => setCreateForm({ ...createForm, author: e.target.value })}
                      placeholder="Ex: Antoine de Saint-Exupéry"
                      className="w-full h-10 px-3.5 rounded-xl bg-stone-50/70 text-stone-900 text-xs border border-stone-200 focus:bg-white focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 placeholder:text-stone-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      ISBN <span className="text-stone-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.isbn}
                      onChange={(e) => setCreateForm({ ...createForm, isbn: e.target.value })}
                      placeholder="Ex: 978-2070612758"
                      className="w-full h-10 px-3.5 rounded-xl bg-stone-50/70 text-stone-900 text-xs font-mono border border-stone-200 focus:bg-white focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 placeholder:text-stone-400 transition-all"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100">
              <button
                type="submit"
                form="form-create"
                disabled={submittingCreate}
                className="w-full h-10 bg-stone-900 hover:bg-stone-800 active:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {submittingCreate ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <IconPlus className="w-4 h-4" />
                )}
                <span>Ajouter ce livre au catalogue</span>
              </button>
            </div>
          </div>

          {/* Card 2: Loan Registration */}
          <div id="form-borrow-card" className="bg-white rounded-2xl border border-stone-200/90 p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="h-7 w-7 rounded-md bg-stone-100 text-stone-800 flex items-center justify-center">
                  <IconUser className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">Enregistrer un emprunt</h2>
                  <p className="text-xs text-stone-500">Prêter un livre disponible à un adhérent</p>
                </div>
              </div>

              <form id="form-borrow" onSubmit={handleBorrowBook} className="space-y-4 mt-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-stone-700">
                      Livre à prêter <span className="text-stone-400">*</span>
                    </label>
                    <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {availableBooks.length} disponible{availableBooks.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <select
                    required
                    value={borrowForm.bookId}
                    onChange={(e) => setBorrowForm({ ...borrowForm, bookId: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-stone-50/70 text-stone-900 text-xs border border-stone-200 focus:bg-white focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all cursor-pointer"
                  >
                    <option value="" className="text-stone-400">
                      {availableBooks.length === 0
                        ? "Aucun livre disponible actuellement"
                        : `-- Choisir un livre disponible (${availableBooks.length}) --`}
                    </option>
                    {availableBooks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} — {b.author}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Nom de l&apos;adhérent <span className="text-stone-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={borrowForm.borrowerName}
                    onChange={(e) => setBorrowForm({ ...borrowForm, borrowerName: e.target.value })}
                    placeholder="Ex: Alice Dupont"
                    className="w-full h-10 px-3.5 rounded-xl bg-stone-50/70 text-stone-900 text-xs border border-stone-200 focus:bg-white focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 placeholder:text-stone-400 transition-all"
                  />
                </div>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100">
              <button
                type="submit"
                form="form-borrow"
                disabled={submittingBorrow || availableBooks.length === 0}
                className="w-full h-10 bg-stone-900 hover:bg-stone-800 active:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {submittingBorrow ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <IconUser className="w-4 h-4" />
                )}
                <span>Valider le prêt du livre</span>
              </button>
            </div>
          </div>
        </section>

        {/* Catalogue Explorer Section */}
        <section className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900">
                  {catalogueView === "active" ? "Catalogue des livres" : "Livres archivés"}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 font-mono text-stone-600 border border-stone-200/70">
                  {filteredBooks.length} livre{filteredBooks.length > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Recherchez parmi vos titres et gérez les flux de prêt et de retour
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/80">
                <button
                  onClick={() => setCatalogueView("active")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    catalogueView === "active" ? "bg-white text-stone-900 shadow-2xs" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Actifs ({books.length})
                </button>
                <button
                  onClick={() => setCatalogueView("archived")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    catalogueView === "archived" ? "bg-white text-stone-900 shadow-2xs" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Archives ({archivedBooks.length})
                </button>
              </div>

              {/* Segmented Filter Pills */}
              {catalogueView === "active" && <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/80">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-white text-stone-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Tous ({books.length})
                </button>
                <button
                  onClick={() => setStatusFilter("available")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === "available"
                      ? "bg-white text-emerald-800 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Disponibles ({availableBooks.length})
                </button>
                <button
                  onClick={() => setStatusFilter("borrowed")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === "borrowed"
                      ? "bg-white text-amber-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  En prêt ({borrowedBooks.length})
                </button>
              </div>}

              {/* Search Bar */}
              <div className="relative min-w-60">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher titre, auteur, ISBN, adhérent..."
                  className="w-full h-9 pl-9 pr-8 rounded-xl bg-stone-50/80 text-stone-900 text-xs border border-stone-200 focus:bg-white focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 placeholder:text-stone-400 transition-all"
                />
                <IconSearch className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 p-0.5 text-stone-400 hover:text-stone-700 rounded"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="pt-6">
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block w-6 h-6 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-medium text-stone-500">Chargement des livres...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                <div className="h-10 w-10 mx-auto rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mb-3">
                  <IconBook className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-stone-800">Aucun livre trouvé</p>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== "all"
                    ? "Aucun résultat ne correspond à vos filtres de recherche."
                    : "Votre catalogue est vide. Ajoutez votre premier livre avec le formulaire ci-dessus."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredBooks.map((book) => {
                  const isAvailable = book.status === "available";
                  const isProcessing = actionLoadingId === book.id;

                  return (
                    <article
                      key={book.id}
                      className="group relative flex flex-col justify-between rounded-2xl p-5 bg-white border border-stone-200/90 hover:border-stone-400/80 transition-all duration-150 shadow-2xs hover:shadow-xs"
                    >
                      <div>
                        {/* Status Badge & Delete Action */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                              isAvailable
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                                : "bg-amber-50 text-amber-900 border border-amber-200/80"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isAvailable ? "bg-emerald-600" : "bg-amber-600"
                              }`}
                            ></span>
                            {isAvailable ? "Disponible" : "Emprunté"}
                          </span>

                          <button
                            onClick={() => catalogueView === "active"
                              ? handleDeleteBook(book.id, book.title)
                              : handleDestroyBook(book.id, book.title)}
                            disabled={isProcessing}
                            title={catalogueView === "active" ? "Archiver ce livre" : "Détruire définitivement ce livre"}
                            className="text-stone-300 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                          >
                            {catalogueView === "active" ? <IconTrash className="w-4 h-4" /> : <IconTrash className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Title & Author */}
                        <h3 className="text-sm font-bold text-stone-900 leading-snug line-clamp-1">
                          {book.title}
                        </h3>
                        <p className="text-xs text-stone-600 font-medium mt-0.5">
                          {book.author}
                        </p>

                        {/* ISBN & Meta info */}
                        <div className="mt-3.5 pt-3 border-t border-stone-100 space-y-2">
                          <div className="flex items-center gap-1.5 text-stone-500">
                            <IconTag className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="font-mono text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200/60">
                              {book.isbn}
                            </span>
                          </div>

                          {/* Reader info if borrowed */}
                          {!isAvailable && book.borrowed_by && (
                            <div className="mt-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-stone-800 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <IconUser className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                                <span className="text-xs font-semibold truncate">
                                  Emprunté par : {book.borrowed_by}
                                </span>
                              </div>
                              {book.borrow_date && (
                                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 pl-5.5">
                                  <IconClock className="w-3 h-3 text-stone-400 shrink-0" />
                                  <span>
                                    Le{" "}
                                    {new Date(book.borrow_date).toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-5 pt-3.5 border-t border-stone-100">
                        {catalogueView === "archived" ? (
                          <button
                            onClick={() => handleRestoreBook(book.id, book.title)}
                            disabled={isProcessing}
                            className="w-full h-9 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {isProcessing ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IconRefresh className="w-3.5 h-3.5" />}
                            <span>Restaurer le livre</span>
                          </button>
                        ) : isAvailable ? (
                          <button
                            onClick={() => selectBookForBorrow(book.id)}
                            className="w-full h-9 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 hover:border-stone-400 text-xs font-semibold rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                          >
                            <IconUser className="w-3.5 h-3.5 text-stone-500" />
                            <span>Emprunter ce livre</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReturnBook(book.id, book.title)}
                            disabled={isProcessing}
                            className="w-full h-9 bg-stone-900 hover:bg-stone-800 active:bg-black text-white text-xs font-semibold rounded-xl shadow-2xs transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                          >
                            {isProcessing ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                              <IconArrowReturn className="w-3.5 h-3.5" />
                            )}
                            <span>Restituer le livre</span>
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}


