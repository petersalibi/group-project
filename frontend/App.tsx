import { NativeRouter, Routes, Route } from "react-router-native";
import { RootLayout } from "./pages/RootLayout";
import { VisualisationPage } from "./pages/VisualisationPage";
import { ThemeProvider } from "./components/theme-provider";

export default function App() {
  return (
    <ThemeProvider>
      <NativeRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/*" element={<VisualisationPage />} />
          </Route>
        </Routes>
      </NativeRouter>
    </ThemeProvider>
  );
}