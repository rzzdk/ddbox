import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronLeft, Play } from "lucide-react";

const API_BASE = "https://dramabox.sansekai.my.id/api";

interface EpisodeItem {
  id: string | number;
  title: string;
  videoUrl: string;
  index: number;
}

interface DramaMeta {
  title: string;
}

const mapEpisodeResponse = (data: any): { episodes: EpisodeItem[]; meta: DramaMeta } => {
  console.log("[DramaBox] Allepisode raw response:", data);

  // Beberapa API terkadang langsung mengembalikan array episode,
  // atau membungkusnya dalam field data/episodeList.
  const rawList: any[] =
    (Array.isArray(data?.episodeList) && data.episodeList) ||
    (Array.isArray(data?.data) && data.data) ||
    (Array.isArray(data) && data) ||
    [];

  const episodes: EpisodeItem[] = rawList.map((item: any, idx: number) => {
    const id = item.episodeId ?? item.id ?? idx;
    const title = item.title ?? item.episodeTitle ?? `Episode ${idx + 1}`;

    const videoUrl =
      item.videoUrl ??
      item.playUrl ??
      item.audioUrl ??
      item.url ??
      "";

    return {
      id,
      title,
      videoUrl,
      index: idx,
    };
  });

  const meta: DramaMeta = {
    title: data?.bookName ?? data?.title ?? "DramaBox",
  };

  return { episodes, meta };
};

const fetchEpisodes = async (bookId: string) => {
  const url = `${API_BASE}/dramabox/allepisode?bookId=${encodeURIComponent(bookId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Gagal memuat episode");
  }
  const data = await res.json();
  return mapEpisodeResponse(data);
};

const Watch = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | number | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["episodes", bookId],
    queryFn: () => fetchEpisodes(bookId || ""),
    enabled: Boolean(bookId),
  });

  const episodes = data?.episodes ?? [];
  const meta = data?.meta ?? { title: "Drama" };

  useEffect(() => {
    if (episodes.length > 0 && currentEpisodeId == null) {
      setCurrentEpisodeId(episodes[0].id);
    }
  }, [episodes, currentEpisodeId]);

  const currentEpisode = episodes.find((e) => e.id === currentEpisodeId) ?? episodes[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header minimal */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-3 px-4">
          <Link
            to="/"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground hover:text-primary hover:border-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              DramaBox Free
            </span>
            <h1 className="truncate text-sm font-medium">{meta.title}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-6 pt-4">
        {isLoading && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-border border-t-primary">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Memuat episode...</p>
              <p className="text-xs text-muted-foreground">
                Proses ini bisa memakan waktu beberapa detik tergantung jumlah episode.
              </p>
            </div>
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Gagal memuat data episode. Server mungkin sedang sibuk.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-105"
            >
              <Loader2 className="h-4 w-4" />
              Coba lagi
            </button>
          </div>
        )}

        {!isLoading && !isError && episodes.length > 0 && (
          <>
            {/* Video player */}
            <section aria-label="Pemutar video" className="space-y-3">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
                {currentEpisode?.videoUrl ? (
                  <video
                    key={currentEpisode.id}
                    controls
                    className="w-full aspect-video bg-black"
                    src={currentEpisode.videoUrl}
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
                    Sumber video tidak tersedia.
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary mb-1">
                  Sedang diputar
                </p>
                <h2 className="text-base font-semibold leading-snug">
                  {meta.title}
                  {currentEpisode && ` · ${currentEpisode.title}`}
                </h2>
              </div>
            </section>

            {/* Episode list */}
            <section aria-label="Daftar episode" className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Daftar episode</h3>
                <span className="text-xs text-muted-foreground">{episodes.length} episode</span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {episodes.map((ep) => {
                  const isActive = ep.id === currentEpisode?.id;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => setCurrentEpisodeId(ep.id)}
                      className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card/80 text-foreground hover:border-primary/70 hover:bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isActive && <Play className="h-3 w-3" />}
                        <span className="font-semibold">Ep {ep.index + 1}</span>
                      </div>
                      <span className="line-clamp-2 text-[11px] text-muted-foreground">
                        {ep.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {!isLoading && !isError && episodes.length === 0 && (
          <div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Episode tidak ditemukan untuk drama ini.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Watch;
