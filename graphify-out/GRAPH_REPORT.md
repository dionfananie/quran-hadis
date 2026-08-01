# Graph Report - .  (2026-08-01)

## Corpus Check
- 72 files · ~68,007 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2092 nodes · 2410 edges · 172 communities (38 shown, 134 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Cloudflare Workers Types
- Accordion UI Components
- Abort Signals & Streams
- DOM Events & Custom Events
- Daily Verse & Prayer Cards
- Last Read & Prayer Marquee
- TypeScript Project Config
- App Dependencies
- Search & Button UI
- Build DevDependencies
- Console API
- Stream Compression
- URL & Location APIs
- Design System & Theme Spec
- Tafsir & Surah Selection
- Shadcn Component Config
- Node/Vite Build Config
- MCP Server Config (opencode)
- Dropdown Menu UI
- URLSearchParams API
- Durable Object Storage
- Package Publishing Metadata
- DOM Element API
- Headers API
- Web Crypto API
- App Shell & Navigation
- Theme & Dark Mode
- Blob API
- Body/Request Streams
- TCP Socket Connections
- FormData API
- URLPattern API
- Wrangler Config
- Durable Object State
- Worker Entrypoints
- Select UI Components
- Sheet UI Components
- Data Prep Scripts
- Root TSConfig
- Stream Error Classes
- i18n & Language Context
- Feature Flags API
- R2 Object Storage
- NPM Scripts
- Stream Queuing Strategies
- Digest & Writable Streams
- Durable Object Lifecycle
- Durable Object Transactions
- ReadableStream API
- TCP Sockets
- WritableStream Writers
- AI Search Instance
- Durable Object Namespaces
- R2 Bucket Storage
- SQL Storage Cursor
- Vectorize Index
- AI Gateway
- AI Search Namespace
- BYOB Readers
- Vectorize Index Ops
- Workflow Instances
- Tabs UI Components
- AI Search Item
- AI Search Item List
- Artifacts API
- Artifacts Repo
- D1 Database
- D1 Prepared Statements
- KV Namespace
- Byte Stream Controllers
- Default Stream Readers
- Text Decoder
- AI Gateway Logs
- Comment DOM
- Email Message API
- HTMLRewriter
- HTMLRewriter Document Handlers
- Image Handle
- BYOB Requests
- Stream Default Controllers
- Stream Captions
- Stream Video Handle
- Stream Watermarks
- Sync KV Storage
- WASM Table
- Text DOM Node
- Text Encoder
- TransformStream Controllers
- App Entry & Server Handler
- AbortController
- AI Search Job
- AI Search Jobs
- AutoRAG
- Cache API
- Web Crypto Primitives
- D1 Database Sessions
- Durable Object Facets
- HTML End Tags
- Hosted Images
- HTMLRewriter Element Handlers
- Image Transform Results
- Image Transformer
- Media Transform Results
- WASM Module
- Performance API
- Queue API
- R2 Multipart Upload
- Stream Binding
- Stream Downloads
- WebSocket Request Pairs
- Workflow API
- Workflow Entrypoints
- Image Transform Properties
- Local Actor Namespace
- RPC Stubs
- DOMException
- Durable Object IDs
- Execution Context
- Global Object
- Hello World Binding
- Images Binding
- Media Transformer
- WASM Memory
- Queue Message
- Queue Message Batch
- Node Style Server
- Pipeline Transformation
- Trace Spans
- SQL Storage
- Markdown Service
- Worker Loader
- Worker Stubs
- Workflow Steps
- WritableStream Controllers
- Analytics Engine
- Cache Context
- Cache Storage
- Compile Error
- Dispatch Namespace
- Document End
- Event Listeners
- Hyperdrive
- Bot Management
- Instance
- JSON Web Key
- Media Binding
- Media Transform Generator
- Message Channel
- Navigator
- Non-Retryable Error
- Pipeline API
- Process Env
- R2 Checksums
- Rate Limit API
- Function Tool Calls
- RPC Target
- Runtime Error
- Scheduled Controller
- Scheduler
- Secrets Store
- Send Email API
- Step Promises
- Stream Videos
- Trace Request Info
- Tracing API
- Unsafe Trace Metrics
- Environment Bindings

## God Nodes (most connected - your core abstractions)
1. `cn()` - 95 edges
2. `useI18n()` - 53 edges
3. `Event` - 25 edges
4. `Console` - 21 edges
5. `URL` - 20 edges
6. `URLSearchParams` - 16 edges
7. `DurableObjectStorage` - 15 edges
8. `compilerOptions` - 14 edges
9. `SubtleCrypto` - 14 edges
10. `Element` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Slider()` --references--> `react`  [EXTRACTED]
  app/components/ui/slider.tsx → package.json
- `README` --conceptually_related_to--> `Light Theme Design Spec`  [INFERRED]
  README.md → app/spec/design/light.md
- `Footer()` --calls--> `useI18n()`  [EXTRACTED]
  app/components/app-shell.tsx → app/lib/i18n.tsx
- `Command()` --calls--> `cn()`  [EXTRACTED]
  app/components/ui/command.tsx → app/lib/utils.ts
- `CommandSeparator()` --calls--> `cn()`  [EXTRACTED]
  app/components/ui/command.tsx → app/lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Typography Hierarchy** — app_spec_design_light_noto_serif, app_spec_design_light_manrope, app_spec_design_light_geist [EXTRACTED 1.00]
- **Cloudflare Deployment Workflow** — readme_c3_cli, readme_wrangler, readme_cloudflare_workers [INFERRED 0.85]

## Communities (172 total, 134 thin omitted)

### Community 0 - "Cloudflare Workers Types"
Cohesion: 0.00
Nodes (783): RFC-2253, RFC-3339, RFC-5246, Ai_Cf_Ai4Bharat_Indictrans2_En_Indic_1B_Input, Ai_Cf_Ai4Bharat_Indictrans2_En_Indic_1B_Output, Ai_Cf_Aisingapore_Gemma_Sea_Lion_V4_27B_It_Async_Batch, Ai_Cf_Aisingapore_Gemma_Sea_Lion_V4_27B_It_AsyncResponse, Ai_Cf_Aisingapore_Gemma_Sea_Lion_V4_27B_It_Chat_Completion_Response (+775 more)

### Community 1 - "Accordion UI Components"
Cohesion: 0.08
Nodes (29): AccordionContent(), AccordionItem(), AccordionTrigger(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount() (+21 more)

### Community 2 - "Abort Signals & Streams"
Cohesion: 0.04
Nodes (7): AbortSignal, EventSource, EventTarget, MessagePort, ServiceWorkerGlobalScope, WebSocket, WorkerGlobalScope

### Community 3 - "DOM Events & Custom Events"
Cohesion: 0.04
Nodes (12): CloseEvent, CustomEvent, EmailEvent, ErrorEvent, Event, ExtendableEvent, FetchEvent, MessageEvent (+4 more)

### Community 4 - "Daily Verse & Prayer Cards"
Cohesion: 0.11
Nodes (14): DailyVerseCard(), RelativeTime(), Placeholder(), useI18n(), AsmaulHusna(), Azkar(), HadithBook(), HadithDetail() (+6 more)

### Community 5 - "Last Read & Prayer Marquee"
Cohesion: 0.15
Nodes (24): ContinueReadingCard(), DEFAULT_READS, LastReadGrid(), LABEL_KEY, ORDER, PrayerKey, PrayerMarquee(), QiblaCard() (+16 more)

### Community 6 - "TypeScript Project Config"
Cohesion: 0.07
Nodes (28): ., app/**/*, app/**/.client/**/*, app/**/.server/**/*, DOM, DOM.Iterable, .react-router/types/**/*, vite/client (+20 more)

### Community 7 - "App Dependencies"
Cohesion: 0.08
Nodes (25): adhan, class-variance-authority, clsx, cmdk, isbot, lucide-react, dependencies, adhan (+17 more)

### Community 8 - "Search & Button UI"
Cohesion: 0.12
Nodes (18): Button(), buttonVariants, Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem() (+10 more)

### Community 9 - "Build DevDependencies"
Cohesion: 0.09
Nodes (23): @cloudflare/vite-plugin, devDependencies, @cloudflare/vite-plugin, @react-router/dev, tailwindcss, @tailwindcss/vite, @types/node, @types/react (+15 more)

### Community 11 - "Stream Compression"
Cohesion: 0.10
Nodes (7): CompressionStream, DecompressionStream, FixedLengthStream, IdentityTransformStream, TextDecoderStream, TextEncoderStream, TransformStream

### Community 13 - "Design System & Theme Spec"
Cohesion: 0.13
Nodes (19): Light Theme Design Spec, Burnished Gold Accent, Deep Emerald Color, Design Tokens, Fixed Grid Layout, Geist Font, Girih Geometric Patterns, Manrope Font (+11 more)

### Community 14 - "Tafsir & Surah Selection"
Cohesion: 0.13
Nodes (8): SelectTafsir(), TAFSIRS, Filter, SurahIndex(), View, SurahRow(), SurahSearch(), Home()

### Community 15 - "Shadcn Component Config"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 16 - "Node/Vite Build Config"
Cohesion: 0.11
Nodes (17): node, tailwind.config.ts, vite.config.ts, compilerOptions, baseUrl, composite, lib, module (+9 more)

### Community 17 - "MCP Server Config (opencode)"
Cohesion: 0.12
Nodes (16): enabled, type, url, X-Goog-Api-Key, mcp, figma, quran, stitch (+8 more)

### Community 18 - "Dropdown Menu UI"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 21 - "Package Publishing Metadata"
Cohesion: 0.14
Nodes (13): cloudflare, categories, label, preview_icon_url, preview_image_url, products, publish, description (+5 more)

### Community 25 - "App Shell & Navigation"
Cohesion: 0.26
Nodes (9): Footer(), BottomNav(), items, NavItem, MobileTopBar(), items, TopNav(), TKey (+1 more)

### Community 26 - "Theme & Dark Mode"
Cohesion: 0.21
Nodes (7): AppShell(), applyTheme(), initialTheme(), systemPrefersDark(), Theme, ThemeContext, ThemeProvider()

### Community 28 - "Body/Request Streams"
Cohesion: 0.15
Nodes (3): Body, Request, Response

### Community 32 - "Wrangler Config"
Cohesion: 0.17
Nodes (11): nodejs_compat, compatibility_date, compatibility_flags, main, name, observability, enabled, $schema (+3 more)

### Community 35 - "Select UI Components"
Cohesion: 0.18
Nodes (7): SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger()

### Community 36 - "Sheet UI Components"
Cohesion: 0.18
Nodes (6): SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 37 - "Data Prep Scripts"
Cohesion: 0.18
Nodes (8): books, daily, DAILY_VERSE_PICKS, HADITH_BOOKS, quran, ROOT, SURAH_ARABIC_NAMES, surahIndex

### Community 38 - "Root TSConfig"
Cohesion: 0.18
Nodes (10): compilerOptions, baseUrl, checkJs, noEmit, paths, skipLibCheck, strict, verbatimModuleSyntax (+2 more)

### Community 39 - "Stream Error Classes"
Cohesion: 0.18
Nodes (11): AlreadyUploadedError, BadRequestError, ForbiddenError, InternalError, InvalidURLError, MaxFileSizeError, NotFoundError, QuotaReachedError (+3 more)

### Community 40 - "i18n & Language Context"
Cohesion: 0.22
Nodes (7): en, I18nContext, I18nProvider(), id, initialLang(), Lang, PrayerTimes()

### Community 43 - "NPM Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, cf-typegen, check, data:prepare, deploy, dev, preview (+1 more)

### Community 44 - "Stream Queuing Strategies"
Cohesion: 0.22
Nodes (3): ByteLengthQueuingStrategy, CountQueuingStrategy, QueuingStrategy

### Community 61 - "Tabs UI Components"
Cohesion: 0.40
Nodes (5): Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger()

### Community 88 - "App Entry & Server Handler"
Cohesion: 0.50
Nodes (4): AppLoadContext, fetch(), react-router, requestHandler

### Community 113 - "Image Transform Properties"
Cohesion: 0.67
Nodes (3): BasicImageTransformations, RequestInitCfPropertiesImage, RequestInitCfPropertiesImageDraw

## Knowledge Gaps
- **939 isolated node(s):** `items`, `DEFAULT_READS`, `ORDER`, `PrayerKey`, `LABEL_KEY` (+934 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **134 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `URLSearchParams` connect `URLSearchParams API` to `Cloudflare Workers Types`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `R2ObjectBody` connect `R2 Object Storage` to `Cloudflare Workers Types`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `URLPattern` connect `URLPattern API` to `Cloudflare Workers Types`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `items`, `DEFAULT_READS`, `ORDER` to the rest of the system?**
  _939 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Cloudflare Workers Types` be split into smaller, more focused modules?**
  _Cohesion score 0.0025412960609911056 - nodes in this community are weakly interconnected._
- **Should `Accordion UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.08048103607770583 - nodes in this community are weakly interconnected._
- **Should `Abort Signals & Streams` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._