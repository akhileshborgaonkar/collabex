

# CollabEx Feature Implementation Plan

This plan covers the implementation of 7 major features to enhance CollabEx with reviews, notifications, profile customization, verification, niche editing, brand/influencer separation, and a payments module.

---

## Feature 1: Review System (Post-Collab Only)

Reviews should only be allowed after a collaboration is marked as **completed**.

### Database Changes
- Add `collaboration_id` column to `reviews` table to link reviews to specific completed collaborations
- Create a `collaborations` table to track completed work between two profiles
- Add constraint to ensure reviews can only be created for completed collaborations

### New Table: `collaborations`
```text
collaborations
  - id (uuid, primary key)
  - profile_a (uuid, references profiles)
  - profile_b (uuid, references profiles)
  - collab_post_id (uuid, optional, references collab_posts)
  - match_id (uuid, optional, references matches)
  - status (text: 'active', 'completed', 'cancelled')
  - started_at (timestamptz)
  - completed_at (timestamptz, nullable)
```

### UI Components
- **Mark as Complete** button on active collaborations
- **Leave Review** dialog that appears after marking complete
- Star rating (1-5) with written feedback
- Reviews display on profile pages (already exists)

---

## Feature 2: Match Notification System

When a mutual "Like" occurs, notify the other user and require acceptance before messaging.

### Database Changes
- Add `status` column to `matches` table: `'pending'`, `'accepted'`, `'declined'`
- Create `notifications` table for in-app notifications

### New Table: `notifications`
```text
notifications
  - id (uuid, primary key)
  - recipient_id (uuid, references profiles)
  - type (text: 'match_request', 'match_accepted', 'new_message', 'review_received')
  - reference_id (uuid, the related match/message/review id)
  - title (text)
  - message (text)
  - read (boolean)
  - created_at (timestamptz)
```

### Backend: Edge Function for Email Notifications
- Create `send-notification` edge function
- Use Lovable AI or email service to send notifications
- Trigger on new match creation

### UI Components
- **Notification Bell** in navigation with unread count badge
- **Notifications Dropdown/Page** showing all notifications
- **Match Request Card** with Accept/Decline buttons
- Update Messages page to only show accepted matches

---

## Feature 3: Enhanced Profile Customization

Enable rich profile personalization with media uploads and social links.

### Database Changes
- Add `banner_url` column to `profiles` table (for profile background)
- Add `video_url` column to `profiles` table (intro/portfolio video)

### Storage
- Use existing `avatars` bucket for profile pictures
- Use existing `portfolio` bucket for banner images and videos

### UI Components: Settings Page Enhancements
- **Avatar Upload** with image cropping preview
- **Banner Upload** for profile header background
- **Video Upload** or URL input for intro video
- **Social Platforms Manager**:
  - Add/edit/remove social platforms
  - Each platform shows: icon, handle, follower count, URL
  - Clickable links that open in new tab

### Profile Page Updates
- Display banner image as header background
- Show embedded video player for intro video
- Social platform icons with direct links

---

## Feature 4: Social Media Verification

Mark profiles as "verified" if their social handles are confirmed genuine.

### Database Changes
- Add `is_verified` column to `social_platforms` table (boolean)
- Add `verified_at` column to `social_platforms` table (timestamptz)

### Implementation Approach
Since calling official APIs (Instagram, TikTok, YouTube) requires OAuth app approval and business accounts, we'll implement a **manual verification request system**:

### Verification Flow
1. User clicks "Request Verification" on their social platform
2. System creates a verification request record
3. Admin reviews and approves/declines (future admin panel)
4. Verified badge shows on profile

### New Table: `verification_requests`
```text
verification_requests
  - id (uuid, primary key)
  - social_platform_id (uuid, references social_platforms)
  - profile_id (uuid, references profiles)
  - status (text: 'pending', 'approved', 'rejected')
  - submitted_at (timestamptz)
  - reviewed_at (timestamptz, nullable)
```

### UI Components
- **Verified Badge** (checkmark icon) on verified platforms
- **Request Verification** button on unverified platforms
- **Verification Status** indicator in settings

---

## Feature 5: Edit Niches/Interests

Allow users to modify their content niches after onboarding.

### UI: Settings Page Enhancement
- **Manage Niches** section with all available niches as toggleable badges
- Currently selected niches highlighted
- Click to add/remove niches
- Auto-saves changes

### Implementation
- Fetch current niches from `profile_niches` table
- Insert new niches, delete removed ones
- Same UI pattern as onboarding niche selection

---

## Feature 6: Separate Brand & Influencer Profiles

Create distinct user types with different onboarding flows and capabilities.

### Database Changes
- Add `account_type` column to `profiles`: `'influencer'`, `'brand'`
- Add brand-specific columns to `profiles`:
  - `company_name` (text)
  - `website_url` (text)
  - `industry` (text)

### Auth Flow Changes
1. **Account Type Selection** screen after signup (before onboarding)
2. **Influencer Onboarding**: Current flow (niches, platforms, audience tier)
3. **Brand Onboarding**: Company name, industry, website, collaboration goals

### UI Differences
- **Brands**: Can post collaboration opportunities, browse influencers, cannot swipe/match
- **Influencers**: Can swipe, match, apply to brand collabs, post their own collabs

### New Pages
- `AccountTypeSelection.tsx`: Choose influencer or brand
- `BrandOnboarding.tsx`: Brand-specific onboarding wizard

### Navigation Differences
- Brands: Dashboard, Discover (influencers), Collabs, Messages, Settings
- Influencers: Dashboard, Discover, Match, Collabs, Messages, Settings

---

## Feature 7: Payments Module

Enable brands and influencers to list collaboration pricing.

### Database Changes
- Add pricing columns to `profiles`:
  - `base_rate` (integer, cents)
  - `rate_type` (text: 'per_post', 'per_campaign', 'hourly', 'negotiable')
  - `currency` (text, default 'USD')
  - `open_to_free` (boolean, for free collabs)

- Add pricing to `collab_posts`:
  - `budget_min` (integer, cents)
  - `budget_max` (integer, cents)
  - `is_paid` (boolean)

### UI Components

**Profile Settings - Pricing Section**
- Rate input field with currency selector
- Rate type dropdown (per post, per campaign, hourly, negotiable)
- "Open to free collaborations" toggle

**Collab Post Creation**
- Budget range inputs (min-max)
- "Paid opportunity" toggle

**Profile Display**
- Show rate/pricing badge on profile cards
- "Free collab friendly" badge if enabled

**Discover Filters**
- Filter by budget range
- Toggle "Free collabs only"

---

## Implementation Order

The features will be built in this sequence to manage dependencies:

1. **Feature 6: Brand/Influencer Separation** (foundational - affects all other features)
2. **Feature 5: Edit Niches** (quick win, extends settings page)
3. **Feature 3: Profile Customization** (enhances profile experience)
4. **Feature 4: Social Verification** (builds on customization)
5. **Feature 7: Payments Module** (adds pricing layer)
6. **Feature 1: Review System** (requires collaboration tracking)
7. **Feature 2: Match Notifications** (most complex, requires edge functions)

---

## Technical Details

### New Database Tables Summary
| Table | Purpose |
|-------|---------|
| `collaborations` | Track active/completed work between profiles |
| `notifications` | In-app notification storage |
| `verification_requests` | Social handle verification queue |

### Profile Table Additions
```text
profiles (new columns):
  - account_type (text: 'influencer', 'brand')
  - banner_url (text)
  - video_url (text)
  - company_name (text, for brands)
  - website_url (text, for brands)
  - industry (text, for brands)
  - base_rate (integer)
  - rate_type (text)
  - currency (text)
  - open_to_free (boolean)
```

### Matches Table Additions
```text
matches (new columns):
  - status (text: 'pending', 'accepted', 'declined')
```

### Social Platforms Table Additions
```text
social_platforms (new columns):
  - is_verified (boolean)
  - verified_at (timestamptz)
```

### Collab Posts Table Additions
```text
collab_posts (new columns):
  - budget_min (integer)
  - budget_max (integer)
  - is_paid (boolean)
```

### New Frontend Files
| File | Purpose |
|------|---------|
| `src/pages/AccountTypeSelection.tsx` | Post-signup account type choice |
| `src/pages/BrandOnboarding.tsx` | Brand-specific onboarding |
| `src/components/profile/AvatarUpload.tsx` | Avatar upload with preview |
| `src/components/profile/BannerUpload.tsx` | Banner image upload |
| `src/components/profile/SocialPlatformsManager.tsx` | Manage social links |
| `src/components/profile/NicheSelector.tsx` | Reusable niche picker |
| `src/components/profile/PricingSettings.tsx` | Rate/pricing configuration |
| `src/components/notifications/NotificationBell.tsx` | Nav notification icon |
| `src/components/notifications/NotificationsList.tsx` | Notifications dropdown |
| `src/components/reviews/LeaveReviewDialog.tsx` | Post-collab review form |
| `src/components/match/MatchRequestCard.tsx` | Accept/decline match UI |

### Edge Functions
| Function | Purpose |
|----------|---------|
| `send-notification` | Send email/push notifications on events |

