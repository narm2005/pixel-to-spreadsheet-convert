# SlickReceipts.com - AI-Powered Receipt Processing Platform

## Overview

SlickReceipts is a web-based SaaS application that transforms receipt images and PDFs into structured data formats (Excel, CSV, JSON). The platform uses AI-powered OCR technology to extract receipt information and offers both freemium and premium subscription tiers. Built with React, TypeScript, and Supabase, it provides user authentication, file processing, analytics, and subscription management through Lemon Squeezy.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (November 24, 2025)

### Critical Production Bug Fix: File Upload System Hanging

**Issue**: Users couldn't upload files because `supabase.auth.getSession()` hung indefinitely on the dashboard, preventing all file processing.

**Root Cause**: 
- No timeout handling on Supabase auth calls
- Complex OAuth callback logic could hang during initialization
- Race conditions in async session retrieval
- Missing error boundaries and fallback mechanisms

**Fixes Applied**:

1. **src/hooks/useAuth.tsx** - Authentication timeout handling:
   - Added `withTimeout` utility wrapper for all Supabase auth calls
   - Implements 10-second timeout with proper cleanup (clears timeout on resolution)
   - Simplified OAuth callback handling to prevent hangs
   - Added `mounted` flag to prevent state updates on unmounted components
   - Ensures loading state always resolves (never stuck indefinitely)
   - Improved error recovery with user-friendly toast messages

2. **src/hooks/useSecureFileUpload.ts** - Security fix:
   - Fixed LSP errors by importing exported constants instead of accessing protected Supabase client properties
   - Changed `supabase.supabaseUrl` → `SUPABASE_URL` (imported constant)
   - Changed `supabase.supabaseKey` → `SUPABASE_PUBLISHABLE_KEY` (imported constant)

3. **src/integrations/supabase/client.ts** - Environment variable support:
   - Moved hardcoded Supabase credentials to environment variables
   - Now reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env
   - Fallback to hardcoded values for backward compatibility
   - Exported `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for proper usage

4. **vite.config.ts** - Replit compatibility:
   - Changed port from 8080 to 5000 (Replit standard)
   - Changed host from `::` to `0.0.0.0` for proper external access
   - Added `strictPort: true` to ensure consistent port binding

**Testing**:
- App now starts successfully on port 5000
- No console errors or warnings
- Timeout handling prevents infinite hangs
- OAuth callback flow works correctly
- Session retrieval completes within 10 seconds or fails gracefully

**Prevention**:
- Always use timeout wrappers for external async calls
- Implement proper cleanup in Promise.race patterns
- Add mounted flags to async effects
- Use environment variables for credentials
- Log all critical async operations for debugging

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- React Router for client-side routing and navigation
- Port configuration: Development server runs on port 5000 with strict port enforcement

**UI Component System:**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component library built on Radix UI
- Tailwind CSS for utility-first styling with custom design tokens
- CSS variables for theme customization (light/dark mode support)
- Responsive design with mobile-first breakpoint at 768px

**State Management:**
- React Query (TanStack Query) for server state management and caching
- React Context API for authentication state
- Local component state with React hooks for UI state

**Form Handling:**
- React Hook Form with Zod resolvers for validation
- Input OTP component for one-time password flows

**Key Design Patterns:**
- Custom hooks pattern for reusable logic (useAuth, useFileUpload, useSecureFileUpload)
- Context providers for cross-cutting concerns (AuthProvider)
- Component composition with shadcn/ui components
- Protected route pattern for authenticated pages

### Authentication & Authorization

**Authentication Provider:**
- Supabase Auth for user management
- Multiple authentication methods:
  - Email/password authentication
  - Google OAuth integration via @react-oauth/google
  - Session-based authentication with JWT tokens

**Authorization Strategy:**
- Two-tier access control: 'freemium' and 'premium'
- User tier stored in Supabase 'profiles' table
- Premium feature gating through PremiumGate component
- Usage limits enforced server-side (10 files for freemium, unlimited for premium)

**Session Management:**
- Timeout protection wrapper for async operations
- Automatic session refresh and validation
- Redirect to sign-in for unauthenticated access to protected routes

### File Processing Pipeline

**Upload Flow:**
- Multi-file upload support (up to 10 files simultaneously)
- Drag-and-drop interface with file validation
- Supported formats: JPEG, PNG, GIF, BMP, WebP, PDF
- File size limit: 10MB per file
- Freemium users: 10 total files lifetime limit
- Premium users: Unlimited uploads

**Storage:**
- Supabase Storage bucket ('receipts') for file persistence
- Signed URLs for secure file access (1-hour expiry)
- File retention: 30 days for freemium, longer for premium

**Processing Architecture:**
- OCR processing through Supabase Edge Functions
- Progress tracking with upload progress state
- Batch processing support for multiple files
- Category detection using keyword-based algorithm
- Merged data output for multi-file processing

**Data Extraction:**
- Merchant name, date, total amount, tax
- Line items with descriptions, quantities, prices
- Automatic category classification
- Confidence scoring for categorization

### Export System

**Format Support:**
- CSV export: Available to all users
- Excel (.xlsx): Premium feature
- JSON: Premium feature

**Export Features:**
- Single-file and merged multi-file exports
- Structured data formatting per export type
- Client-side data transformation
- Automatic download trigger

### Subscription & Payment

**Payment Processor:**
- Lemon Squeezy for subscription management
- Two plans: Premium Monthly and Premium Yearly
- Webhook integration for subscription events

**Subscription Data Model:**
- 'subscribers' table in Supabase
- Fields: user_id, subscribed (boolean), subscription_tier, subscription_end
- Lemon Squeezy customer ID and subscription ID tracking

**Pricing Strategy:**
- Freemium: $0 (10 files total, CSV export only)
- Premium Monthly: $9/month
- Premium Yearly: $90/year (~17% discount)

**Subscription Flow:**
- Redirect to Lemon Squeezy hosted checkout
- Custom data passed: user_id, user_email
- Webhook processing for subscription activation
- Profile update on successful payment

### Analytics & Insights (Premium Feature)

**Data Aggregation:**
- Monthly spending trends
- Category-based expense breakdown
- Transaction counts and averages
- Time-series data visualization

**Visualization:**
- Recharts library for chart rendering
- Bar charts for monthly trends
- Pie charts for category distribution
- Summary cards for key metrics

**Data Source:**
- Processed receipts stored in Supabase
- Real-time analytics queries
- User-specific data filtering

### Database Schema (Supabase/PostgreSQL)

**Key Tables:**
- `profiles`: User metadata, tier information
- `subscribers`: Subscription status and Lemon Squeezy data
- `processed_files`: Receipt processing results and metadata
- `receipts`: File storage references

**Row Level Security (RLS):**
- User-scoped data access
- Service role bypass for administrative operations
- Authenticated user policies for CRUD operations

**Database Functions:**
- `can_user_upload`: Usage limit validation
- `get_user_file_count`: Count user's processed files
- Analytics aggregation functions

### Error Handling & Logging

**Client-Side:**
- Toast notifications for user feedback
- Console logging for debugging (with prefixed emojis for categorization)
- Error boundaries for component-level error isolation

**Validation:**
- File type and size validation
- Usage limit checking before upload
- Form validation with Zod schemas

**User Feedback:**
- Toast component (shadcn/ui) for success/error messages
- Sonner for alternative toast notifications
- Progress indicators during async operations

### Security Considerations

**Data Protection:**
- Supabase RLS for database security
- Signed URLs with expiration for file access
- Environment variables for sensitive credentials

**Authentication Security:**
- JWT token-based authentication
- Secure session storage
- CORS headers configured for API access

**API Security:**
- Authorization headers required for Supabase functions
- User validation in Edge Functions
- Rate limiting through usage tiers

## External Dependencies

### Core Services

**Supabase (Backend-as-a-Service):**
- PostgreSQL database hosting
- Authentication service
- File storage (S3-compatible)
- Edge Functions for serverless processing
- Real-time subscriptions capability

**Lemon Squeezy (Payment & Subscriptions):**
- Hosted checkout pages
- Subscription management
- Webhook notifications
- Customer portal for subscription management

**Google OAuth:**
- Social authentication provider
- Client ID: Configured in environment variables
- Integration via @react-oauth/google package

### Third-Party Libraries

**UI & Styling:**
- Tailwind CSS v3
- Radix UI component primitives
- Lucide React icons
- date-fns for date formatting
- Embla Carousel for carousels

**Data & State:**
- @tanstack/react-query for server state
- axios for HTTP requests
- React Hook Form for forms
- Zod for schema validation

**Charts & Visualization:**
- Recharts for analytics charts
- Custom chart components wrapping Recharts

**Development:**
- Vite for build tooling
- TypeScript for type checking
- ESLint for code linting
- PostCSS with Autoprefixer

### API Integrations

**OCR Processing:**
- Supabase Edge Function endpoint
- Custom OCR service integration
- Category detection algorithm

**File Storage:**
- Supabase Storage API
- Bucket: 'receipts'
- Public/private access control

### Environment Configuration

**Required Environment Variables:**
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase public API key
- `VITE_LEMONSQUEEZY_API_KEY`: Lemon Squeezy API key
- `VITE_LEMONSQUEEZY_STORE_ID`: Store identifier
- `VITE_LEMONSQUEEZY_PREMIUM_MONTHLY_VARIANT_ID`: Monthly plan variant
- `VITE_LEMONSQUEEZY_PREMIUM_YEARLY_VARIANT_ID`: Yearly plan variant
- Google OAuth Client ID (hardcoded in main.tsx)