/**
 * API client service for the Library API
 * Communicates with the FastAPI backend on port 8002
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  status: "available" | "borrowed";
  borrowed_by: string | null;
  borrow_date: string | null;
  archived_at: string | null;
}

export interface CreateBookRequest {
  title: string;
  author: string;
  isbn: string;
}

export interface BorrowBookRequest {
  borrower_name: string;
}

export const libraryApi = {
  /**
   * Operation 1: Create a new book
   */
  async createBook(request: CreateBookRequest): Promise<Book> {
    const response = await fetch(`${API_URL}/books`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create book");
    }

    return response.json();
  },

  /**
   * Operation 2: List all books with their status
   */
  async listBooks(): Promise<Book[]> {
    const response = await fetch(`${API_URL}/books`);

    if (!response.ok) {
      throw new Error("Failed to fetch books");
    }

    return response.json();
  },

  /** List archived books for the administrator. */
  async listArchivedBooks(): Promise<Book[]> {
    const response = await fetch(`${API_URL}/books/archived`);
    if (!response.ok) {
      throw new Error("Failed to fetch archived books");
    }
    return response.json();
  },

  /**
   * Operation 3: Borrow a book
   */
  async borrowBook(bookId: string, request: BorrowBookRequest): Promise<Book> {
    const response = await fetch(`${API_URL}/books/${bookId}/borrow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to borrow book");
    }

    return response.json();
  },

  /**
   * Operation 4: Return a borrowed book
   */
  async returnBook(bookId: string): Promise<Book> {
    const response = await fetch(`${API_URL}/books/${bookId}/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to return book");
    }

    return response.json();
  },

  /** Archive a book without deleting it permanently. */
  async deleteBook(bookId: string): Promise<void> {
    const response = await fetch(`${API_URL}/books/${bookId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to delete book" }));
      throw new Error(error.detail || "Failed to archive book");
    }
  },

  /** Restore an archived book. */
  async restoreBook(bookId: string): Promise<void> {
    const response = await fetch(`${API_URL}/books/${bookId}/restore`, {
      method: "POST",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to restore book" }));
      throw new Error(error.detail || "Failed to restore book");
    }
  },

  /** Permanently delete a book. */
  async destroyBook(bookId: string): Promise<void> {
    const response = await fetch(`${API_URL}/books/${bookId}/destroy`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to destroy book" }));
      throw new Error(error.detail || "Failed to destroy book");
    }
  },
};
