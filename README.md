# 🌿 Oasis - Smart Waste Management System

A comprehensive waste management platform that connects citizens with waste management workers to efficiently handle illegal garbage dumping through intelligent reporting and safety-verified cleanup operations.

## 🚀 Features

### For Citizens (Individual Users)
- 📍 **Illegal Garbage Reporting**: Report illegal garbage dumps with photo evidence and precise location mapping
- 🗺️ **Interactive Map Interface**: View and mark garbage locations using Leaflet and OpenStreetMap
- 📊 **Ticket History**: Track the status of your reported garbage incidents
- 🎯 **Waste Classifier**: AI-powered quiz to help classify different types of waste
- 📚 **Training Module**: Educational content about proper waste management practices

### For Workers
- 👷 **Safety Gear Verification**: Upload photos that are verified by AI to ensure proper safety equipment (helmet, vest, mask, gloves)
- ✅ **Status Management**: Update garbage report status from "Pending" → "In Progress" → "Complete"
- 📋 **Ticket Dashboard**: View and manage assigned cleanup tasks
- 🔒 **Role-based Access**: Secure worker authentication and authorization

### AI & Technology Features
- 🤖 **Roboflow AI Integration**: Automatic safety gear detection using computer vision
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🎨 **Animated UI**: Engaging Lottie animations for better user experience
- 🔄 **Real-time Updates**: Live status tracking for all stakeholders

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB
- **Authentication**: Supabase Auth
- **Maps**: Leaflet.js with OpenStreetMap
- **AI/ML**: Roboflow Serverless API
- **Image Storage**: Cloudinary
- **Animations**: Lottie Files
- **Styling**: Tailwind CSS

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB database
- Supabase account
- Cloudinary account
- Roboflow account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/oasis.git
cd oasis
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:
```env
ROBOFLOW_API_KEY=your_roboflow_api_key
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

4. **Run the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
oasis/
├── .env.local                               # Environment variables
├── app/                                     # Next.js 14 App Router
│   ├── api/                                # API Routes
│   │   ├── garbage-reports/               # Garbage report endpoints
│   │   │   ├── [id]/                     # Dynamic report ID routes
│   │   │   │   └── status/               # Status update endpoint
│   │   │   │       └── route.ts
│   │   │   ├── user/                     # User-specific reports
│   │   │   │   └── [userId]/
│   │   │   │       └── route.ts
│   │   │   └── route.ts                  # Main garbage reports API
│   │   ├── predict/                       # AI prediction endpoints
│   │   │   └── route.ts                  # Safety gear detection
│   │   └── user/                          # User management APIs
│   │       ├── check/                    # User verification
│   │       ├── create/                   # User creation
│   │       ├── profile/                  # Profile management
│   │       └── update/                   # Profile updates
│   ├── auth/                              # Authentication pages
│   │   └── callback/                     # OAuth callback
│   ├── detail/                            # Report details page
│   ├── profile/                           # User profile page
│   ├── raise-ticket/                      # Report garbage form
│   ├── signin/                            # Sign in page
│   ├── signup/                            # Sign up page
│   ├── ticket-history/                    # User's report history
│   ├── training/                          # Educational content
│   ├── waste-classifier/                  # AI waste classification quiz
│   ├── worker/                            # Worker dashboard
│   │   └── tickets/                      # Worker ticket management
│   ├── logout/                            # Logout page
│   ├── layout.tsx                         # Root layout
│   ├── page.tsx                           # Home page
│   └── globals.css                        # Global styles
├── components/                            # Reusable React components
│   ├── Animation.tsx                      # Lottie animations
│   ├── LeafletLoader.tsx                  # Dynamic map loading
│   ├── LeftSidebar.tsx                    # Left navigation
│   ├── LocationPicker.tsx                 # Location selection
│   ├── MapView.tsx                        # Interactive map
│   ├── ReportForm.tsx                     # Garbage reporting form
│   ├── RightSidebar.tsx                   # Right navigation
│   └── SidebarLayout.tsx                  # Layout wrapper
├── context/                               # React contexts
│   └── ToastContext.tsx                   # Toast notifications
├── hooks/                                 # Custom React hooks
│   └── useGeolocation.ts                  # Geolocation hook
├── lib/                                   # Utility libraries
│   ├── supabase/                         # Supabase configuration
│   │   ├── client.ts                     # Client-side config
│   │   ├── middleware.ts                 # Auth middleware
│   │   └── server.ts                     # Server-side config
│   ├── cloudinary.ts                     # Image upload config
│   ├── db.ts                             # Database utilities
│   ├── geocoding.ts                      # Location services
│   └── mongodb.ts                        # MongoDB connection
├── models/                                # Data models
│   ├── GarbageReport.ts                  # Report schema
│   └── User.ts                           # User schema
├── public/                                # Static assets
│   ├── Dustbin.json                      # Lottie animation
│   ├── Trash.json                        # Lottie animation
│   ├── Truck.json                        # Lottie animation
│   ├── Logo.svg                          # Application logo
│   └── *.svg                             # Other icons
├── types/                                 # TypeScript definitions
│   └── index.ts                          # Type definitions
├── next.config.ts                         # Next.js configuration
├── package.json                           # Dependencies
├── tsconfig.json                          # TypeScript config
└── postcss.config.mjs                     # PostCSS configuration
```

## 🔧 API Endpoints

### Garbage Reports
- `GET /api/garbage-reports` - Fetch all reports
- `POST /api/garbage-reports` - Create new report
- `PUT /api/garbage-reports/[id]/status` - Update report status
- `GET /api/garbage-reports/user/[userId]` - Get user's reports

### User Management
- `POST /api/user/create` - Create new user
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/update` - Update user information
- `POST /api/user/check` - Verify user credentials

### AI Prediction
- `POST /api/predict` - Safety gear detection using Roboflow

## 🙏 Acknowledgments

- [Roboflow](https://roboflow.com/) for AI model hosting
- [Supabase](https://supabase.com/) for authentication services
- [OpenStreetMap](https://www.openstreetmap.org/) for mapping data
- [Lottie Files](https://lottiefiles.com/) for animations

---

Made with ❤️ by Manan
