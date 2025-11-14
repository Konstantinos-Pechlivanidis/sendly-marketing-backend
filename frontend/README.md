# Sendly Frontend

Modern React application for Sendly Marketing App with glass morphism design system.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **date-fns** - Date utilities

## Getting Started

### Prerequisites

- Node.js 18+ and npm 8+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:8080
```

For production, update to:
```env
VITE_API_URL=https://sendly-marketing-backend.onrender.com
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Build for production:
```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── ui/             # Base UI components
│   │   ├── layout/          # Layout components
│   │   ├── iphone/         # iPhone preview component
│   │   └── SEO.jsx         # SEO component
│   ├── pages/              # Page components
│   │   ├── Landing.jsx
│   │   ├── Features.jsx
│   │   ├── Pricing.jsx
│   │   ├── HowItWorks.jsx
│   │   ├── Contact.jsx
│   │   ├── NotFound.jsx
│   │   └── app/
│   │       └── CampaignCreate.jsx
│   ├── services/           # API services
│   │   ├── api.js         # Axios instance
│   │   └── queries.js     # React Query hooks
│   ├── utils/             # Utility functions
│   │   ├── constants.js   # Design tokens
│   │   └── smsParser.js   # SMS parsing utilities
│   ├── styles/            # Global styles
│   │   └── index.css      # Tailwind imports
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── public/                # Static assets
├── index.html             # HTML template
├── package.json
├── vite.config.js         # Vite configuration
└── tailwind.config.js     # Tailwind configuration
```

## Design System

The application uses a custom design system inspired by iOS 26 Liquid Glass with dark mode first approach.

### Colors

- **Primary**: Dark (#020202) and Light (#E5E5E5)
- **Ice Accent**: #99B5D7 (primary accent)
- **Zoom Fuchsia**: #C09DAE (secondary accent)
- **Glass Effects**: Various transparency levels for glass morphism

### Typography

- **Font**: Inter (with system font fallbacks)
- **Scale**: Hero (3-4.5rem) down to Small (0.75-0.875rem)

### Components

All components follow the glass morphism design pattern with:
- Backdrop blur effects
- Semi-transparent backgrounds
- Subtle borders and shadows
- Smooth hover animations

## Features

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Glass morphism UI components
- ✅ Real-time iPhone SMS preview
- ✅ SMS character and parts calculator
- ✅ Form validation
- ✅ API integration with React Query
- ✅ Code splitting and lazy loading
- ✅ SEO optimization
- ✅ Accessibility features (ARIA, keyboard navigation)

## Routes

- `/` - Landing page
- `/features` - Features page
- `/pricing` - Pricing page
- `/how-it-works` - How it works page
- `/contact` - Contact page
- `/app/campaigns/new` - Campaign creation page
- `*` - 404 page

## API Integration

The app connects to the backend API configured in `.env`. All API calls are handled through:
- Axios instance in `src/services/api.js`
- React Query hooks in `src/services/queries.js`

Authentication tokens are stored in localStorage and automatically included in API requests.

## Development Notes

- Components use Tailwind CSS classes
- Glass effects are implemented via CSS utilities
- Responsive breakpoints: mobile (<768px), tablet (768-1279px), desktop (≥1280px)
- All interactive elements have focus states for accessibility
- Images should be optimized (WebP format recommended)

## License

ISC
