import { DarkTheme, DefaultTheme, NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Platform, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from './src/constants/Colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NotificationService } from './src/services/NotificationService';
import { LifeDashboard, TimelineScreen, SplitBillScreen, AddBillScreen, ProfileScreen, SettingsScreen, AddCardScreen, CategoryDetailScreen, CategoriesScreen, ExpenseTrackerScreen } from './src/screens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AddTabButton(props: any) {
  // Navigation state might be nested (Root -> Tabs).
  // We need to find the active route name of the Tab Navigator.
  const currentRouteName = useNavigationState(state => {
    // Helper to traverse down to the active leaf route
    const getActiveRouteName = (navState: any): string => {
      if (!navState || !navState.routes || typeof navState.index !== 'number') {
        return 'Dashboard';
      }
      const route = navState.routes[navState.index];
      if (route.state) {
        return getActiveRouteName(route.state);
      }
      return route.name;
    };

    return getActiveRouteName(state);
  });

  // If we are on Expenses, hide the button (return transparent view to keep spacing)
  if (currentRouteName === 'Expenses') {
    return <View style={{ width: 56 }} pointerEvents="none" />;
  }

  return (
    <TouchableOpacity {...props} style={props.style} onPress={props.onPress}>
      <View style={{
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: Colors.dark.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -24,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)'
      }}>
        <MaterialCommunityIcons name="plus" size={32} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 88,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              tint="dark"
              intensity={100}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', position: 'absolute', top: 0, left: 0, right: 0 }} />
          </View>
        ),
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#64748B',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 6,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={LifeDashboard}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "home-variant" : "home-variant-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{
          tabBarLabel: 'Timeline',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "clock-time-four" : "clock-time-four-outline"} size={24} color={color} />
          ),
        }}
      />



      <Tab.Screen
        name="Add"
        component={AddBillScreen}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <AddTabButton {...props} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('AddCard');
          },
        })}
      />

      <Tab.Screen
        name="Expenses"
        component={ExpenseTrackerScreen}
        options={{
          tabBarLabel: 'Expenses',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "wallet" : "wallet-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "grid" : "grid-large"} size={24} color={color} />
          ),
        }}
      />
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
