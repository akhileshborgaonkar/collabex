# CollabEx Product Requirements Document

**Version:** 1.0  
**Last Updated:** February 2026  
**Status:** In Development

---

# CONTENTS

- [Abstract](#-abstract)
- [Business Objectives](#-business-objectives)
- [KPI](#-kpi)
- [Success Criteria](#-success-criteria)
- [User Journeys](#-user-journeys)
- [Scenarios](#-scenarios)
- [User Flow](#-user-flow)
- [Functional Requirements](#-functional-requirements)
- [Model Requirements](#-model-requirements)
- [Data Requirements](#-data-requirements)
- [Prompt Requirements](#-prompt-requirements)
- [Testing & Measurement](#-testing--measurement)
- [Risks & Mitigations](#-risks--mitigations)
- [Costs](#-costs)
- [Assumptions & Dependencies](#-assumptions--dependencies)
- [Compliance/Privacy/Legal](#-complianceprivacylegal)
- [GTM/Rollout Plan](#-gtmrollout-plan)

---

## 📝 Abstract

**CollabEx** ("Where Influence Meets Impact") is a B2B2C platform that connects content creators (influencers) with brands seeking collaboration partnerships. The platform solves the inefficiency and trust gaps in influencer-brand discovery by providing:

- **Tinder-style matching** for quick mutual interest discovery
- **Collaboration board** for posting and applying to opportunities
- **Verified profiles** with social proof and reputation signals
- **End-to-end collaboration tracking** from match to review

The platform distinguishes between two user types—Influencers and Brands—with role-specific onboarding, navigation, and capabilities. By combining matchmaking mechanics with professional collaboration tools, CollabEx reduces time-to-partnership from weeks to hours while building trust through verified credentials and post-collab reviews.

---

## 🎯 Business Objectives

- **Accelerate creator economy partnerships** by reducing discovery friction for both influencers and brands
- **Build trust infrastructure** through verified social platforms, completed collaboration history, and peer reviews
- **Create network effects** where more influencers attract more brands, and vice versa
- **Enable monetization transparency** by standardizing rate displays and budget expectations upfront
- **Reduce failed collaborations** by requiring mutual acceptance and clear scope definition before starting work

---

## 📊 KPI

| GOAL | METRIC | QUESTION |
|------|--------|----------|
| User Acquisition | Weekly signups (split by Influencer/Brand) | Are we attracting both sides of the marketplace? |
| Activation | % completing onboarding within 24h | Does onboarding feel valuable and quick? |
| Engagement | Weekly active swipes per user | Are users exploring the match experience? |
| Match Rate | Matches / Right Swipes | Is our recommendation quality improving? |
| Collaboration Conversion | Collaborations started / Matches made | Do matches translate to real work? |
| Completion Rate | Collaborations completed / Collaborations started | Are partnerships successful? |
| Review Rate | Reviews left / Collaborations completed | Are users contributing to trust signals? |
| Retention | D7 / D30 return rate | Do users find ongoing value? |

---

## 🏆 Success Criteria

**V1 Launch Success (8-12 weeks post-launch):**

1. **500+ registered users** with at least 40% completing onboarding
2. **100+ matches created** through the swipe interface
3. **25+ collaborations started** (either via match or collab board)
4. **10+ collaborations completed** with reviews submitted
5. **Positive qualitative feedback** from 5+ users in each role (influencer/brand)
6. **Core flows functional** with <2% error rate on critical paths
7. **Email notifications delivered** successfully for key events

---

## 🚶‍♀️ User Journeys

### Journey 1: Influencer Finding Brand Partnerships

**Persona:** Maya, a lifestyle micro-influencer (15K Instagram followers)

1. Maya signs up and selects "Influencer" account type
2. Completes onboarding: niches (lifestyle, wellness), platforms (Instagram, TikTok), audience tier (micro)
3. Uploads avatar, banner, and links verified social accounts
4. Sets her base rate ($150/post) and marks "open to free collabs" for portfolio building
5. Explores Discover grid to browse brand profiles
6. Uses Match tab to swipe on interesting brands
7. Gets notified of a mutual match with "GlowUp Cosmetics"
8. Messages the brand to discuss a campaign
9. Brand initiates a collaboration: "Summer Skincare Reel"
10. Maya accepts, delivers content, and marks complete
11. Leaves a 5-star review for the brand

### Journey 2: Brand Finding Influencers

**Persona:** Jordan, marketing manager at an indie fashion label

1. Jordan signs up and selects "Brand" account type
2. Completes onboarding: company name, industry (fashion), website
3. Posts a collab opportunity on the board: "Looking for fashion creators for Fall collection"
4. Browses Discover to find influencers matching their aesthetic
5. Views influencer profiles, checks their reviews and verified socials
6. Initiates a direct collaboration request with a creator they like
7. Alternatively, reviews "Show Interest" applications from the collab board
8. Accepts an interested influencer and starts collaboration
9. Tracks progress through the Collabs page
10. Marks complete and leaves a review

### Journey 3: Organic Match-to-Collaboration

**Persona:** Two influencers wanting to cross-promote

1. Both influencers complete onboarding with overlapping niches
2. Each swipes right on the other during Match sessions
3. System creates a match and notifies both
4. They message to discuss a collaboration idea
5. One initiates a formal collaboration with title/description
6. They complete the cross-promotion campaign
7. Both leave reviews, building their reputation scores

---

## 📖 Scenarios

| ID | Scenario | Actor | Precondition | Expected Outcome |
|----|----------|-------|--------------|------------------|
| S1 | New influencer signup | Influencer | Has email | Account created, onboarding started |
| S2 | Complete influencer onboarding | Influencer | Account exists, no account_type | Niches, platforms, tier saved; redirected to dashboard |
| S3 | Complete brand onboarding | Brand | Account exists, no account_type | Company info saved; redirected to dashboard |
| S4 | Browse profiles in Discover | Any user | Onboarding complete | See grid of profiles with filters |
| S5 | Swipe right on profile | Influencer | Viewing Match tab | Swipe recorded; match created if mutual |
| S6 | Receive match notification | Any user | Other user swiped right | In-app + email notification |
| S7 | Send message to match | Any user | Match exists | Message delivered, appears in chat |
| S8 | Post collab opportunity | Any user | Onboarding complete | Post visible on Collab Board |
| S9 | Show interest in collab post | Any user | Not author of post | Application created, author notified |
| S10 | Start collaboration from match | Any user | Match exists | Collaboration created in "pending" status |
| S11 | Accept collaboration request | Any user | Pending collab where user is profile_b | Status changes to "in_progress" |
| S12 | Mark collaboration complete | Either party | Collab in "in_progress" | Status changes to "completed", review prompt shown |
| S13 | Leave review | Either party | Collab completed | Review saved, visible on reviewee profile |
| S14 | Verify social platform | Influencer | Social link added | Edge function validates URL, marks verified |
| S15 | Update profile settings | Any user | Profile exists | Changes saved, reflected everywhere |

---

## 🕹️ User Flow

### Happy Path: Match → Collaboration → Review

```
[Signup] → [Account Type Selection] → [Role-specific Onboarding]
                                              ↓
                                      [Dashboard/Home]
                                              ↓
                    ┌─────────────────────────┼─────────────────────────┐
                    ↓                         ↓                         ↓
              [Discover]                  [Match]                  [Collabs]
              Browse grid                Swipe cards               View board
                    ↓                         ↓                         ↓
            [View Profile]            [Swipe Right]              [Post Collab]
                    ↓                         ↓                    or [Apply]
        [Start Collaboration]         [Mutual Match!]                  ↓
                    ↓                         ↓                   [Notified]
                    └─────────────────────────┴─────────────────────────┘
                                              ↓
                                      [Messages Page]
                                     Chat with partner
                                              ↓
                                   [Start Collaboration]
                                    Title + Description
                                              ↓
                                    [Pending → Accepted]
                                              ↓
                                     [In Progress Work]
                                              ↓
                                    [Mark as Complete]
                                              ↓
                                     [Leave Review]
                                              ↓
                                   [Review on Profile]
```

### Key Alternative Flows

- **Declined match/collab**: Notification sent, status updated, no messaging enabled
- **Cancelled collaboration**: Either party can cancel before completion
- **Edit profile mid-flow**: Settings accessible from any authenticated page
- **Social verification**: Async process, profile updated when complete

---

## 🧰 Functional Requirements

### Authentication & Onboarding

| SECTION | SUB-SECTION | USER STORY & EXPECTED BEHAVIORS | SCREENS |
|---------|-------------|--------------------------------|---------|
| Signup | Email | As a new user, I can create an account with email/password so I can access the platform. Email verification required before full access. | `/auth` |
| Signup | Google | As a new user, I can sign up with Google OAuth for faster onboarding. | `/auth` |
| Login | Email | As a returning user, I can log in with my credentials to access my account. | `/auth` |
| Login | Google | As a returning user, I can log in with Google OAuth. | `/auth` |
| Forgot Password | — | As a user who forgot my password, I can reset it via email link. | `/auth` |
| Account Type | Selection | As a new user, I must choose Influencer or Brand before proceeding. This gates role-specific onboarding. | `/account-type` |
| Onboarding | Influencer | As an influencer, I complete niches, platforms, audience tier, and optional pricing to build my profile. | `/onboarding` |
| Onboarding | Brand | As a brand, I enter company name, industry, and website to establish my business profile. | `/brand-onboarding` |

### Core Features

| SECTION | SUB-SECTION | USER STORY & EXPECTED BEHAVIORS | SCREENS |
|---------|-------------|--------------------------------|---------|
| Dashboard | Home | As a user, I see my stats (matches, active collabs, messages), AI recommendations, and quick actions. | `/` (Index) |
| Discover | Grid | As a user, I can browse all profiles in a filterable grid sorted by relevance. | `/discover` |
| Discover | Profile View | As a user, I can view full profile details, reviews, and start a collaboration. | Profile modal/page |
| Match | Swipe | As an influencer, I can swipe left/right on profiles. Mutual right-swipes create a match. | `/match` |
| Match | Notification | As a user, I receive in-app and email notifications when a match occurs. | Notification bell |
| Collabs | Board | As a user, I see a dual-pane view: opportunities (left) and my active collaborations (right). | `/collabs` |
| Collabs | Post | As a user, I can post a collaboration opportunity with title, description, niche, platforms, deadline. | Create dialog |
| Collabs | Apply | As a user, I can "Show Interest" on others' posts with an optional message. | Interest dialog |
| Collabs | Manage | As a post author, I can view applications and accept/decline. | Applications list |
| Collaborations | Start | As a user, I can initiate a collaboration from a profile or match with title/description. | Start collab dialog |
| Collaborations | Track | As a participant, I see all my collaborations with status: pending, in_progress, completed, cancelled. | `/collabs` |
| Collaborations | Complete | As a participant, I can mark a collaboration as complete, triggering review prompt. | Complete button |
| Reviews | Create | As a user with a completed collab, I can rate (1-5 stars) and write feedback for my partner. | Review dialog |
| Reviews | Display | As any user, I can see reviews on profiles to assess reputation. | Profile page |
| Messages | Chat | As a matched/collab partner, I can send real-time messages. | `/messages` |
| Messages | Unread | As a user, I see unread count in navigation and can mark as read. | Nav badge |
| Notifications | Bell | As a user, I see a notification bell with unread count and dropdown list. | Header |
| Notifications | Types | I receive notifications for: matches, collab requests, messages, reviews. | — |

### Profile & Settings

| SECTION | SUB-SECTION | USER STORY & EXPECTED BEHAVIORS | SCREENS |
|---------|-------------|--------------------------------|---------|
| Profile | View | As any user, I can view my own profile as others see it. | `/profile` |
| Profile | Avatar | As a user, I can upload and crop a profile picture stored in cloud storage. | Settings |
| Profile | Banner | As a user, I can upload a banner image for my profile header. | Settings |
| Profile | Video | As a user, I can add an intro video URL to showcase my work. | Settings |
| Profile | Social Links | As a user, I can add/edit social platforms with handle, URL, and follower count. | Settings |
| Profile | Verification | As a user, I can request verification of my social links. Verified badge displays on success. | Settings |
| Profile | Niches | As a user, I can edit my content niches after onboarding. | Settings |
| Profile | Pricing | As a user, I can set my base rate, rate type, currency, and "open to free collabs" flag. | Settings |
| Settings | Payment | As a user, I can configure payment preferences (rates, currency). | `/settings` |

---

## 📐 Model Requirements

| SPECIFICATION | REQUIREMENT | RATIONALE |
|---------------|-------------|-----------|
| Open vs Proprietary | Proprietary (Google Gemini via Lovable AI Gateway) | Pre-configured, no API key management for users |
| Model | google/gemini-3-flash-preview (default) | Fast, cost-effective for recommendations and matching |
| Context Window | 32K tokens | Sufficient for profile context and recommendation logic |
| Modalities | Text only (V1) | No image/video analysis in V1 recommendations |
| Fine Tuning | Not required (V1) | Prompt engineering sufficient for initial features |
| Latency | P50 < 2s, P95 < 5s | Dashboard recommendations should feel responsive |
| Fallback | Graceful degradation | Show generic recommendations if AI fails |

**AI Use Cases (Planned):**
- Dashboard "Recommended For You" section
- Smart matching suggestions based on niche/audience overlap
- Collaboration success prediction (future)

---

## 🧮 Data Requirements

### Database Schema (Implemented)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profiles | account_type, display_name, bio, avatar_url, banner_url, base_rate, currency |
| `profile_niches` | Content categories | profile_id, niche |
| `social_platforms` | Linked social accounts | profile_id, platform_name, handle, follower_count, is_verified |
| `swipe_actions` | Match swipe history | swiper_id, swiped_id, direction |
| `matches` | Mutual matches | profile_a, profile_b |
| `collab_posts` | Opportunity board posts | author_id, title, description, niche, platforms, deadline, status |
| `collab_applications` | Interest in posts | applicant_id, post_id, message, status |
| `collaborations` | Active/completed work | profile_a, profile_b, title, description, status, completed_at |
| `reviews` | Post-collab ratings | reviewer_id, reviewee_id, rating, content |
| `messages` | Chat messages | sender_id, receiver_id, content, read |
| `notifications` | In-app alerts | user_id, type, title, message, read, data |
| `portfolio_items` | Work samples | profile_id, image_url, caption |

### Data Flow
- **Ingestion**: User input via forms, OAuth for social links
- **Storage**: Supabase PostgreSQL with RLS policies
- **Media**: Supabase Storage buckets (avatars, portfolio)
- **Real-time**: Supabase Realtime for messages (planned)

### Data Quality
- Required fields enforced at DB level with NOT NULL
- Defaults set for optional fields to prevent null handling issues
- RLS policies ensure users only access authorized data

---

## 💬 Prompt Requirements

### AI Recommendation Prompts (Planned)

**System Prompt:**
```
You are CollabEx's recommendation engine. Given a user's profile (niches, platforms, audience tier, location) and available profiles, suggest the top 3 most compatible collaboration partners.

Prioritize:
1. Niche overlap (at least 1 shared niche)
2. Complementary audience sizes (not competing)
3. Geographic relevance (if location specified)
4. Verified social accounts (trust signal)
5. Positive review history

Output JSON array with profile_id and match_reason.
```

**Personalization Rules:**
- Use display_name in recommendations
- Respect account_type (don't recommend brands to brands)
- Consider "open_to_free_collabs" flag for budget matching

**Output Format:**
```json
{
  "recommendations": [
    { "profile_id": "uuid", "match_reason": "Shared lifestyle niche, complementary audience" }
  ]
}
```

**Accuracy Target:** 70% of recommendations should result in profile view (click-through)

---

## 🧪 Testing & Measurement

### Offline Evaluation
- **Unit tests**: Core business logic (match creation, review eligibility)
- **Integration tests**: Auth flows, RLS policy enforcement
- **Golden set**: 50 test profiles with expected match pairings

### Online Evaluation
- **A/B testing**: Recommendation algorithm variants
- **Guardrails**: Monitor match rate, don't drop below baseline
- **Rollback**: Feature flags for quick disable

### Live Monitoring
- **Edge Function logs**: Notification delivery, verification success
- **Database analytics**: Query patterns, slow queries
- **Error tracking**: Console errors, API failures
- **Key metrics dashboard**: Signups, matches, collaborations (daily)

---

## ⚠️ Risks & Mitigations

| RISK | IMPACT | LIKELIHOOD | MITIGATION |
|------|--------|------------|------------|
| Cold start (no users to match) | High | High | Seed with test profiles; focus on one-sided value (collab board) first |
| Fake/spam profiles | Medium | Medium | Social verification, email confirmation, report system (future) |
| Low match rate frustrates users | High | Medium | Improve recommendation quality; show "interest" as fallback |
| Review manipulation | Medium | Low | Only allow reviews after completed collab (enforced in RLS) |
| Email delivery fails | Medium | Medium | Fallback to in-app notifications; monitor delivery rates |
| Social verification blocked by platforms | Low | High | Use pattern matching, not API calls; manual verification fallback |
| Messaging abuse | Medium | Low | Report system, message moderation (future) |
| Rate/budget mismatch expectations | Medium | Medium | Clear pricing display; filter by budget range |

---

## 💰 Costs

### Development Costs
- **Platform**: Lovable Cloud (Supabase) - included in subscription
- **Email**: Resend - free tier (100 emails/day), then $20/mo
- **AI**: Lovable AI Gateway - included usage, pay for overages
- **Media storage**: Supabase Storage - included in plan

### Operational Costs (Estimated Monthly at Scale)
| Item | Low (1K users) | Medium (10K users) | High (100K users) |
|------|----------------|--------------------|--------------------|
| Database | $25 | $75 | $300 |
| Storage | $5 | $25 | $100 |
| Edge Functions | $0 | $10 | $50 |
| Email (Resend) | $0 | $20 | $100 |
| AI tokens | $5 | $50 | $300 |
| **Total** | ~$35/mo | ~$180/mo | ~$850/mo |

---

## 🔗 Assumptions & Dependencies

### Assumptions
1. **A1**: Users have at least one social media account to link
2. **A2**: Email is the primary communication channel (not SMS/push)
3. **A3**: English is the primary language for V1
4. **A4**: Users are comfortable with "swipe" mechanics from dating apps
5. **A5**: Brands and influencers will self-identify correctly
6. **A6**: Free tier with paid upgrades is the monetization model (TBD)
7. **A7**: Mobile-first web is sufficient; native apps not needed for V1

### Dependencies
1. **D1**: Supabase/Lovable Cloud for backend infrastructure
2. **D2**: Resend for transactional email delivery
3. **D3**: Lovable AI Gateway for AI features
4. **D4**: Social platforms remain accessible for verification checks
5. **D5**: User email providers don't aggressively spam-filter

---

## 🔒 Compliance/Privacy/Legal

### Data Privacy
- **Data minimization**: Only collect necessary profile information
- **User control**: Users can edit/delete their data via settings
- **Encryption**: Data encrypted at rest (Supabase) and in transit (HTTPS)
- **Access control**: Row Level Security (RLS) enforces data isolation

### Regulatory Considerations
- **GDPR**: Right to erasure, data portability (implement in V2)
- **CCPA**: Privacy policy, opt-out mechanisms
- **Age restriction**: Platform for 18+ (terms of service)

### Terms of Service (Required)
- Acceptable use policy for messaging
- Collaboration liability (platform facilitates, not responsible for outcomes)
- Intellectual property rights for posted content

### Content Moderation
- User reporting system (planned)
- Manual review queue for flagged content
- Clear community guidelines

---

## 📣 GTM/Rollout Plan

### Phase 1: Private Alpha (Weeks 1-4)
- **Audience**: 50 invited users (25 influencers, 25 brands)
- **Goal**: Validate core flows, identify critical bugs
- **Metrics**: Completion rates, qualitative feedback
- **Channels**: Personal outreach, founder network

### Phase 2: Closed Beta (Weeks 5-8)
- **Audience**: 500 users via waitlist
- **Goal**: Test at-scale matching, refine recommendations
- **Metrics**: Match rate, collaboration conversion
- **Channels**: Social media teasers, influencer partnerships

### Phase 3: Public Launch (Weeks 9-12)
- **Audience**: Open registration
- **Goal**: 2,000+ users, establish market presence
- **Metrics**: Full KPI dashboard
- **Channels**: Product Hunt, influencer marketing, content marketing

### Rollout Milestones
| Week | Milestone |
|------|-----------|
| 1 | Core auth + onboarding stable |
| 2 | Match + messaging functional |
| 3 | Collab board + applications working |
| 4 | Reviews + notifications complete |
| 6 | AI recommendations live |
| 8 | Email notifications reliable |
| 10 | Public launch |
| 12 | Post-launch iteration based on feedback |

### Marketing Positioning
**Tagline**: "Where Influence Meets Impact"

**Value Props**:
- For Influencers: "Find brand deals that match your vibe, not just your metrics"
- For Brands: "Discover authentic creators who actually engage their audience"
- For Both: "Built-in trust through verified profiles and real reviews"

---

## 📎 Appendix

### Existing Edge Functions
| Function | Purpose |
|----------|---------|
| `send-notification` | Creates in-app notification + sends email via Resend |
| `verify-social-platform` | Validates social media URLs and marks as verified |

### Storage Buckets
| Bucket | Purpose | Public |
|--------|---------|--------|
| `avatars` | Profile pictures | Yes |
| `portfolio` | Banner images, work samples | Yes |

### Database Triggers
| Trigger | Table | Action |
|---------|-------|--------|
| `check_and_create_match` | swipe_actions | Auto-create match on mutual right-swipe |
| `handle_new_user` | auth.users | Auto-create profile on signup |
| `update_updated_at_column` | various | Auto-update timestamps |

---

*This PRD was generated based on the CollabEx codebase as of February 2026. Items marked TBD or "planned" require further discovery or implementation.*
