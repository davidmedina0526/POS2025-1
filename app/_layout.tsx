import { AuthProvider } from "@/context/AuthContext";
import { MenuProvider } from "@/context/MenuContext";
import { WaiterProvider } from "@/context/WaiterContext";
import { CajaProvider } from "@/context/CajaContext";
import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return(
    <AuthProvider>
      <MenuProvider>
        <WaiterProvider>
          <CajaProvider>
            <Stack>
              <Stack.Screen name = "index" options = {{ title: "Log in", headerShown: false }} />
              <Stack.Screen name = "mesero" options = {{ title: "Waiter", headerShown: false }} />
              <Stack.Screen name = "caja" options = {{ title: "Cashier", headerShown: false }} />
              <Stack.Screen name = "cocinero" options = {{ title: "Chef", headerShown: false }} />
              <Stack.Screen name = "admin" options = {{ title: "Admin", headerShown: false }} />
              <Stack.Screen name = "menu" options = {{ title: "Menu", headerShown: false }} />
              <Stack.Screen name = "personal" options = {{ title: "Personal", headerShown: false }} />
            </Stack>
          </CajaProvider>
        </WaiterProvider>
      </MenuProvider>  
    </AuthProvider>
  )
}
