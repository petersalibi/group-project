// App.tsx
import { NativeRouter, Routes, Route } from "react-router-native";
import { RootLayout } from "./pages/RootLayout";
import CurriculumPage from "./pages/CurriculumPage";
import { VisualisationPage } from "./pages/VisualisationPage";
import { ComponentsPage } from "./pages/ComponentsPage";
import { LearningPage } from "./pages/LearningPage";
import { ThemeProvider } from "./components/theme-provider";

export default function App() {
  return (
    <ThemeProvider>
      <NativeRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<VisualisationPage />} />
            <Route path="/curriculum" element={<CurriculumPage />} />
            <Route path="/curriculum/lesson/:lessonId" element={<LearningPage />} />
            <Route path="/components" element={<ComponentsPage />} />
          </Route>
        </Routes>
      </NativeRouter>
    </ThemeProvider>
  );
}