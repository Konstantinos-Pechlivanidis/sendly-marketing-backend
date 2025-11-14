📱 Sendly Frontend Documentation
Overview

This document describes the complete frontend architecture, design system, and user experience specifications for the Sendly Marketing App marketing website and core campaign-create preview UI.

Version: 1.1.0
Last Updated: November 2025
Design System: iOS 26 – Liquid Glass / Dark Mode First

🎨 Design System
Color Palette

All colors are inspired by the Nike Mercurial Vapor 16 Elite FG (Black/Ice + Zoom sole highlight).

Primary Colors
Primary Dark: #020202
  - Main text on light backgrounds
  - Page background (deep areas)
  - Primary icons / logo

Primary Light: #E5E5E5
  - Text on dark backgrounds (secondary)
  - Light backgrounds for contrast sections

Ice Accent Colors (Cool Blues)
Ice Accent: #99B5D7
  - Primary accent color
  - Main CTAs
  - Links and key highlights

Ice Light: #B3CDDA
  - Hover states for CTAs
  - Soft highlights / chips
  - Secondary accent surfaces

Ice Dark: #6686A9
  - Pressed / active states for CTAs
  - Emphasis borders
  - Deep accent elements

Border / Subtle Lines: #94A9B4
  - Dividers
  - Card borders
  - Input outlines

Fuchsia Accent Colors (Zoom Sole Highlight)

Inspired by the Air Zoom sole’s pink-magenta glow.

Zoom Fuchsia: #C09DAE
  - High-impact highlight color
  - Secondary CTAs (Upgrade, Most Popular)
  - Accent in gradients
  - KPI / metrics highlights

Zoom Fuchsia Deep: #7C5A67
  - Darker fuchsia for depth
  - Shadows under fuchsia elements
  - Badges / tags with strong contrast


Usage guidelines:

Use Ice Accent as the primary brand accent.

Use Zoom Fuchsia sparingly for emphasis:

“Most Popular” pricing card badge

Important metrics, badges, or limited-time offers

Secondary gradient accents

Never use both Ice and Fuchsia at 100% saturation in the same small component; keep one dominant, one supporting.

Surface & Background Colors
Surface Dark: #191819
  - Main dark surface
  - Cards on dark background
  - Navigation bar background

Surface Mid: #262425
  - Secondary surfaces
  - Panels, sidebars, secondary cards

Background Dark: #020202
  - Page background (hero, deep sections)
  - Behind glass and gradient overlays

Background Light: #E5E5E5
  - Light sections for contrast
  - Documentation / long-read blocks

Glass Colors (with Transparency)
Glass White: rgba(255, 255, 255, 0.10)
  - Default glass cards on dark background

Glass Dark: rgba(2, 2, 2, 0.30)
  - Overlays, modals, bottom sheets

Glass Ice: rgba(153, 181, 215, 0.20)
  - Accent glass surfaces
  - Feature highlight cards

Glass Fuchsia: rgba(192, 157, 174, 0.22)
  - Special highlight glass (pricing, metrics)

Glass Border: rgba(148, 169, 180, 0.30)
  - Glass card borders
  - Input outlines

Typography
Font Family
Primary: Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif
  - All UI text
  - Headings and body copy

Monospace: "SF Mono", Monaco, Menlo, Inconsolata, monospace
  - Code snippets
  - Technical content

Font Scale
Hero: 3.0rem – 4.5rem (5xl–7xl)
H1:   2.25rem – 3.0rem (4xl–5xl)
H2:   1.875rem – 2.25rem (3xl–4xl)
H3:   1.5rem – 1.875rem (2xl–3xl)
Body: 1rem – 1.125rem (base–lg)
Small: 0.75rem – 0.875rem (xs–sm)


Line-height: 1.4–1.6 for body, 1.1–1.3 for headings.

Max text width: 65–75 characters for readability.

Spacing System

Design tokens (used across layout and components):

0:  0px
1:  4px
2:  8px
3:  12px
4:  16px
5:  20px
6:  24px
8:  32px
10: 40px
12: 48px
16: 64px
20: 80px
24: 96px

Border Radius
sm:   8px    - Small elements (chips, tags)
md:   12px   - Inputs, small cards
lg:   16px   - Standard cards
xl:   20px   - Larger panels
2xl:  24px   - Hero cards, primary sections
3xl:  32px   - Device mockups (iPhone 17 frame)
full: 9999px - Pills, badges, circular elements

Shadows
sm:       0 1px  2px rgba(0,0,0,0.05)
md:       0 4px  6px rgba(0,0,0,0.10)
lg:       0 10px 15px rgba(0,0,0,0.10)
xl:       0 20px 25px rgba(0,0,0,0.10)

glass:    0  8px 32px rgba(2,  2,  2, 0.37)
glass-lg: 0 16px 48px rgba(2,  2,  2, 0.50)

glow-ice:    0 0 20px rgba(153, 181, 215, 0.40)
glow-ice-lg: 0 0 30px rgba(153, 181, 215, 0.50)

glow-fuchsia: 0 0 24px rgba(192, 157, 174, 0.50)
  - Used only on special CTAs or badges

Animations
fade-in:     0.3s ease-out
slide-up:    0.3s ease-out
scale-in:    0.2s ease-out
glass-shimmer: 3s ease-in-out infinite
glass-glow:    2s ease-in-out infinite
float:         6s ease-in-out infinite


Use CSS transforms and opacity only for performance.

🧭 Global Layout
Global Navigation (Navbar)

Applies to: All public pages (/, /features, /pricing, /how-it-works, /contact).

Style:

Position: fixed top, full width, with subtle blur.

Height: 64px desktop, 56px mobile.

Background:
background: linear-gradient(90deg, rgba(2,2,2,0.85), rgba(25,24,25,0.85));

backdrop-filter: blur(20px);

border-bottom: 1px solid Glass Border.

Content Layout:

┌───────────────────────────────────────────────────────────────┐
│ [Sendly Logo] Sendly           [Features] [Pricing] [How It…] │
│                                      [Docs]     Log in  [Install App] │
└───────────────────────────────────────────────────────────────┘


Left:

Logo mark (compact icon)

Wordmark: “Sendly” using H3 style.

Center (Desktop ≥ 1024px):

Text links: Features, Pricing, How It Works, Docs

Hover: underline + color shift to Ice Accent.

Right:

Ghost Button: “Log in” (outline, no fill).

Primary Button: “Install on Shopify”

Background: Ice Accent → Ice Dark on hover.

Box-shadow: glow-ice.

Scroll Behavior:

On scroll > 16px:

Slightly increase background opacity.

Add subtle glass shadow.

Keep height unchanged (no jarring jumps).

Mobile (≤ 768px):

Left: Logo + wordmark.

Right: Hamburger icon (3 lines, rounded).

Tapping opens full-screen glass menu:

┌──────────────────────────────┐
│ [X]                          │
│                              │
│ Features                     │
│ Pricing                      │
│ How It Works                 │
│ Docs                         │
│                              │
│ [Log in]                     │
│ [Primary: Install on Shopify]│
└──────────────────────────────┘

📄 Page Specifications
0. Global Structure

Each page uses:

Fixed glass navbar at top.

Central content container (~1110–1200px max-width).

Vertical rhythm: sections spaced by 80–120px on desktop, 56–80px on mobile.

Optional footer with:

Left: logo + short description.

Center: navigation links.

Right: social icons & legal links.

1. Landing Page (/)

Purpose
First impression and main conversion entry (Install / Start Trial).

User Flow

Hero (value proposition + primary CTA)

Feature preview

How it works (summary)

Social proof / metrics (optional block)

Pricing teaser

FAQ

Final CTA

Hero Section (below navbar)

┌───────────────────────────────────────────────┐
│  [Glass Badge] SMS Marketing for Shopify      │
│                                               │
│  Grow Your Store with                         │
│  SMS Marketing That Converts                  │
│                                               │
│  [Short supporting paragraph…]                │
│                                               │
│  [Primary CTA: Install on Shopify] [Secondary: How it works] │
│                                               │
│  ✓ Free 14-day trial  •  98% open rates  •  24/7 support     │
│                                               │
│  [Subtle device / dashboard illustration]     │
└───────────────────────────────────────────────┘


Background: dark gradient + Ice / Fuchsia blobs.

Primary CTA uses Ice Accent; secondary is ghost style.

Metrics row can use subtle Zoom Fuchsia for the numbers only.

Features Section

6 feature cards in a responsive grid (3/2/1 columns).

Each card:

Icon (minimal line icon or emoji – optional).

Title (H3).

Short descriptive paragraph.

Glass card with hover scale + shadow.

How It Works (Short Version)

4 step cards, numbered 01–04 horizontally on desktop, vertically on mobile.

2. Features Page (/features)

Same navigation and footer as Landing.

Header with brief overview.

16 feature cards in a 3-column grid (2 on tablet, 1 on mobile).

Each card:

Title, short description, and bullet list of benefits.

Optional: Fuchsia accent for labels like “New” or “Pro”.

3. Pricing Page (/pricing)

Header

Simple, transparent pricing  
Choose the plan that fits your growth
[Toggle: Monthly | Annual – Save 17%]


Toggle uses Ice Accent track and thumb; active side highlighted.

Pricing Cards

3 tier cards in a row:

Starter

Growth (Most Popular – uses Zoom Fuchsia badge + glow-fuchsia shadow)

Enterprise

Each card:

Price

SMS volume

Key benefits list

CTA button

Cards hover with slight scaling and glow.

4. How It Works Page (/how-it-works)

Detailed 4-step process, 6 automation examples, best practices and CTA.
Structure as in your original doc; just align visuals with glass cards and consistent spacing.

5. Contact Page (/contact)

Contact methods grid (Email, Chat, Help Center, Book a Demo).

Glass contact form with validation states.

Office info / company footprint block.

6. Campaign Create Page – iPhone 17 SMS Preview

(Core in-app experience, but uses the same design system)

Route: /app/campaigns/new

Goal
Let users create an SMS campaign while seeing a real-time mobile preview inside an iPhone 17-style device frame.

Layout (Desktop)
┌─────────────────────────────────────────────────────┐
│ [Navbar (app version)]                              │
├─────────────────────────────────────────────────────┤
│  Campaign Form (left)        |   iPhone Preview (right)   │
│                              |                            │
│  ┌───────────────────────┐   |   ┌─────────────────────┐ │
│  │ [Glass Card]          │   |   │  iPhone 17 Frame    │ │
│  │ Name                  │   |   │                     │ │
│  │ Audience / Segment    │   |   │  [Status bar]       │ │
│  │ Sender ID             │   |   │                     │ │
│  │ Message (textarea)    │   |   │  [Message bubble]   │ │
│  │ Schedule              │   |   │  [Char + parts]     │ │
│  │ [Save Draft] [Send]   │   |   └─────────────────────┘ │
│  └───────────────────────┘   |                            │
└─────────────────────────────────────────────────────┘

iPhone 17 Device UI

Frame:

Aspect ratio similar to tall modern iPhone.

Outer frame:

Background: #020202 with glass-lg shadow.

Radius: 3xl.

Subtle side highlights in Ice Light.

Inner screen:

Background gradient:
linear-gradient(180deg, #020202 0%, #191819 45%, #262425 100%)

Top status bar:

Time, signal, battery (small monochrome icons).

Message Bubble Preview:

Left-aligned bubble (Sendly → customer).

Bubble background: Ice Accent with slight gradient.

Text color: Primary Dark (for contrast).

Bubble style:

border-radius: 20px 20px 20px 4px;
padding: 10px 14px;
max-width: 80%;
font-size: 0.95rem;
line-height: 1.4;


Allow inline variable tokens: {{first_name}}, {{discount_code}}. These appear with slightly stronger weight or small underline.

Content Binding:

As user types in the Message textarea on the left, the device preview updates live.

Any line breaks in the textarea are mirrored in the bubble.

Character counter and segment count:

[ 127 characters • 1 SMS part ]


Placed below the bubble, right-aligned, using Small typography.

Zoom Fuchsia Usage:

Use Zoom Fuchsia to highlight:

The SMS parts count when it becomes > 1.

Warnings like “This message will be split into 2 parts”.

Mobile Layout (≤ 768px):

Layout becomes vertical:

Campaign form first.

iPhone preview below, full width.

Device frame width: 100% of container minus padding; maintain aspect ratio.

Character counter remains inside the device preview for strong connection between text and feedback.

Interaction States:

Message textarea:

Default: Glass White background, Glass Border outline.

Focus: border color = Ice Accent; subtle glow-ice shadow.

Error: border color = red (standard error color, e.g. #EF4444).

“Send” / “Schedule” button:

Primary button style, uses Ice Accent.

When scheduling is selected, show subtle label below:
“Scheduled for 14 Nov, 18:30” with small clock icon.

🎨 Styling Patterns
Liquid Glass Effect

Core Pattern:

background: rgba(255, 255, 255, 0.10);
backdrop-filter: blur(24px);
border: 1px solid rgba(148, 169, 180, 0.30);
border-radius: 24px;
box-shadow: 0 8px 32px 0 rgba(2, 2, 2, 0.37);


Applied to:

Cards

Panels

Navbar

iPhone device screen container

Gradient Text

Include both Ice and Fuchsia in the brand gradient:

background: linear-gradient(
  to right,
  #99B5D7,
  #C09DAE,
  #6686A9
);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;


Use only for:

Hero headline

Section titles that need extra emphasis

Hover Effects

Cards:

transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 16px 48px 0 rgba(2, 2, 2, 0.50);
}


Buttons:

transition: all 0.2s ease-out;

:hover {
  background: #6686A9; /* Ice Dark */
  box-shadow: 0 0 20px rgba(153, 181, 215, 0.40);
}

:active {
  transform: scale(0.96);
}

📱 Responsive Design

Breakpoints

Mobile:   < 768px
Tablet:   768px – 1279px
Desktop:  ≥ 1280px


Key rules:

Cards: 1 column on mobile, 2 on tablet, 3+ on desktop.

Buttons: full-width on mobile for primary CTAs.

Navbar: hamburger with overlay menu on mobile.

Campaign Create: form then iPhone preview, stacked on mobile.

🎯 UX Guidelines

Clear visual hierarchy (H1 → H2 → H3 → body).

Primary CTAs visually stronger than secondary.

Use Ice + Fuchsia only where necessary—avoid overloading the page with bright accents.

All interactive elements must have hover + focus states.

♿ Accessibility

Color contrast WCAG 2.1 AA minimum (especially text on glass).

Keyboard-accessible navigation and buttons.

Visible focus ring (e.g. 2px outline in Ice Accent).

Semantic HTML (nav, main, section, footer).

ARIA labels for icons and navigation toggles.

🧩 Component Usage

(GlassCard, GlassButton, GlassBadge, GlassInput, etc. as already defined in your original doc – logic remains the same; now with optional fuchsia variants.)

🎬 Animation Guidelines, Performance, SEO

Remain as in your original document:

CSS-based animations only.

Lazy loading images (WebP), responsive sizes.

Route-based code splitting.

Meta tags, Open Graph, structured data, clean heading hierarchy.

🚀 Implementation Checklist (Key Points)

 Global glass navbar implemented on all pages.

 Color palette uses Ice + Zoom Fuchsia correctly.

 Landing / Features / Pricing / How It Works / Contact responsive.

 Campaign Create page includes live iPhone 17 SMS preview with character count and parts.

 Hover & focus states for all interactive elements.

 Accessibility and performance checks completed.