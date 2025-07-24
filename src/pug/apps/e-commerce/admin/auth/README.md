# Admin Authentication System

This directory contains the frontend authentication pages for the e-commerce admin panel.

## Files

### Authentication Pages
- **`index.pug`** - Landing page with authentication options
- **`sign-in.pug`** - Admin login page
- **`sign-up.pug`** - Admin registration page
- **`forgot-password.pug`** - Password reset request page
- **`reset-password.pug`** - Password reset page (with token)

### Dashboard
- **`../dashboard.pug`** - Main admin dashboard (redirected to after login)

## Features

### ✅ **Sign In Page (`sign-in.pug`)**
- Email and password authentication
- Form validation
- Loading states with spinner
- Error and success message handling
- Automatic token storage in localStorage
- Redirect to dashboard on success
- Auto-redirect if already logged in

### ✅ **Sign Up Page (`sign-up.pug`)**
- Complete registration form with:
  - First and last name
  - Email address
  - Phone number
  - Role selection (Store Owner, Store Admin, Platform Admin)
  - Position and department (optional)
  - Password with confirmation
  - Terms and conditions agreement
- Password strength validation
- Form validation
- Loading states
- Success/error handling

### ✅ **Forgot Password Page (`forgot-password.pug`)**
- Email input for password reset request
- Form validation
- Loading states
- Success/error handling

### ✅ **Reset Password Page (`reset-password.pug`)**
- Token validation from URL parameters
- New password input with confirmation
- Password strength validation
- Form validation
- Loading states
- Success/error handling

### ✅ **Dashboard Page (`dashboard.pug`)**
- Authentication check
- Logout functionality
- Quick access cards to different admin sections
- Automatic token injection for API requests

## API Endpoints Used

### Authentication
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/forgot-password` - Request password reset (to be implemented)
- `POST /api/v1/users/reset-password` - Reset password (to be implemented)

## Security Features

### ✅ **Client-Side Security**
- Token storage in localStorage
- Automatic token injection for API requests
- Authentication checks on protected pages
- Form validation and sanitization
- Password strength requirements

### ✅ **User Experience**
- Loading spinners during API calls
- Clear error messages
- Success confirmations
- Auto-redirects for authenticated users
- Responsive design

## Usage

### Accessing the Admin Panel
1. Navigate to `/admin/auth` for the authentication landing page
2. Choose "Sign In" to log in with existing credentials
3. Choose "Create Account" to register a new admin user
4. Use "Forgot Password" if you need to reset your password

### URLs
- **Landing Page**: `/admin/auth` or `/admin/auth/index`
- **Sign In**: `/admin/auth/sign-in`
- **Sign Up**: `/admin/auth/sign-up`
- **Forgot Password**: `/admin/auth/forgot-password`
- **Reset Password**: `/admin/auth/reset-password?token=YOUR_TOKEN`
- **Dashboard**: `/admin/dashboard`

## Backend Requirements

The following backend endpoints need to be implemented:

### ✅ **Implemented**
- `POST /api/v1/users/login` - Returns JWT token
- `POST /api/v1/users/register` - Creates new admin user

### 🔄 **To Be Implemented**
- `POST /api/v1/users/forgot-password` - Sends reset email
- `POST /api/v1/users/reset-password` - Resets password with token

## Styling

The pages use the existing Phoenix theme with:
- Bootstrap 5 classes
- Custom Phoenix components
- Responsive design
- Dark mode support
- Consistent branding

## Browser Compatibility

- Modern browsers with ES6+ support
- localStorage for token storage
- Fetch API for HTTP requests
- CSS Grid and Flexbox for layout

## Development Notes

- All pages extend the main theme layout
- Uses the card authentication layout for consistent styling
- JavaScript is included inline for simplicity
- Form validation is client-side with server-side validation as backup
- Token management is handled automatically 