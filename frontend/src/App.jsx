import { Routes, Route } from "react-router-dom";
import ProjectsPage from "./pages/ProjectsPage";
import AnnotationPage from "./pages/AnnotationPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProjectsPage />} />
      <Route path="/projects/:id" element={<AnnotationPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
