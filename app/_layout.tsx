import { AuthProvider } from "@/context/AuthContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return(
    <AuthProvider>
      <Stack>
        <Stack.Screen name = "index" options = {{ title: "Log in", headerShown: false }} />
        <Stack.Screen name = "mesero" options = {{ title: "Waiter", headerShown: false }} />
        <Stack.Screen name = "caja" options = {{ title: "Cashier", headerShown: false }} />
        <Stack.Screen name = "cocinero" options = {{ title: "Chef", headerShown: false }} />
        <Stack.Screen name = "admin" options = {{ title: "Admin", headerShown: false }} />
      </Stack>
    </AuthProvider>
  )
}
