// App.tsx
import { NativeRouter, Routes, Route } from "react-router-native";
import { RootLayout } from "./pages/RootLayout";
import CurriculumPage from "./pages/CurriculumPage";
import { VisualizationPage } from "./pages/VisualizationPage";
import { ComponentsPage } from "./pages/ComponentsPage"; // Import the new page
import { ThemeProvider } from "./components/theme-provider";

export default function App() {
  return (
    <ThemeProvider>
      <NativeRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<VisualizationPage />} />
            <Route path="/curriculum" element={<CurriculumPage />} />
            <Route path="/components" element={<ComponentsPage />} />
          </Route>
        </Routes>
      </NativeRouter>
    </ThemeProvider>
  );
}