import { useEffect, useState } from "react";
import { Play, Search, Star, Home, Film, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

const API_BASE = "https://dramabox.sansekai.my.id/api";

interface DramaItem {
  id: string | number;
  title: string;
  cover: string;
  tags: string[];
}

const mapApiToDramas = (data: any): DramaItem[] => {
  console.log("[DramaBox] API raw response:", data);

  const rawList: any[] =
    (Array.isArray(data?.columnVoList) && data.columnVoList) ||
    (Array.isArray(data?.data) && data.data) ||
    (Array.isArray(data) && data) ||
    [];

  return rawList.map((item: any): DramaItem => {
    const id =
      item.bookId ??
      item.id ??
      (typeof crypto !== "undefined" && (crypto as Crypto).randomUUID?.()) ??
      Math.random().toString(36).slice(2);

    const title = item.title ?? item.bookName ?? "Tanpa Judul";
    const cover = item.cover ?? item.bookCover ?? item.coverWap ?? item.img ?? "";

    const tags: string[] =
      item.tags ??
      item.tagList ??
      item.genres ??
      (typeof item.tag === "string"
        ? item.tag
            .split(/[,/]/)
            .map((t: string) => t.trim())
            .filter(Boolean)
        : []) ??
      [];

    return { id, title, cover, tags };
  });
};

const fetchTrendingDramas = async (): Promise<DramaItem[]> => {
  const res = await fetch(`${API_BASE}/dramabox/trending`);
  if (!res.ok) {
    throw new Error("Gagal mengambil data trending");
  }

  const data = await res.json();
  console.log("[DramaBox] Trending response:", data);
  return mapApiToDramas(data);
};

const fetchSearchDramas = async (query: string): Promise<DramaItem[]> => {
  const url = `${API_BASE}/dramabox/search?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Gagal mencari drama");
  }

  const data = await res.json();
  console.log("[DramaBox] Search response:", data);
  return mapApiToDramas(data);
};

const Index = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce 1000ms: hanya kirim request jika user berhenti mengetik 1 detik
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 1000);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const {
    data: dramas = [],
    isLoading: isTrendingLoading,
    isError: isTrendingError,
  } = useQuery<DramaItem[]>({
    queryKey: ["trendingDramas"],
    queryFn: fetchTrendingDramas,
    staleTime: 1000 * 60 * 10, // 10 menit
  });

  const {
    data: searchResults = [],
    isLoading: isSearchLoading,
    isError: isSearchError,
  } = useQuery<DramaItem[]>({
    queryKey: ["searchDramas", debouncedQuery],
    queryFn: () => fetchSearchDramas(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const featured = dramas[0];

  const showSearchSection = searchInput.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="text-lg font-semibold tracking-tight text-primary">DramaBox</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
              Free
            </span>
          </div>

          {/* Search input bar */}
          <div className="flex flex-1 items-center">
            <div className="flex w-full items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-sm text-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari drama..."
                className="h-6 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground sm:text-sm"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 pb-20 pt-4">
        {/* Search results section */}
        {showSearchSection && (
          <section aria-label="Hasil pencarian" className="space-y-3 rounded-2xl border border-border bg-card/80 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Pencarian</p>
                <h2 className="text-sm font-semibold sm:text-base">
                  Hasil untuk: <span className="text-primary">{searchInput}</span>
                </h2>
              </div>
              {isSearchLoading && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Mencari...
                </div>
              )}
            </div>

            {debouncedQuery.length === 0 && (
              <p className="text-xs text-muted-foreground">Ketik kata kunci dan tunggu sebentar untuk melihat hasil.</p>
            )}

            {debouncedQuery.length > 0 && !isSearchLoading && isSearchError && (
              <p className="text-sm text-muted-foreground">Gagal memuat hasil pencarian. Coba lagi nanti.</p>
            )}

            {debouncedQuery.length > 0 && !isSearchLoading && !isSearchError && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground">Tidak ditemukan.</p>
            )}

            {debouncedQuery.length > 0 && searchResults.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {searchResults.map((drama) => (
                  <Link
                    key={drama.id}
                    to={`/watch/${drama.id}`}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/60 text-left shadow-sm transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden">
                      <img
                        src={drama.cover || "/placeholder.svg"}
                        alt={drama.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />
                    </div>
                    <div className="absolute inset-x-1 bottom-1 flex flex-col gap-1 px-1.5 pb-1.5">
                      <p className="line-clamp-2 text-[11px] font-medium leading-snug text-foreground">
                        {drama.title}
                      </p>
                      <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                        {drama.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-secondary/70 px-1.5 py-0.5 text-[9px] font-medium text-secondary-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Hero: featured drama (tetap dari trending) */}
        <section aria-label="Drama unggulan" className="min-h-[180px]">
          {isTrendingLoading && (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-card/60">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat drama trending...
              </div>
            </div>
          )}

          {isTrendingError && !isTrendingLoading && (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-card/60">
              <p className="text-sm text-muted-foreground">
                Gagal memuat data. Coba beberapa saat lagi.
              </p>
            </div>
          )}

          {!isTrendingLoading && !isTrendingError && featured && (
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img
                  src={featured.cover || "/placeholder.svg"}
                  alt={featured.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 pb-4 sm:pb-6">
                  <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    Drama unggulan
                  </div>
                  <h1 className="max-w-xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                    {featured.title}
                  </h1>
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    {featured.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 pb-1">
                    <Link
                      to={`/watch/${featured.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] sm:flex-none sm:px-5"
                    >
                      <Play className="h-4 w-4 fill-primary-foreground" />
                      Tonton sekarang
                    </Link>
                    <Link
                      to={`/watch/${featured.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-primary hover:text-primary"
                    >
                      <Film className="h-4 w-4" />
                      Detail
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Grid section: trending list di beranda */}
        <section aria-label="Daftar drama" className="space-y-3 pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">Trending sekarang</h2>
            <button
              type="button"
              className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"
            >
              Lihat semua
            </button>
          </div>

          {isTrendingLoading && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/60 animate-pulse"
                >
                  <div className="aspect-[2/3] w-full bg-muted" />
                  <div className="p-2 space-y-2">
                    <div className="h-3 w-3/4 rounded-full bg-muted" />
                    <div className="h-2 w-1/2 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isTrendingLoading && !isTrendingError && dramas.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {dramas.map((drama) => (
                <Link
                  key={drama.id}
                  to={`/watch/${drama.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/60 text-left shadow-sm transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden">
                    <img
                      src={drama.cover || "/placeholder.svg"}
                      alt={drama.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />
                  </div>
                  <div className="absolute inset-x-1 bottom-1 flex flex-col gap-1 px-1.5 pb-1.5">
                    <p className="line-clamp-2 text-[11px] font-medium leading-snug text-foreground">
                      {drama.title}
                    </p>
                    <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                      {drama.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-secondary/70 px-1.5 py-0.5 text-[9px] font-medium text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!isTrendingLoading && !isTrendingError && dramas.length === 0 && (
            <p className="text-sm text-muted-foreground">Tidak ada drama untuk ditampilkan.</p>
          )}
        </section>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-stretch justify-around px-4 py-2.5 text-xs text-muted-foreground">
          <button
            type="button"
            className="flex flex-1 flex-col items-center gap-1 rounded-full bg-secondary/40 px-3 py-1.5 text-[11px] font-medium text-primary transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Beranda</span>
          </button>
          <button
            type="button"
            className="flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Search className="h-4 w-4" />
            <span>Cari</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Index;
