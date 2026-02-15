import { DarkTheme, NavigationContainer } from '@react-navigation/native';
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
import { LifeDashboard, TimelineScreen, SplitBillScreen, AddBillScreen, ProfileScreen, SettingsScreen, AddCardScreen, CategoryDetailScreen, CategoriesScreen, ExpenseTrackerScreen } from './src/screens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
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

  return (
    <View style={[tabStyles.container, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8) }]}>
      <View style={tabStyles.barOuter}>
        <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(30, 41, 59, 0.85)', 'rgba(15, 23, 42, 0.95)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={tabStyles.topBorder} />

        <View style={tabStyles.tabRow}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const isAddButton = route.name === 'Add';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                if (isAddButton) {
                  navigation.navigate('AddCard');
                } else {
                  navigation.navigate(route.name);
                }
              }
            };

            if (isAddButton) {
              const isExpensesActive = state.routes[state.index]?.name === 'Expenses';
              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  activeOpacity={0.8}
                  style={tabStyles.addButtonWrapper}
                >
                  <View style={[tabStyles.addButton, isExpensesActive && { opacity: 0.3 }]}>
                    <LinearGradient
                      colors={[Colors.dark.primary, '#0EA5E9']}
                      style={tabStyles.addGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <MaterialCommunityIcons name="plus" size={28} color="#fff" />
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
              outputRange: ['#475569', '#FFFFFF'],
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
                  <RNAnimated.View style={[tabStyles.activeIndicator, { opacity: indicatorOpacity }]} />
                  <RNAnimated.Text style={{ color: animatedColor }}>
                    <MaterialCommunityIcons
                      name={isFocused ? iconConfig.active : iconConfig.inactive}
                      size={22}
                      color={isFocused ? '#fff' : '#475569'}
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 4,
  },
  topBorder: {
    height: 0.5,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
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
    backgroundColor: Colors.dark.primary,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  addButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginTop: -28,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(56, 189, 248, 0.35)',
      },
      default: {
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
      },
    }),
  },
  addGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('AddCard');
          },
        })}
      />
      <Tab.Screen name="Expenses" component={ExpenseTrackerScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
    </Tab.Navigator>
  );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  useEffect(() => {
    NotificationService.registerForPushNotificationsAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: Colors.dark.background,
        }
      }}>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Root" component={TabNavigator} />
          <Stack.Screen
            name="AddBillModal"
            component={AddBillScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Add New',
              headerStyle: {
                backgroundColor: Colors.dark.surface,
              },
              headerTintColor: '#fff',
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
    </GestureHandlerRootView>
  );
}
