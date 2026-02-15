import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform, TouchableOpacity, Animated as RNAnimated } from 'react-native';
import { useEffect, useRef } from 'react';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from './src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { NotificationService } from './src/services/NotificationService';
import { LifeDashboard, TimelineScreen, SplitBillScreen, AddBillScreen, ProfileScreen, SettingsScreen, AddCardScreen, CategoryDetailScreen, CategoriesScreen, ExpenseTrackerScreen, LoginScreen, SignUpScreen } from './src/screens';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { useState } from 'react';
import { supabase } from './src/services/SupabaseClient';
import { Session } from '@supabase/supabase-js';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const animatedValues = useRef(
    state.routes.map((_: any, i: number) => new RNAnimated.Value(i === state.index ? 1 : 0))
  ).current;

  useEffect(() => {
    state.routes.forEach((_: any, i: number) => {
      RNAnimated.spring(animatedValues[i], {
        toValue: i === state.index ? 1 : 0,
        useNativeDriver: false,
        tension: 60,
        friction: 10,
      }).start();
    });
  }, [state.index]);

  const tabIcons: Record<string, { active: string; inactive: string }> = {
    Dashboard: { active: 'home-variant', inactive: 'home-variant-outline' },
    Timeline: { active: 'calendar-clock', inactive: 'calendar-clock-outline' },
    Add: { active: 'plus', inactive: 'plus' },
    Expenses: { active: 'wallet', inactive: 'wallet-outline' },
    Categories: { active: 'shape', inactive: 'shape-outline' },
  };

  const tabLabels: Record<string, string> = {
    Dashboard: 'Home',
    Timeline: 'Timeline',
    Add: '',
    Expenses: 'Expenses',
    Categories: 'Categories',
  };

  const inactiveColor = theme === 'dark' ? '#475569' : '#94A3B8';
  const activeColor = theme === 'dark' ? '#FFFFFF' : '#0F172A';

  return (
    <View style={[tabStyles.container, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8) }]}>
      <View style={[tabStyles.barOuter, {
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      }]}>
        <BlurView tint={theme === 'dark' ? 'dark' : 'light'} intensity={80} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={theme === 'dark'
            ? ['rgba(30, 41, 59, 0.85)', 'rgba(15, 23, 42, 0.95)']
            : ['rgba(255, 255, 255, 0.9)', 'rgba(241, 245, 249, 0.95)']
          }
          style={StyleSheet.absoluteFill}
        />
        <View style={[tabStyles.topBorder, {
          backgroundColor: theme === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.2)',
        }]} />

        <View style={tabStyles.tabRow}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const isAddButton = route.name === 'Add';

            const currentRouteName = state.routes[state.index]?.name;

            const onPress = () => {
              if (isAddButton) {
                if (currentRouteName === 'Expenses') {
                  navigation.navigate('Expenses', { openAddExpense: Date.now() });
                } else {
                  navigation.navigate('AddCard');
                }
                return;
              }

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            if (isAddButton) {
              const isExpensesActive = currentRouteName === 'Expenses';
              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  activeOpacity={0.8}
                  style={tabStyles.addButtonWrapper}
                >
                  <View style={[tabStyles.addButton, {
                    borderColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                    ...Platform.select({
                      web: {
                        boxShadow: `0 6px 20px rgba(14, 165, 233, 0.3)`,
                      },
                      default: {
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.35,
                        shadowRadius: 12,
                        elevation: 10,
                      },
                    }),
                  }]}>
                    <LinearGradient
                      colors={isExpensesActive ? ['#10B981', '#059669'] : [colors.primary, '#0EA5E9']}
                      style={tabStyles.addGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <MaterialCommunityIcons
                        name={isExpensesActive ? 'cash-plus' : 'plus'}
                        size={isExpensesActive ? 24 : 28}
                        color="#fff"
                      />
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              );
            }

            const iconConfig = tabIcons[route.name] || { active: 'circle', inactive: 'circle-outline' };
            const label = tabLabels[route.name] || route.name;

            const animatedScale = animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.05],
            });

            const animatedColor = animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [inactiveColor, activeColor],
            });

            const indicatorOpacity = animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            });

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.7}
                style={tabStyles.tabItem}
              >
                <RNAnimated.View style={[tabStyles.tabContent, { transform: [{ scale: animatedScale }] }]}>
                  <RNAnimated.View style={[tabStyles.activeIndicator, { opacity: indicatorOpacity, backgroundColor: colors.primary }]} />
                  <RNAnimated.Text style={{ color: animatedColor }}>
                    <MaterialCommunityIcons
                      name={(isFocused ? iconConfig.active : iconConfig.inactive) as any}
                      size={22}
                      color={isFocused ? activeColor : inactiveColor}
                    />
                  </RNAnimated.Text>
                  <RNAnimated.Text
                    style={[
                      tabStyles.tabLabel,
                      { color: animatedColor, fontWeight: isFocused ? '700' : '500' },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </RNAnimated.Text>
                </RNAnimated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  barOuter: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 4,
  },
  topBorder: {
    height: 0.5,
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 4,
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  addButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    marginTop: -24,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
  },
  addGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
});

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={LifeDashboard} />
      <Tab.Screen name="Timeline" component={TimelineScreen} />
      <Tab.Screen
        name="Add"
        component={AddBillScreen}
      />
      <Tab.Screen name="Expenses" component={ExpenseTrackerScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
    </Tab.Navigator>
  );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

const AuthStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function AppContent() {
  const { colors, theme } = useTheme();
  const { session, isLoading, isGuest } = useAuth();

  useEffect(() => {
    NotificationService.registerForPushNotificationsAsync();
  }, []);

  const navTheme = theme === 'dark' ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
    }
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
    }
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#0F172A' }} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Root" component={TabNavigator} />
        {/* ... other screens ... */}
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ presentation: 'fullScreenModal' }}
        />
        {/* ... keep existing modals ... */}
        <Stack.Screen
          name="AddBillModal"
          component={AddBillScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Add New',
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen
          name="AddCard"
          component={AddCardScreen}
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ presentation: 'card', headerShown: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="CategoryDetail"
          component={CategoryDetailScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
