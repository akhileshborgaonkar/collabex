# CollabEx System Architecture

This document provides visual diagrams of the CollabEx platform architecture, including system components, data flow, and integrations.

---

## 🏗️ High-Level System Architecture

```mermaid
graph TB
    subgraph Client["Frontend (React + Vite)"]
        UI[React Components]
        Router[React Router]
        State[TanStack Query]
        Auth[useAuth Hook]
    end

    subgraph Supabase["Lovable Cloud (Supabase)"]
        subgraph API["API Layer"]
            REST[REST API]
            Realtime[Realtime WS]
            AuthService[Auth Service]
        end
        
        subgraph DB["PostgreSQL Database"]
            Tables[(Tables)]
            RLS[RLS Policies]
            Triggers[Triggers]
            Functions[DB Functions]
        end
        
        subgraph Storage["Storage"]
            Avatars[(avatars)]
            Portfolio[(portfolio)]
        end
        
        subgraph Edge["Edge Functions"]
            SendNotif[send-notification]
            VerifySocial[verify-social-platform]
        end
    end

    subgraph External["External Services"]
        Resend[Resend Email API]
        LovableAI[Lovable AI Gateway]
    end

    UI --> Router
    UI --> State
    UI --> Auth
    
    State --> REST
    Auth --> AuthService
    UI --> Realtime
    UI --> Storage
    
    REST --> RLS --> Tables
    AuthService --> Tables
    Triggers --> Functions
    
    Edge --> Tables
    SendNotif --> Resend
    Edge --> LovableAI

    style Client fill:#4F46E5,color:#fff
    style Supabase fill:#3ECF8E,color:#fff
    style External fill:#F59E0B,color:#fff
```

---

## 📊 Database Schema Relationships

```mermaid
erDiagram
    PROFILES ||--o{ PROFILE_NICHES : has
    PROFILES ||--o{ SOCIAL_PLATFORMS : has
    PROFILES ||--o{ PORTFOLIO_ITEMS : has
    PROFILES ||--o{ SWIPE_ACTIONS : swipes
    PROFILES ||--o{ MATCHES : matches
    PROFILES ||--o{ COLLAB_POSTS : authors
    PROFILES ||--o{ COLLAB_APPLICATIONS : applies
    PROFILES ||--o{ COLLABORATIONS : participates
    PROFILES ||--o{ REVIEWS : gives_receives
    PROFILES ||--o{ MESSAGES : sends_receives
    PROFILES ||--o{ NOTIFICATIONS : receives
    
    COLLAB_POSTS ||--o{ COLLAB_APPLICATIONS : receives
    COLLABORATIONS ||--o{ REVIEWS : enables
    SWIPE_ACTIONS ||--o{ MATCHES : creates

    PROFILES {
        uuid id PK
        uuid user_id FK
        string account_type
        string display_name
        string bio
        string avatar_url
        string banner_url
        decimal base_rate
        string currency
        boolean open_to_free_collabs
    }

    PROFILE_NICHES {
        uuid id PK
        uuid profile_id FK
        string niche
    }

    SOCIAL_PLATFORMS {
        uuid id PK
        uuid profile_id FK
        string platform_name
        string handle
        string url
        int follower_count
        boolean is_verified
    }

    SWIPE_ACTIONS {
        uuid id PK
        uuid swiper_id FK
        uuid swiped_id FK
        string direction
    }

    MATCHES {
        uuid id PK
        uuid profile_a FK
        uuid profile_b FK
    }

    COLLAB_POSTS {
        uuid id PK
        uuid author_id FK
        string title
        string description
        string status
    }

    COLLAB_APPLICATIONS {
        uuid id PK
        uuid applicant_id FK
        uuid post_id FK
        string message
        string status
    }

    COLLABORATIONS {
        uuid id PK
        uuid profile_a FK
        uuid profile_b FK
        string title
        string status
        timestamp completed_at
    }

    REVIEWS {
        uuid id PK
        uuid reviewer_id FK
        uuid reviewee_id FK
        int rating
        string content
    }

    MESSAGES {
        uuid id PK
        uuid sender_id FK
        uuid receiver_id FK
        string content
        boolean read
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string type
        string title
        boolean read
    }
```

---

## 🔄 Core User Flows

### Authentication & Onboarding Flow

```mermaid
sequenceDiagram
    participant U as User
    participant App as React App
    participant Auth as Supabase Auth
    participant DB as Database
    participant Trigger as DB Trigger

    U->>App: Visit /auth
    U->>App: Enter email/password
    App->>Auth: signUp()
    Auth->>Auth: Create auth.users record
    Auth-->>Trigger: NEW user event
    Trigger->>DB: INSERT into profiles
    Auth-->>App: Session + user
    App->>App: Redirect to /account-type
    U->>App: Select "Influencer" or "Brand"
    App->>DB: UPDATE profiles.account_type
    App->>App: Redirect to onboarding
    U->>App: Complete onboarding form
    App->>DB: INSERT niches, platforms
    App->>DB: UPDATE profiles.onboarding_completed
    App->>App: Redirect to Dashboard
```

### Match Creation Flow

```mermaid
sequenceDiagram
    participant A as User A
    participant B as User B
    participant App as React App
    participant DB as Database
    participant Trigger as check_and_create_match
    participant Edge as send-notification
    participant Email as Resend

    A->>App: Swipe RIGHT on User B
    App->>DB: INSERT swipe_action (A→B, right)
    DB-->>Trigger: AFTER INSERT
    Trigger->>DB: Check for reverse swipe
    Note over Trigger: No match yet (B hasn't swiped)
    
    B->>App: Swipe RIGHT on User A
    App->>DB: INSERT swipe_action (B→A, right)
    DB-->>Trigger: AFTER INSERT
    Trigger->>DB: Found! A swiped right on B
    Trigger->>DB: INSERT into matches
    
    App->>Edge: Invoke send-notification
    Edge->>DB: INSERT notification for A
    Edge->>DB: INSERT notification for B
    Edge->>Email: Send email to A
    Edge->>Email: Send email to B
    
    A->>App: See notification bell badge
    B->>App: See notification bell badge
```

### Collaboration Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> Discovered: Browse/Match

    state Discovered {
        [*] --> ViewProfile
        ViewProfile --> InitiateCollab: Click "Start Collaboration"
    }

    Discovered --> Pending: Create collaboration
    
    Pending --> InProgress: Partner accepts
    Pending --> Cancelled: Partner declines
    Pending --> Cancelled: Initiator cancels
    
    InProgress --> Completed: Either marks complete
    InProgress --> Cancelled: Either cancels
    
    Completed --> Reviewed: Leave review
    Reviewed --> [*]
    Cancelled --> [*]

    note right of Pending
        Notification sent
        to partner
    end note

    note right of Completed
        Review prompt
        shown to both
    end note
```

---

## 🔐 Security Architecture

### Row Level Security (RLS) Flow

```mermaid
flowchart TD
    subgraph Client
        Request[API Request]
    end

    subgraph Auth["Authentication Layer"]
        JWT[JWT Token]
        AuthUID["auth.uid()"]
    end

    subgraph RLS["RLS Policy Check"]
        Policy{Policy Evaluation}
        Select[SELECT Policy]
        Insert[INSERT Policy]
        Update[UPDATE Policy]
        Delete[DELETE Policy]
    end

    subgraph Data["Database"]
        Tables[(Protected Tables)]
    end

    Request --> JWT
    JWT --> AuthUID
    AuthUID --> Policy
    
    Policy --> Select
    Policy --> Insert
    Policy --> Update
    Policy --> Delete
    
    Select -->|"user owns row?"| Tables
    Insert -->|"user authorized?"| Tables
    Update -->|"user owns row?"| Tables
    Delete -->|"user owns row?"| Tables

    style RLS fill:#EF4444,color:#fff
```

### Edge Function Security

```mermaid
flowchart LR
    subgraph Client
        A[Frontend Request]
    end

    subgraph Edge["Edge Function"]
        B[CORS Check]
        C[JWT Validation]
        D[Ownership Check]
        E[Business Logic]
        F[Service Role Client]
    end

    subgraph DB["Database"]
        G[(Tables)]
    end

    subgraph External
        H[Resend API]
    end

    A -->|Authorization header| B
    B --> C
    C -->|Verify user| D
    D -->|Check permissions| E
    E --> F
    F -->|Service role bypasses RLS| G
    E --> H

    style Edge fill:#8B5CF6,color:#fff
```

---

## 📱 Frontend Component Architecture

```mermaid
graph TD
    subgraph App["App.tsx"]
        Router[BrowserRouter]
        QueryProvider[QueryClientProvider]
        AuthProvider[AuthProvider]
    end

    subgraph Layout["AppLayout"]
        DesktopSidebar[DesktopSidebar]
        MobileTabBar[MobileTabBar]
        NotificationBell[NotificationBell]
    end

    subgraph Pages["Pages"]
        Index[Index/Dashboard]
        Auth[Auth]
        AccountType[AccountTypeSelection]
        Onboarding[Onboarding]
        BrandOnboarding[BrandOnboarding]
        Discover[Discover]
        Match[Match]
        Collabs[Collabs]
        Messages[Messages]
        Profile[Profile]
        Settings[SettingsPage]
    end

    subgraph Components["Shared Components"]
        UI[UI Components]
        Dialogs[Dialog Components]
        Cards[Card Components]
    end

    subgraph Hooks["Custom Hooks"]
        useAuth[useAuth]
        useProfile[useProfile]
        useMobile[use-mobile]
    end

    Router --> Layout
    Layout --> Pages
    Pages --> Components
    Pages --> Hooks
    Components --> UI

    style App fill:#4F46E5,color:#fff
    style Layout fill:#6366F1,color:#fff
    style Pages fill:#818CF8,color:#fff
```

---

## 🔌 Integration Architecture

```mermaid
flowchart TB
    subgraph Frontend["React Frontend"]
        UI[User Interface]
        SupaClient[Supabase Client]
    end

    subgraph SupabaseCore["Lovable Cloud Core"]
        Auth[Authentication]
        REST[REST API]
        Realtime[Realtime]
        Storage[Storage CDN]
    end

    subgraph EdgeFunctions["Edge Functions"]
        SendNotif[send-notification]
        VerifySocial[verify-social-platform]
        AIChat[AI Chat - Planned]
    end

    subgraph ExternalAPIs["External Services"]
        Resend[Resend<br/>Email Delivery]
        LovableAI[Lovable AI Gateway<br/>Gemini/GPT-5]
        SocialURLs[Social Media URLs<br/>Verification]
    end

    UI --> SupaClient
    SupaClient --> Auth
    SupaClient --> REST
    SupaClient --> Realtime
    SupaClient --> Storage
    
    SupaClient -.->|invoke| EdgeFunctions
    
    SendNotif --> Resend
    VerifySocial --> SocialURLs
    AIChat -.-> LovableAI

    style Frontend fill:#4F46E5,color:#fff
    style SupabaseCore fill:#3ECF8E,color:#fff
    style EdgeFunctions fill:#8B5CF6,color:#fff
    style ExternalAPIs fill:#F59E0B,color:#fff
```

---

## 📨 Notification System Architecture

```mermaid
flowchart TD
    subgraph Triggers["Event Triggers"]
        Match[New Match]
        CollabReq[Collab Request]
        CollabAccept[Collab Accepted]
        CollabComplete[Collab Completed]
        NewMessage[New Message]
        NewReview[New Review]
    end

    subgraph Edge["send-notification Edge Function"]
        Validate[Validate JWT]
        CheckRecipient[Get Recipient]
        CreateNotif[Create DB Notification]
        SendEmail[Send Email via Resend]
    end

    subgraph Outputs["Notification Channels"]
        InApp[In-App Notification]
        Email[Email Notification]
    end

    subgraph UI["User Interface"]
        Bell[Notification Bell]
        Dropdown[Notifications List]
        Badge[Unread Count Badge]
    end

    Triggers --> Edge
    Validate --> CheckRecipient
    CheckRecipient --> CreateNotif
    CheckRecipient --> SendEmail
    
    CreateNotif --> InApp
    SendEmail --> Email
    
    InApp --> Bell
    Bell --> Badge
    Bell --> Dropdown

    style Edge fill:#8B5CF6,color:#fff
    style Outputs fill:#10B981,color:#fff
```

---

## 🗂️ File Structure Overview

```
collabex/
├── src/
│   ├── components/
│   │   ├── collaborations/     # Collab-related components
│   │   ├── layout/             # AppLayout, Sidebar, TabBar
│   │   ├── notifications/      # NotificationBell
│   │   ├── profile/            # Avatar, Banner, Niches, Social
│   │   ├── settings/           # PaymentSettings
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/
│   │   ├── useAuth.tsx         # Authentication state
│   │   ├── useProfile.tsx      # Profile data
│   │   └── use-mobile.tsx      # Responsive detection
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts       # Supabase client (auto-generated)
│   │       └── types.ts        # TypeScript types (auto-generated)
│   ├── pages/
│   │   ├── Index.tsx           # Dashboard
│   │   ├── Auth.tsx            # Login/Signup
│   │   ├── AccountTypeSelection.tsx
│   │   ├── Onboarding.tsx      # Influencer onboarding
│   │   ├── BrandOnboarding.tsx # Brand onboarding
│   │   ├── Discover.tsx        # Profile grid
│   │   ├── Match.tsx           # Swipe interface
│   │   ├── Collabs.tsx         # Board + active collabs
│   │   ├── Messages.tsx        # Chat
│   │   ├── Profile.tsx         # View profile
│   │   └── SettingsPage.tsx    # User settings
│   └── lib/
│       └── utils.ts            # Utility functions
├── supabase/
│   ├── config.toml             # Supabase configuration
│   └── functions/
│       ├── send-notification/  # Email + in-app notifications
│       └── verify-social-platform/  # Social URL verification
├── docs/
│   └── architecture.md         # This file
├── prd.md                      # Product Requirements Document
└── .lovable/
    └── plan.md                 # Feature implementation plan
```

---

## 🚀 Deployment Architecture

```mermaid
flowchart LR
    subgraph Dev["Development"]
        Local[Local Dev Server]
        Preview[Lovable Preview]
    end

    subgraph Build["Build Pipeline"]
        Vite[Vite Build]
        TypeCheck[TypeScript Check]
        Lint[ESLint]
    end

    subgraph Deploy["Deployment"]
        EdgeDeploy[Edge Function Deploy]
        StaticDeploy[Static Asset Deploy]
        DBMigrate[DB Migrations]
    end

    subgraph Prod["Production"]
        CDN[Lovable CDN]
        SupabaseProd[Supabase Prod]
        EdgeProd[Edge Functions]
    end

    Local --> Preview
    Preview --> Build
    Build --> Deploy
    Deploy --> Prod

    style Dev fill:#6366F1,color:#fff
    style Prod fill:#10B981,color:#fff
```

---

## 📈 Scaling Considerations

| Component | Current | At Scale | Strategy |
|-----------|---------|----------|----------|
| Database | Single Supabase instance | Connection pooling | PgBouncer enabled |
| Storage | Direct uploads | CDN-backed | Already using Supabase CDN |
| Edge Functions | On-demand | Warm instances | Monitor cold starts |
| Real-time | Single channel | Sharded channels | Per-conversation channels |
| Search | Sequential scan | Full-text search | Add pg_trgm indexes |

---

*Architecture diagrams generated for CollabEx - February 2026*
