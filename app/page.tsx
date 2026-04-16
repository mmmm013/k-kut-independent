"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Purpose =
  | "send"
  | "express"
  | "feel"
  | "explore"
  | "";

type FormatType = "mk" | "kkut";

type SentimentKey =
  | "love"
  | "apology"
  | "gratitude"
  | "energy"
  | "hurt"
  | "hope"
  | "peace";

type PreviewItem = {
  id: string;
  title: string;
  artist: string;
  sentiment: SentimentKey;
  purposeTags: Purpose[];
  format: FormatType;
  durationLabel: string;
  confidenceHint: string;
  description: string;
  previewUrl: string;
  messengerFit: string[];
  isPromoSafe: boolean; // mKs only for promos
};

const previewCatalog: PreviewItem[] = [
  {
    id: "mk-love-renews-01",
    title: "Love Renews",
    artist: "KLEIGH",
    sentiment: "love",
    purposeTags: ["send", "express", "feel"],
    format: "mk",
    durationLabel: "0:18",
    confidenceHint: "warm, romantic, hopeful",
    description: "A gentle first taste for love-led sharing.",
    previewUrl: "/pix/kleigh--solace.mp3",
    messengerFit: ["text", "DM", "email"],
    isPromoSafe: true,
  },
  {
    id: "mk-heart-tap-01",
    title: "Heart Tap",
    artist: "KLEIGH",
    sentiment: "love",
    purposeTags: ["send", "express", "explore"],
    format: "mk",
    durationLabel: "0:16",
    confidenceHint: "playful, direct, modern",
    description: "A bright emotional hook with instant clarity.",
    previewUrl: "/pix/perfect-day.mp3",
    messengerFit: ["text", "story", "share link"],
    isPromoSafe: true,
  },
  {
    id: "mk-thank-you-01",
    title: "Steady Thanks",
    artist: "G Putnam Music",
    sentiment: "gratitude",
    purposeTags: ["send", "express"],
    format: "mk",
    durationLabel: "0:20",
    confidenceHint: "sincere, grounded, mature",
    description: "Short, respectful gratitude that feels real.",
    previewUrl: "/pix/wanna-know-you.mp3",
    messengerFit: ["text", "email", "gift"],
    isPromoSafe: true,
  },
  {
    id: "mk-apology-01",
    title: "Open Hands",
    artist: "G Putnam Music",
    sentiment: "apology",
    purposeTags: ["send", "express"],
    format: "mk",
    durationLabel: "0:19",
    confidenceHint: "humble, clear, restorative",
    description: "For when words alone are not enough.",
    previewUrl: "/pix/jump.mp3",
    messengerFit: ["text", "private link", "email"],
    isPromoSafe: true,
  },
  {
    id: "mk-energy-01",
    title: "High Energy",
    artist: "G Putnam Music",
    sentiment: "energy",
    purposeTags: ["feel", "explore", "send"],
    format: "mk",
    durationLabel: "0:17",
    confidenceHint: "bold, high-drive, fun",
    description: "A strong pulse for hype, momentum, or celebration.",
    previewUrl: "/pix/kleigh--waterfall.mp3",
    messengerFit: ["story", "group text", "link"],
    isPromoSafe: true,
  },
  {
    id: "mk-hurt-01",
    title: "Wounded & Willing",
    artist: "G Putnam Music",
    sentiment: "hurt",
    purposeTags: ["express", "feel", "send"],
    format: "mk",
    durationLabel: "0:21",
    confidenceHint: "hurt, honest, still open",
    description: "Pain with dignity and emotional truth.",
    previewUrl: "/pix/kleigh--nightfall.mp3",
    messengerFit: ["private link", "email", "text"],
    isPromoSafe: true,
  },
  {
    id: "mk-peace-01",
    title: "Melancholy Blues",
    artist: "G Putnam Music",
    sentiment: "peace",
    purposeTags: ["feel", "explore"],
    format: "mk",
    durationLabel: "0:19",
    confidenceHint: "soft, reflective, calming",
    description: "A quiet, inward emotional place.",
    previewUrl: "/pix/kleigh--solace.mp3",
    messengerFit: ["self-use", "private link"],
    isPromoSafe: true,
  },
  {
    id: "kkut-love-01",
    title: "K-KUT · Love Renews",
    artist: "KLEIGH",
    sentiment: "love",
    purposeTags: ["send", "express", "feel"],
    format: "kkut",
    durationLabel: "0:43",
    confidenceHint: "the fullest romantic section",
    description: "Longer exact-audio K-KUT for a fully delivered feeling.",
    previewUrl: "/pix/perfect-day.mp3",
    messengerFit: ["private link", "gift"],
    isPromoSafe: false,
  },
  {
    id: "kkut-apology-01",
    title: "K-KUT · Open Hands",
    artist: "G Putnam Music",
    sentiment: "apology",
    purposeTags: ["send", "express"],
    format: "kkut",
    durationLabel: "0:46",
    confidenceHint: "heavier sincerity, more emotional room",
    description: "A longer exact-audio section for meaningful repair.",
    previewUrl: "/pix/jump.mp3",
    messengerFit: ["private link", "email"],
    isPromoSafe: false,
  },
  {
    id: "kkut-hurt-01",
    title: "K-KUT · Wounded & Willing",
    artist: "G Putnam Music",
    sentiment: "hurt",
    purposeTags: ["feel", "express", "send"],
    format: "kkut",
    durationLabel: "0:48",
    confidenceHint: "deep honesty, serious feeling",
    description: "A longer K-KUT when the user needs something real.",
    previewUrl: "/pix/kleigh--nightfall.mp3",
    messengerFit: ["private link", "gift"],
    isPromoSafe: false,
  },
];

const sentimentMeta: Record<
  SentimentKey,
  { label: string; blurb: string; bbLine: string }
> = {
  love: {
    label: "Love",
    blurb: "For romance, care, closeness, and heart-led connection.",
    bbLine: "BB hears love here. Let’s start with warmth and sincerity.",
  },
  apology: {
    label: "Apology",
    blurb: "For repair, accountability, humility, and healing.",
    bbLine: "BB hears repair here. Let’s be direct, careful, and human.",
  },
  gratitude: {
    label: "Gratitude",
    blurb: "For thanks, honor, appreciation, and respect.",
    bbLine: "BB hears appreciation here. Let’s make it real, not generic.",
  },
  energy: {
    label: "Energy",
    blurb: "For celebration, hype, momentum, and spark.",
    bbLine: "BB hears lift and motion. Let’s make it vivid and fun.",
  },
  hurt: {
    label: "Hurt",
    blurb: "For pain, honesty, longing, and emotional truth.",
    bbLine: "BB hears hurt. Let’s be gentle, accurate, and brave.",
  },
  hope: {
    label: "Hope",
    blurb: "For forward motion, lift, and emotional light.",
    bbLine: "BB hears hope. Let’s build toward possibility.",
  },
  peace: {
    label: "Peace",
    blurb: "For reflection, quiet, and inward calm.",
    bbLine: "BB hears stillness. Let’s keep this grounded and clear.",
  },
};

const purposeMeta: Record<
  Exclude<Purpose, "">,
  { label: string; blurb: string }
> = {
  send: {
    label: "Send to someone",
    blurb: "You want to deliver a feeling to another human.",
  },
  express: {
    label: "Express something I can’t say",
    blurb: "You know the feeling but words are failing you.",
  },
  feel: {
    label: "Just feel something",
    blurb: "You’re here for the experience itself.",
  },
  explore: {
    label: "Explore",
    blurb: "You want BB to help you discover what fits.",
  },
};

export default function KKutPage() {
  const [sentiment, setSentiment] = useState<SentimentKey | null>(null);
  const [purpose, setPurpose] = useState<Purpose>("");
  const [selectedFormat, setSelectedFormat] = useState<FormatType | null>(null);
  const [selectedMessenger, setSelectedMessenger] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PreviewItem | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [firstFreeMode, setFirstFreeMode] = useState(false);
  const [promiseChecked, setPromiseChecked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [audioNow, setAudioNow] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    if (!audioNow) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      return;
    }
    audioRef.current.src = audioNow;
    void audioRef.current.play().catch(() => {});
  }, [audioNow]);

  const mkPromos = useMemo(() => {
    if (!sentiment) return [];
    return previewCatalog.filter(
      (item) => item.sentiment === sentiment && item.format === "mk" && item.isPromoSafe
    );
  }, [sentiment]);

  const recommendationPool = useMemo(() => {
    if (!sentiment || !purpose) return [];
    let pool = previewCatalog.filter(
      (item) =>
        item.sentiment === sentiment &&
        item.purposeTags.includes(purpose)
    );

    if (selectedFormat) {
      pool = pool.filter((item) => item.format === selectedFormat);
    }

    if (selectedMessenger) {
      pool = pool.filter((item) => item.messengerFit.includes(selectedMessenger));
    }

    const sorted = [...pool].sort((a, b) => {
      const aDur = parseDuration(a.durationLabel);
      const bDur = parseDuration(b.durationLabel);
      return bDur - aDur; // longest duration first
    });

    return sorted;
  }, [sentiment, purpose, selectedFormat, selectedMessenger]);

  const groupedFive = useMemo(() => {
    const start = pageIndex * 5;
    return recommendationPool.slice(start, start + 5);
  }, [recommendationPool, pageIndex]);

  const hasMore = useMemo(() => {
    return (pageIndex + 1) * 5 < recommendationPool.length;
  }, [pageIndex, recommendationPool.length]);

  const bbIntro = useMemo(() => {
    if (!sentiment) {
      return "BB is ready. Start with a feeling and hear mini-KUT examples first.";
    }
    if (!purpose) {
      return `${sentimentMeta[sentiment].bbLine} What are you trying to do with this feeling?`;
    }
    if (!selectedFormat) {
      return "You’ve got a feeling and a purpose. Now choose your path: K-KUT or mini-KUT.";
    }
    if (!selectedMessenger) {
      return "Who is carrying this feeling: text, email, private link, story, or gift?";
    }
    if (!selectedItem) {
      return "Here are five narrowed options. I put the longest-fitting duration first.";
    }
    return "Now let’s make sure you feel confident before purchase.";
  }, [purpose, selectedFormat, selectedItem, selectedMessenger, sentiment]);

  function resetAfterSentiment(nextSentiment: SentimentKey) {
    setSentiment(nextSentiment);
    setPurpose("");
    setSelectedFormat(null);
    setSelectedMessenger(null);
    setSelectedItem(null);
    setPageIndex(0);
    setFirstFreeMode(false);
    setPromiseChecked(false);
    setUserEmail("");
  }

  function choosePurpose(nextPurpose: Purpose) {
    setPurpose(nextPurpose);
    setSelectedFormat(null);
    setSelectedMessenger(null);
    setSelectedItem(null);
    setPageIndex(0);
    setFirstFreeMode(false);
  }

  function chooseFormat(nextFormat: FormatType) {
    setSelectedFormat(nextFormat);
    setSelectedMessenger(null);
    setSelectedItem(null);
    setPageIndex(0);
    setFirstFreeMode(false);
  }

  function chooseMessenger(messenger: string) {
    setSelectedMessenger(messenger);
    setSelectedItem(null);
    setPageIndex(0);
    setFirstFreeMode(false);
  }

  function chooseItem(item: PreviewItem) {
    setSelectedItem(item);
    setFirstFreeMode(false);
    setAudioNow(item.previewUrl);
  }

  function nextFive() {
    if (hasMore) setPageIndex((p) => p + 1);
  }

  function useFirstFree() {
    setFirstFreeMode(true);
  }

  function startCheckout() {
    if (!selectedItem) return;
    window.location.href = `/api/checkout/sovereign?item=${encodeURIComponent(
      selectedItem.id
    )}&format=${encodeURIComponent(selectedItem.format)}`;
  }

  function submitFirstFree() {
    if (!selectedItem || !promiseChecked || !userEmail.trim()) return;
    alert(
      `First one free recorded for ${selectedItem.title}. Follow up cadence: 3 touches in 3 weeks to ${userEmail}.`
    );
  }

  return (
    <main className="min-h-screen bg-[#120d08] text-[#f7f0e4]">
      <audio ref={audioRef} hidden />

      <section className="border-b border-[#3d2a19] bg-[radial-gradient(circle_at_top,#2c1a10_0%,#120d08_55%)]">
        <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-16">
          <div className="mb-4 inline-flex rounded-full border border-[#7c4b25] bg-[#2d1b11] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f3b06b]">
            Inventions First · K-KUT · mini-KUT · K-UpId
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight text-[#fff3e2] md:text-6xl">
            Three Never-Before-Done Feeling Inventions
          </h1>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-[#dbc5ad] md:text-2xl">
            Not songs. Not playlists. Not browsing a giant library. BB helps a user
            hear, narrow, trust, and choose the right feeling-delivery invention.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#5b3920] bg-[#1b130d] p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-[#c7925a]">
                Invention 01
              </div>
              <div className="mt-2 text-2xl font-bold text-[#fff3e2]">K-KUT</div>
              <p className="mt-2 text-sm leading-7 text-[#d3bea7]">
                Longer exact-audio section. Best when the user wants a more complete
                emotional delivery.
              </p>
            </div>

            <div className="rounded-2xl border border-[#5b3920] bg-[#1b130d] p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-[#c7925a]">
                Invention 02
              </div>
              <div className="mt-2 text-2xl font-bold text-[#fff3e2]">mini-KUT</div>
              <p className="mt-2 text-sm leading-7 text-[#d3bea7]">
                Short mK tastes for promo, sampling, and first contact. Promo rule:
                mKs only unless admin forces a one-time overlay.
              </p>
            </div>

            <div className="rounded-2xl border border-[#5b3920] bg-[#1b130d] p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-[#c7925a]">
                Invention 03
              </div>
              <div className="mt-2 text-2xl font-bold text-[#fff3e2]">K-UpId</div>
              <p className="mt-2 text-sm leading-7 text-[#d3bea7]">
                Identity and messenger layer. The shareable companion that makes the
                delivered feeling easy to send and remember.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-[#7d5230] bg-[#1a120d]/90 p-5 md:p-7">
            <div className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#f0b16a]">
              BB · Omnipotent Feeling Guide
            </div>
            <div className="text-xl font-semibold text-[#fff1dd] md:text-2xl">
              {bbIntro}
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-[#d1bca3] md:text-base">
              BB keeps this simple for a dull user: hear mKs first, establish
              sentiment and purpose, narrow to five options, confirm confidence,
              then guide purchase.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <StepCard
              number="01"
              title="Hear mini-KUT tastes first"
              active
              complete={!!sentiment}
            >
              <div className="rounded-2xl border border-[#4b301d] bg-[#18110c] p-4 text-[#e8d7c1]">
                Tap a feeling. BB starts with mKs only. That is the promo rule.
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {(
                  Object.keys(sentimentMeta) as SentimentKey[]
                ).map((key) => (
                  <button
                    key={key}
                    onClick={() => resetAfterSentiment(key)}
                    className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                      sentiment === key
                        ? "border-[#e1aa6e] bg-[#3a2415] text-[#fff1dd]"
                        : "border-[#4e3420] bg-[#18110c] text-[#d8c3ab] hover:border-[#7b542f]"
                    }`}
                  >
                    {sentimentMeta[key].label}
                  </button>
                ))}
              </div>

              {sentiment && (
                <div className="mt-6 rounded-2xl border border-[#5d3a20] bg-[#20150e] p-5">
                  <div className="text-lg font-bold text-[#fff1de]">
                    {sentimentMeta[sentiment].label}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[#d8c4ad]">
                    {sentimentMeta[sentiment].blurb}
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {mkPromos.map((item) => (
                      <PreviewCard
                        key={item.id}
                        item={item}
                        selected={selectedItem?.id === item.id}
                        onListen={() => {
                          setAudioNow(item.previewUrl);
                          setSelectedItem(item);
                        }}
                        onChoose={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </StepCard>

            <StepCard
              number="02"
              title="Establish sentiment purpose"
              active={!!sentiment}
              complete={!!purpose}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {(Object.keys(purposeMeta) as Exclude<Purpose, "">[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => choosePurpose(key)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      purpose === key
                        ? "border-[#dba46f] bg-[#352215]"
                        : "border-[#4e3420] bg-[#18110c] hover:border-[#7b542f]"
                    }`}
                  >
                    <div className="text-lg font-bold text-[#fff1dd]">
                      {purposeMeta[key].label}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-[#d5bfa7]">
                      {purposeMeta[key].blurb}
                    </div>
                  </button>
                ))}
              </div>
            </StepCard>

            <StepCard
              number="03"
              title="Choose format and messenger"
              active={!!purpose}
              complete={!!selectedFormat && !!selectedMessenger}
            >
              <div className="rounded-2xl border border-[#4f3420] bg-[#18110c] p-4">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e4ab73]">
                  Format
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button
                    onClick={() => chooseFormat("kkut")}
                    className={`rounded-2xl border p-5 text-left transition ${
                      selectedFormat === "kkut"
                        ? "border-[#dfaa73] bg-[#352215]"
                        : "border-[#4e3420] bg-[#120d08] hover:border-[#7b542f]"
                    }`}
                  >
                    <div className="text-2xl font-bold text-[#fff2de]">K-KUT</div>
                    <p className="mt-2 text-sm leading-6 text-[#d7c1aa]">
                      Longer exact audio. Use the fullest duration that matches the
                      identified sentiment.
                    </p>
                  </button>

                  <button
                    onClick={() => chooseFormat("mk")}
                    className={`rounded-2xl border p-5 text-left transition ${
                      selectedFormat === "mk"
                        ? "border-[#dfaa73] bg-[#352215]"
                        : "border-[#4e3420] bg-[#120d08] hover:border-[#7b542f]"
                    }`}
                  >
                    <div className="text-2xl font-bold text-[#fff2de]">mini-KUT</div>
                    <p className="mt-2 text-sm leading-6 text-[#d7c1aa]">
                      Short taste / hook / phrase option. Ideal for promo, low-friction
                      tryout, and first pass confidence.
                    </p>
                  </button>
                </div>
              </div>

              {selectedFormat && (
                <div className="rounded-2xl border border-[#4f3420] bg-[#18110c] p-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e4ab73]">
                    Messenger fit
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {["text", "DM", "email", "private link", "story", "gift", "self-use"].map(
                      (messenger) => (
                        <button
                          key={messenger}
                          onClick={() => chooseMessenger(messenger)}
                          className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                            selectedMessenger === messenger
                              ? "border-[#e0a86d] bg-[#382315] text-[#fff2de]"
                              : "border-[#4e3420] bg-[#120d08] text-[#dcc8b0] hover:border-[#7b542f]"
                          }`}
                        >
                          {messenger}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </StepCard>

            <StepCard
              number="04"
              title="Five at a time. Narrow with BB."
              active={!!selectedMessenger}
              complete={!!selectedItem}
            >
              {!selectedMessenger ? (
                <p className="text-sm leading-7 text-[#d7c2ab]">
                  BB will show five options at a time once format and messenger are set.
                </p>
              ) : groupedFive.length === 0 ? (
                <p className="text-sm leading-7 text-[#d7c2ab]">
                  No exact matches yet. BB recommends changing messenger or switching
                  format to keep the flow moving.
                </p>
              ) : (
                <>
                  <div className="grid gap-4">
                    {groupedFive.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-5 transition ${
                          selectedItem?.id === item.id
                            ? "border-[#e1ad73] bg-[#342114]"
                            : "border-[#4f3420] bg-[#17100b]"
                        }`}
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="text-xl font-bold text-[#fff2de]">
                              {item.title}
                            </div>
                            <div className="mt-1 text-sm text-[#cfae86]">
                              {item.artist} · {item.durationLabel} · {item.format === "mk" ? "mini-KUT" : "K-KUT"}
                            </div>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#dbc7b0]">
                              {item.description}
                            </p>
                            <div className="mt-3 text-sm font-semibold text-[#f1b26d]">
                              BB read: {item.confidenceHint}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col gap-3">
                            <button
                              onClick={() => setAudioNow(item.previewUrl)}
                              className="rounded-full bg-[#f0b16a] px-5 py-3 font-bold text-[#2c1709] hover:bg-[#ffd3a5]"
                            >
                              Hear Sample
                            </button>
                            <button
                              onClick={() => chooseItem(item)}
                              className="rounded-full border border-[#c98e57] px-5 py-3 font-bold text-[#fff2de] hover:bg-[#2c1b10]"
                            >
                              Choose This One
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {hasMore && (
                      <button
                        onClick={nextFive}
                        className="rounded-full border border-[#c88c54] px-5 py-3 font-semibold text-[#fff0db] hover:bg-[#2b1a10]"
                      >
                        Show 5 More
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedMessenger(null);
                        setSelectedItem(null);
                        setPageIndex(0);
                      }}
                      className="rounded-full border border-[#5a3b22] px-5 py-3 font-semibold text-[#d7c3ab] hover:bg-[#1b120c]"
                    >
                      Not Quite
                    </button>
                  </div>
                </>
              )}
            </StepCard>

            <StepCard
              number="05"
              title="Confidence, free-first path, and purchase"
              active={!!selectedItem}
            >
              {!selectedItem ? (
                <p className="text-sm leading-7 text-[#d7c2ab]">
                  Once the user has a likely match, BB helps confirm confidence before purchase.
                </p>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#4f3420] bg-[#17100b] p-5">
                    <div className="text-sm uppercase tracking-[0.18em] text-[#e2ab74]">
                      BB confidence check
                    </div>
                    <h3 className="mt-2 text-2xl font-bold text-[#fff2de]">
                      Is this perfect for the user?
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[#d8c3ac]">
                      {selectedItem.title} is currently your strongest fit. You can hear it again,
                      choose another five, or continue.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => setAudioNow(selectedItem.previewUrl)}
                        className="rounded-full bg-[#f0b16a] px-5 py-3 font-bold text-[#2d1809]"
                      >
                        Hear It Again
                      </button>
                      <button
                        onClick={() => setPageIndex((p) => p + 1)}
                        className="rounded-full border border-[#c88f59] px-5 py-3 font-bold text-[#fff2de]"
                      >
                        Show 5 More
                      </button>
                      <button
                        onClick={useFirstFree}
                        className="rounded-full border border-[#c88f59] px-5 py-3 font-bold text-[#fff2de]"
                      >
                        First One Free
                      </button>
                      <button
                        onClick={startCheckout}
                        className="rounded-full bg-[#f56d5e] px-5 py-3 font-bold text-white hover:bg-[#ff8578]"
                      >
                        Guide to Purchase
                      </button>
                    </div>
                  </div>

                  {firstFreeMode && (
                    <div className="rounded-2xl border border-[#7b4a24] bg-[#21140d] p-5">
                      <div className="text-lg font-bold text-[#fff2de]">
                        First one free, if they promise to come back
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#d8c4ad]">
                        If a user is leery, BB can offer the first one free, but only with a promise
                        to return. Then follow up 3 times in 3 weeks.
                      </p>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-[#f3b06e]">
                          Email for follow-up
                        </label>
                        <input
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          type="email"
                          placeholder="user@email.com"
                          className="mt-2 w-full rounded-xl border border-[#6c4625] bg-[#120d08] px-4 py-3 text-[#fff2de] outline-none"
                        />
                      </div>

                      <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-[#d8c3ab]">
                        <input
                          type="checkbox"
                          checked={promiseChecked}
                          onChange={(e) => setPromiseChecked(e.target.checked)}
                          className="mt-1"
                        />
                        They promise to come back, and BB may follow up 3 times across 3 weeks.
                      </label>

                      <button
                        onClick={submitFirstFree}
                        disabled={!promiseChecked || !userEmail.trim()}
                        className="mt-5 rounded-full bg-[#f0b16a] px-5 py-3 font-bold text-[#2d1809] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Confirm First-Free Path
                      </button>
                    </div>
                  )}
                </div>
              )}
            </StepCard>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-[#5a3920] bg-[#18110c] p-6">
              <div className="text-sm uppercase tracking-[0.18em] text-[#e8b174]">
                For the user
              </div>
              <h2 className="mt-2 text-2xl font-bold text-[#fff2de]">
                Simple, friendly, narrow, clear
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[#d7c2aa]">
                <li>1. Hear mini-KUT tastes first.</li>
                <li>2. Establish sentiment and purpose.</li>
                <li>3. Show options in groups of 5.</li>
                <li>4. Narrow gently, like a friend.</li>
                <li>5. Confirm confidence before purchase.</li>
                <li>6. Offer first-free only for leery users with follow-up commitment.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-[#5a3920] bg-[#18110c] p-6">
              <div className="text-sm uppercase tracking-[0.18em] text-[#e8b174]">
                What the user is getting
              </div>
              <div className="mt-4 space-y-4 text-sm leading-7 text-[#d7c2aa]">
                <div className="rounded-2xl border border-[#4c321d] bg-[#130d09] p-4">
                  <div className="font-bold text-[#fff2de]">K-KUT</div>
                  <div>Delivered feeling through longer exact audio.</div>
                </div>
                <div className="rounded-2xl border border-[#4c321d] bg-[#130d09] p-4">
                  <div className="font-bold text-[#fff2de]">mini-KUT</div>
                  <div>Taste, phrase, hook, or emotional entry point.</div>
                </div>
                <div className="rounded-2xl border border-[#4c321d] bg-[#130d09] p-4">
                  <div className="font-bold text-[#fff2de]">K-UpId</div>
                  <div>Messenger identity layer that helps delivery travel well.</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#8f4f2b] bg-[#25160f] p-6">
              <div className="text-sm uppercase tracking-[0.18em] text-[#ffb06e]">
                Admin overlay rule
              </div>
              <div className="mt-3 text-xl font-bold text-[#fff2de]">
                Promo uses mini-KUTs only
              </div>
              <p className="mt-3 text-sm leading-7 text-[#e0c7ad]">
                Unless an admin explicitly scripts a one-time overlay, promo surfaces must use mini-KUTs only.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StepCard({
  number,
  title,
  children,
  active = false,
  complete = false,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  complete?: boolean;
}) {
  return (
    <section
      className={`rounded-3xl border p-6 md:p-8 ${
        active
          ? "border-[#7d5230] bg-[#1a120d]"
          : "border-[#352416] bg-[#120d08]"
      }`}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`text-5xl font-black ${
              active ? "text-[#f0b16a]" : "text-[#4d3624]"
            }`}
          >
            {number}
          </div>
          <div>
            <div className="text-2xl font-bold text-[#fff2de]">{title}</div>
            {complete && (
              <div className="mt-1 text-sm font-semibold text-[#f1b16c]">
                complete
              </div>
            )}
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

function PreviewCard({
  item,
  selected,
  onListen,
  onChoose,
}: {
  item: PreviewItem;
  selected: boolean;
  onListen: () => void;
  onChoose: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        selected
          ? "border-[#e2ad73] bg-[#362214]"
          : "border-[#4d331e] bg-[#17100b]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-bold text-[#fff2de]">{item.title}</div>
          <div className="mt-1 text-sm text-[#d7b189]">
            {item.artist} · {item.durationLabel}
          </div>
        </div>
        <div className="rounded-full border border-[#6d4827] px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#f1b26d]">
          mK
        </div>
      </div>

      <p className="mt-3 text-sm leading-7 text-[#d7c2aa]">{item.description}</p>

      <div className="mt-4 flex gap-3">
        <button
          onClick={onListen}
          className="rounded-full bg-[#f0b16a] px-4 py-2 font-bold text-[#2d1809]"
        >
          Hear
        </button>
        <button
          onClick={onChoose}
          className="rounded-full border border-[#c98e57] px-4 py-2 font-bold text-[#fff2de]"
        >
          Use This
        </button>
      </div>
    </div>
  );
}

function parseDuration(value: string) {
  const [m, s] = value.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
}