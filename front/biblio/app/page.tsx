"use client";

import { useEffect, useState, useMemo } from "react";
import { libraryApi, type Book } from "@/lib/api";
import {
  IconBook,
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

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await libraryApi.listBooks();
      setBooks(data);
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur de chargement des données",
      });
    } finally {
      setLoading(false);
    }
  };

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
        message: `Ouvrage "${newBook.title}" enregistré dans le catalogue.`,
      });
      await loadBooks();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Échec de l'enregistrement de l'ouvrage.",
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
        message: "Sélectionnez un ouvrage et renseignez le nom de l'emprunteur.",
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
        message: `Emprunt validé pour "${updated.title}" au nom de ${updated.borrowed_by}.`,
      });
      await loadBooks();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Échec de la validation de l'emprunt.",
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
        message: `Ouvrage "${title}" restitué et rendu disponible.`,
      });
      await loadBooks();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Impossible d'effectuer la restitution.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Operation 5: Delete a book
  const handleDeleteBook = async (bookId: string, title: string) => {
    if (!confirm(`Confirmer la suppression définitive de l'ouvrage "${title}" ?`)) return;

    setActionLoadingId(bookId);
    try {
      await libraryApi.deleteBook(bookId);
      setNotification({
        type: "success",
        message: `Ouvrage "${title}" supprimé du catalogue.`,
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

  const selectBookForBorrow = (bookId: string) => {
    setBorrowForm((prev) => ({ ...prev, bookId }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.isbn.toLowerCase().includes(q) ||
        (book.borrowed_by && book.borrowed_by.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ? true : book.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [books, searchQuery, statusFilter]);

  const availableBooks = books.filter((b) => b.status === "available");
  const borrowedBooks = books.filter((b) => b.status === "borrowed");

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
              <IconBook className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-900 leading-none">
                Bibliothèque
              </h1>
              <p className="text-[11px] text-zinc-500 font-normal mt-1 leading-none">
                Architecture Hexagonale • FastAPI & Next.js
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100/80 text-[11px] font-medium text-zinc-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              API active
            </div>
            <button
              onClick={loadBooks}
              disabled={loading}
              title="Rafraîchir les données"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
            >
              <IconRefresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Notification Alert */}
        {notification && (
          <div
            role="alert"
            className={`mb-6 p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
              notification.type === "success"
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : "bg-rose-50/70 border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === "success" ? (
                <IconCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <IconAlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <p className="font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Metrics Row */}
        <section className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-xl p-4 border border-zinc-200/80 shadow-2xs">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Ouvrages</p>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900 mt-1">{books.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-zinc-200/80 shadow-2xs">
            <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Disponibles</p>
            <p className="text-2xl font-semibold tracking-tight text-emerald-700 mt-1">{availableBooks.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-zinc-200/80 shadow-2xs">
            <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">En prêt</p>
            <p className="text-2xl font-semibold tracking-tight text-zinc-700 mt-1">{borrowedBooks.length}</p>
          </div>
        </section>

        {/* Operations Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Create Book */}
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <IconPlus className="w-4 h-4 text-zinc-700" />
                <h2 className="text-sm font-semibold text-zinc-900">Enregistrer un ouvrage</h2>
              </div>
              <p className="text-xs text-zinc-500 mb-4">
                Ajoute une nouvelle référence au fonds documentaire.
              </p>

              <form id="form-create" onSubmit={handleCreateBook} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Titre
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="Ex: Le Petit Prince"
                    className="w-full h-9 px-3 rounded-lg bg-white text-zinc-900 text-xs border border-zinc-200 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Auteur
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.author}
                      onChange={(e) => setCreateForm({ ...createForm, author: e.target.value })}
                      placeholder="Ex: Antoine de Saint-Exupéry"
                      className="w-full h-9 px-3 rounded-lg bg-white text-zinc-900 text-xs border border-zinc-200 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      ISBN
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.isbn}
                      onChange={(e) => setCreateForm({ ...createForm, isbn: e.target.value })}
                      placeholder="Ex: 978-2070612758"
                      className="w-full h-9 px-3 rounded-lg bg-white text-zinc-900 text-xs font-mono border border-zinc-200 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400 transition-colors"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100">
              <button
                type="submit"
                form="form-create"
                disabled={submittingCreate}
                className="w-full h-9 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submittingCreate ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <IconPlus className="w-3.5 h-3.5" />
                )}
                <span>Ajouter au catalogue</span>
              </button>
            </div>
          </div>

          {/* Borrow Book */}
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <IconUser className="w-4 h-4 text-zinc-700" />
                <h2 className="text-sm font-semibold text-zinc-900">Enregistrer un emprunt</h2>
              </div>
              <p className="text-xs text-zinc-500 mb-4">
                Assigne un ouvrage disponible à un adhérent.
              </p>

              <form id="form-borrow" onSubmit={handleBorrowBook} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Ouvrage à prêter
                  </label>
                  <select
                    required
                    value={borrowForm.bookId}
                    onChange={(e) => setBorrowForm({ ...borrowForm, bookId: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-white text-zinc-900 text-xs border border-zinc-200 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-colors cursor-pointer"
                  >
                    <option value="" className="text-zinc-400">
                      {availableBooks.length === 0
                        ? "Aucun ouvrage disponible"
                        : `-- Sélectionner parmi les ${availableBooks.length} ouvrage(s) disponible(s) --`}
                    </option>
                    {availableBooks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} — {b.author}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Nom de l'adhérent
                  </label>
                  <input
                    type="text"
                    required
                    value={borrowForm.borrowerName}
                    onChange={(e) => setBorrowForm({ ...borrowForm, borrowerName: e.target.value })}
                    placeholder="Ex: Alice Dupont"
                    className="w-full h-9 px-3 rounded-lg bg-white text-zinc-900 text-xs border border-zinc-200 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400 transition-colors"
                  />
                </div>
              </form>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100">
              <button
                type="submit"
                form="form-borrow"
                disabled={submittingBorrow || availableBooks.length === 0}
                className="w-full h-9 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submittingBorrow ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <IconUser className="w-3.5 h-3.5" />
                )}
                <span>Valider le prêt</span>
              </button>
            </div>
          </div>
        </section>

        {/* Catalogue Section */}
        <section className="bg-white rounded-xl border border-zinc-200/80 shadow-2xs p-5">
          {/* Table Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-100">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Catalogue des fonds</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {filteredBooks.length} ouvrage{filteredBooks.length > 1 ? "s" : ""} répertorié{filteredBooks.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter Tabs */}
              <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 border border-zinc-200/60">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "all"
                      ? "bg-white text-zinc-900 shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Tous ({books.length})
                </button>
                <button
                  onClick={() => setStatusFilter("available")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "available"
                      ? "bg-white text-zinc-900 shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Disponibles ({availableBooks.length})
                </button>
                <button
                  onClick={() => setStatusFilter("borrowed")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "borrowed"
                      ? "bg-white text-zinc-900 shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  En prêt ({borrowedBooks.length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par titre, auteur, ISBN..."
                  className="w-full h-8.5 pl-8 pr-7 rounded-lg bg-white text-zinc-900 text-xs border border-zinc-200 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400 transition-colors"
                />
                <IconSearch className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 p-0.5 text-zinc-400 hover:text-zinc-700"
                  >
                    <IconX className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="pt-5">
            {loading ? (
              <div className="py-16 text-center">
                <div className="inline-block w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs text-zinc-500">Chargement du catalogue...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                <p className="text-xs font-medium text-zinc-700">Aucun ouvrage trouvé</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {searchQuery || statusFilter !== "all"
                    ? "Aucun résultat ne correspond aux filtres actifs."
                    : "Le fonds documentaire est actuellement vide."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBooks.map((book) => {
                  const isAvailable = book.status === "available";
                  const isProcessing = actionLoadingId === book.id;

                  return (
                    <article
                      key={book.id}
                      className="group relative flex flex-col justify-between rounded-xl p-4 bg-white border border-zinc-200/80 hover:border-zinc-300 transition-all shadow-2xs hover:shadow-xs"
                    >
                      <div>
                        {/* Header Badge & Delete */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                              isAvailable
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                                : "bg-zinc-100 text-zinc-700 border border-zinc-200/80"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isAvailable ? "bg-emerald-500" : "bg-zinc-400"
                              }`}
                            ></span>
                            {isAvailable ? "Disponible" : "Prêté"}
                          </span>

                          <button
                            onClick={() => handleDeleteBook(book.id, book.title)}
                            disabled={isProcessing}
                            title="Supprimer la notice"
                            className="text-zinc-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title & Author */}
                        <h3 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-1">
                          {book.title}
                        </h3>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {book.author}
                        </p>

                        {/* Metadata */}
                        <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1.5 text-[11px] text-zinc-500">
                          <div className="flex items-center gap-1.5 font-mono text-zinc-500">
                            <IconTag className="w-3 h-3 text-zinc-400" />
                            <span>{book.isbn}</span>
                          </div>

                          {!isAvailable && book.borrowed_by && (
                            <div className="mt-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-700 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <IconUser className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span className="font-medium truncate">{book.borrowed_by}</span>
                              </div>
                              {book.borrow_date && (
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                  <IconClock className="w-3 h-3 text-zinc-400 shrink-0" />
                                  <span>
                                    {new Date(book.borrow_date).toLocaleDateString("fr-FR", {
                                      day: "2-digit",
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

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-zinc-100">
                        {isAvailable ? (
                          <button
                            onClick={() => selectBookForBorrow(book.id)}
                            className="w-full h-8 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 border border-zinc-200 text-xs font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <IconUser className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Enregistrer le prêt</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReturnBook(book.id, book.title)}
                            disabled={isProcessing}
                            className="w-full h-8 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {isProcessing ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                            ) : (
                              <IconArrowReturn className="w-3.5 h-3.5" />
                            )}
                            <span>Enregistrer le retour</span>
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
