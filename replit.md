# Life Admin - Daily Admin App

## Overview
A React Native / Expo application for personal life management. Built with Expo SDK 52 and runs on web using Metro bundler. Features include task management, expense tracking, bill splitting, and category organization.

## Recent Changes
- 2026-02-15: Initial Replit setup - configured for web deployment on port 5000
- 2026-02-15: Added web compatibility (react-dom, react-native-web, @expo/metro-runtime)
- 2026-02-15: Created WebSwipeable wrapper to handle gesture handler web incompatibility
- 2026-02-15: Comprehensive premium UI overhaul - fintech-style dark theme (Revolut/Cred aesthetic)
  - All screens redesigned: Dashboard, Timeline, Expenses, Profile, Categories, Settings, AddBill
  - Bug fixes: removed console.logs from screens, fixed Colors.dark.gray references, fixed greeting flicker, dark-themed NeonTextInput
  - Replaced SafeAreaView with useSafeAreaInsets across all main screens
  - Button component uses sky blue gradient (#38BDF8), glass-morphism effects throughout
  - Entrance animations with react-native-reanimated FadeInDown on key screens
- 2026-02-15: Fixed AddCardScreen - rebuilt with proper dark theme, safe area insets, simplified animations for web compatibility
- 2026-02-15: Smart + button - context-aware (adds bill on most tabs, adds expense on Expenses tab with green icon)
- 2026-02-15: Timeline fix - no longer shows future month (March) tasks
- 2026-02-15: Removed duplicate + from Expenses header, replaced with export button

## Project Architecture
- **Framework**: Expo SDK 52 with React Native
- **Web Bundler**: Metro
- **Language**: TypeScript
- **Navigation**: React Navigation (bottom tabs + native stack)
- **State**: AsyncStorage via StorageService
- **Styling**: React Native StyleSheet with premium dark fintech theme (sky blue primary #38BDF8, midnight backgrounds, glass-morphism effects)

### Directory Structure
```
/
├── App.tsx              # Root app with navigation setup
├── index.ts             # Entry point (registerRootComponent)
├── app.json             # Expo configuration
├── babel.config.js      # Babel config with reanimated plugin
├── tsconfig.json        # TypeScript config
├── src/
│   ├── components/      # Reusable UI components (BentoCard, TaskRow, etc.)
│   ├── constants/       # Colors, MockData
│   ├── screens/         # App screens (Dashboard, Expenses, Timeline, etc.)
│   ├── services/        # NotificationService, StorageService
│   ├── types.ts         # Type definitions
│   ├── types/           # Additional type definitions
│   └── utils/           # Utility functions (dateUtils)
└── assets/              # Images and icons
```

## Running the App
- **Development**: `npx expo start --web --port 5000`
- **Deployment**: Static export via `npx expo export --platform web`

## Key Dependencies
- expo, react-native, react-native-web, react-dom
- @react-navigation/native, @react-navigation/bottom-tabs, @react-navigation/native-stack
- react-native-reanimated, react-native-gesture-handler
- expo-linear-gradient, expo-blur, expo-notifications
