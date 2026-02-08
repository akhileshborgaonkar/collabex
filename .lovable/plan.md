

# InfluencerConnect — Influencer Collaboration Platform

## Overview
A full-stack, fully responsive web app where social media influencers can create profiles, discover collaborators through multiple methods (browse, match, AI-powered recommendations, and collab postings), message each other, and build their reputation through reviews. The app works seamlessly on any screen size — phone, tablet, or desktop.

---

## Responsive Design Philosophy
- **Mobile-first approach** — all layouts designed for small screens first, then enhanced for larger screens
- **Adaptive navigation** — bottom tab bar on mobile, sidebar on desktop
- **Touch-friendly interactions** — swipe gestures on mobile, click-based on desktop
- **Fluid card grids** — single column on mobile, multi-column on tablet/desktop
- **Responsive modals** — full-screen sheets on mobile, centered dialogs on desktop

---

## Pages & Features

### 1. Auth (Login / Signup)
- Email & password signup/login
- Profile creation flow after signup (onboarding wizard)
- Full-screen layout on mobile, centered card on desktop

### 2. Onboarding Profile Setup
- Step-by-step wizard that works well on all screen sizes
- Name, bio, profile photo upload
- Add social platforms (any platform — name, handle, follower count)
- Select content niches/categories (e.g., Fashion, Tech, Fitness, Food, Travel, Gaming, etc.)
- Location (city/country)
- Audience size tier (Nano, Micro, Mid, Macro, Mega)

### 3. Homepage / Dashboard
- **AI-Powered Recommended Matches** — A prominent "Recommended For You" carousel/section at the top, powered by Lovable AI, that analyzes the influencer's niche, audience size, platforms, and past collaboration history to suggest the best potential collaborators with a short explanation of why each is a good match
- Overview cards for active collabs, pending applications, recent matches
- Notifications for new matches, messages, and applications
- Quick access to collab board and discover features
- On mobile: scrollable vertical feed; on desktop: dashboard grid layout

### 4. Browse & Discover
- Card grid of influencer profiles (1 column mobile, 2-3 columns tablet, 4 columns desktop)
- Filter panel: slide-up drawer on mobile, sidebar on desktop
- Search by name or keyword
- Click/tap to view full profile

### 5. Swipe/Match
- Tinder-style card stack — works with touch swipe gestures on mobile and drag/buttons on desktop
- Swipe right (interested) or left (pass)
- When both swipe right → it's a match, unlocking messaging
- Match notification with option to start chatting

### 6. Collaboration Board
- Influencers can post collaboration opportunities (title, description, requirements, platforms, niche, deadline)
- Others can browse and apply to collab posts
- Post author can accept/decline applications
- Status tracking: Open, In Progress, Completed
- List view on mobile, card grid on desktop

### 7. Influencer Profile Page
- Full bio, social platforms with links
- Niches & audience stats
- Portfolio/content showcase (image grid)
- Reviews & ratings from past collaborations
- "Connect" button to send a collab request
- Stacked layout on mobile, two-column layout on desktop

### 8. Messaging
- Real-time chat between matched or connected influencers
- Conversation list with unread indicators
- On mobile: full-screen conversation list → tap to open chat; on desktop: split-pane (list + chat side by side)

### 9. Reviews & Ratings
- After a collaboration, both parties can leave a star rating and written review
- Reviews displayed on profile

### 10. Navigation
- **Mobile**: Bottom tab bar with icons for Home, Discover, Swipe, Collabs, Messages
- **Desktop**: Left sidebar with labeled navigation links
- Profile & settings accessible from avatar menu on both

### 11. Settings
- Edit profile information
- Notification preferences
- Account management (change password, logout, delete account)

---

## Backend (Lovable Cloud / Supabase)
- **Auth**: Email/password authentication
- **Database**: Users, profiles, social platforms, niches, matches, collab posts, applications, messages, reviews
- **Storage**: Profile photos and portfolio images
- **Real-time**: Live messaging via Supabase Realtime
- **AI Recommendations**: Lovable AI edge function that ranks potential collaborators with reasoning

---

## Design Direction
- Clean, modern UI with card-based layouts
- Vibrant gradient accent colors fitting the creator/social media aesthetic
- Mobile-first responsive design with adaptive layouts for every screen size
- Smooth animations for swipe/match and page transitions
- Touch-optimized controls and spacing on mobile

