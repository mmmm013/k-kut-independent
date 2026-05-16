"use client";

import { use, useEffect, useState } from "react";

type HugResponse = {
  ok?: boolean;
  blocked?: boolean;
  code?: string;
  message?: string;
  audio_url?: string;
  delivery_note?: string;
  remaining_forwards?: number | null;
  delivery_unit_type?: string;
};

export default function HugPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [hug, setHug] = useState<HugResponse | null>(null);

  useEffect(() => {
    let alive = true;

    fetch(`/api/hug/${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (alive) setHug(data);
      })
      .catch((error) => {
        if (alive) {
          setHug({
            ok: false,
            blocked: true,
            code: "CLIENT_FETCH_ERROR",
            message: error?.message || "Unable to load this HUG.",
          });
        }
      });

    return () => {
      alive = false;
    };
  }, [id]);

  if (!hug) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-neutral-100">
        <div className="mx-auto max-w-2xl">Loading...</div>
      </main>
    );
  }

  if (!hug.ok || hug.blocked || !hug.audio_url) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-neutral-100">
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-900/60 bg-neutral-950 p-6">
          <p className="text-sm font-semibold tracking-[0.25em] text-amber-400">
            K-KUT DELIVERY BLOCKED
          </p>

          <h1 className="mt-4 text-3xl font-black text-amber-300">
            This HUG is not available.
          </h1>

          <p className="mt-4 text-neutral-200">
            {hug.message ||
              "This delivery did not pass KUT/mK/LLF authorization."}
          </p>

          {hug.code ? (
            <p className="mt-4 text-xs text-neutral-500">Code: {hug.code}</p>
          ) : null}

          <p className="mt-6 text-sm text-neutral-400">
            K-KUT HUGs may only play approved KUT, mK, or LLF delivery units.
            Full PIX/source playback is blocked.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-neutral-100">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-amber-300">💛 You’ve received a HUG</p>

        <div className="mt-8">
          <audio controls preload="none" src={hug.audio_url} />
        </div>

        <p className="mt-8 text-neutral-200">{hug.delivery_note}</p>

        <p className="mt-2 text-sm text-neutral-400">
          Delivery unit: {hug.delivery_unit_type}
        </p>

        {hug.remaining_forwards !== null &&
        hug.remaining_forwards !== undefined ? (
          <p className="mt-1 text-sm text-neutral-400">
            Remaining forwards: {hug.remaining_forwards}
          </p>
        ) : null}
      </div>
    </main>
  );
}
