import { Hammer, HardHat, KeyRound, Leaf, PaintRoller, PlugZap, Snowflake, Wrench } from "lucide-react";
import { tradeImages } from "@/lib/mock-data";

export const allTradesLabel = "All trades";
export const allDistrictsLabel = "All districts";
export const allTagsLabel = "All tags";

export const marketplaceCopy = {
  en: {
    nav: { postJob: "Post a job", login: "Login", artisan: "Artisan access" },
    hero: {
      location: "Made in Mauritius",
      eyebrow: "Same-day matching across the island",
      headlineLead: "Get it fixed by a",
      headlineEm: "trusted local pro",
      headlineTail: ".",
      support:
        "Tell us what broke, get matched with verified artisans near you, then chat and book on WhatsApp — no more calling around.",
      ctaPrimary: "Post a job — get matched on WhatsApp",
      ctaSecondary: "How it works",
      chips: ["Verified pros", "WhatsApp-ready", "EN / FR / Morisien", "Same-day"],
      visualBadge: "Verified",
      visualCaption: "Trusted trades, one tap away",
    },
    how: {
      title: "How ArtisanMU works",
      subtitle: "Three simple steps, no phone tag.",
      steps: [
        { title: "Describe the job", desc: "A sentence or two and a photo — that's all we need to start." },
        { title: "Get matched with verified pros", desc: "We notify artisans near you who do exactly that kind of work." },
        { title: "Chat & book on WhatsApp", desc: "Talk directly, agree a time, and get it done — all on WhatsApp." },
      ],
    },
    tradesSection: {
      title: "Popular trades",
      subtitle: "Tap a trade to start a request in seconds.",
    },
    request: {
      eyebrow: "Start here",
      title: "Tell us what you need",
      subtitle: "Post your job once and let verified artisans come to you on WhatsApp. Free to post.",
    },
    why: {
      title: "Why ArtisanMU",
      items: [
        { title: "Verified artisans", desc: "Every pro is identity-checked before they can be matched." },
        { title: "Local to Mauritius", desc: "Built for the island — districts, trades and WhatsApp habits we all know." },
        { title: "No more calling around", desc: "One clean request reaches the right artisans for you." },
        { title: "Free to post", desc: "Posting a job costs nothing. You only deal with pros you choose." },
      ],
    },
    browse: {
      eyebrow: "Browse artisans",
      title: "Verified artisans",
      subtitle: "Filter by trade, area and service. Verified profiles appear first.",
      filters: "Filters",
      quickTitle: "Quick starts",
      filterAction: "Filter results",
      resetAction: "Reset",
      searchPlaceholder: "Leak, wiring, AC, cabinet...",
      fastFirst: "Fast first",
      readyHeading: (n: number) => `${n} ${n === 1 ? "artisan" : "artisans"} ready`,
      sortedEta: "Sorted by ETA",
      verifiedFirst: "Verified first",
      availableNow: (n: number) => `${n} available now`,
      onboarding: "We're onboarding verified artisans across Mauritius",
      fastestEta: (n: number) => `${n} min fastest ETA`,
      etaSoon: "ETA appears when matches are live",
      reviewAfter: "Review your artisan after the job",
      allVerified: "All verified artisans",
      emptyTitle: "Verified artisans are coming online",
      emptyCopy:
        "We're onboarding trusted pros across the island. Post your job now and you'll be matched the moment one comes online.",
      emptyCta: "Post your job",
      view: "View",
      selected: "Selected",
      available: "Available",
      later: "Later today",
      verified: "Verified",
      portfolio: "Portfolio",
      portfolioEmpty: "Portfolio photos will appear here after this artisan uploads verified work.",
      reviews: "Reviews",
      reviewsCount: (n: number) =>
        n
          ? `${n} public reviews recorded. Detailed comments appear once review storage is connected.`
          : "No public reviews yet.",
      availability: "Availability",
      availableToday: (n: number) => `Available today. Estimated response: ${n} min.`,
      notAvailable: "Not marked available right now. You can still prepare a request for later.",
      selectHint: "Send a WhatsApp-ready brief directly to this artisan.",
      whatsapp: "WhatsApp contact",
    },
    faq: {
      title: "Good to know",
      items: [
        { q: "Is it free to post a job?", a: "Yes. Posting a job on ArtisanMU is completely free. You only arrange payment directly with the artisan you choose." },
        { q: "How do artisans reach me?", a: "Your WhatsApp number stays protected. Matched artisans contact you through the app or a protected link once they accept your job." },
        { q: "Are the artisans verified?", a: "Every artisan is identity-checked before they can be matched to a job, and verified profiles are clearly badged." },
        { q: "Which areas do you cover?", a: "All of Mauritius — every district from Port Louis to Rodrigues. Pick the closest area when you post." },
        { q: "What if no one is online yet?", a: "We're still onboarding artisans in some areas. Post your job anyway and we'll match you as soon as a verified pro comes online." },
      ],
    },
    footer: {
      tagline: "Trusted local artisans for every Mauritian home.",
      cols: { product: "Product", company: "Company" },
      links: { post: "Post a job", browse: "Browse artisans", artisan: "Become an artisan", login: "Login" },
      contact: "Contact",
      builtFor: "Built for local service discovery",
    },
    bottomNav: { browse: "Browse", request: "Post job", artisan: "Artisan", login: "Login" },
  },
  fr: {
    nav: { postJob: "Poster un travail", login: "Connexion", artisan: "Espace artisan" },
    hero: {
      location: "Fait a Maurice",
      eyebrow: "Mise en relation le jour meme partout sur l'ile",
      headlineLead: "Faites reparer par un",
      headlineEm: "artisan local de confiance",
      headlineTail: ".",
      support:
        "Dites-nous ce qui ne va pas, soyez mis en relation avec des artisans verifies pres de chez vous, puis discutez et reservez sur WhatsApp.",
      ctaPrimary: "Poster un travail — mise en relation sur WhatsApp",
      ctaSecondary: "Comment ca marche",
      chips: ["Artisans verifies", "Pret pour WhatsApp", "EN / FR / Morisien", "Le jour meme"],
      visualBadge: "Verifie",
      visualCaption: "Des artisans de confiance, en un clic",
    },
    how: {
      title: "Comment fonctionne ArtisanMU",
      subtitle: "Trois etapes simples, sans courir apres le telephone.",
      steps: [
        { title: "Decrivez le travail", desc: "Une ou deux phrases et une photo — c'est tout ce qu'il faut." },
        { title: "Mise en relation avec des pros verifies", desc: "Nous prevenons les artisans proches qui font exactement ce travail." },
        { title: "Discutez et reservez sur WhatsApp", desc: "Parlez directement, fixez un rendez-vous et c'est regle." },
      ],
    },
    tradesSection: {
      title: "Metiers populaires",
      subtitle: "Touchez un metier pour lancer une demande en quelques secondes.",
    },
    request: {
      eyebrow: "Commencez ici",
      title: "Dites-nous ce dont vous avez besoin",
      subtitle: "Postez votre travail une fois et laissez les artisans verifies venir a vous sur WhatsApp. Gratuit.",
    },
    why: {
      title: "Pourquoi ArtisanMU",
      items: [
        { title: "Artisans verifies", desc: "Chaque pro est verifie avant d'etre propose." },
        { title: "Local a Maurice", desc: "Pense pour l'ile — districts, metiers et habitudes WhatsApp que l'on connait." },
        { title: "Fini les appels en boucle", desc: "Une seule demande claire atteint les bons artisans." },
        { title: "Gratuit a poster", desc: "Poster un travail ne coute rien. Vous choisissez les pros." },
      ],
    },
    browse: {
      eyebrow: "Parcourir les artisans",
      title: "Artisans verifies",
      subtitle: "Filtrez par metier, region et service. Les profils verifies apparaissent en premier.",
      filters: "Filtres",
      quickTitle: "Departs rapides",
      filterAction: "Filtrer",
      resetAction: "Reinitialiser",
      searchPlaceholder: "Fuite, electricite, clim, meuble...",
      fastFirst: "Plus rapides",
      readyHeading: (n: number) => `${n} ${n === 1 ? "artisan pret" : "artisans prets"}`,
      sortedEta: "Tries par delai",
      verifiedFirst: "Verifies en premier",
      availableNow: (n: number) => `${n} disponibles`,
      onboarding: "Nous integrons des artisans verifies partout a Maurice",
      fastestEta: (n: number) => `${n} min de delai le plus court`,
      etaSoon: "Le delai s'affiche des qu'il y a des correspondances",
      reviewAfter: "Notez votre artisan apres le travail",
      allVerified: "Tous les artisans verifies",
      emptyTitle: "Les artisans verifies arrivent",
      emptyCopy:
        "Nous integrons des pros de confiance partout sur l'ile. Postez votre travail maintenant et soyez mis en relation des qu'un artisan est en ligne.",
      emptyCta: "Poster votre travail",
      view: "Voir",
      selected: "Selectionne",
      available: "Disponible",
      later: "Plus tard",
      verified: "Verifie",
      portfolio: "Portfolio",
      portfolioEmpty: "Les photos apparaitront ici une fois que l'artisan aura ajoute ses travaux verifies.",
      reviews: "Avis",
      reviewsCount: (n: number) =>
        n
          ? `${n} avis publics enregistres. Les commentaires detailles s'afficheront bientot.`
          : "Pas encore d'avis publics.",
      availability: "Disponibilite",
      availableToday: (n: number) => `Disponible aujourd'hui. Reponse estimee : ${n} min.`,
      notAvailable: "Pas disponible pour le moment. Vous pouvez quand meme preparer une demande.",
      selectHint: "Envoyez une demande prete pour WhatsApp directement a cet artisan.",
      whatsapp: "Contacter sur WhatsApp",
    },
    faq: {
      title: "Bon a savoir",
      items: [
        { q: "Est-ce gratuit de poster un travail ?", a: "Oui. Poster un travail sur ArtisanMU est totalement gratuit. Vous reglez le paiement directement avec l'artisan choisi." },
        { q: "Comment les artisans me contactent ?", a: "Votre numero WhatsApp reste protege. Les artisans vous contactent via l'app ou un lien protege une fois qu'ils acceptent." },
        { q: "Les artisans sont-ils verifies ?", a: "Chaque artisan est verifie avant d'etre propose, et les profils verifies sont clairement identifies." },
        { q: "Quelles regions couvrez-vous ?", a: "Tout Maurice — chaque district, de Port-Louis a Rodrigues. Choisissez la region la plus proche." },
        { q: "Et si personne n'est en ligne ?", a: "Nous integrons encore des artisans dans certaines regions. Postez quand meme et nous vous mettrons en relation des qu'un pro est en ligne." },
      ],
    },
    footer: {
      tagline: "Des artisans locaux de confiance pour chaque foyer mauricien.",
      cols: { product: "Produit", company: "Entreprise" },
      links: { post: "Poster un travail", browse: "Parcourir les artisans", artisan: "Devenir artisan", login: "Connexion" },
      contact: "Contact",
      builtFor: "Concu pour la recherche de services locaux",
    },
    bottomNav: { browse: "Artisans", request: "Poster", artisan: "Artisan", login: "Connexion" },
  },
  mfe: {
    nav: { postJob: "Poste enn travay", login: "Konekte", artisan: "Espas artizan" },
    hero: {
      location: "Fer dan Moris",
      eyebrow: "Gagn enn artizan zordi mem partou dan lil",
      headlineLead: "Fer repare par enn",
      headlineEm: "artizan lokal serye",
      headlineTail: ".",
      support:
        "Dir nou ki finn kase, nou met ou an kontak ar bann artizan verifye pre kot ou, apre koz ek rezerv lor WhatsApp.",
      ctaPrimary: "Poste enn travay — kontak lor WhatsApp",
      ctaSecondary: "Kouma sa marse",
      chips: ["Artizan verifye", "Pare pou WhatsApp", "EN / FR / Morisien", "Zordi mem"],
      visualBadge: "Verifye",
      visualCaption: "Bann artizan serye, enn tap lwin",
    },
    how: {
      title: "Kouma ArtisanMU marse",
      subtitle: "Trwa step fasil, pa bizin galoup deryer telefonn.",
      steps: [
        { title: "Dekrir travay-la", desc: "Enn-de fraz ek enn foto — samem tou seki bizin." },
        { title: "Gagn bann pro verifye", desc: "Nou averti bann artizan pre kot ou ki fer sa kalite travay-la." },
        { title: "Koz ek rezerv lor WhatsApp", desc: "Koz direk, fixe enn ler, ek travay fini." },
      ],
    },
    tradesSection: {
      title: "Metie popiler",
      subtitle: "Tap enn metie pou koumans enn demann dan de segonn.",
    },
    request: {
      eyebrow: "Koumans isi",
      title: "Dir nou ki ou bizin",
      subtitle: "Poste ou travay enn sel fwa ek les bann artizan verifye vinn get ou lor WhatsApp. Gratis.",
    },
    why: {
      title: "Kifer ArtisanMU",
      items: [
        { title: "Artizan verifye", desc: "Sak pro verifye avan ki li kapav gagn enn travay." },
        { title: "Lokal pou Moris", desc: "Fer pou lil — distrik, metie ek labitid WhatsApp ki nou tou konn." },
        { title: "Nepli bizin telefonn partou", desc: "Enn sel demann prop ariv kot bann bon artizan." },
        { title: "Gratis pou poste", desc: "Poste enn travay pa kout nanye. Ou swazir bann pro." },
      ],
    },
    browse: {
      eyebrow: "Get bann artizan",
      title: "Artizan verifye",
      subtitle: "Filtre par metie, landrwa ek servis. Bann profil verifye paret avan.",
      filters: "Filtre",
      quickTitle: "Koumans vit",
      filterAction: "Filtre rezilta",
      resetAction: "Reset",
      searchPlaceholder: "Fuit, kouran, klim, plakar...",
      fastFirst: "Pli vit avan",
      readyHeading: (n: number) => `${n} artizan pare`,
      sortedEta: "Trie par dele",
      verifiedFirst: "Verifye avan",
      availableNow: (n: number) => `${n} disponib la`,
      onboarding: "Nou pe azout bann artizan verifye partou dan Moris",
      fastestEta: (n: number) => `${n} min dele pli kourt`,
      etaSoon: "Dele paret kan ena bann korespondans",
      reviewAfter: "Note ou artizan apre travay",
      allVerified: "Tou bann artizan verifye",
      emptyTitle: "Bann artizan verifye pe vini",
      emptyCopy:
        "Nou pe azout bann pro serye partou dan lil. Poste ou travay aster ek nou pou met ou an kontak deswit ki enn pro verifye an liyn.",
      emptyCta: "Poste ou travay",
      view: "Get",
      selected: "Swazir",
      available: "Disponib",
      later: "Plitar",
      verified: "Verifye",
      portfolio: "Portfolio",
      portfolioEmpty: "Bann foto pou paret isi kan artizan-la inn azout so travay verifye.",
      reviews: "Komanter",
      reviewsCount: (n: number) =>
        n
          ? `${n} komanter piblik. Bann detay pou paret biento.`
          : "Pena komanter piblik ankor.",
      availability: "Disponibilite",
      availableToday: (n: number) => `Disponib zordi. Repons estime: ${n} min.`,
      notAvailable: "Pa disponib la. Ou kapav prepar enn demann pou plitar.",
      selectHint: "Avoy enn demann pare pou WhatsApp direk ar sa artizan-la.",
      whatsapp: "Kontak lor WhatsApp",
    },
    faq: {
      title: "Bon pou kone",
      items: [
        { q: "Eski gratis pou poste enn travay?", a: "Wi. Poste enn travay lor ArtisanMU net gratis. Ou aranz peyman direk ar artizan ki ou swazir." },
        { q: "Kouma bann artizan kontak mwa?", a: "Ou nimero WhatsApp res protze. Bann artizan kontak ou via lapp ou enn lien protze enn fwa ki zot aksepte." },
        { q: "Eski bann artizan verifye?", a: "Sak artizan verifye avan ki li kapav gagn enn travay, ek bann profil verifye ena enn badz kler." },
        { q: "Ki landrwa zot kouver?", a: "Tou Moris — sak distrik, depi Port-Louis ziska Rodrig. Swazir landrwa pli pre kan ou poste." },
        { q: "Ki arive si personn pa an liyn?", a: "Nou ankor pe azout bann artizan dan sertin landrwa. Poste kanmem ek nou pou met ou an kontak deswit ki enn pro an liyn." },
      ],
    },
    footer: {
      tagline: "Bann artizan lokal serye pou sak lakaz Morisien.",
      cols: { product: "Prodwi", company: "Konpani" },
      links: { post: "Poste enn travay", browse: "Get bann artizan", artisan: "Vinn enn artizan", login: "Konekte" },
      contact: "Kontak",
      builtFor: "Fer pou trouv servis lokal",
    },
    bottomNav: { browse: "Artizan", request: "Poste", artisan: "Artizan", login: "Konekte" },
  },
};

export type Language = keyof typeof marketplaceCopy;

export const languageOptions: { value: Language; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
  { value: "mfe", label: "Morisien" },
];

export const tabLabels: Record<Language, { home: string; how: string; browse: string }> = {
  en: { home: "Home", how: "How it works", browse: "Browse artisans" },
  fr: { home: "Accueil", how: "Comment ca marche", browse: "Parcourir" },
  mfe: { home: "Akey", how: "Kouma sa marse", browse: "Get artizan" },
};

export const popularTrades: { value: string; icon: typeof Wrench; labels: Record<Language, string> }[] = [
  { value: "Plumber", icon: Wrench, labels: { en: "Plumber", fr: "Plombier", mfe: "Plonbie" } },
  { value: "Electrician", icon: PlugZap, labels: { en: "Electrician", fr: "Electricien", mfe: "Elektrisien" } },
  { value: "Painter", icon: PaintRoller, labels: { en: "Painter", fr: "Peintre", mfe: "Pintur" } },
  { value: "Carpenter", icon: Hammer, labels: { en: "Carpenter", fr: "Menuisier", mfe: "Menwizie" } },
  { value: "Mason", icon: HardHat, labels: { en: "Mason", fr: "Macon", mfe: "Mason" } },
  { value: "AC technician", icon: Snowflake, labels: { en: "AC technician", fr: "Climatisation", mfe: "Klimatizasion" } },
  { value: "Locksmith", icon: KeyRound, labels: { en: "Locksmith", fr: "Serrurier", mfe: "Serurie" } },
  { value: "Gardener", icon: Leaf, labels: { en: "Gardener", fr: "Jardinier", mfe: "Zardinie" } },
];

export const heroStats: { value: number; suffix: string; labels: Record<Language, string> }[] = [
  { value: 8, suffix: "", labels: { en: "Trades", fr: "Metiers", mfe: "Metie" } },
  { value: 9, suffix: "", labels: { en: "Districts", fr: "Districts", mfe: "Distrik" } },
  { value: 100, suffix: "%", labels: { en: "Free to post", fr: "Gratuit", mfe: "Gratis" } },
];

// Illustrative "artisan at work" imagery for the hero (trade photos already
// used by the data layer); decorative only, not real listings.
export const heroShowcase: { trade: string; image: string; tilt: string; float: string; delay: string }[] = [
  { trade: "Plumber", image: tradeImages.Plumber, tilt: "-4deg", float: "animate-float", delay: "" },
  { trade: "Electrician", image: tradeImages.Electrician, tilt: "5deg", float: "animate-float-slow", delay: "anim-delay-2" },
  { trade: "Carpenter", image: tradeImages.Carpenter, tilt: "-3deg", float: "animate-float-soft", delay: "anim-delay-1" },
];

export const quickFilters = [
  { label: "Pipe leak", query: "leak", trade: "Plumber", tag: "Leak repair" },
  { label: "No power", query: "wiring", trade: "Electrician", tag: "No power" },
  { label: "Emergency repair", query: "urgent repair", trade: allTradesLabel, tag: "Emergency repair" },
  { label: "AC service", query: "ac service", trade: "AC technician", tag: "AC service" },
  { label: "Door lock", query: "door lock", trade: "Locksmith", tag: allTagsLabel },
  { label: "Paint room", query: "paint", trade: "Painter", tag: "Renovation" },
];

export const tradeSearchAliases: Record<string, string[]> = {
  Plumber: ["plumber", "plombier", "leak", "fuite", "water", "pipe", "sink", "drain", "robinet"],
  Plombier: ["leak", "fuite", "water", "pipe", "sink", "drain", "robinet"],
  Electrician: ["electrician", "electricien", "wiring", "electric", "power", "light", "prise", "breaker", "circuit"],
  Electricien: ["wiring", "electric", "power", "light", "prise", "breaker", "circuit"],
  Mason: ["mason", "macon", "wall", "concrete", "block", "tiles", "renovation", "repair"],
  Macon: ["wall", "concrete", "block", "tiles", "renovation", "repair"],
  Carpenter: ["carpenter", "menuisier", "cabinet", "cupboard", "door", "wood", "kitchen", "shelf"],
  Menuisier: ["cabinet", "cupboard", "door", "wood", "kitchen", "shelf"],
  "AC technician": ["ac", "aircon", "clim", "split", "cooling", "maintenance"],
  Climatisation: ["ac", "aircon", "clim", "split", "cooling", "maintenance"],
  Painter: ["painter", "peintre", "paint", "painting", "repaint", "wall finish", "color"],
  Peintre: ["paint", "painting", "repaint", "wall finish", "color"],
  Gardener: ["gardener", "jardinier", "garden", "grass", "yard", "tree", "plants", "trim"],
  Jardinier: ["garden", "grass", "yard", "tree", "plants", "trim"],
  Locksmith: ["locksmith", "serrurier", "lock", "key", "door lock", "locked", "security"],
  Serrurier: ["lock", "key", "door lock", "locked", "security"],
};
