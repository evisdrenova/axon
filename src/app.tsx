import { createRoot } from "react-dom/client";
import "./styles/index.css";
import Layout from "./layout";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Tools from "./pages/Tools";
import Home from "./pages/Home";
import Models from "./pages/Models";
import { ThemeProvider } from "./ThemeProvider";
import Settings from "./pages/Settings";

const App = () => (
  <BrowserRouter>
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/models" element={<Models />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  </BrowserRouter>
);

const container = document.getElementById("root");
if (!container) throw new Error("Failed to find root element");
const root = createRoot(container);
root.render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
