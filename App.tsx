import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from './src/constants/Colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NotificationService } from './src/services/NotificationService';
import { LifeDashboard, TimelineScreen, SplitBillScreen, AddBillScreen, ProfileScreen, SettingsScreen, AddCardScreen, CategoryDetailScreen, CategoriesScreen, ExpenseTrackerScreen } from './src/screens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
          height: 96, // iPhone Pro Max safe area friendly
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              tint="dark"
              intensity={100} // Maximum Frost
              style={StyleSheet.absoluteFill}
            />
            {/* Crisp Top Line */}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            {/* Gradient wash at bottom */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: 'rgba(0,0,0,0.2)' }} />
          </View>
        ),
        tabBarActiveTintColor: '#fff', // Pure white for active
        tabBarInactiveTintColor: '#64748B', // Slate gray for inactive
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 6,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', // native feel
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



      {/* Primary Action Button - Center */}
      <Tab.Screen
        name="Add"
        component={AddBillScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View style={{
              width: 56, // Slightly larger for emphasis
              height: 56,
              borderRadius: 20,
              backgroundColor: Colors.dark.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: -24, // Float higher
              shadowColor: Colors.dark.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.1)'
            }}>
              <MaterialCommunityIcons name="plus" size={32} color="#fff" />
            </View>
          ),
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
          tabBarStyle: { display: 'none' }, // Hide bottom bar for immersive mode
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

export default function App() {
  useEffect(() => {
    NotificationService.registerForPushNotificationsAsync();
  }, []);

  return (
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
  );
}
